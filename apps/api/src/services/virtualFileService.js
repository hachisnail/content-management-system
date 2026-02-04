import { Op } from "sequelize";
import { sequelize, File, FileLink, User } from "../models/index.js";
import { recycleBinService } from "./recycleBinService.js";
import { FILE_CATEGORIES } from "../config/categories.js";
import { ROLES } from "../config/roles.js"; 
import logger from "../core/logging/Logger.js";
import { AppError } from "../core/errors/AppError.js";

class VirtualFileService {
  /**
   * Optimized Directory Tree (Aggregated)
   */
  async getDirectoryStructure(user) {
    logger.info(`[VirtualFileService] Building directory tree for user: ${user.id}`);

    const folderPaths = await FileLink.findAll({
      attributes: [
        "recordType",
        "recordId",
        "category",
        [sequelize.fn("COUNT", sequelize.col("id")), "fileCount"],
      ],
      group: ["recordType", "recordId", "category"],
      raw: true,
    });

    const idsByType = {};
    folderPaths.forEach((p) => {
      if (!idsByType[p.recordType]) idsByType[p.recordType] = new Set();
      idsByType[p.recordType].add(p.recordId);
    });

    const nameMap = await this._resolveEntityNames(idsByType);

    const tree = { name: "Root", type: "root", children: {} };

    for (const path of folderPaths) {
      const { recordType, recordId, category } = path;
      const entityName =
        nameMap[recordType]?.[recordId] ||
        `${recordType}_${recordId.substring(0, 8)}`;

      this._ensureEntityPath(tree, recordType, recordId, entityName, category);
    }

    const hasOrphans = await File.findOne({
      where: sequelize.literal(`(
        SELECT COUNT(*) 
        FROM file_links 
        WHERE file_links.file_id = File.id 
        AND file_links.deleted_at IS NULL
      ) = 0`),
      attributes: ["id"],
    });

    if (hasOrphans) {
      this._ensurePath(tree, ["Uncategorized", "General"]);
    }

    return tree;
  }

  /**
   * List Files with SQL-level Permissions and Pagination
   */
  async listVirtualFolder(user, virtualPath, query = {}) {
    const { page = 1, limit = 50, search } = query;
    const parts = virtualPath.split("/").filter((p) => p && p !== "..");

    logger.info(`[VirtualFileService] Listing folder: ${virtualPath} for user: ${user.id}`);

    const recordType = parts[0];
    const recordId = parts[1];
    const category = parts[2];

    const where = {};
    const include = [];

    if (recordType === "Uncategorized") {
      where[Op.and] = [
        sequelize.literal(`(
          SELECT COUNT(*) 
          FROM file_links 
          WHERE file_links.file_id = File.id 
          AND file_links.deleted_at IS NULL
        ) = 0`)
      ];
    } else if (recordType && recordId) {
      const linkWhere = { recordType, recordId };

      if (category) {
          linkWhere.category = category;
      } else {
          linkWhere.category = { [Op.or]: [null, 'general', 'attachment'] }; 
      }

      include.push({
        model: FileLink,
        as: "links",
        where: linkWhere,
        required: true,
      });
    } else if (recordType) {
      where[Op.and] = [sequelize.literal('1 = 0')]; 
    }

    if (search) {
      where.originalName = { [Op.like]: `%${search}%` };
    }

    // [ACCESS CONTROL]
    // Admins and Superadmins can VIEW all files.
    // Regular users can only view Public files or their Own files.
    const canViewAll = user.roles.includes(ROLES.ADMIN) || user.roles.includes(ROLES.SUPERADMIN);

    if (!canViewAll) {
      where[Op.or] = [
        { visibility: "public" },
        { uploadedBy: user.id },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await File.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      distinct: true, 
    });
    
    return { data: rows, meta: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } };
  }

  async renameFile(user, fileId, newName) {
    logger.info(`[VirtualFileService] Rename request: ${fileId} -> ${newName} by ${user.id}`);
    
    const file = await File.findByPk(fileId, { include: ["links"] });
    if (!file) throw new AppError("File not found", 404);
    
    // Check Permissions (Owner or Superadmin)
    await this._checkWriteAccess(file, user);

    return await sequelize.transaction(async (t) => {
      const collision = await this._checkCollision(newName, file, t);
      const finalName = collision ? this._generateUniqueName(newName) : newName;

      file.originalName = finalName;
      await file.save({ transaction: t });
      
      logger.info(`[VirtualFileService] Renamed file ${fileId} to ${finalName}`);
      return file;
    });
  }

  async moveFile(
    user,
    fileId,
    targetRecordType,
    targetCategory,
    targetRecordId
  ) {
    logger.info(`[VirtualFileService] Move request: File ${fileId} -> ${targetRecordType}/${targetCategory}`);

    // [ACCESS CONTROL] STRICTLY SUPERADMIN ONLY
    // Admins are NOT allowed to move files (view only).
    if (!user.roles.includes(ROLES.SUPERADMIN)) {
        logger.warn(`[VirtualFileService] Move blocked. User ${user.id} is not Super Admin.`);
        throw new AppError("Access Denied: Only Super Admins can move files.", 403);
    }

    const file = await File.findByPk(fileId);
    if (!file) throw new AppError("File not found", 404);

    if (targetRecordType !== "Uncategorized") {
      if (!targetRecordId) throw new AppError("Target Record ID required", 400);

      const validModels = { users: User };
      const Model = validModels[targetRecordType];

      if (Model) {
        const targetExists = await Model.findByPk(targetRecordId);
        if (!targetExists) {
          throw new AppError(`Target ${targetRecordType} not found`, 404);
        }
      } 
    }

    return await sequelize.transaction(async (t) => {
      await FileLink.destroy({ 
          where: { fileId: file.id }, 
          force: true, 
          transaction: t 
      });

      if (targetRecordType !== "Uncategorized") {
        const config = FILE_CATEGORIES[targetCategory];
        
        if (config && config.singleInstance) {
             const existingLink = await FileLink.findOne({
                where: { 
                    recordId: targetRecordId, 
                    recordType: targetRecordType, 
                    category: targetCategory 
                },
                transaction: t
             });

             if (existingLink && existingLink.fileId !== file.id) {
                 logger.info(`[VirtualFileService] Swapping single-instance file in ${targetCategory}`);
                 await recycleBinService.moveToBin('files', existingLink.fileId, user.id, t);
             }
        }

        try {
            await FileLink.create(
              {
                fileId: file.id,
                recordType: targetRecordType,
                recordId: targetRecordId || "system",
                category: targetCategory || "general",
                createdBy: user.id,
              },
              { transaction: t }
            );
        } catch (err) {
            logger.error(`[VirtualFileService] Move failed: ${err.message}`);
            throw new AppError(`Failed to move file: ${err.message}`, 500);
        }
      }
      
      logger.info(`[VirtualFileService] File ${fileId} moved successfully.`);
      return file;
    });
  }

  async deleteFile(user, ids) {
    logger.info(`[VirtualFileService] Delete request for ${ids} files by ${user.id}`);
    
    const idArray = Array.isArray(ids) ? ids : [ids];
    for (const id of idArray) {
      const file = await File.findByPk(id);
      if (!file) throw new AppError(`File ${id} not found`, 404);
      await this._checkWriteAccess(file, user);
    }
    
    return await sequelize.transaction(async (t) => {
      for (const id of idArray) {
        await recycleBinService.moveToBin("files", id, user.id, t);
      }
    });
  }

  async updateVisibility(user, fileIds, newVisibility) {
    if (!["public", "private"].includes(newVisibility))
      throw new AppError("Invalid visibility", 400);

    logger.info(`[VirtualFileService] Updating visibility to ${newVisibility} for files: ${fileIds}`);

    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];
    
    // [ACCESS CONTROL]
    // Check if user is Superadmin. If not, they must own ALL files.
    // Regular Admins cannot change visibility of others' files (View Only).
    const isSuperAdmin = user.roles.includes(ROLES.SUPERADMIN);

    if (!isSuperAdmin) {
      const count = await File.count({
        where: { id: { [Op.in]: ids }, uploadedBy: user.id },
      });
      if (count !== ids.length) throw new AppError("Access Denied: You can only modify your own files.", 403);
    }

    return await File.update(
      { visibility: newVisibility },
      { where: { id: { [Op.in]: ids } } },
    );
  }

  // --- Helpers ---

  async _resolveEntityNames(idsByType) {
    const map = {};
    if (idsByType["users"] && idsByType["users"].size > 0) {
      const users = await User.findAll({
        where: { id: { [Op.in]: Array.from(idsByType["users"]) } },
        attributes: ["id", "firstName", "lastName", "email"],
        raw: true,
      });
      map["users"] = {};
      users.forEach((u) => {
        map["users"][u.id] =
          u.firstName || u.lastName
            ? `${u.firstName} ${u.lastName}`.trim()
            : u.email;
      });
    }
    return map;
  }

  async _checkCollision(name, fileContext, transaction) {
    return false; // Simplified
  }

  _generateUniqueName(name) { return `${name}_${Date.now()}`; }

  _ensureEntityPath(tree, type, id, entityName, category) {
    if (!tree.children[type]) {
      tree.children[type] = { name: type, type: "folder", children: {} };
    }
    const typeNode = tree.children[type];
    if (!typeNode.children[id]) {
      typeNode.children[id] = {
        name: entityName,
        pathSegment: id,
        type: "folder",
        children: {},
      };
    }
    const entityNode = typeNode.children[id];
    if (!entityNode.children[category]) {
      entityNode.children[category] = {
        name: category,
        type: "folder",
        action: "fetch_files",
      };
    }
  }

  _ensurePath(tree, parts) {
    let current = tree;
    for (const part of parts) {
      if (!current.children[part]) {
        current.children[part] = { name: part, type: "folder", children: {} };
      }
      current = current.children[part];
    }
  }

  async _checkWriteAccess(file, user) {
    // [ACCESS CONTROL]
    // If not owner, MUST be Superadmin. 
    // Regular Admin is Read-Only for others' files.
    if (file.uploadedBy !== user.id && !user.roles.includes(ROLES.SUPERADMIN)) {
      throw new AppError("Access Denied: You do not have permission to modify this file.", 403);
    }
  }
}

export const virtualFileService = new VirtualFileService();
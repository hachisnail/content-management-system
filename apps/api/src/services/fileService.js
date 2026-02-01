/* api/src/services/fileService.js */
import fs from "fs";
import { Transaction, Op } from "sequelize";
import { sequelize, File, FileLink } from "../models/index.js";
import { verifyFileSignature } from "../config/upload.js";
import { recycleBinService } from "./recycleBinService.js";
import { isSingleFile, isValidResource } from "../config/resources.js";
import { parseRoles } from "../utils/auth.js"; 

class FileService {
  async uploadFile({ fileData, metaData, userId }) {
    if (metaData.recordType && !isValidResource(metaData.recordType)) {
      this._cleanupFile(fileData.path);
      throw new Error(`Invalid recordType: '${metaData.recordType}'`);
    }

    const isValidSig = await verifyFileSignature(fileData.path);
    if (!isValidSig) {
      this._cleanupFile(fileData.path);
      throw new Error("Security Error: File content does not match extension.");
    }

    const t = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      // [FIX] Ensure allowedRoles is parsed correctly from string/JSON
      const parsedAllowedRoles = parseRoles(metaData.allowedRoles);

      const file = await File.create(
        {
          originalName: fileData.originalname,
          encoding: fileData.encoding,
          mimetype: fileData.mimetype,
          size: fileData.size,
          path: fileData.path,
          visibility: metaData.visibility === "public" ? "public" : "private",
          allowedRoles: parsedAllowedRoles, // Store role permissions
          uploadedBy: userId || null,
        },
        { transaction: t },
      );

      let link = null;

      if (metaData.recordId && metaData.recordType) {
        const shouldReplace =
          isSingleFile(metaData.recordType, metaData.category) ||
          metaData.replaceExisting === "true" ||
          metaData.replaceExisting === true;

        if (shouldReplace) {
          const existingLinks = await FileLink.findAll({
            where: {
              recordId: metaData.recordId,
              recordType: metaData.recordType,
              category: metaData.category || "attachment",
            },
            transaction: t,
          });

          for (const existingLink of existingLinks) {
            const fileExists = await File.findByPk(existingLink.fileId, { transaction: t });
            if (fileExists) {
              await recycleBinService.moveToBin("files", existingLink.fileId, userId, t);
            } else {
              await existingLink.destroy({ transaction: t });
            }
          }
        }

        link = await FileLink.create(
          {
            fileId: file.id,
            recordId: metaData.recordId,
            recordType: metaData.recordType,
            category: metaData.category || "attachment",
            createdBy: userId || null,
          },
          { transaction: t },
        );
      }

      await t.commit();
      return { file, link };
    } catch (error) {
      await t.rollback();
      this._cleanupFile(fileData.path);
      throw error;
    }
  }

  // [RESTORED] List files for a specific user
  async getFiles(user, query) {
    const { search, page = 1, limit = 50, sort_by = 'createdAt', sort_dir = 'DESC' } = query;
    const where = { uploadedBy: user.id }; 

    if (search) {
      where.originalName = { [Op.like]: `%${search}%` };
    }

    const offset = (Math.max(1, page) - 1) * limit;

    const { count, rows } = await File.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort_by, sort_dir]]
    });

    return {
      items: rows,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    };
  }

  async getFile(user, id) {
    const file = await File.findByPk(id);
    if (!file) throw new Error("File not found");
    
    // Use the central access logic
    await this._checkAccess(file, user);
    
    return file;
  }

  async updateFile(user, id, updates) {
    const file = await File.findByPk(id);
    if (!file) throw new Error("File not found");

    // Only Uploader or Admin can modify file settings
    if (file.uploadedBy !== user.id && !user.roles.includes('admin') && !user.roles.includes('superadmin')) {
        throw new Error("Access Denied: Only the uploader or admin can modify this file.");
    }

    if (updates.originalName) file.originalName = updates.originalName;
    if (updates.visibility) file.visibility = updates.visibility;
    
    // [NEW] Allow updating roles dynamically
    if (updates.allowedRoles) {
        file.allowedRoles = parseRoles(updates.allowedRoles);
    }
    
    await file.save();
    return file;
  }

  async deleteFile(user, id) {
    const file = await File.findByPk(id);
    if (!file) throw new Error("File not found");

    if (file.uploadedBy !== user.id && !user.roles.includes('admin') && !user.roles.includes('superadmin')) {
        throw new Error("Access Denied");
    }

    await recycleBinService.moveToBin('files', id, user.id);
    return true;
  }

  /**
   * [IMPROVED] Robust Permission Logic
   * Priority: Public > Owner > Admin > Allowed Role > Deny
   */
  async processFileAccess(id, user) {
    const file = await File.findByPk(id);
    if (!file) throw Object.assign(new Error("File not found"), { status: 404 });

    // 1. Public Access (No Login Required)
    if (file.visibility === "public") {
      this._ensureFileOnDisk(file);
      return file;
    }

    // 2. Auth Check for Private Files
    if (!user) {
      throw Object.assign(new Error("Unauthorized: Login required for private files"), { status: 401 });
    }

    // 3. Permission Checks
    try {
        await this._checkAccess(file, user);
    } catch (e) {
        throw Object.assign(new Error("Access Denied"), { status: 403 });
    }

    this._ensureFileOnDisk(file);
    return file;
  }

  // Helper for centralized permission logic
  async _checkAccess(file, user) {
    // A. Owner
    if (file.uploadedBy === user.id) return true;

    // B. SuperAdmin / Admin
    const isAdmin = user.roles && (user.roles.includes("superadmin") || user.roles.includes("admin"));
    if (isAdmin) return true;
    
    // C. Role-Based Access Delegation
    // stored roles are in file.allowedRoles (array of strings)
    const allowedRoles = parseRoles(file.allowedRoles);
    
    // Check if user has ANY of the allowed roles
    const hasRole = allowedRoles.some(r => user.roles.includes(r));
    
    if (hasRole) return true;

    throw new Error("Access Denied");
  }

  _cleanupFile(filePath) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to cleanup file:", filePath, err);
      }
    }
  }

  _ensureFileOnDisk(file) {
    const normalizedPath = file.path.replace(/\\/g, '/');
    if (!fs.existsSync(normalizedPath)) {
      const error = new Error("File system error: File missing on disk");
      error.status = 404;
      throw error;
    }
  }
}

export const fileService = new FileService();
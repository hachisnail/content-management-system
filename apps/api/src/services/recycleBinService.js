import fs from "fs/promises";
import {
  User,
  File,
  FileLink,
  RecycleBin,
  sequelize,
} from "../models/index.js";
import { Op } from "sequelize";
import { isSingleInstance } from "../config/resources.js";
import { ROLES } from "../config/roles.js"; // [NEW] Import ROLES
import logger from "../core/logging/Logger.js"; // [NEW] Import Logger

const MODEL_MAP = {
  users: User,
  files: File,
};

export const recycleBinService = {
  /**
   * List all deleted items with pagination
   */
  async getAllDeleted(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await RecycleBin.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: User,
          as: "deleter",
          attributes: ["id", "firstName", "lastName", "email", "roles"],
          include: [
            {
              model: File,
              as: "avatarFiles",
              attributes: ["id", "path", "visibility", "mimetype"],
            },
          ],
        },
      ],
    });
  },

  async findById(binId) {
    const entry = await RecycleBin.findByPk(binId, {
      include: [
        {
          model: User,
          as: "deleter",
          attributes: ["id", "firstName", "lastName", "email", "roles"],
        },
      ],
    });
    if (!entry) throw new Error("Recycle bin item not found");
    return entry;
  },

  /**
   * Moves a resource to the recycle bin.
   * NOTE: Does not enforce Role checks (that is done in Controller).
   * Used internally by other services (e.g., fileService replacement).
   */
  async moveToBin(resource, id, userId = null, externalTransaction = null) {
    const Model = MODEL_MAP[resource];
    if (!Model) throw new Error(`Invalid resource: ${resource}`);

    const t = externalTransaction || (await sequelize.transaction());
    const isLocalTransaction = !externalTransaction;

    try {
      const item = await Model.findByPk(id, {
        transaction: t,
        lock: true,
        skipLocked: false,
      });

      if (!item) throw new Error("Item not found or already deleted");

      const name =
        item.originalName || item.firstName || item.name || "Unknown Item";

      let metadata = {
        linksBackup: [],
      };

      const cascade = {
        files: [],
        links: [],
      };

      // 1. Snapshot & Handle Relationships
      if (resource === "files") {
        const links = await FileLink.findAll({
          where: { fileId: id },
          paranoid: false,
          transaction: t,
        });

        const plainLinks = links.map((l) => l.get({ plain: true }));
        metadata.linksBackup = plainLinks;

        metadata = {
          ...metadata,
          path: item.path,
          size: item.size,
          mimeType: item.mimetype,
          category: links.length > 0 ? links[0].category : "uncategorized",
          linkedRecordType: links.length > 0 ? links[0].recordType : null,
        };
      } else {
        const links = await FileLink.findAll({
          where: { recordId: id, recordType: resource },
          paranoid: false,
          transaction: t,
        });

        const plainLinks = links.map((l) => l.get({ plain: true }));
        metadata.linksBackup = plainLinks;

        if (links.length > 0) {
          cascade.links = links.map((l) => l.id);
          const fileIds = links.map((link) => link.fileId);

          if (fileIds.length > 0) {
            cascade.files = fileIds;
            await File.destroy({
              where: { id: fileIds },
              transaction: t,
            });
          }
        }
      }

      metadata.cascade = cascade;

      // 2. Create Bin Entry
      await RecycleBin.create(
        {
          resourceType: resource,
          resourceId: id,
          name: name,
          deletedBy: userId,
          metadata: metadata,
        },
        { transaction: t },
      );

      // 3. Delete Original Item
      await item.destroy({ transaction: t });

      // 4. Cleanup Links
      const linkQuery =
        resource === "files"
          ? { where: { fileId: id }, transaction: t }
          : { where: { recordId: id, recordType: resource }, transaction: t };

      await FileLink.destroy({
        ...linkQuery,
        force: true, 
      });

      if (isLocalTransaction) await t.commit();
      logger.info(`[RecycleBin] Moved ${resource}:${id} to bin by ${userId}`);
      return true;
    } catch (error) {
      if (isLocalTransaction) await t.rollback();
      throw error;
    }
  },

  /**
   * Restores an item. Enforces RBAC.
   * @param {string} binId 
   * @param {Object} user - The full user object requesting restore
   */
  async restore(binId, user) {
    if (!user || !user.id) throw new Error("User context required for restore");

    const binEntry = await RecycleBin.findByPk(binId);
    if (!binEntry) throw new Error("Recycle bin entry not found");

    // [ACCESS CONTROL]
    // 1. Owner can restore their own items.
    // 2. Superadmin can restore anything.
    // 3. Regular Admins cannot restore others' items.
    const isOwner = binEntry.deletedBy === user.id;
    const isSuperAdmin = user.roles.includes(ROLES.SUPERADMIN);

    if (!isOwner && !isSuperAdmin) {
      logger.warn(`[RecycleBin] Restore denied for user ${user.id} on bin ${binId}`);
      throw new Error("Access Denied: You can only restore your own items.");
    }

    let { resourceType, resourceId, metadata } = binEntry;

    if (typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        console.error("Failed to parse metadata JSON:", e);
        metadata = {};
      }
    }

    const Model = MODEL_MAP[resourceType];
    if (!Model) throw new Error(`Invalid resource type: ${resourceType}`);

    const t = await sequelize.transaction();
    try {
      // 1. Restore the Main Item
      const item = await Model.findByPk(resourceId, {
        paranoid: false,
        transaction: t,
      });

      if (item) {
        await item.restore({ transaction: t });
      } else {
        throw new Error("Original item record is missing permanently.");
      }

      // 2. Restore Cascaded Files
      if (metadata?.cascade?.files?.length > 0) {
        await File.restore({
          where: { id: { [Op.in]: metadata.cascade.files } },
          transaction: t,
        });
      }

      // 3. Restore Links (Robust Re-creation)
      const linksToRestore = metadata.linksBackup || [];

      for (const linkData of linksToRestore) {
        const isSingle = isSingleInstance(
          linkData.recordType,
          linkData.category,
        );

        if (isSingle) {
          const conflictingLinks = await FileLink.findAll({
            where: {
              recordId: linkData.recordId,
              recordType: linkData.recordType,
              category: linkData.category,
              id: { [Op.ne]: linkData.id },
            },
            transaction: t,
          });

          for (const conflict of conflictingLinks) {
            if (conflict.fileId === linkData.fileId) {
              await conflict.destroy({ transaction: t });
              continue;
            }

            try {
              // Swap logic: Move current active to bin
              await this.moveToBin("files", conflict.fileId, user.id, t);
            } catch (err) {
              console.error(`[RecycleBin] Failed to swap file ${conflict.fileId}:`, err.message);
              await conflict.destroy({ force: true, transaction: t });
            }
          }
        }

        const existingLink = await FileLink.findByPk(linkData.id, {
          paranoid: false,
          transaction: t,
        });

        if (existingLink) {
          if (existingLink.deletedAt) {
            await existingLink.restore({ transaction: t });
          }
        } else {
          await FileLink.create(
            {
              id: linkData.id,
              fileId: linkData.fileId,
              recordId: linkData.recordId,
              recordType: linkData.recordType,
              category: linkData.category,
              createdBy: linkData.createdBy,
              createdAt: linkData.createdAt,
            },
            { transaction: t },
          );
        }
      }

      await binEntry.destroy({ transaction: t });
      await t.commit();
      
      logger.info(`[RecycleBin] Restored bin ${binId} by ${user.id}`);
      return { message: "Restored successfully" };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  /**
   * Permanently deletes an item. Enforces RBAC.
   * @param {string} binId 
   * @param {Object} user - The user object
   */
  async forceDelete(binId, user) {
    if (!user) throw new Error("User context required");

    // [ACCESS CONTROL]
    // STRICTLY Superadmin Only. Destructive action.
    if (!user.roles.includes(ROLES.SUPERADMIN)) {
        logger.warn(`[RecycleBin] Force delete denied for ${user.id}`);
        throw new Error("Access Denied: Only Super Admins can permanently delete items.");
    }

    const binEntry = await RecycleBin.findByPk(binId);
    if (!binEntry) throw new Error("Recycle bin entry not found");

    const { resourceType, resourceId, metadata } = binEntry;
    const Model = MODEL_MAP[resourceType];

    const t = await sequelize.transaction();
    const filesToDeleteFromDisk = [];

    try {
      const item = await Model.findByPk(resourceId, {
        paranoid: false,
        transaction: t,
      });
      if (item) {
        if (resourceType === "files" && item.path) {
          filesToDeleteFromDisk.push(item.path);
        }
        await item.destroy({ force: true, transaction: t });
      }

      if (metadata?.cascade?.files?.length > 0) {
        const cascadedFiles = await File.findAll({
          where: { id: { [Op.in]: metadata.cascade.files } },
          paranoid: false,
          attributes: ["id", "path"],
          transaction: t,
        });

        cascadedFiles.forEach((f) => {
          if (f.path) filesToDeleteFromDisk.push(f.path);
        });

        await File.destroy({
          where: { id: { [Op.in]: metadata.cascade.files } },
          force: true,
          transaction: t,
        });
      }

      const linkQuery =
        resourceType === "files"
          ? { where: { fileId: resourceId } }
          : { where: { recordId: resourceId, recordType: resourceType } };

      await FileLink.destroy({
        ...linkQuery,
        force: true,
        transaction: t,
      });

      await binEntry.destroy({ transaction: t });

      await t.commit();
      logger.info(`[RecycleBin] Permanently deleted bin ${binId} by ${user.id}`);
    } catch (error) {
      await t.rollback();
      throw error;
    }

    if (filesToDeleteFromDisk.length > 0) {
      Promise.allSettled(
        filesToDeleteFromDisk.map(async (path) => {
          try {
            await fs.unlink(path);
          } catch (err) {
            if (err.code !== "ENOENT") {
              console.warn(
                `[RecycleBin] Failed to delete file on disk: ${path} - ${err.message}`,
              );
            }
          }
        }),
      );
    }
    return true;
  },
};
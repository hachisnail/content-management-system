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
   * CAPTURES A SNAPSHOT of relationships to enable restoring even if links are hard-deleted.
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
        linksBackup: [], // Store full link objects here
      };

      const cascade = {
        files: [],
        links: [],
      };

      // 1. Snapshot & Handle Relationships
      if (resource === "files") {
        // Snapshot existing links before deletion
        const links = await FileLink.findAll({
          where: { fileId: id },
          transaction: t,
        });

        metadata.linksBackup = links.map((l) => l.toJSON()); // BACKUP FULL DATA

        metadata = {
          ...metadata,
          path: item.path,
          size: item.size,
          mimeType: item.mimetype,
          // Snapshot primary category for quick display
          category: links.length > 0 ? links[0].category : "uncategorized",
          linkedRecordType: links.length > 0 ? links[0].recordType : null,
        };
      } else {
        // Handle Parent Resource (User)
        const links = await FileLink.findAll({
          where: { recordId: id, recordType: resource },
          transaction: t,
        });

        metadata.linksBackup = links.map((l) => l.toJSON()); // BACKUP FULL DATA

        if (links.length > 0) {
          cascade.links = links.map((l) => l.id);
          const fileIds = links.map((link) => link.fileId);

          // Soft delete cascaded files (e.g., Avatars)
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

      // 4. Cleanup Links (Hard or Soft Delete depending on model)
      const linkQuery =
        resource === "files"
          ? { where: { fileId: id }, transaction: t }
          : { where: { recordId: id, recordType: resource }, transaction: t };

      await FileLink.destroy(linkQuery);

      if (isLocalTransaction) await t.commit();
      return true;
    } catch (error) {
      if (isLocalTransaction) await t.rollback();
      throw error;
    }
  },

  /**
   * Restores an item and its relationships from the snapshot.
   */
  async restore(binId) {
    const binEntry = await RecycleBin.findByPk(binId);
    if (!binEntry) throw new Error("Recycle bin entry not found");

    const { resourceType, resourceId, metadata } = binEntry;
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
        // If the main item is completely gone, we can't restore relationships
        throw new Error("Original item record is missing permanently.");
      }

      // 2. Restore Cascaded Files (e.g. Avatar File)
      if (metadata?.cascade?.files?.length > 0) {
        await File.restore({
          where: { id: { [Op.in]: metadata.cascade.files } },
          transaction: t,
        });
      }

      // 3. Restore Links (Robust Re-creation)
      const linksToRestore = metadata.linksBackup || [];

      for (const linkData of linksToRestore) {
        // A. Check for Collisions (e.g., User has a new avatar already?)
        if (isSingleInstance(linkData.recordType, linkData.category)) {
          // Remove any CURRENT link that conflicts
          await FileLink.destroy({
            where: {
              recordId: linkData.recordId,
              recordType: linkData.recordType,
              category: linkData.category,
              id: { [Op.ne]: linkData.id }, // Don't delete the one we are restoring
            },
            force: true, // Ensure it's gone
            transaction: t,
          });
        }

        // B. Restore or Recreate
        const existingLink = await FileLink.findByPk(linkData.id, {
          paranoid: false,
          transaction: t,
        });

        if (existingLink) {
          if (existingLink.deletedAt) {
            await existingLink.restore({ transaction: t });
          }
        } else {
          // Hard-deleted? Recreate it exactly as it was.
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

      // 4. Clean up Bin
      await binEntry.destroy({ transaction: t });

      await t.commit();
      return { message: "Restored successfully" };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  },

  /**
   * Permanently deletes an item, ensuring NO orphaned links or files remain.
   */
  async forceDelete(binId) {
    const binEntry = await RecycleBin.findByPk(binId);
    if (!binEntry) throw new Error("Recycle bin entry not found");

    const { resourceType, resourceId, metadata } = binEntry;
    const Model = MODEL_MAP[resourceType];

    const t = await sequelize.transaction();
    const filesToDeleteFromDisk = [];

    try {
      // 1. Force Delete Main Resource
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

      // 2. Identify & Purge Cascaded Files (e.g. User Avatars)
      // This prevents "Zombie Files" where the User is gone but their Avatar file remains in DB/Disk.
      if (
        metadata &&
        metadata.cascade &&
        metadata.cascade.files &&
        metadata.cascade.files.length > 0
      ) {
        const cascadedFiles = await File.findAll({
          where: { id: { [Op.in]: metadata.cascade.files } },
          paranoid: false,
          attributes: ["id", "path"],
          transaction: t,
        });

        cascadedFiles.forEach((f) => {
          if (f.path) filesToDeleteFromDisk.push(f.path);
        });

        // Permanently remove the file records
        await File.destroy({
          where: { id: { [Op.in]: metadata.cascade.files } },
          force: true,
          transaction: t,
        });
      }

      // 3. Clean up Links (Orphan Prevention)
      // If we are deleting a FILE, delete all links pointing TO it.
      // If we are deleting a USER, delete all links pointing FROM it.
      const linkQuery =
        resourceType === "files"
          ? { where: { fileId: resourceId } }
          : { where: { recordId: resourceId, recordType: resourceType } };

      // Apply force: true to ensure even soft-deleted links are purged
      await FileLink.destroy({
        ...linkQuery,
        force: true,
        transaction: t,
      });

      // 4. Remove Bin Entry
      await binEntry.destroy({ transaction: t });

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }

    // 5. Cleanup Disk (Non-blocking / Best Effort)
    if (filesToDeleteFromDisk.length > 0) {
      Promise.allSettled(
        filesToDeleteFromDisk.map(async (path) => {
          try {
            await fs.unlink(path);
            console.log(
              `[RecycleBin] Permanently deleted file from disk: ${path}`,
            );
          } catch (err) {
            // Ignore if file is already missing
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

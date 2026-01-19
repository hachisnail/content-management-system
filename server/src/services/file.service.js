import { db } from '../models/index.js';
import { triggerSmartUpdate } from '../models/hooks.js';
import { logOperation } from './logger.js';
import { FILE_LIMITS, ALLOWED_LINK_TYPES } from '../config/upload.js';
import fs from 'fs/promises';
import { Op } from 'sequelize';
import { verifyFileContent } from '../config/upload.js';
// --- CONFIGURATION ---
const MODEL_MAP = {
  users: 'User',
  donations: 'Donation',
  test_items: 'TestItem',
  audit_logs: 'AuditLog',
};

const SINGLE_FILE_RESOURCES = [];

// --- HELPERS ---

const deletePhysicalFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(
        `[FileService] Warning: Could not delete ${filePath}`,
        err.message,
      );
    }
  }
};

const validateFileSize = (fileObject, relatedType) => {
  const size = fileObject.size;
  const mime = fileObject.mimetype;
  let limit = FILE_LIMITS.MAX_GLOBAL;
  let limitType = 'Global Limit';

  if (relatedType && FILE_LIMITS[relatedType]) {
    limit = FILE_LIMITS[relatedType];
    limitType = `${relatedType} Limit`;
  } else if (mime.startsWith('image/')) {
    limit = FILE_LIMITS.IMAGES;
    limitType = 'Image Limit';
  } else {
    limit = FILE_LIMITS.DOCUMENTS;
    limitType = 'Document Limit';
  }

  if (size > limit) {
    const limitMB = (limit / (1024 * 1024)).toFixed(1);
    throw new Error(`File too large. ${limitType} is ${limitMB}MB.`);
  }
};

/**
 * Fetch and broadcast the FULL resource state to all clients.
 */
const broadcastResourceUpdate = async (relatedType, relatedId) => {
  const modelName = MODEL_MAP[relatedType];
  if (!modelName || !db[modelName]) return;

  // Define inclusions to match frontend expectations
  let include = [];
  if (relatedType === 'users') {
    include = [
      { model: db.File, as: 'profilePicture', through: { attributes: [] } },
    ];
  } else if (relatedType === 'test_items') {
    include = [
      {
        model: db.File,
        as: 'attachments',
        through: { attributes: ['category'] },
      },
    ];
  }

  try {
    const freshRecord = await db[modelName].findByPk(relatedId, { include });
    if (freshRecord) {
      triggerSmartUpdate(relatedType, freshRecord);
    }
  } catch (err) {
    console.error(
      `[FileService] Failed to broadcast update for ${relatedType}:${relatedId}`,
      err,
    );
  }
};

// --- CORE FUNCTIONS ---

export const linkFile = async ({
  fileId,
  relatedType,
  relatedId,
  category,
  user,
}) => {
  if (!ALLOWED_LINK_TYPES.includes(relatedType))
    throw new Error(`Invalid link type: ${relatedType}`);

  const transaction = await db.sequelize.transaction();
  try {
    const file = await db.File.findByPk(fileId, { transaction });
    if (!file) throw new Error('File not found');

    const existingLink = await db.FileLink.findOne({
      where: { fileId, relatedType, relatedId },
      transaction,
    });

    if (existingLink) {
      await transaction.rollback();
      return existingLink;
    }

    const newLink = await db.FileLink.create(
      {
        fileId,
        relatedType,
        relatedId,
        category: category || 'general',
        linkedBy: user ? user.email : 'system',
      },
      { transaction },
    );

    await transaction.commit();
    await broadcastResourceUpdate(relatedType, relatedId);
    return newLink;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const unlinkFile = async (fileId, relatedType, relatedId) => {
  const transaction = await db.sequelize.transaction();
  try {
    await db.FileLink.destroy({
      where: { fileId, relatedType, relatedId },
      transaction,
    });

    const remainingLinks = await db.FileLink.count({
      where: { fileId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (remainingLinks === 0) {
      const file = await db.File.findByPk(fileId, { transaction });
      if (file) await file.destroy({ transaction });
    }

    await transaction.commit();
    await broadcastResourceUpdate(relatedType, relatedId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const deleteRelatedFiles = async (
  { relatedType, relatedId },
  transaction,
) => {
  const links = await db.FileLink.findAll({
    where: { relatedType, relatedId },
    transaction,
  });
  for (const link of links) {
    await link.destroy({ transaction });
    const activeLinksCount = await db.FileLink.count({
      where: { fileId: link.fileId },
      transaction,
    });
    if (activeLinksCount === 0) {
      const file = await db.File.findByPk(link.fileId, { transaction });
      if (file) await file.destroy({ transaction });
    }
  }
};

export const restoreRelatedFiles = async (
  { relatedType, relatedId },
  transaction,
) => {
  const deletedLinks = await db.FileLink.findAll({
    where: { relatedType, relatedId, deletedAt: { [Op.not]: null } },
    paranoid: false,
    transaction,
  });

  for (const link of deletedLinks) {
    await link.restore({ transaction });
    const file = await db.File.findByPk(link.fileId, {
      paranoid: false,
      transaction,
    });
    if (file && file.deletedAt) {
      await file.restore({ transaction });
    }
  }
};

// --- ROBUST FILE RESTORE (THE FIX) ---
export const restoreFile = async (id) => {
  const transaction = await db.sequelize.transaction();
  const resourcesToUpdate = new Set();

  try {
    // 1. Find the File (even if deleted)
    const file = await db.File.findByPk(id, { paranoid: false, transaction });
    if (!file) throw new Error('File not found in trash');

    // 2. Find links associated with this file (even if deleted)
    const links = await db.FileLink.findAll({
      where: { fileId: id },
      paranoid: false,
      transaction,
    });

    for (const link of links) {
      const modelName = MODEL_MAP[link.relatedType];
      if (!modelName || !db[modelName]) continue;

      // Ensure parent still exists
      const parentRecord = await db[modelName].findByPk(link.relatedId, {
        paranoid: false,
        transaction,
      });
      if (!parentRecord)
        throw new Error(
          `Parent resource (${link.relatedType}) no longer exists.`,
        );
      if (parentRecord.deletedAt)
        throw new Error(
          `Parent ${link.relatedType} is in the trash. Restore it first.`,
        );

      // --- LOGIC: SWAP PROFILE PICTURE ---
      if (['profile_picture'].includes(link.category)) {
        // Find the CURRENTLY ACTIVE profile picture for this user
        const currentActiveLink = await db.FileLink.findOne({
          where: {
            relatedType: link.relatedType,
            relatedId: link.relatedId,
            category: link.category,
            deletedAt: null, // Only active ones
          },
          transaction,
        });

        // If there is an active one, and it's not the one we are restoring
        if (currentActiveLink && currentActiveLink.fileId !== id) {
          console.log(
            `[Restore] Swapping profile picture for ${link.relatedType}:${link.relatedId}. Moving current to trash.`,
          );

          // 1. Soft Delete the current link (Move to Trash)
          await currentActiveLink.destroy({ transaction });

          // 2. Check if the current file has other links. If not, soft delete the file too.
          const activeCount = await db.FileLink.count({
            where: { fileId: currentActiveLink.fileId, deletedAt: null },
            transaction,
          });

          if (activeCount === 0) {
            const fileToDelete = await db.File.findByPk(
              currentActiveLink.fileId,
              { transaction },
            );
            if (fileToDelete) {
              await fileToDelete.destroy({ transaction });
            }
          }
        }
      }

      // 3. Restore the Link we want
      await link.restore({ transaction });
      resourcesToUpdate.add(`${link.relatedType}:${link.relatedId}`);

      // Force touch parent to update UI timestamp
      if (parentRecord.setDataValue) {
        parentRecord.setDataValue('updatedAt', new Date());
        await parentRecord.save({ hooks: false, transaction });
      }
    }

    // 4. Restore the File we want
    await file.restore({ transaction });
    await transaction.commit();

    // 5. Broadcast updates
    for (const entry of resourcesToUpdate) {
      const [rType, rId] = entry.split(':');
      await broadcastResourceUpdate(rType, rId);
    }

    return file;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

export const processUpload = async (
  fileObject,
  { relatedType, relatedId, category, isPublic, allowedRoles, user },
) => {
  if (!fileObject) throw new Error('No file received');
  
  try {
    validateFileSize(fileObject, relatedType);
  } catch (error) {
    await deletePhysicalFile(fileObject.path);
    throw error;
  }

  try {
    const isContentValid = await verifyFileContent(fileObject.path);
    if (!isContentValid) {
      throw new Error(`Security Error: File content does not match extension ${fileObject.mimetype}`);
    }
  } catch (error) {
    await deletePhysicalFile(fileObject.path);
    throw error;
  }

  const transaction = await db.sequelize.transaction();
  const finalCategory = category || 'general';

  try {
    const shouldReplace =
      SINGLE_FILE_RESOURCES.includes(relatedType) ||
      (relatedType === 'users' && finalCategory === 'profile_picture');

    if (relatedType && relatedId && shouldReplace) {
      const existingLinks = await db.FileLink.findAll({
        where: { relatedType, relatedId, category: finalCategory },
        transaction,
      });

      for (const link of existingLinks) {
        await link.destroy({ transaction }); // Soft delete link

        // Check orphans
        const count = await db.FileLink.count({
          where: { fileId: link.fileId, deletedAt: null }, // Count ACTIVE links only
          transaction,
        });

        if (count === 0) {
          const oldFile = await db.File.findByPk(link.fileId, { transaction });
          if (oldFile) await oldFile.destroy({ transaction }); // Soft delete file
        }
      }
    }

    // 4. Parse Roles
    let rolesToSave = [];
    if (typeof allowedRoles === 'string') {
      try {
        rolesToSave = JSON.parse(allowedRoles);
      } catch {
        rolesToSave = [allowedRoles];
      }
    } else if (Array.isArray(allowedRoles)) {
      rolesToSave = allowedRoles;
    }

    // 5. Create File Record
    const newFile = await db.File.create(
      {
        fileName: fileObject.filename,
        originalName: fileObject.originalname,
        mimeType: fileObject.mimetype,
        size: fileObject.size,
        path: fileObject.path,
        isPublic: isPublic === 'true' || isPublic === true,
        allowedRoles: rolesToSave,
        uploadedBy: user ? user.email : 'guest',
      },
      { transaction },
    );

    // 6. Link File
    if (relatedType && relatedId) {
      if (!ALLOWED_LINK_TYPES.includes(relatedType))
        throw new Error('Invalid relatedType');
      await db.FileLink.create(
        {
          fileId: newFile.id,
          relatedType,
          relatedId,
          category: finalCategory,
          linkedBy: user ? user.email : 'guest',
        },
        { transaction },
      );
    }

    // 7. Update Parent Timestamp (Fixes Stale UI)
    if (relatedType === 'users') {
      const u = await db.User.findByPk(relatedId, { transaction });
      if (u) {
        u.last_active = new Date();
        u.changed('updatedAt', true); // Force update timestamp
        await u.save({ transaction });
      }
    }

    await transaction.commit();

    // 8. Broadcast
    if (relatedType && relatedId) {
      await broadcastResourceUpdate(relatedType, relatedId);
    }

    if (relatedType === 'users' && relatedId && user) {
      await logOperation({
        description: `User uploaded ${finalCategory}: ${fileObject.originalname}`,
        operation: 'UPDATE',
        affectedResource: `user:${relatedId}`,
        afterState: {
          fileId: newFile.id,
          fileName: newFile.fileName,
          category: finalCategory,
        },
        initiator: user.email,
      });
    }

    return newFile;
  } catch (error) {
    await transaction.rollback();
    await deletePhysicalFile(fileObject.path);
    throw error;
  }
};

/**
 * Permanently deletes a file record and its physical file.
 */
export const purgeFile = async (id, transaction) => {
  const options = transaction
    ? { transaction, paranoid: false }
    : { paranoid: false };
  const file = await db.File.findByPk(id, options);
  if (!file) throw new Error('File not found');

  await file.destroy({ ...options, force: true });

  if (transaction) {
    transaction.afterCommit(() => deletePhysicalFile(file.path));
  } else {
    await deletePhysicalFile(file.path);
  }
  return true;
};

/**
 * Permanently deletes all files linked to a resource.
 */
export const purgeRelatedFiles = async (
  { relatedType, relatedId },
  transaction,
) => {
  const links = await db.FileLink.findAll({
    where: { relatedType, relatedId },
    paranoid: false,
    transaction,
  });

  const pathsToDelete = [];

  for (const link of links) {
    const fileId = link.fileId;
    await link.destroy({ force: true, transaction });

    const remainingLinks = await db.FileLink.count({
      where: { fileId },
      paranoid: false,
      transaction,
    });

    if (remainingLinks === 0) {
      const file = await db.File.findByPk(fileId, {
        paranoid: false,
        transaction,
      });
      if (file) {
        pathsToDelete.push(file.path);
        await file.destroy({ force: true, transaction });
      }
    }
  }

  if (transaction) {
    transaction.afterCommit(async () => {
      for (const p of pathsToDelete) await deletePhysicalFile(p);
    });
  }
};

export const purgeOldDeletedFiles = async () => {
  console.log('[FileService] Starting 30-day Prune...');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const filesToPurge = await db.File.findAll({
    where: { deletedAt: { [Op.lt]: thirtyDaysAgo } },
    paranoid: false,
  });
  let purgedCount = 0;
  for (const file of filesToPurge) {
    try {
      await deletePhysicalFile(file.path);
      await file.destroy({ force: true });
      purgedCount++;
    } catch (err) {
      console.error(`[FileService] Failed to purge file ${file.id}:`, err);
    }
  }
  const orphans = await runSystemCleanup();
  return {
    purgedCount,
    orphanCount: orphans.deletedCount,
    message: `Purged ${purgedCount} old files and cleaned ${orphans.deletedCount} orphans.`,
  };
};

export const runSystemCleanup = async () => {
  let deletedCount = 0;
  const allFiles = await db.File.findAll({
    include: [
      { model: db.FileLink, as: 'links', paranoid: false, attributes: ['id'] },
    ],
  });
  for (const file of allFiles) {
    if (!file.links || file.links.length === 0) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(file.createdAt) > oneHourAgo) continue;
      await deletePhysicalFile(file.path);
      await file.destroy({ force: true });
      deletedCount++;
    }
  }
  return { deletedCount };
};

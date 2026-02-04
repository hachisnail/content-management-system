import { sequelize, File, FileLink } from "../models/index.js";
import { recycleBinService } from "./recycleBinService.js";
import { FILE_CATEGORIES, CATEGORY_DEFAULTS } from "../config/categories.js";
import { FileSpecification } from "../specifications/FileSpecification.js";
import { storage } from "../core/storage/index.js";
import { AppError } from "../core/errors/AppError.js";
import logger from "../core/logging/Logger.js";
import { notificationService } from "./notificationService.js"; 
import { ROLES } from "../config/roles.js"; 
import sharp from 'sharp';

class FileService {
  constructor() {
    this.storage = storage;
  }

async uploadAndAttach(user, fileData, meta) {
    const {
      recordId,
      recordType,
      category = "attachment",
      visibility = "private",
    } = meta;

    logger.info(
      `[FileService] Upload start: ${fileData.originalname} (${fileData.mimetype}) by ${user.id}`,
    );

    const categoryRules = this._getCategoryRules(category);
    const spec = new FileSpecification(categoryRules);

    try {
      spec.isSatisfiedBy(fileData);
    } catch (err) {
      logger.warn(`[FileService] Validation failed: ${err.message}`);
      throw new AppError(err.message, 400);
    }

    // 1. Upload Main File
    const storagePath = await this.storage.upload(fileData, category);

    // 2. [NEW] Generate Thumbnail (Fire & Forget logic)
    if (fileData.mimetype.startsWith('image/')) {
        this._generateThumbnail(fileData.path, storagePath)
            .catch(err => logger.error(`[FileService] Thumbnail failed: ${err.message}`));
    }

    return await sequelize.transaction(async (t) => {
      try {
        const file = await File.create(
          {
            originalName: fileData.originalname,
            encoding: fileData.encoding,
            mimetype: fileData.mimetype,
            size: fileData.size,
            path: storagePath,
            visibility: visibility,
            uploadedBy: user.id,
            categoryId: null,
          },
          { transaction: t },
        );

        if (recordId && recordType) {
          await this._handleLinking(file, recordId, recordType, category, categoryRules, user, t);
        }

        logger.info(`[FileService] Upload success. File ID: ${file.id}`);
        return file;
      } catch (error) {
        logger.error(
          `[FileService] DB Error, cleaning up disk: ${storagePath}`,
        );
        await this.storage
          .delete(storagePath)
          .catch((err) => console.error("Cleanup failed:", err));
        throw error;
      }
    });
  }

  async _generateThumbnail(inputPath, storagePath) {
    try {
        // We read from the temp inputPath (before it was moved) OR use the buffer if available.
        // Since LocalAdapter moved the file, we can read from the new storagePath.
        // Safety check: wait a tick to ensure FS move is complete if async issues arise, 
        // but await this.storage.upload usually guarantees it.
        
        const thumbBuffer = await sharp(storagePath)
            .resize(300, 300, { 
                fit: 'cover',
                position: 'center' 
            })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();

        await this.storage.saveThumbnail(storagePath, thumbBuffer);
        logger.info(`[FileService] Generated thumbnail for ${storagePath}`);
    } catch (err) {
        throw new Error(`Sharp Error: ${err.message}`);
    }
  }

  async _handleLinking(file, recordId, recordType, category, rules, user, t) {
    if (rules.maxInstances === 1) {
      const existingLink = await FileLink.findOne({
        where: { recordId, recordType, category },
        transaction: t,
      });

      if (existingLink) {
        logger.info(
          `[FileService] Collision detected for ${category}. Archiving old file ${existingLink.fileId}`,
        );
        await recycleBinService.moveToBin(
          "files",
          existingLink.fileId,
          user.id,
          t,
        );
      }
    }

    await FileLink.create(
      {
        fileId: file.id,
        recordId,
        recordType,
        category,
        createdBy: user.id,
      },
      { transaction: t },
    );
  }

  async deleteFile(user, fileId) {
    logger.info(`[FileService] Delete request: ${fileId} by ${user.id}`);
    
    const file = await File.findByPk(fileId);
    if (!file) throw new AppError("File not found", 404);

    const isOwner = file.uploadedBy === user.id;
    const isSuperAdmin = user.roles && user.roles.includes('superadmin');

    if (!isOwner && !isSuperAdmin) {
      throw new AppError("Access Denied", 403);
    }

    await recycleBinService.moveToBin("files", fileId, user.id);

    await notificationService.broadcastToTargets(
      { roles: [ROLES.SUPERADMIN] },
      {
        title: "File Deleted",
        message: `File "${file.originalName}" was moved to Recycle Bin by ${user.firstName}.`,
        type: "warning",
        data: { link: `/files/recycle-bin` }
      }
    );

    return { message: "File moved to recycle bin" };
  }

  async restoreFile(user, binId) {
    logger.info(`[FileService] Restore request: Bin ID ${binId} by ${user.id}`);
    return await recycleBinService.restore(binId, user.id);
  }

  async updateFile(user, fileId, updates) {
    logger.info(`[FileService] Update request: ${fileId} by ${user.id}`);

    const file = await File.findByPk(fileId);
    if (!file) throw new AppError("File not found", 404);

    const isOwner = file.uploadedBy === user.id;
    const isSuperAdmin = user.roles && user.roles.includes('superadmin');

    if (!isOwner && !isSuperAdmin) {
      throw new AppError("Access Denied: You can only modify your own files.", 403);
    }

    const safeUpdates = {};
    
    if (updates.allowedRoles !== undefined) {
        safeUpdates.allowedRoles = updates.allowedRoles;
    }

    if (updates.visibility) {
        if (!['public', 'private'].includes(updates.visibility)) {
            throw new AppError("Invalid visibility option", 400);
        }
        safeUpdates.visibility = updates.visibility;
    }

    if (updates.originalName) safeUpdates.originalName = updates.originalName;
    if (updates.name) safeUpdates.originalName = updates.name;
    if (updates.newName) safeUpdates.originalName = updates.newName;

    if (Object.keys(safeUpdates).length > 0) {
        await file.update(safeUpdates);
        logger.info(`[FileService] File ${fileId} updated: ${Object.keys(safeUpdates).join(', ')}`);
    }

    return file;
  }

  _getCategoryRules(categoryName) {
    const config = FILE_CATEGORIES[categoryName];

    if (!config) {
      return {
        maxInstances: -1,
        maxSize: CATEGORY_DEFAULTS.maxSize,
        allowedMimes: CATEGORY_DEFAULTS.allowedMimes,
      };
    }

    return {
      maxInstances: config.singleInstance ? 1 : -1,
      maxSize: config.maxSize || CATEGORY_DEFAULTS.maxSize,
      allowedMimes: config.allowedMimes || CATEGORY_DEFAULTS.allowedMimes,
    };
  }
}

export const fileService = new FileService();
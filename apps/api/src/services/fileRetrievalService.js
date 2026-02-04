import { File } from '../models/index.js';
import { storage } from '../core/storage/index.js'; 
import { AppError } from '../core/errors/AppError.js'; 

export class FileRetrievalService {
  constructor() {
    this.storage = storage; // Auto-injected from Core
  }

  /**
   * Get file stream for downloading/serving
   */
  async getStream(user, fileId) {
    console.log(`[Retrieval] Fetching ID: ${fileId} for User: ${user.id}`);

    // [FIX] Added paranoid: false to allow fetching files currently in the Recycle Bin
    // This prevents 404 errors when previews are requested for swapped/deleted items.
    const file = await File.findByPk(fileId, { 
      include: ['links'],
      paranoid: false 
    });
    
    if (!file) {
      throw new AppError("File not found", 404);
    }

    this._checkAccess(user, file);

    try {
      const stream = await this.storage.getStream(file.path);
      return { stream, meta: file };
    } catch (err) {
      console.error(`[Retrieval] Disk Read Failed: ${file.path}`);
      throw new AppError("File content missing on disk", 404);
    }
  }

  /**
   * Get single file metadata
   */
  async getFileMetadata(user, fileId) {
    // [FIX] Added paranoid: false here as well
    const file = await File.findByPk(fileId, { 
      include: ['links'],
      paranoid: false 
    });
    
    if (!file) throw new AppError("File not found", 404);

    this._checkAccess(user, file);
    return file;
  }

  /**
   * List all files uploaded by user
   */
  async getUserFiles(user, query) {
    return await File.findAll({ 
      where: { uploadedBy: user.id },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Internal Access Control
   */
  _checkAccess(user, file) {
    if (file.visibility === 'public') return true;
    if (user.roles?.includes('admin') || user.roles?.includes('superadmin')) return true;
    if (file.uploadedBy === user.id) return true;

    if (file.allowedRoles && Array.isArray(file.allowedRoles) && file.allowedRoles.length > 0) {
      const hasRole = file.allowedRoles.some(role => user.roles.includes(role));
      if (hasRole) return true;
    }

    throw new AppError("Access Denied", 403);
  }
}

export const fileRetrievalService = new FileRetrievalService();
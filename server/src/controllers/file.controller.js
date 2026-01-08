import * as FileService from '../services/file.service.js';
import { db } from '../models/index.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Match the config logic
const UPLOADS_ROOT = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'uploads');

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) throw new Error('No file uploaded');

    const fileRecord = await FileService.processUpload(req.file, {
      relatedType: req.body.relatedType,
      relatedId: req.body.relatedId,
      isPublic: req.body.isPublic,
      allowedRoles: req.body.allowedRoles,
      user: req.user
    });

    res.status(201).json({ success: true, data: fileRecord });
  } catch (error) {
    next(error);
  }
};

export const viewFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const file = await db.File.findByPk(id);
    if (!file) return res.status(404).send('File not found');

    if (!file.isPublic) {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).send('Unauthorized');
      }

      const restrictedRoles = file.allowedRoles || [];
      if (restrictedRoles.length > 0) {
        const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        const isSuperAdmin = userRoles.includes('super_admin');
        const hasPermission = userRoles.some(r => restrictedRoles.includes(r));

        if (!isSuperAdmin && !hasPermission) {
          return res.status(403).send('Forbidden: Insufficient Permissions');
        }
      }
    }

    const folderName = file.relatedType || 'misc'; 
    // Construct path based on current UPLOADS_ROOT
    const absolutePath = path.join(UPLOADS_ROOT, folderName, file.fileName);
    
    try {
      await fs.access(absolutePath);
    } catch {
      return res.status(410).send('File missing from disk');
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    const safeFilename = encodeURIComponent(file.originalName);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${safeFilename}`);
    
    res.sendFile(absolutePath);

  } catch (error) {
    next(error);
  }
};
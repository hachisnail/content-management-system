import { db } from '../models/index.js';
import { triggerSmartUpdate } from '../models/hooks.js';
import { logOperation } from './logger.js'; 
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_ROOT = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'uploads');

const SINGLE_FILE_RESOURCES = ['users']; 

// ... (keep deleteFile as is) ...
export const deleteFile = async (fileId) => {
  try {
    const file = await db.File.findByPk(fileId);
    if (!file) return;

    try {
      const folder = file.relatedType || 'misc';
      const dynamicPath = path.join(UPLOADS_ROOT, folder, file.fileName);
      await fs.unlink(dynamicPath);
    } catch (err) {
      console.warn(`[FileService] Warning: Could not delete physical file ${file.fileName}.`, err.message);
    }

    await file.destroy();
    console.log(`[FileService] Cleaned up file record: ${fileId}`);

  } catch (error) {
    console.error(`[FileService] Error deleting file ${fileId}:`, error);
  }
};

export const processUpload = async (fileObject, { 
  relatedType, 
  relatedId, 
  isPublic, 
  allowedRoles, 
  user 
}) => {
  if (!fileObject) throw new Error('No file received');

  // 1. Handle Replacement
  if (relatedType && relatedId && SINGLE_FILE_RESOURCES.includes(relatedType)) {
    const existingFile = await db.File.findOne({ 
      where: { relatedType, relatedId } 
    });
    if (existingFile) {
      await deleteFile(existingFile.id);
    }
  }

  // 2. Parse Roles
  let rolesToSave = [];
  if (typeof allowedRoles === 'string') {
    try { rolesToSave = JSON.parse(allowedRoles); } catch { rolesToSave = [allowedRoles]; }
  } else if (Array.isArray(allowedRoles)) {
    rolesToSave = allowedRoles;
  }

  // 3. Create Record
  const newFile = await db.File.create({
    fileName: fileObject.filename,
    originalName: fileObject.originalname,
    mimeType: fileObject.mimetype,
    size: fileObject.size,
    path: fileObject.path, 
    isPublic: isPublic === 'true' || isPublic === true,
    allowedRoles: rolesToSave,
    relatedType, 
    relatedId,   
    uploadedBy: user ? user.email : 'guest',
  });

  // 4. Trigger Real-time Update
  if (relatedType && relatedId) {
    
    // FIX: If this is a User Profile Picture, we must "touch" the User record.
    if (relatedType === 'users') {
       const userToUpdate = await db.User.findByPk(relatedId);
       if (userToUpdate) {
          // A. Update "Live Status" immediately
          userToUpdate.last_active = new Date();
          
          // B. Save triggers 'afterSave' hook -> emits 'users_updated' with Profile Pic
          await userToUpdate.save(); 
       }
    } else {
       // Default behavior for other resources
       triggerSmartUpdate(relatedType, { id: relatedId });
    }
  }

  // 5. Audit Logging
  if (relatedType === 'users' && relatedId && user) {
    await logOperation({
      description: 'User updated profile picture',
      operation: 'UPDATE',
      affectedResource: `user:${relatedId}`,
      beforeState: null, 
      afterState: { 
        fileId: newFile.id, 
        fileName: newFile.fileName, 
        mimeType: newFile.mimeType 
      },
      initiator: user.email 
    });
  }

  return newFile;
};
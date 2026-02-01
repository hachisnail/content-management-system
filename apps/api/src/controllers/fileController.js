import { fileService } from '../services/fileService.js';
import { trackActivity } from '../utils/audit.js';
import path from 'path';

// [NEW] Added Missing Serve Function
export const serveFile = async (req, res, next) => {
  try {
    const file = await fileService.processFileAccess(req.params.id, req.user);
    
    // Resolve absolute path for security
    const absolutePath = path.resolve(file.path);
    res.sendFile(absolutePath, {
      headers: {
        'Content-Type': file.mimetype,
        'Content-Disposition': `inline; filename="${file.originalName}"`
      }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) throw new Error('No file uploaded');

    // FIX: Wrap arguments into a single object matching the Service's destructuring
    const file = await fileService.uploadFile({
      fileData: req.file,
      metaData: req.body,
      userId: req.user.id
    });
    
    trackActivity(req, 'UPLOAD_FILE', 'files', { 
      fileId: file.file.id, // Note: Service returns { file, link }
      fileName: file.file.originalName,
      size: file.file.size 
    });
    
    res.status(201).json(file);
  } catch (error) {
    next(error);
  }
};
export const getFiles = async (req, res, next) => {
  try {
    const result = await fileService.getFiles(req.user, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getFile = async (req, res, next) => {
  try {
    const file = await fileService.getFile(req.user, req.params.id);
    res.json(file);
  } catch (error) {
    next(error);
  }
};

export const updateFile = async (req, res, next) => {
  try {
    const file = await fileService.updateFile(req.user, req.params.id, req.body);
    
    trackActivity(req, 'UPDATE_FILE', 'files', { 
      fileId: file.id, 
      changes: Object.keys(req.body) 
    });

    res.json(file);
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    await fileService.deleteFile(req.user, req.params.id);

    trackActivity(req, 'DELETE_FILE', 'files', { fileId: req.params.id });

    res.json({ message: 'File moved to recycle bin' });
  } catch (error) {
    next(error);
  }
};
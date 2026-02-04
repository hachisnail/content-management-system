import { fileService } from '../services/fileService.js';
import { fileRetrievalService } from '../services/fileRetrievalService.js';
import { trackActivity } from '../utils/audit.js';

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) throw new Error('No file uploaded');

    const result = await fileService.uploadAndAttach(
      req.user,
      req.file,
      req.body 
    );

    // [AUDIT] Log Upload
    trackActivity(req, 'UPLOAD_FILE', 'files', {
      fileId: result.id,
      fileName: result.originalName,
      size: result.size,
      mimetype: result.mimetype
    });
    
    res.status(201).json({ file: result });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    await fileService.deleteFile(req.user, req.params.id);
    
    // [AUDIT] Log Delete
    trackActivity(req, 'DELETE_FILE', 'files', { fileId: req.params.id });

    res.json({ message: 'File moved to recycle bin' });
  } catch (error) {
    next(error);
  }
};

export const serveFile = async (req, res, next) => {
  try {
    const { stream, meta } = await fileRetrievalService.getStream(req.user, req.params.id);
    
    res.setHeader('Content-Type', meta.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${meta.originalName}"`);
    
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const getFiles = async (req, res, next) => {
  try {
    const result = await fileRetrievalService.getUserFiles(req.user, req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getFile = async (req, res, next) => {
  try {
    const file = await fileRetrievalService.getFileMetadata(req.user, req.params.id);
    res.json(file);
  } catch (error) {
    next(error);
  }
};

export const updateFile = async (req, res, next) => {
  try {
    const file = await fileService.updateFile(req.user, req.params.id, req.body);
    
    // [AUDIT] Log Update
    trackActivity(req, 'UPDATE_FILE', 'files', { fileId: req.params.id, updates: req.body });

    res.json(file);
  } catch (error) {
    next(error);
  }
};


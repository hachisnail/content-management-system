import { adminFilesService } from '../services/adminFilesService.js';
import { trackActivity } from '../utils/audit.js';

// Matches route: /list
export const getAllFiles = async (req, res, next) => {
  try {
    const result = await adminFilesService.getAllFiles(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Matches route: /tree
export const getTree = async (req, res, next) => {
  try {
    const tree = await adminFilesService.getDirectoryTree();
    res.json(tree);
  } catch (error) {
    next(error);
  }
};

// Matches route: /orphaned
export const getOrphanedFiles = async (req, res, next) => {
  try {
    const files = await adminFilesService.getOrphanedFiles();
    res.json(files);
  } catch (error) {
    next(error);
  }
};

// Matches route: /:id (DELETE)
export const deleteFileAdmin = async (req, res, next) => {
  try {
    await adminFilesService.deleteFile(req.params.id);
    
    trackActivity(req, 'ADMIN_DELETE_FILE', 'files', { fileId: req.params.id });
    
    res.json({ message: 'File deleted by admin' });
  } catch (error) {
    next(error);
  }
};

// Matches route: /visibility (PATCH)
export const bulkUpdateVisibility = async (req, res, next) => {
  try {
    const { fileIds, visibility } = req.body;
    if (!fileIds || !visibility) throw new Error("Missing fileIds or visibility");

    await adminFilesService.updateVisibility(fileIds, visibility);
    
    trackActivity(req, 'ADMIN_UPDATE_VISIBILITY', 'files', { count: fileIds.length, visibility });

    res.json({ message: 'Visibility updated' });
  } catch (error) {
    next(error);
  }
};

// Matches route: /:id/rename (PATCH)
export const renameFile = async (req, res, next) => {
  try {
    const { newName } = req.body;
    if (!newName) throw new Error("Missing newName");

    const file = await adminFilesService.renameFile(req.params.id, newName);
    
    trackActivity(req, 'ADMIN_RENAME_FILE', 'files', { fileId: file.id, newName });

    res.json(file);
  } catch (error) {
    next(error);
  }
};
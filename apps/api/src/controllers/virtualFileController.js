import { virtualFileService } from '../services/virtualFileService.js';
import { trackActivity } from '../utils/audit.js';

// Matches route: /list?path=users/avatar/2026
export const getAllFiles = async (req, res, next) => {
  try {
    const { path } = req.query;
    const virtualPath = path || 'Uncategorized'; 
    
    const files = await virtualFileService.listVirtualFolder(req.user, virtualPath, req.query);
    res.json(files);
  } catch (error) {
    next(error);
  }
};

// Matches route: /tree
export const getTree = async (req, res, next) => {
  try {
    const tree = await virtualFileService.getDirectoryStructure(req.user);
    res.json(tree);
  } catch (error) {
    next(error);
  }
};

// Matches route: /orphaned
export const getOrphanedFiles = async (req, res, next) => {
  try {
    const files = await virtualFileService.listVirtualFolder(req.user, 'Uncategorized');
    res.json(files);
  } catch (error) {
    next(error);
  }
};

// Matches route: /:id (DELETE)
export const deleteFileAdmin = async (req, res, next) => {
  try {
    // Service now checks if User is Owner or Superadmin
    await virtualFileService.deleteFile(req.user, req.params.id);
    
    trackActivity(req, 'ADMIN_DELETE_FILE', 'files', { fileId: req.params.id });
    
    res.json({ message: 'File moved to recycle bin' });
  } catch (error) {
    next(error);
  }
};

// Matches route: /visibility (PATCH)
export const bulkUpdateVisibility = async (req, res, next) => {
  try {
    const { fileIds, visibility } = req.body;
    if (!fileIds || !visibility) throw new Error("Missing fileIds or visibility");

    await virtualFileService.updateVisibility(req.user, fileIds, visibility);
    
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

    const file = await virtualFileService.renameFile(req.user, req.params.id, newName);
    
    trackActivity(req, 'ADMIN_RENAME_FILE', 'files', { fileId: file.id, newName });

    res.json(file);
  } catch (error) {
    next(error);
  }
};

// Matches route: /:id/move (PATCH)
export const moveFile = async (req, res, next) => {
    try {
        const { targetRecordType, targetCategory, targetRecordId } = req.body;
        // Service restricts this to Superadmin Only
        const file = await virtualFileService.moveFile(
            req.user, 
            req.params.id, 
            targetRecordType, 
            targetCategory, 
            targetRecordId
        );

        trackActivity(req, 'MOVE_FILE', 'files', { 
            fileId: req.params.id,
            targetRecordType,
            targetCategory,
            targetRecordId 
        });

        res.json(file);
    } catch (error) {
        next(error);
    }
};
import { Router } from 'express';
import * as controller from '../controllers/virtualFileController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js'; 
import { RESOURCES } from '../config/roles.js';        

const router = Router();
router.use(isAuthenticated);

// List & Tree Views
router.get('/list', authorize('readAny', RESOURCES.FILES), controller.getAllFiles);
router.get('/tree', authorize('readAny', RESOURCES.FILES), controller.getTree);

router.get('/orphaned', authorize('readAny', RESOURCES.FILES), controller.getOrphanedFiles);

// Operations
router.delete('/:id', authorize('deleteAny', RESOURCES.FILES), controller.deleteFileAdmin);
router.patch('/visibility', authorize('updateAny', RESOURCES.FILES), controller.bulkUpdateVisibility);
router.patch('/:id/rename', authorize('updateAny', RESOURCES.FILES), controller.renameFile);

router.patch('/:id/move', authorize('updateAny', RESOURCES.FILES), controller.moveFile);

export default router;
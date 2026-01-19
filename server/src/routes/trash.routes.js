import express from 'express';
import * as TrashController from '../controllers/trash.controller.js';
import { isAuthenticated, hasPermission } from '../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = express.Router();


router.get('/', isAuthenticated, hasPermission(PERMISSIONS.READ_TRASH), TrashController.getTrash);
router.get('/:id', isAuthenticated, hasPermission(PERMISSIONS.READ_TRASH), TrashController.getTrashItem); 

router.post('/:type/:id/restore', isAuthenticated, hasPermission(PERMISSIONS.RESTORE_TRASH), TrashController.restoreItem);
router.delete('/:type/:id', isAuthenticated, hasPermission(PERMISSIONS.DELETE_TRASH), TrashController.purgeItem);

export { router as trashRoutes };
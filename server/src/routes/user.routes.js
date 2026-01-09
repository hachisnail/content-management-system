import express from 'express';
import * as UserController from '../controllers/user.controller.js';
import { isAuthenticated, hasPermission } from '../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = express.Router();

// 1. VIEW DIRECTORY
router.get('/', isAuthenticated, hasPermission(PERMISSIONS.VIEW_USERS), UserController.getAllUsers);
router.get('/:id', isAuthenticated, hasPermission(PERMISSIONS.VIEW_USERS), UserController.getUserById);

// 2. CREATE (Invite) - Requires specific creation permission
router.post('/', isAuthenticated, hasPermission(PERMISSIONS.CREATE_USERS), UserController.createUser);

// 3. REVOKE (Delete Invite) - Usually tied to creation or management
router.delete('/:id', isAuthenticated, hasPermission(PERMISSIONS.CREATE_USERS), UserController.revokeUser);

// 4. UPDATE PROFILE
// Note: Controller handles "Self-Update" logic internally. 
// Middleware here ensures they can at least view/manage generally if it's not self.
router.put('/:id', isAuthenticated, UserController.updateUser);

// 5. COMPLETE REGISTRATION (Public)
router.post('/complete-registration', UserController.completeRegistration);

export { router as userRoutes };
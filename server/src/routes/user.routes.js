import express from 'express';
import * as UserController from '../controllers/user.controller.js';
import { isAuthenticated, hasPermission } from '../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = express.Router();

// 1. VIEW DIRECTORY (Read)
router.get('/', isAuthenticated, hasPermission(PERMISSIONS.READ_USERS), UserController.getAllUsers);
router.get('/:id', isAuthenticated, hasPermission(PERMISSIONS.READ_USERS), UserController.getUserById);

// 2. CREATE (Invite)
router.post('/', isAuthenticated, hasPermission(PERMISSIONS.CREATE_USERS), UserController.createUser);

// 3. REVOKE (Delete)
// Only users with explicit DELETE permission can do this
router.delete('/:id', isAuthenticated, hasPermission(PERMISSIONS.DELETE_USERS), UserController.revokeUser);

// 4. UPDATE PROFILE
// Logic inside controller handles self-update.
// Middleware can enforce that only those who can UPDATE_USERS can edit others.
router.put('/:id', isAuthenticated, UserController.updateUser);

// 5. COMPLETE REGISTRATION (Public)
router.post('/complete-registration', UserController.completeRegistration);

export { router as userRoutes };
// server/src/routes/user.routes.js
import express from 'express';
import * as UserController from '../controllers/user.controller.js';
import { isAuthenticated, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// PROTECTED: Only Admins can create new users (The "Invite" system)
router.post('/', isAuthenticated, isAdmin, UserController.createUser);

// PUBLIC: User completes their registration
router.post('/complete-registration', UserController.completeRegistration);

// PROTECTED: Staff can view list of users
router.get('/', isAuthenticated, UserController.getAllUsers);
router.get('/:id', isAuthenticated, UserController.getUserById);

// NEW: Update User Profile (Self or Admin)
router.put('/:id', isAuthenticated, UserController.updateUser);

router.delete('/:id', isAuthenticated, isAdmin, UserController.revokeUser);

export { router as userRoutes };
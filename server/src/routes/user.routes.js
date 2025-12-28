import express from 'express';
import * as UserController from '../controllers/user.controller.js';
import { isAuthenticated, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// PROTECTED: Only Admins can create new users (The "Invite" system)
router.post('/', isAuthenticated, isAdmin, UserController.createUser);

// PROTECTED: Staff can view list of users
router.get('/', isAuthenticated, UserController.getAllUsers);

export { router as userRoutes };
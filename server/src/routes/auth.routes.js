import express from 'express';
import * as AuthController from '../controllers/auth.controller.js';

const router = express.Router();

// Only Login and Logout remain public/accessible
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/status', AuthController.checkAuth);

export { router as authRoutes };
import express from 'express';
import rateLimit from 'express-rate-limit'; // Import
import * as AuthController from '../controllers/auth.controller.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: { success: false, message: "Too many login attempts, please try again later." }
});

const setupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
});

router.post('/login', authLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/status', AuthController.checkAuth);

router.get('/setup-status', AuthController.getSetupStatus);
router.post('/setup', setupLimiter, AuthController.setupAdmin); // Apply limiter

export { router as authRoutes };
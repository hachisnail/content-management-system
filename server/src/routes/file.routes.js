import express from 'express';
import { upload } from '../config/upload.js';
import * as FileController from '../controllers/file.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// SAFETY: Limit uploads to 10 per 15 mins per IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { success: false, message: 'Too many uploads. Please try again later.' }
});

// 1. Upload (Protected)
router.post(
  '/upload', 
  isAuthenticated, 
  uploadLimiter, 
  upload.single('file'), 
  FileController.uploadFile
);

// 2. View (Logic handles permissions)
router.get('/:id', FileController.viewFile);

export { router as fileRoutes };
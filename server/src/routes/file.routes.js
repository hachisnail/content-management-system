import express from 'express';
import { upload } from '../config/upload.js';
import * as FileController from '../controllers/file.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { success: false, message: 'Too many uploads. Please try again later.' }
});

// 1. Upload
router.post(
  '/upload', 
  isAuthenticated, 
  uploadLimiter, 
  upload.single('file'), 
  FileController.uploadFile
);

// 2. View
router.get('/:id', FileController.viewFile);

// 3. Delete (New)
router.delete('/:id', isAuthenticated, FileController.deleteFile);

export { router as fileRoutes };
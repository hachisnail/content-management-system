import express from 'express';
import { authRoutes } from './auth.routes.js';
import { userRoutes } from './user.routes.js';
import { donationRoutes } from './donation.routes.js';
import { auditLogRoutes } from './auditLog.routes.js';
import { configRoutes } from './config.routes.js';
import { fileRoutes } from './file.routes.js';
import { testRoutes } from './test.routes.js';
import { trashRoutes } from './trash.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);       // Admin Only
router.use('/donations', donationRoutes); // Mixed Public/Private
router.use('/audit_logs', auditLogRoutes); // Admin Only
router.use('/config', configRoutes);
router.use('/test_items', testRoutes);
router.use('/files', fileRoutes);
router.use('/admin/trash', trashRoutes);


export { router as routes };
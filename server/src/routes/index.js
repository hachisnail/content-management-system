import express from 'express';
import { authRoutes } from './auth.routes.js';
import { userRoutes } from './user.routes.js';
import { donationRoutes } from './donation.routes.js';
import { auditLogRoutes } from './auditLog.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);       // Admin Only
router.use('/donations', donationRoutes); // Mixed Public/Private
router.use('/audit_logs', auditLogRoutes); // Admin Only

export { router as routes };
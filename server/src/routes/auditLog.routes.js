import express from 'express';
import * as AuditLogController from '../controllers/auditLog.controller.js';
import { isAuthenticated, hasPermission } from '../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = express.Router();

// 1. List All Logs
router.get('/', isAuthenticated, hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS), AuditLogController.getAuditLogs);

// 2. View Single Log Details
router.get('/:id', isAuthenticated, hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS), AuditLogController.getAuditLogById);

export { router as auditLogRoutes };


import express from 'express';
import * as AuditLogController from '../controllers/auditLog.controller.js';
import { isAuthenticated, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', isAuthenticated, isAdmin, AuditLogController.getAuditLogs);

export { router as auditLogRoutes };
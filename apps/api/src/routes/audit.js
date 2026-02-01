import { Router } from 'express';
import * as auditController from '../controllers/auditController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { RESOURCES } from '../config/roles.js';

const router = Router();

// Global Protection: All audit routes require login
router.use(isAuthenticated);

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Retrieve system audit logs (Admin only)
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by action, resource, or IP
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by specific action (e.g., LOGIN, DELETE)
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource (e.g., users, files)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter logs by specific user ID
 *     responses:
 *       200:
 *         description: Paginated audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *       403:
 *         description: Access denied (Admins only)
 */
router.get(
  '/', 
  // Authorization: Check if user can "readAny" "audit_logs"
  authorize('readAny', RESOURCES.AUDIT_LOGS), 
  auditController.getAuditLogs
);


/**
 * @swagger
 * /audit-logs/{id}:
 *   get:
 *     summary: View a specific audit log
 *     tags: [System]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log details
 */
router.get(
  '/:id', 
  authorize('readAny', RESOURCES.AUDIT_LOGS),
  auditController.getAuditLogById
);


export default router;

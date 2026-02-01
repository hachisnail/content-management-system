// api/src/routes/recycle.js
import { Router } from "express";
import * as recycleController from "../controllers/recycleController.js";
import { isAuthenticated } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { RESOURCES } from "../config/roles.js";

const router = Router();

// Auth required for all routes
router.use(isAuthenticated);

// Admin/Superadmin base access
router.use(authorize("readAny", RESOURCES.RECYCLE_BIN));

/**
 * @swagger
 * /recycle-bin:
 *   get:
 *     summary: List all deleted items
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of deleted items
 */
router.get("/", recycleController.listDeleted);

/**
 * @swagger
 * /recycle-bin/{id}:
 *   get:
 *     summary: View details of a specific deleted item
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The Recycle Bin Entry ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted item details
 *       404:
 *         description: Item not found
 */
router.get("/:id", recycleController.getDeletedItem);

/**
 * @swagger
 * /recycle-bin/{id}/restore:
 *   post:
 *     summary: Restore a deleted item
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The Recycle Bin Entry ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item restored successfully
 *       403:
 *         description: Access denied
 */
router.post(
  "/:id/restore",
  authorize("updateAny", RESOURCES.RECYCLE_BIN),
  recycleController.restoreItem
);

/**
 * @swagger
 * /recycle-bin/{id}:
 *   delete:
 *     summary: Permanently delete an item
 *     tags: [System]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The Recycle Bin Entry ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item permanently deleted
 *       403:
 *         description: Access denied
 */
router.delete(
  "/:id",
  authorize("deleteAny", RESOURCES.RECYCLE_BIN),
  recycleController.forceDeleteItem
);

export default router;

import { Router } from "express";
import { upload } from "../config/upload.js";
import * as fileController from "../controllers/fileController.js";
import { isAuthenticated } from "../middleware/auth.js"; 

const router = Router();

/**
 * @swagger
 * /files:
 *   get:
 *     summary: List user's files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of files
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get(
  "/",
  isAuthenticated,
  fileController.getFiles
);

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Upload a new file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 */
router.post(
  "/upload",
  isAuthenticated,
  upload.single("file"),
  fileController.uploadFile
);

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Download or serve file content
 *     description: Public files are accessible anonymously. Private files require authentication.
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File content
 *       404:
 *         description: File not found
 */
router.get(
  "/:id", 
  fileController.serveFile
);

/**
 * @swagger
 * /files/{id}/details:
 *   get:
 *     summary: Get file metadata
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: File not found
 */
router.get(
  "/:id/details",
  isAuthenticated,
  fileController.getFile
);

/**
 * @swagger
 * /files/{id}:
 *   patch:
 *     summary: Update file (rename or change visibility)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New file name
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *     responses:
 *       200:
 *         description: File updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: File not found
 */
router.patch(
  "/:id",
  isAuthenticated,
  fileController.updateFile
);

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Move file to recycle bin
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File moved to recycle bin
 *       404:
 *         description: File not found
 */
router.delete(
  "/:id",
  isAuthenticated,
  fileController.deleteFile
);

export default router;

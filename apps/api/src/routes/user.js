import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { RESOURCES } from '../config/roles.js';
import { updateUserSchema } from '@repo/validation/src/user.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(isAuthenticated);

router.get('/', authorize('readAny', RESOURCES.USERS), userController.getUsers);
/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get my own profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', userController.getMe);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a specific user (Auth required)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/:id', userController.getUser);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user profile
 *     description: >
 *       Users can update their own basic info.
 *       Admins can update others (roles, status, password reset) if they have higher rank.
 *       Only Superadmin can update email.
 *     tags: [Users]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Hierarchy violation or email restriction
 */
router.patch('/:id', isAuthenticated, userController.updateUser);

// [NEW] Soft Delete User
router.delete(
  '/:id',
  authorize('deleteAny', RESOURCES.USERS),
  userController.deleteUser
);

// [NEW] Force Disconnect (Logout)
router.post(
  '/:id/disconnect',
  authorize('updateAny', RESOURCES.USERS), 
  userController.forceDisconnect
);

export default router;

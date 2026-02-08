import { Router } from "express";
import {
  loginSchema,
  inviteUserSchema,
  completeRegistrationSchema,
  onboardingSchema,     
  forgotPasswordSchema, 
  resetPasswordSchema,
  changePasswordSchema
} from "@repo/validation";
import { validate } from "../middleware/validate.js";
import * as authController from "../controllers/authController.js";
import { isAuthenticated } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { RESOURCES } from "../config/roles.js";

const router = Router();

/**
 * @swagger
 * /auth/onboard/status:
 *   get:
 *     summary: Check if system initialization is required
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Returns true if no users exist
 */
router.get("/onboard/status", authController.checkOnboardingStatus);

/**
 * @swagger
 * /auth/onboard:
 *   post:
 *     summary: Initial system onboarding (Superadmin setup)
 *     description: This endpoint is only available when the user database is empty.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Superadmin created and logged in
 *       403:
 *         description: Forbidden - System already has users
 */
router.post("/onboard", validate(onboardingSchema), authController.onboard);


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/invite:
 *   post:
 *     summary: Invite a new user (Admin/Curator)
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - roles
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Invitation sent
 *       403:
 *         description: Forbidden
 */
router.post(
  "/invite",
  isAuthenticated,
  authorize("createAny", RESOURCES.USERS),
  validate(inviteUserSchema),
  authController.inviteUser,
);

router.post(
  "/invite/:id/resend",
  isAuthenticated,
  authorize("createAny", RESOURCES.USERS), // Same permission as creating an invite
  authController.resendInvitation
);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change current user's password
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: oldPass123
 *               newPassword:
 *                 type: string
 *                 example: newSecurePass456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated
 *       400:
 *         description: Invalid current password
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/change-password",
  isAuthenticated,
  validate(changePasswordSchema),
  authController.changePassword
);


/**
 * @swagger
 * /auth/register/complete:
 *   post:
 *     summary: Complete registration with token
 *     description: Sets the password for an invited user. First and Last name are already set during invitation.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               contactNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Invalid token or password mismatch
 */
router.post(
  "/register/complete",
  validate(completeRegistrationSchema),
  authController.completeRegistration,
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Not authenticated
 */
router.get("/me", authController.getMe);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent (or simulated)
 */
router.post('/forgot-password',validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token
 */
router.post('/reset-password',validate(resetPasswordSchema), authController.resetPassword);

router.get('/invite/validate', authController.validateInvitation);
router.get('/reset-password/validate', authController.validateReset);
export default router;

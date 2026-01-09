import express from 'express';
import * as DonationController from '../controllers/donation.controller.js';
import { isAuthenticated, hasPermission } from '../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = express.Router();

// PUBLIC: Submit
router.post('/submit', DonationController.submitDonation);

// PROTECTED: List
router.get('/', isAuthenticated, hasPermission(PERMISSIONS.VIEW_DONATIONS), DonationController.getAllDonations);

// PROTECTED: Update Status (Intake)
router.patch(
  '/:id/status', 
  isAuthenticated, 
  hasPermission(PERMISSIONS.PROCESS_DONATIONS), 
  DonationController.updateStatus
);

export { router as donationRoutes };
import express from 'express';
import * as DonationController from '../controllers/donation.controller.js';
import { isAuthenticated, hasRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// PUBLIC ROUTE (No middleware)
// Any guest can hit this to submit a form
router.post('/submit', DonationController.submitDonation);

// PROTECTED ROUTES (Requires Login)
// Only staff can view list or change status
router.get('/', isAuthenticated, DonationController.getAllDonations);
router.patch(
  '/:id/status', 
  isAuthenticated, 
  hasRoles(['admin', 'inventory_manager', 'super_admin']), 
  DonationController.updateStatus
);

export { router as donationRoutes };
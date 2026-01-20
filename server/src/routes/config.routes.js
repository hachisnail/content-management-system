// server/src/routes/config.routes.js
import express from 'express';
import { getRoleConfig } from '../controllers/config.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';


const router = express.Router();

// Public route (or protected if you prefer) so the app can bootstrap
router.get('/', isAuthenticated, getRoleConfig);

export { router as configRoutes };
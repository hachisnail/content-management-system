import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import * as controller from '../controllers/notificationController.js';

const router = Router();

router.use(isAuthenticated); 

// Standard User Routes
router.get('/', controller.listNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/read', controller.markRead);
router.patch('/read-all', controller.markAllRead);

// Test & Admin Routes
router.post('/test', controller.sendTestNotification);
router.post('/test-broadcast', controller.broadcastTestNotification);
router.post('/send', controller.sendTargetedNotification); // [NEW]

export default router;
import { Router } from 'express';
import authRoutes from './auth.js';
import fileRoutes from './file.js';
import recycleRoutes from './recycleBin.js';
import auditRoutes from './audit.js';
import userRoutes from './user.js'; 
import virtualFileRoutes from './virtualFile.js';
import configRoutes from './config.js'
import notificationRoutes from './notification.js';


const router = Router();


router.use('/config', configRoutes)
router.use('/auth', authRoutes);
router.use('/files', fileRoutes);
router.use('/recycle-bin', recycleRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/users', userRoutes); 
router.use('/files/manager', virtualFileRoutes);
router.use('/notifications', notificationRoutes);

export default router;
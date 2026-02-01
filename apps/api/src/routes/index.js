import { Router } from 'express';
import authRoutes from './auth.js';
import fileRoutes from './file.js';
import recycleRoutes from './recycle.js';
import auditRoutes from './audit.js';
import userRoutes from './user.js'; 
import adminFileRoutes from './adminFile.js';
import configRoutes from './config.js'


const router = Router();


router.use('/config', configRoutes)
router.use('/auth', authRoutes);
router.use('/files', fileRoutes);
router.use('/recycle-bin', recycleRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/users', userRoutes); 
router.use('/admin/files', adminFileRoutes);

export default router;
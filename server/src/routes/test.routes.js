import express from 'express';
import * as TestController from '../controllers/test.controller.js';

const router = express.Router();

// Collections
router.get('/', TestController.getAllTestItems);
router.post('/', TestController.createTestItem);

// Maintenance & Trash (Must be before /:id)
router.get('/cleanup', TestController.triggerCleanup);
router.get('/trash', TestController.getTrash); // <--- ADDED

// Specific Item Operations
router.get('/:id', TestController.getTestItem);
router.delete('/:id', TestController.deleteTestItem);
router.post('/:id/restore', TestController.restoreTestItem); // <--- ADDED

export { router as testRoutes };

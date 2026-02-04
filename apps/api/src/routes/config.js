import { Router } from "express";
import { isAuthenticated } from '../middleware/auth.js';
import ac, { ROLES, ROLE_HIERARCHY, RESOURCES } from '../config/roles.js';

const router = Router();

router.get('/roles', isAuthenticated, (req, res, next) => {
  try {
    res.json({
      ROLES,
      ROLE_HIERARCHY,
      RESOURCES,
      grants: ac.getGrants() 
    });
  } catch (error) {
    next(error);
  }
});

export default router;
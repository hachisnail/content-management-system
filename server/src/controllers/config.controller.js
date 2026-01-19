import { ROLES, PERMISSIONS, ROLE_DEFINITIONS } from '../config/permissions.js';
import { FILE_LIMITS } from '../config/upload.js'; 
import { config } from '../config/env.js'; 

export const getRoleConfig = (req, res) => {
  res.json({
    version: config.app.version, 
    ROLES,
    PERMISSIONS,
    ROLE_DEFINITIONS,
    FILE_LIMITS 
  });
};
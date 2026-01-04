// server/src/controllers/config.controller.js
import { ROLES, PERMISSIONS, ROLE_DEFINITIONS } from '../config/permissions.js';

export const getRoleConfig = (req, res) => {
  // Send the raw config constants to the client
  res.json({
    ROLES,
    PERMISSIONS,
    ROLE_DEFINITIONS
  });
};
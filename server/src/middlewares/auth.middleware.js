import { ROLE_DEFINITIONS, PERMISSIONS } from '../config/permissions.js';

export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
};

/**
 * Checks if the user has a specific permission based on their role(s).
 * @param {string} permission - The permission key (e.g., 'create_users')
 */
export const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Normalize roles to an array
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];

    // 1. Super Admin Bypass (Optimization)
    if (userRoles.includes('super_admin')) {
      return next();
    }

    // 2. Check if ANY of the user's roles grants the required permission
    const hasAccess = userRoles.some(role => {
      const allowedActions = ROLE_DEFINITIONS[role] || [];
      return allowedActions.includes(permission);
    });

    if (hasAccess) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: `Forbidden: Missing permission '${permission}'` 
    });
  };
};

/**
 * Legacy Helper: Checks for specific roles directly.
 * Useful for logic that strictly requires a specific role (e.g., 'super_admin' only).
 */
export const hasRoles = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });

    const userRoles = req.user.role || [];
    if (userRoles.includes('super_admin')) return next();

    const hasRole = userRoles.some(r => requiredRoles.includes(r));
    if (hasRole) return next();

    return res.status(403).json({ message: 'Forbidden' });
  };
};

export const isAdmin = hasRoles(['admin', 'super_admin']);
// src/middlewares/auth.middleware.js

export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
};

export const hasRoles = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Normalized User Roles from DB (it's now an array)
    const userRoles = req.user.role || []; 

    // 1. Super Admin bypasses everything
    if (userRoles.includes('super_admin')) {
      return next();
    }

    // 2. Check if user has AT LEAST ONE of the required roles
    const hasPermission = userRoles.some(r => requiredRoles.includes(r));

    if (hasPermission) {
      return next();
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  };
};

export const isAdmin = hasRoles(['admin', 'super_admin']);
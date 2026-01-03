export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized' });
};

export const hasRoles = (roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRoles = req.user.role;
    if (userRoles.includes('super_admin') || roles.some(role => userRoles.includes(role))) {
      return next();
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  };
};

export const isAdmin = hasRoles(['admin']);
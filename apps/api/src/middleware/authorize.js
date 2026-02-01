import ac from '../config/roles.js';

export const authorize = (action, resource) => (req, res, next) => {
  try {

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not logged in' });
    }

    const userRoles = req.user.roles || [];
    
    let granted = false;
    let permission = null;

    for (const role of userRoles) {
      const check = ac.can(role)[action](resource);
      if (check.granted) {
        granted = true;
        permission = check;
        break; 
      }
    }

    if (!granted) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `None of your roles (${userRoles.join(', ')}) allow performing '${action}' on '${resource}'`
      });
    }

    req.permission = permission;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Authorization failed' });
  }
};
import { ROLES, PERMISSIONS, ROLE_DEFINITIONS } from '../config/permissions.js';
import { FILE_LIMITS } from '../config/upload.js'; 
import { config } from '../config/env.js'; 

export const getRoleConfig = (req, res) => {
  // 1. Default: Guest sees no definitions
  let visibleDefinitions = {};
  let myPermissions = [];

  // 2. If Logged In, calculate what they are allowed to see
  if (req.user && req.user.role) {
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];

    // Calculate the user's effective permissions
    const effectivePerms = new Set();
    userRoles.forEach(role => {
      const perms = ROLE_DEFINITIONS[role] || [];
      perms.forEach(p => effectivePerms.add(p));
    });

    const isSuperAdmin = userRoles.includes('super_admin');
    // Check if user is an Admin who needs to assign roles to others
    const canManageRoles = isSuperAdmin || effectivePerms.has(PERMISSIONS.MANAGE_USER_ROLES);

    if (canManageRoles) {
      // STRATEGY: Admin View
      // Admins need the full list to populate "Assign Role" dropdowns in the UI
      visibleDefinitions = ROLE_DEFINITIONS;
    } else {
      // STRATEGY: Data Minimization (Basic User)
      // Only send the definition for their OWN role(s) so the UI works, 
      // but they don't see the capabilities of other roles.
      userRoles.forEach(role => {
        if (ROLE_DEFINITIONS[role]) {
          visibleDefinitions[role] = ROLE_DEFINITIONS[role];
        }
      });
    }

    myPermissions = Array.from(effectivePerms);
  }

  res.json({
    version: config.app.version, 
    // Constants are safe to expose
    ROLES,
    PERMISSIONS,
    FILE_LIMITS,
    
    // Dynamic/Filtered Data
    ROLE_DEFINITIONS: visibleDefinitions,
    
    // Convenience field: A flat list of what THIS user can do.
    // Frontend can check `my_permissions.includes('create_users')` 
    // instead of traversing ROLE_DEFINITIONS.
    my_permissions: myPermissions
  });
};
// 1. ROLES: The list of available roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  INVENTORY_MANAGER: 'inventory_manager',
  ACQUISITIONS_MANAGER: 'acquisitions_manager',
  ARTICLES_MANAGER: 'articles_manager',
  APPOINTMENTS_MANAGER: 'appointments_manager',
  VIEWER: 'viewer',
};

// 2. PERMISSIONS: The list of distinct actions
export const PERMISSIONS = {
  // Navigation
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_MONITOR: 'view_monitor',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_ADMIN_TOOLS: 'view_admin_tools',
  VIEW_SOCKET_TEST: 'view_socket_test',

  // Actions
  MANAGE_USERS: 'manage_users',
  DISCONNECT_USERS: 'disconnect_users',
  MANAGE_SYSTEM: 'manage_system',
  CREATE_DONATION: 'create_donation',
};

// 3. ROLE_DEFINITIONS: Who can do what
export const ROLE_DEFINITIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), 
  
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MONITOR,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_SOCKET_TEST,
    PERMISSIONS.CREATE_DONATION,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.DISCONNECT_USERS
  ],
  
  [ROLES.INVENTORY_MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_DONATION,
  ],

  [ROLES.ACQUISITIONS_MANAGER]: [PERMISSIONS.VIEW_DASHBOARD],
  [ROLES.ARTICLES_MANAGER]: [PERMISSIONS.VIEW_DASHBOARD],
  [ROLES.APPOINTMENTS_MANAGER]: [PERMISSIONS.VIEW_DASHBOARD],
  [ROLES.VIEWER]: [PERMISSIONS.VIEW_DASHBOARD],
};

// Helper for backend validation
export const getAllowedRoles = () => Object.values(ROLES);
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
  // --- CORE ACCESS ---
  VIEW_DASHBOARD: 'view_dashboard',

  // --- SYSTEM MONITORING & TOOLS ---
  VIEW_MONITOR: 'view_monitor',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_ADMIN_TOOLS: 'view_admin_tools',
  VIEW_SOCKET_TEST: 'view_socket_test',

  // --- USER MANAGEMENT ---
  VIEW_USERS: 'view_users', 
  MANAGE_USERS: 'manage_users', 
  CREATE_USERS: 'create_users', 
  MANAGE_USER_ROLES: 'manage_user_roles', 
  MANAGE_USER_STATUS: 'manage_user_status', 
  DISCONNECT_USERS: 'disconnect_users', 

  // --- DONATIONS & INVENTORY ---
  CREATE_DONATION: 'create_donation',
  VIEW_DONATIONS: 'view_donations',
  PROCESS_DONATIONS: 'process_donations',
  MANAGE_INVENTORY: 'manage_inventory', 

  // --- CONTENT (CMS) ---
  VIEW_ARTICLES: 'view_articles',
  MANAGE_ARTICLES: 'manage_articles', 

  // --- BUSINESS LOGIC ---
  VIEW_ACQUISITIONS: 'view_acquisitions',
  MANAGE_ACQUISITIONS: 'manage_acquisitions',

  VIEW_APPOINTMENTS: 'view_appointments',
  MANAGE_APPOINTMENTS: 'manage_appointments',
};

// 3. ROLE_DEFINITIONS: Who can do what
export const ROLE_DEFINITIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  // ADMIN: Operational control, but cannot change roles or access raw server logs unless specified
  [ROLES.ADMIN]: [
    // Core
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MONITOR,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_SOCKET_TEST,

    // Users
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.MANAGE_USER_STATUS, // Admins can disable, but maybe not change roles
    PERMISSIONS.DISCONNECT_USERS,

    // Domains
    PERMISSIONS.VIEW_DONATIONS,
    PERMISSIONS.PROCESS_DONATIONS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_ARTICLES,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.VIEW_ACQUISITIONS,
  ],

  // INVENTORY MANAGER: Focused on items and donations
  [ROLES.INVENTORY_MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_DONATION,
    PERMISSIONS.VIEW_DONATIONS,
    PERMISSIONS.PROCESS_DONATIONS,
    PERMISSIONS.MANAGE_INVENTORY,
  ],

  // ACQUISITIONS MANAGER
  [ROLES.ACQUISITIONS_MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ACQUISITIONS,
    PERMISSIONS.MANAGE_ACQUISITIONS,
    PERMISSIONS.VIEW_DONATIONS, // Likely needs to see donations to acquire them
  ],

  // ARTICLES MANAGER (CMS)
  [ROLES.ARTICLES_MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ARTICLES,
    PERMISSIONS.MANAGE_ARTICLES,
  ],

  // APPOINTMENTS MANAGER
  [ROLES.APPOINTMENTS_MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_USERS, // Might need to see who they are meeting
  ],

  // VIEWER: Read-only access
  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ARTICLES, // Public news
    // Can generally see public info, but no management actions
  ],

};

// Helper for backend validation
export const getAllowedRoles = () => Object.values(ROLES);

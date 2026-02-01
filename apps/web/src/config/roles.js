// web/src/config/roles.js
// Shared constants for Frontend Logic

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  CURATOR: 'curator',       
  EDITOR: 'editor',         
  SCHEDULER: 'scheduler',   
  AUDITOR: 'auditor',       
  DONOR: 'donor',            
  GUEST: 'guest'             
};

export const RESOURCES = {
  USERS: 'users',
  AUDIT_LOGS: 'audit_logs',
  ARTIFACTS: 'artifacts',
  ACCESSIONS: 'accessions',
  ARTICLES: 'articles',
  APPOINTMENTS: 'appointments',
  DASHBOARD: 'dashboard',
  SYSTEM: 'system',
  INTAKE: 'intake',
  SUPPORT: 'support',
  FILES: 'files', 
  RECYCLE_BIN: 'recycle_bin', 
};

export const ROLE_HIERARCHY = {
  [ROLES.SUPERADMIN]: 100,
  [ROLES.ADMIN]: 50,
  [ROLES.CURATOR]: 20,
  [ROLES.EDITOR]: 20,
  [ROLES.SCHEDULER]: 20,
  [ROLES.AUDITOR]: 10,
  [ROLES.DONOR]: 5,
  [ROLES.GUEST]: 0
};

// UI Helper: Get label or color for roles
export const getRoleBadgeColor = (role) => {
    switch (role) {
        case ROLES.SUPERADMIN: return 'badge-error'; // Red
        case ROLES.ADMIN: return 'badge-warning'; // Orange
        case ROLES.CURATOR: return 'badge-primary'; // Blue
        case ROLES.EDITOR: return 'badge-secondary'; // Purple
        case ROLES.SCHEDULER: return 'badge-accent'; // Teal
        case ROLES.AUDITOR: return 'badge-info'; // Cyan
        default: return 'badge-ghost';
    }
};
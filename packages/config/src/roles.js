// This file is safe to import in Frontend and Backend
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
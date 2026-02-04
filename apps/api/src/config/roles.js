import { AccessControl } from 'accesscontrol';

const ac = new AccessControl();

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  CURATOR: 'curator',       // Inventory & Accessioning
  EDITOR: 'editor',         // Articles
  SCHEDULER: 'scheduler',   // Appointments
  AUDITOR: 'auditor',       // Viewer/Manager
  DONOR: 'donor',            // External User
  GUEST: 'guest'             // Unauthenticated
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

// --- Permission Definitions ---

// 1. Auditor (The "Manager" who just checks)
ac.grant(ROLES.AUDITOR)
  .readAny(RESOURCES.DASHBOARD)
  .readAny(RESOURCES.ARTIFACTS)
  .readAny(RESOURCES.ACCESSIONS)
  .readAny(RESOURCES.ARTICLES)
  .readAny(RESOURCES.APPOINTMENTS)
  // 

// 2. Scheduler (Manage Appointments)
ac.grant(ROLES.SCHEDULER)
  .extend(ROLES.AUDITOR)
  .createAny(RESOURCES.APPOINTMENTS)
  .updateAny(RESOURCES.APPOINTMENTS)
  .deleteAny(RESOURCES.APPOINTMENTS);

// 3. Editor (Manage Articles)
ac.grant(ROLES.EDITOR)
  .extend(ROLES.AUDITOR)
  .createAny(RESOURCES.ARTICLES)
  .updateAny(RESOURCES.ARTICLES)
  .deleteAny(RESOURCES.ARTICLES);

// 4. Curator (Manage Inventory, Accessioning & Intakes)
ac.grant(ROLES.CURATOR)
  .extend(ROLES.AUDITOR)
  // Artifacts & Accessioning
  .createAny(RESOURCES.ARTIFACTS)
  .updateAny(RESOURCES.ARTIFACTS)
  .deleteAny(RESOURCES.ARTIFACTS)
  .createAny(RESOURCES.ACCESSIONS)
  .updateAny(RESOURCES.ACCESSIONS)
  // Intake Management (Reviewing Donors)
  .readAny(RESOURCES.INTAKE)    // Can see all donor requests
  .updateAny(RESOURCES.INTAKE) // Can approve/reject requests
  .readAny(RESOURCES.SUPPORT)   // Can see all incoming help requests
  .createAny(RESOURCES.SUPPORT) // Can reply to anyone
  .updateAny(RESOURCES.SUPPORT);

// 5. Donor (External User)
ac.grant(ROLES.DONOR)
  .createOwn(RESOURCES.INTAKE)     // Submit form
  .readOwn(RESOURCES.INTAKE)       // Track status
  .updateOwn(RESOURCES.INTAKE)     // Edit draft
  .readOwn(RESOURCES.ACCESSIONS)   // See the final official record once accepted
  .createOwn(RESOURCES.SUPPORT) // Can send a message
  .readOwn(RESOURCES.SUPPORT);  // Can read their own replies

// 6. Admin (Overseer)
ac.grant(ROLES.ADMIN)
  .extend([ROLES.CURATOR, ROLES.EDITOR, ROLES.SCHEDULER])
  .readAny(RESOURCES.AUDIT_LOGS)
  .readAny(RESOURCES.USERS)
  .createAny(RESOURCES.USERS)
  .updateAny(RESOURCES.USERS)
  .deleteAny(RESOURCES.USERS)
  .readAny(RESOURCES.SYSTEM)
  .readAny(RESOURCES.FILES);

// 7. Super Admin (God Mode)
ac.grant(ROLES.SUPERADMIN)
  .extend(ROLES.ADMIN)
  .createAny(RESOURCES.SYSTEM)
  .updateAny(RESOURCES.SYSTEM)
  .deleteAny(RESOURCES.SYSTEM)
  // Files: Full Control
  .createAny(RESOURCES.FILES)
  .updateAny(RESOURCES.FILES)
  .deleteAny(RESOURCES.FILES)
  // Recycle Bin: Full Control (Exclusive)
  .readAny(RESOURCES.RECYCLE_BIN)
  .updateAny(RESOURCES.RECYCLE_BIN)
  .deleteAny(RESOURCES.RECYCLE_BIN);

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

/**
 * Check if Requester can modify Target based on Rank.
 * Rule: Requester must have strictly higher rank than Target.
 */
export const canModifyUser = (requesterRoles, targetRoles) => {
  const rRoles = Array.isArray(requesterRoles) ? requesterRoles : [requesterRoles];
  const tRoles = Array.isArray(targetRoles) ? targetRoles : [targetRoles];

  const getRank = (roles) => Math.max(...roles.map(r => ROLE_HIERARCHY[r] || 0));

  const rRank = getRank(rRoles);
  const tRank = getRank(tRoles);

  if (rRoles.includes(ROLES.SUPERADMIN)) return true;

  return rRank > tRank;
};
export default ac;
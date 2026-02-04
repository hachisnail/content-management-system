import { AccessControl } from 'accesscontrol';

const ac = new AccessControl();

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  CURATOR: 'curator',      
  CONSERVATOR: 'conservator', 
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
  CONSERVATION: 'conservation', 

  DASHBOARD: 'dashboard',
  SYSTEM: 'system',
  INTAKE: 'intake',
  SUPPORT: 'support',
  FILES: 'files', 
  RECYCLE_BIN: 'recycle_bin', 
  FEEDBACK: 'feedback'
};

// --- Permission Definitions ---

// 1. Auditor (The "Manager" who just checks)
ac.grant(ROLES.AUDITOR)
  .readAny(RESOURCES.DASHBOARD)
  .readAny(RESOURCES.ARTIFACTS) 
  .readAny(RESOURCES.ACCESSIONS)
  .readAny(RESOURCES.ARTICLES)
  .readAny(RESOURCES.APPOINTMENTS)
  .readAny(RESOURCES.FEEDBACK)
  .readAny(RESOURCES.CONSERVATION); 

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
  // Inventory (Artifacts) Management
  .createAny(RESOURCES.ARTIFACTS)
  .updateAny(RESOURCES.ARTIFACTS)
  .deleteAny(RESOURCES.ARTIFACTS)
  // Accessioning
  .createAny(RESOURCES.ACCESSIONS)
  .updateAny(RESOURCES.ACCESSIONS)
  // Intake Management (Reviewing Donors)
  .readAny(RESOURCES.INTAKE)    
  .updateAny(RESOURCES.INTAKE) 
  // Support & Feedback
  .readAny(RESOURCES.SUPPORT)   
  .createAny(RESOURCES.SUPPORT) 
  .updateAny(RESOURCES.SUPPORT)
  .readAny(RESOURCES.FEEDBACK)   
  .createAny(RESOURCES.FEEDBACK) 
  .updateAny(RESOURCES.FEEDBACK);

// 5. Conservator (Manage Treatment & Condition)
ac.grant(ROLES.CONSERVATOR)
  .extend(ROLES.AUDITOR) // Inherits read access to dashboard, etc.
  // Conservation Module Access
  .createAny(RESOURCES.CONSERVATION)
  .updateAny(RESOURCES.CONSERVATION)
  .deleteAny(RESOURCES.CONSERVATION)
  // Needs to update specific fields on Artifacts (e.g. condition status)
  .updateAny(RESOURCES.ARTIFACTS)
  // Often needs to attach files (reports/images)
  .createAny(RESOURCES.FILES)
  .readAny(RESOURCES.FILES);

// 6. Donor (External User)
ac.grant(ROLES.DONOR)
  .createOwn(RESOURCES.INTAKE)     // Submit form
  .readOwn(RESOURCES.INTAKE)       // Track status
  .updateOwn(RESOURCES.INTAKE)     // Edit draft
  .readOwn(RESOURCES.ACCESSIONS)   // See the final official record once accepted
  .createOwn(RESOURCES.SUPPORT)    // Can send a message
  .readOwn(RESOURCES.SUPPORT);     // Can read their own replies

// 7. Admin (Overseer)
ac.grant(ROLES.ADMIN)
  .extend([ROLES.CURATOR, ROLES.EDITOR, ROLES.SCHEDULER, ROLES.CONSERVATOR])
  .readAny(RESOURCES.AUDIT_LOGS)
  .readAny(RESOURCES.USERS)
  .createAny(RESOURCES.USERS)
  .updateAny(RESOURCES.USERS)
  .deleteAny(RESOURCES.USERS)
  .readAny(RESOURCES.SYSTEM)
  .readAny(RESOURCES.FILES)
  .deleteAny(RESOURCES.FEEDBACK);

// 8. Super Admin (God Mode)
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
  [ROLES.CONSERVATOR]: 20,
  [ROLES.EDITOR]: 20,
  [ROLES.SCHEDULER]: 20,
  [ROLES.AUDITOR]: 10,
  [ROLES.DONOR]: 5,
  [ROLES.GUEST]: 0
};

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
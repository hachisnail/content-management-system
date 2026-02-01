// api/src/config/resources.js

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

// Define which categories are "Single Instance" per resource type.
export const SINGLE_ATTACHMENT_RULES = {
  [RESOURCES.USERS]: ['avatar', 'resume'], 
  [RESOURCES.ARTICLES]: ['cover_image'],
  [RESOURCES.ARTIFACTS]: ['primary_photo']
};

// [FIX] Renamed to 'isSingleFile' to match fileService import
// (Or you could update fileService to use 'isSingleInstance')
export const isSingleFile = (recordType, category) => {
  const rules = SINGLE_ATTACHMENT_RULES[recordType];
  return rules && rules.includes(category);
};

// [FIX] Added alias if other services use the old name
export const isSingleInstance = isSingleFile;

// [FIX] Added missing validation function
export const isValidResource = (resource) => {
  return Object.values(RESOURCES).includes(resource);
};
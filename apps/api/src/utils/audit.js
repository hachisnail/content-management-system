
import logger from '../core/logging/Logger.js';

const SENSITIVE_KEYS = ['password', 'confirmPassword', 'token', 'authorization', 'secret'];

/**
 * Generates description based on the action and details.
 */
const generateDescription = (action, resource, details) => {
  const act = action.toUpperCase();
  const res = resource.toLowerCase();

  // --- Auth & System ---
  if (act === 'LOGIN') return 'User logged in successfully.';
  if (act === 'LOGOUT') return 'User logged out.';
  if (act === 'SYSTEM_ONBOARD') return 'System initialized by Superadmin.';
  if (act === 'SESSION_EXPIRED') return 'Session expired due to inactivity.';
  
  // --- Users ---
  if (res === 'users') {
    if (act === 'INVITE_USER') return `Invited user: ${details.invitedEmail}`;
    if (act === 'RESEND_INVITE') return `Resent invitation to user ID: ${details.userId}`;
    if (act === 'UPDATE_USER') return `Updated profile for user ID: ${details.targetId}`;
    if (act === 'DELETE_USER') return `Deleted user ID: ${details.targetId}`;
    if (act === 'FORCE_DISCONNECT') return `Force disconnected user ID: ${details.targetId}`;
    if (act === 'DISABLE_USER') return `Disabled user ID: ${details.targetId}`;
    if (act === 'ENABLE_USER') return `Enabled user ID: ${details.targetId}`;
  }

  // --- Files ---
  if (res === 'files') {
    if (act === 'UPLOAD_FILE') return `Uploaded file: ${details.fileName} (${(details.size / 1024).toFixed(1)} KB)`;
    if (act === 'UPDATE_FILE') return `Updated file details for ID: ${details.fileId}`;
    if (act === 'DELETE_FILE') return `Moved file to recycle bin: ${details.fileId}`;
    
    // [NEW] Virtual File Operations
    if (act === 'MOVE_FILE') return `Moved file ${details.fileId} to ${details.targetRecordType}/${details.targetCategory}`;
    if (act === 'ADMIN_RENAME_FILE') return `Admin renamed file ${details.fileId} to ${details.newName}`;
    if (act === 'ADMIN_DELETE_FILE') return `Admin moved file ${details.fileId} to recycle bin`;
    if (act === 'ADMIN_UPDATE_VISIBILITY') return `Updated visibility for ${details.count} files to ${details.visibility}`;
  }

  // --- Recycle Bin ---
  if (res === 'recycle_bin') {
    if (act === 'RESTORE_ITEM') return `Restored item ID: ${details.binId}`;
    if (act === 'FORCE_DELETE_ITEM') return `Permanently deleted item ID: ${details.binId}`;
  }

  // --- Fallbacks ---
  if (act.includes('UPDATE')) return `Updated ${res} (ID: ${details.id || details.targetId || 'unknown'})`;
  if (act.includes('CREATE')) return `Created new ${res}`;
  if (act.includes('DELETE')) return `Deleted ${res}`;

  return `${action} performed on ${resource}`;
};

/**
 * Helper to sanitize details
 */
const sanitizeDetails = (details, action, resource) => {
  const safeDetails = { ...details };
  SENSITIVE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(safeDetails, key)) {
      safeDetails[key] = '[REDACTED]';
    }
  });

  if (!safeDetails.description) {
    safeDetails.description = generateDescription(action, resource, safeDetails);
  }
  return safeDetails;
};

/**
 * Standard tracker for HTTP requests
 */
export const trackActivity = (req, action, resource, details = {}) => {
  if (!req.user) return; 

  const safeDetails = sanitizeDetails(details, action, resource);

  logger.info({
    isAudit: true, 
    message: `${req.user.email} performed ${action} on ${resource}`,
    userId: req.user.id,
    action: action.toUpperCase(),
    resource: resource.toLowerCase(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    details: safeDetails 
  });
};

/**
 * [NEW] Tracker for System/Cron/Background events
 * Does not require 'req' object.
 */
export const trackSystemActivity = (action, resource, details = {}, userId = null) => {
  const safeDetails = sanitizeDetails(details, action, resource);

  logger.info({
    isAudit: true,
    message: `System performed ${action} on ${resource}`,
    userId: userId, // Can be null for pure system events, or a user ID if targeting a user
    action: action.toUpperCase(),
    resource: resource.toLowerCase(),
    ip: 'SYSTEM',
    userAgent: 'SYSTEM',
    details: safeDetails
  });
};
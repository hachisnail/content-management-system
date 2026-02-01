import logger from '../config/logger.js';

const SENSITIVE_KEYS = ['password', 'confirmPassword', 'token', 'authorization', 'secret'];

/**
 * Tracks a user action to the Audit Log
 * Automatically strips sensitive data from 'details' to prevent leaks.
 * * @param {Object} req - The Express Request object (to get user/IP)
 * @param {string} action - 'LOGIN', 'UPDATE', 'DELETE'
 * @param {string} resource - 'users', 'artifacts'
 * @param {Object} details - Extra data (e.g. { artifactId: 123, updateData: {...} })
 */
export const trackActivity = (req, action, resource, details = {}) => {
  if (!req.user) return; // Can't track anonymous users easily

  // 1. Create a shallow copy to avoid mutating the original request body
  const safeDetails = { ...details };

  // 2. Recursive or top-level redaction
  // For now, we handle top-level keys commonly sent in body
  SENSITIVE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(safeDetails, key)) {
      safeDetails[key] = '[REDACTED]';
    }
  });

  // 3. Log safe data
  logger.info({
    isAudit: true, // Flag for our custom transport to save to DB
    message: `${req.user.email} performed ${action} on ${resource}`,
    userId: req.user.id,
    action: action.toUpperCase(),
    resource: resource.toLowerCase(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    details: safeDetails // <--- Now Safe
  });
};
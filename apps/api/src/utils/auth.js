import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config/env.js'; // [ADDED]

/**
 * Hash a plain text password using bcrypt and an application pepper
 * @param {string} password 
 * @returns {Promise<string>}
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
  return bcrypt.hash(password + config.securityPepper, salt);
};

/**
 * Compare a candidate password with a stored hash (using pepper)
 * @param {string} candidatePassword 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (candidatePassword, hashedPassword) => {
  // [ADDED] Append pepper to candidate before comparison
  return bcrypt.compare(candidatePassword + config.securityPepper, hashedPassword);
};

/**
 * Used for storing invitation and reset tokens so the DB doesn't hold raw tokens.
 * @param {string} token - The raw token
 * @returns {string} - The hex digest of the hashed token
 */
export const hashToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token + config.securityPepper)
    .digest('hex');
};

/**
 * Robustly parses roles from various input formats (JSON string, comma-separated string, array)
 * @param {string|string[]} input 
 * @returns {string[]}
 */
export const parseRoles = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return typeof input === 'string' ? input.split(',').map(r => r.trim()) : [];
  }
};
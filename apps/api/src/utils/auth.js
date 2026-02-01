import bcrypt from 'bcryptjs';

/**
 * Hash a plain text password using bcrypt
 * @param {string} password 
 * @returns {Promise<string>}
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a candidate password with a stored hash
 * @param {string} candidatePassword 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (candidatePassword, hashedPassword) => {
  return bcrypt.compare(candidatePassword, hashedPassword);
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
    // Handle JSON string format
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    // Handle comma-separated strings
    return typeof input === 'string' ? input.split(',').map(r => r.trim()) : [];
  }
};
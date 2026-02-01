import { config } from './env.js';

/**
 * CORS Configuration
 * Defines which domains are allowed to access the API.
 * * Sources allowed origins from the environment variable CORS_ORIGINS
 */
export const corsOptions = {
  /**
   * Dynamic Origin Check
   * @param {string} origin - The origin of the request
   * @param {function} callback - Error first callback
   */
  origin: (origin, callback) => {
    // 1. Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    // 2. Check against the list from config.env.js
    if (config.corsOrigins.includes(origin)) {
      // Origin is in the safe list
      callback(null, true);
    } else {
      // Origin is NOT allowed
      callback(new Error(`CORS Error: Origin ${origin} not allowed.`));
    }
  },

  // Allow cookies and authorization headers (Vital for your Auth system)
  credentials: true,

  // Allowed HTTP Verbs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed Headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};
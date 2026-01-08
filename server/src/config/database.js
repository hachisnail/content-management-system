import { config } from './env.js';

export const dbConfig = {
  database: config.db.name,
  username: config.db.user,
  password: config.db.pass,
  host: config.db.host,
  dialect: 'mysql',
  logging: false,
  pool: {
    // --- FIX: Increase connection limit ---
    max: 20, // Changed from 5 to 20
    min: 0,
    acquire: 60000, // Increase timeout to 60s
    idle: 10000,
  },
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  },
};
import { config } from './env.js';

export const dbConfig = {
  database: config.db.name,
  username: config.db.user,
  password: config.db.pass,
  host: config.db.host,
  dialect: 'mariadb',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
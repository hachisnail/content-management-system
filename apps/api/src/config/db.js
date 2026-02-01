import { Sequelize } from 'sequelize';
import { config } from './env.js';

// Initialize Sequelize with mysql2 dialect
const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql', // <--- Uses mysql2 driver automatically
    logging: false,   // Set to console.log to see raw SQL
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true, // Create createdAt/updatedAt
      underscored: true // <--- GLOBAL NAMING CONVENTION (snake_case in DB)
    }
  }
);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to MariaDB via Sequelize');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

export default sequelize;
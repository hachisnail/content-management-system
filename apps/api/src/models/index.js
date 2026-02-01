import sequelize from '../config/db.js';
import User from './User.js';
import AuditLog from './AuditLog.js';
import File from './File.js';
import FileLink from './FileLink.js';
import RecycleBin from './RecycleBin.js'; 
import { attachSocketHooks } from '../utils/socketHooks.js'; 

const models = { 
  User, 
  AuditLog,
  File,       
  FileLink,
  RecycleBin 
};


Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// --- Global Hooks ---
attachSocketHooks(models);

// --- Sync ---
export const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database Models Synchronized');
  } catch (error) {
    console.error('Database Sync Error:', error);
  }
};

export { sequelize, User, AuditLog, File, FileLink, RecycleBin };
import sequelize from '../config/db.js';
import User from './auth/User.js';
import AuditLog from './system/AuditLog.js';
import File from './storage/File.js';
import FileLink from './storage/FileLink.js';
import Notification from './system/Notification.js';
import RecycleBin from './system/RecycleBin.js'; 
import { attachSocketHooks } from '../listeners/socketHooks.js'; 

const models = { 
  User, 
  AuditLog,
  File,       
  FileLink,
  RecycleBin,
  Notification,
};

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

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

// REMOVED: Category from export
export { sequelize, User, AuditLog, File, FileLink, RecycleBin, Notification };
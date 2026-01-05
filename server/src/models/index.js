// server/src/models/index.js
import Sequelize from 'sequelize';
import { dbConfig } from '../config/database.js';
import { User as UserModel } from './user.model.js';
import { Donation as DonationModel } from './donation.model.js';
import { AuditLog as AuditLogModel } from './audit-log.model.js';

// Import the factories
import { notifyNewResource, notifyMutableResource } from './hooks.js';

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = UserModel(sequelize);
db.Donation = DonationModel(sequelize);
db.AuditLog = AuditLogModel(sequelize);

// ============================================================
// REAL-TIME HOOKS (Clean & Non-Redundant)
// ============================================================

// 1. Users (Mutable)
// We bind to 'afterSave' only. This covers BOTH 'afterCreate' and 'afterUpdate'.
// No need to list them separately.
db.User.afterSave(notifyMutableResource('users'));

// 2. Donations (Append-Only)
// We bind to 'afterCreate' because we generally don't update donations in this system.
db.Donation.afterCreate(notifyNewResource('donations'));

// 3. Audit Logs (Append-Only)
// Strictly create only.
db.AuditLog.afterCreate(notifyNewResource('audit_logs'));

// Associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.User.hasMany(db.AuditLog, {
  foreignKey: 'initiator',
  as: 'logs'
});

db.AuditLog.belongsTo(db.User, {
  foreignKey: 'initiator',
  as: 'user' // This alias must match the 'as' in your service include
});

export { db };
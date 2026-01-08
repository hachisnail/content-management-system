import Sequelize from 'sequelize';
import { dbConfig } from '../config/database.js';
import { User as UserModel } from './user.model.js';
import { Donation as DonationModel } from './donation.model.js';
import { AuditLog as AuditLogModel } from './audit-log.model.js';
import { File as FileModel } from './file.model.js'; 

import { notifyNewResource, notifyMutableResource, notifyDeletedResource } from './hooks.js';

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// INITIALIZE MODELS
db.User = UserModel(sequelize);
db.Donation = DonationModel(sequelize);
db.AuditLog = AuditLogModel(sequelize);
db.File = FileModel(sequelize);

// DEFINE ASSOCIATIONS (Must be before hooks)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Explicit Associations used for Eager Loading
db.User.hasMany(db.AuditLog, { foreignKey: 'initiator', sourceKey: 'email', as: 'logs' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'initiator', targetKey: 'email', as: 'user' });

db.User.hasOne(db.File, { foreignKey: 'relatedId', constraints: false, scope: { relatedType: 'users' }, as: 'profilePicture' });
db.File.belongsTo(db.User, { foreignKey: 'relatedId', constraints: false, as: 'owner' });

// --- REGISTER HOOKS ---

db.AuditLog.afterCreate(notifyNewResource('audit_logs', [
  {
    model: db.User,
    as: 'user',
    attributes: ['id', 'email', 'firstName', 'lastName'],
    include: [{
      model: db.File,
      as: 'profilePicture',
      attributes: ['id', 'fileName', 'relatedType']
    }]
  }
]));

db.User.afterSave(notifyMutableResource('users', [
  {
    model: db.File,
    as: 'profilePicture',
    attributes: ['id', 'fileName', 'relatedType']
  }
]));

db.User.afterDestroy(notifyDeletedResource('users'));
db.Donation.afterCreate(notifyNewResource('donations'));

export { db };
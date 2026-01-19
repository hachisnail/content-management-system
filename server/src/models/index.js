import Sequelize from 'sequelize';
import { dbConfig } from '../config/database.js';
import { User as UserModel } from './user.model.js';
import { Donation as DonationModel } from './donation.model.js';
import { AuditLog as AuditLogModel } from './audit-log.model.js';
import { File as FileModel } from './file.model.js';
import { FileLink as FileLinkModel } from './file-link.model.js';
import { TestItem as TestItemModel } from './test-item.model.js';
import { TrashItem as TrashItemModel } from './trash-item.model.js';

import {
  notifyNewResource,
  notifyMutableResource,
  notifyDeletedResource,
  notifyRestoredResource,
  handleTrashBinSync,
} from './hooks.js';

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig,
);
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// INITIALIZE MODELS
db.User = UserModel(sequelize);
db.Donation = DonationModel(sequelize);
db.AuditLog = AuditLogModel(sequelize);
db.File = FileModel(sequelize);
db.FileLink = FileLinkModel(sequelize);
db.TestItem = TestItemModel(sequelize);
db.TrashItem = TrashItemModel(sequelize);

// DEFINE ASSOCIATIONS
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// CORE ASSOCIATIONS
db.User.hasMany(db.AuditLog, {
  foreignKey: 'initiator',
  sourceKey: 'email',
  as: 'logs',
});
db.AuditLog.belongsTo(db.User, {
  foreignKey: 'initiator',
  targetKey: 'email',
  as: 'user',
});
db.File.hasMany(db.FileLink, { foreignKey: 'fileId', as: 'links' });
db.FileLink.belongsTo(db.File, { foreignKey: 'fileId', as: 'file' });
db.User.belongsToMany(db.File, {
  through: {
    model: db.FileLink,
    unique: false,
    scope: { relatedType: 'users', category: 'profile_picture' },
  },
  foreignKey: 'relatedId',
  otherKey: 'fileId',
  constraints: false,
  as: 'profilePicture',
});
db.TestItem.belongsToMany(db.File, {
  through: {
    model: db.FileLink,
    unique: false,
    scope: { relatedType: 'test_items' },
  },
  foreignKey: 'relatedId',
  otherKey: 'fileId',
  constraints: false,
  as: 'attachments',
});

// --- HOOK CONFIGURATION ---
db.AuditLog.afterCreate(
  notifyNewResource('audit_logs', [
    {
      model: db.User,
      as: 'user',
      attributes: ['id', 'email', 'firstName', 'lastName'],
      include: [
        { model: db.File, as: 'profilePicture', through: { attributes: [] } },
      ],
    },
  ]),
);

/**
 * SCALABLE AUTOMATION:
 * Iterate over ALL models. If a model supports Soft Deletes (paranoid: true),
 * automatically attach Trash Bin logic and Socket notifications.
 */
Object.keys(db).forEach((modelName) => {
  const model = db[modelName];

  // Skip internal models like TrashItem or Link tables if they aren't paranoid
  if (!model.options || !model.options.paranoid) return;

  // 1. Determine Resource Name (matches 'tableName' usually, e.g. 'users', 'test_items')
  const resourceName = model.options.tableName || modelName.toLowerCase();

  // 2. Intelligent Label Detection
  // We try to guess the best field to use as the "Title" in the trash bin.
  const attributes = model.rawAttributes;
  const potentialLabels = [
    'name',
    'title',
    'label',
    'email',
    'originalName',
    'itemDescription',
    'username',
    'code',
  ];
  const labelField = potentialLabels.find((field) => attributes[field]) || 'id';

  console.log(
    `[Auto-Sync] Enabled Trash Bin for '${resourceName}' (Label: ${labelField})`,
  );

  // 3. Attach Trash Bin Hooks
  model.afterDestroy(
    handleTrashBinSync(resourceName, labelField, 'soft_delete'),
  );
  model.afterRestore(handleTrashBinSync(resourceName, labelField, 'restore'));

  // 4. Attach Socket Notification Hooks
  model.afterSave(notifyMutableResource(resourceName));
  model.afterDestroy(notifyDeletedResource(resourceName));
  model.afterRestore(notifyRestoredResource(resourceName));
});

export { db };

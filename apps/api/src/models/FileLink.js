import { DataTypes, Model } from 'sequelize';
import { ulid } from 'ulid';
import sequelize from '../config/db.js';

class FileLink extends Model {
  static associate(models) {
    this.belongsTo(models.File, { foreignKey: 'fileId', as: 'file' });
    
    // Note: Polymorphic 'belongsTo' (User, etc) is usually not defined explicitly 
    // on the child side in Sequelize because the parent model is dynamic.
  }
}

FileLink.init({
  id: {
    type: DataTypes.CHAR(26),
    defaultValue: () => ulid(),
    primaryKey: true,
  },
  fileId: {
    type: DataTypes.CHAR(26),
    allowNull: false,
    // [NOTE] References in Sequelize definitions are for Migration generation.
    // The actual JS association is handled in the associate() method.
    references: { model: 'files', key: 'id' }
  },
  recordId: { type: DataTypes.CHAR(26), allowNull: false },
  recordType: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'attachment' },
  createdBy: { type: DataTypes.CHAR(26), allowNull: true }
}, {
  sequelize,
  modelName: 'FileLink',
  tableName: 'file_links',
  underscored: true,
  parianod: true,
  indexes: [
    { fields: ['record_id', 'record_type'] }, 
    { fields: ['file_id'] },                  
    { unique: true, fields: ['file_id', 'record_id', 'record_type', 'category'] } 
  ]
});

export default FileLink;
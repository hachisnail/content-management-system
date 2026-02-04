import { DataTypes, Model } from 'sequelize';
import { ulid } from 'ulid';
import sequelize from '../../config/db.js';

class FileLink extends Model {
  static associate(models) {
    this.belongsTo(models.File, { foreignKey: 'fileId', as: 'file' });
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
  paranoid: true,
  indexes: [
    { fields: ['record_id', 'record_type'] }, 
    { fields: ['file_id'] },                  
    { unique: true, fields: ['file_id', 'record_id', 'record_type', 'category'] } 
  ]
});

export default FileLink;
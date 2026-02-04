import { DataTypes, Model } from 'sequelize';
import { ulid } from 'ulid';
import sequelize from '../../config/db.js';

class File extends Model {
  static associate(models) {
    // File <-> User (Uploader)
    this.belongsTo(models.User, { foreignKey: 'uploadedBy', as: 'uploader' });
    
    // File <-> FileLink
    this.hasMany(models.FileLink, { foreignKey: 'fileId', as: 'links' });
  }
}

File.init({
  id: {
    type: DataTypes.CHAR(26),
    defaultValue: () => ulid(),
    primaryKey: true,
  },
  originalName: { type: DataTypes.STRING, allowNull: false },
  encoding: DataTypes.STRING,
  mimetype: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.INTEGER, allowNull: false },
  path: { type: DataTypes.STRING, allowNull: false },
  visibility: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'private',
    allowNull: false,
  },
  allowedRoles: {
    type: DataTypes.JSON, 
    allowNull: true,
    defaultValue: [],
  },
  uploadedBy: {
    type: DataTypes.CHAR(26),
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'File',
  tableName: 'files',
  underscored: true,
  paranoid: true,
});

export default File;
import { DataTypes, Model } from 'sequelize';
import { ulid } from 'ulid';
import sequelize from '../../config/db.js';

class RecycleBin extends Model {
  static associate(models) {
    // RecycleBin -> User (The person who deleted the item)
    this.belongsTo(models.User, { foreignKey: 'deletedBy', as: 'deleter' });
  }
}

RecycleBin.init({
  id: {
    type: DataTypes.CHAR(26),
    defaultValue: () => ulid(),
    primaryKey: true,
  },
  resourceType: {
    type: DataTypes.STRING,
    allowNull: false, // e.g., 'files', 'users'
  },
  resourceId: {
    type: DataTypes.CHAR(26),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true, // Snapshot of the item's name
  },
  deletedBy: {
    type: DataTypes.CHAR(26),
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON, // Store extra info like original path, file size, etc.
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'RecycleBin',
  tableName: 'recycle_bin',
  underscored: true,
  timestamps: true, // We want createdAt and updatedAt
  updatedAt: false, // Actually, we only need createdAt (time of deletion)
});

export default RecycleBin;
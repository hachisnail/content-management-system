import { DataTypes, Model } from 'sequelize';
import { ulid } from 'ulid';
import sequelize from '../../config/db.js';

class AuditLog extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

AuditLog.init({
  id: {
    type: DataTypes.CHAR(26),
    defaultValue: () => ulid(),
    primaryKey: true,
  },
  userId: {
    type: DataTypes.CHAR(26),
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent'
  },
}, {
  sequelize, // Pass the connection instance
  modelName: 'AuditLog',
  tableName: 'audit_logs',
  underscored: true, 
  updatedAt: false, // We only care when the log was created
});

export default AuditLog;
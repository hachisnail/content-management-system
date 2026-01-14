import { DataTypes } from 'sequelize';
import { ulid } from 'ulid'; 

const defineAuditLogModel = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.STRING(26), 
      defaultValue: () => ulid(), 
      primaryKey: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    operation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    affectedResource: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    beforeState: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    afterState: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    initiator: {
      type: DataTypes.STRING,
      allowNull: false,
      collate: 'utf8mb4_general_ci', 
    },
  }, {
    timestamps: true,
    tableName: 'audit_logs',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  });

  return AuditLog;
};

export { defineAuditLogModel as AuditLog };
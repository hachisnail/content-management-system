import { DataTypes } from 'sequelize';

const defineAuditLogModel = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    },
  }, {
    timestamps: true,
    tableName: 'audit_logs',
  });

  return AuditLog;
};

export { defineAuditLogModel as AuditLog };

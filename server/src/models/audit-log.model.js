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
      // --- FIX: Explicit Collation ---
      // Forces this column to be compatible with the Users table email column
      collate: 'utf8mb4_general_ci', 
    },
  }, {
    timestamps: true,
    tableName: 'audit_logs',
    // Ensure the table itself uses the compatible charset
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  });

  return AuditLog;
};

export { defineAuditLogModel as AuditLog };
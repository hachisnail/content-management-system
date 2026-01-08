import { DataTypes } from 'sequelize';

const defineFileModel = (sequelize) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fileName: { type: DataTypes.STRING, allowNull: false },
    originalName: { type: DataTypes.STRING, allowNull: false },
    mimeType: { type: DataTypes.STRING },
    size: { type: DataTypes.INTEGER },
    path: { type: DataTypes.STRING, allowNull: false },

    isPublic: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false 
    },
    allowedRoles: {
      type: DataTypes.JSON, 
      allowNull: true,
      defaultValue: [] 
    },

    relatedType: { 
      type: DataTypes.STRING, 
      allowNull: true,
      // FIX: Match User table collation
      collate: 'utf8mb4_general_ci' 
    },
    relatedId: { type: DataTypes.INTEGER, allowNull: true },
    
    uploadedBy: { type: DataTypes.STRING }, 
  }, {
    timestamps: true,
    tableName: 'files',
    // FIX: Match User table collation
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  });

  return File;
};

export { defineFileModel as File };
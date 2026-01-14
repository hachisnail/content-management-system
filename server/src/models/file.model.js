import { DataTypes } from 'sequelize';
import { ulid } from 'ulid'; 

const defineFileModel = (sequelize) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.STRING(26), 
      defaultValue: () => ulid(),
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
      collate: 'utf8mb4_general_ci' 
    },
    
    relatedId: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    
    uploadedBy: { type: DataTypes.STRING }, 
  }, {
    timestamps: true,
    tableName: 'files',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  });

  return File;
};

export { defineFileModel as File };
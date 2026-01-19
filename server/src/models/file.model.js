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
    path: { type: DataTypes.STRING, allowNull: false }, // Physical location

    isPublic: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false 
    },
    allowedRoles: {
      type: DataTypes.JSON, 
      defaultValue: [] 
    },
    uploadedBy: { type: DataTypes.STRING }, 
}, {
    timestamps: true,
    paranoid: true, // <--- ENABLES SOFT DELETE (Adds deletedAt column)
    tableName: 'files',
  });

  return File;
};

export { defineFileModel as File };
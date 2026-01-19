import { DataTypes } from 'sequelize';
import { ulid } from 'ulid'; 

const defineFileLinkModel = (sequelize) => {
  const FileLink = sequelize.define('FileLink', {
    id: {
      type: DataTypes.STRING(26), 
      defaultValue: () => ulid(),
      primaryKey: true,
    },
    fileId: {
      type: DataTypes.STRING(26),
      allowNull: false,
      references: { model: 'files', key: 'id' },
      onDelete: 'CASCADE'
    },
    relatedType: { type: DataTypes.STRING, allowNull: false },
    relatedId: { type: DataTypes.STRING, allowNull: false },
    linkedBy: { type: DataTypes.STRING, allowNull: true },

    // --- NEW FIELD ---
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'general' // Default group
    }
  }, {
    timestamps: true,
    paranoid: true,
    tableName: 'file_links',
    indexes: [
      { fields: ['relatedType', 'relatedId'] },
      { fields: ['fileId'] }
    ]
  });

  return FileLink;
};

export { defineFileLinkModel as FileLink };
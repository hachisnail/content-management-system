import { DataTypes } from 'sequelize';
import { ulid } from 'ulid';

const defineTrashItemModel = (sequelize) => {
  const TrashItem = sequelize.define('TrashItem', {
    id: {
      type: DataTypes.STRING(26),
      defaultValue: () => ulid(),
      primaryKey: true,
    },
    resourceType: {
      type: DataTypes.STRING,
      allowNull: false, // e.g. 'users', 'files'
    },
    resourceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // SNAPSHOT: Stores Name, Size, Email so UI is always fast & accurate
    displayData: {
      type: DataTypes.JSON,
      allowNull: true, 
    },
    deletedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    originalDeletedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  }, {
    timestamps: true,
    tableName: 'system_trash',
    indexes: [
      {
        unique: true,
        fields: ['resourceType', 'resourceId'], 
      }
    ]
  });

  return TrashItem;
};

export { defineTrashItemModel as TrashItem };
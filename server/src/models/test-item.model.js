import { DataTypes } from 'sequelize';
import { ulid } from 'ulid';

const defineTestItemModel = (sequelize) => {
  const TestItem = sequelize.define('TestItem', {
    id: {
      type: DataTypes.STRING(26),
      defaultValue: () => ulid(),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    timestamps: true,
    paranoid: true,
    tableName: 'test_items',
  });

  return TestItem;
};

export { defineTestItemModel as TestItem };
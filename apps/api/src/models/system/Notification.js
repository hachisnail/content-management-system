import { DataTypes } from 'sequelize';
import { ulid } from 'ulid';
import sequelize from '../../config/db.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.CHAR(26),
    defaultValue: () => ulid(),
    primaryKey: true,
  },
  userId: { // The recipient
    type: DataTypes.CHAR(26),
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  type: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'system'),
    defaultValue: 'info'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  data: {
    type: DataTypes.JSON, // For metadata like link URLs, related IDs
    allowNull: true,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'notifications',
  underscored: true,
  indexes: [
    { fields: ['user_id', 'is_read'] }, // Optimized for fetching unread count
    { fields: ['created_at'] }
  ]
});

Notification.associate = (models) => {
  Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'recipient' });
};

export default Notification;
import { Notification, User } from '../models/index.js';
import { socketService } from '../core/socket/SocketManager.js';
import { Op } from 'sequelize';
import sequelize from '../config/db.js';

export const notificationService = {
  /**
   * Send a notification to a single user
   */
  async send(userId, { title, message, type = 'info', data = null }) {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data
    });

    socketService.emitToUser(userId, 'notification:new', notification.toJSON());
    return notification;
  },

  /**
   * Broadcast to a specific list of User IDs (Fan-out)
   */
  async broadcast(userIds, payload) {
    if (!userIds || userIds.length === 0) return [];

    const records = userIds.map(id => ({
      userId: id,
      ...payload
    }));
    
    const notifications = await Notification.bulkCreate(records);

    notifications.forEach(n => {
      socketService.emitToUser(n.userId, 'notification:new', n.toJSON());
    });

    return notifications;
  },

  /**
   * [NEW] Broadcast to Users and/or Roles
   * @param {Object} targets - { users: string[], roles: string[] }
   * @param {Object} payload - { title, message, type, data }
   */
  async broadcastToTargets({ users = [], roles = [] }, payload) {
    const finalUserIds = new Set(users);

    // 1. Resolve Roles to User IDs
    if (roles.length > 0) {
      // Use JSON_CONTAINS to find users who have ANY of the specified roles
      // Note: This syntax works for MariaDB/MySQL
      const roleConditions = roles.map(r => 
        sequelize.literal(`JSON_CONTAINS(roles, '"${r}"')`)
      );

      const usersWithRoles = await User.findAll({
        attributes: ['id'],
        where: {
          [Op.or]: roleConditions,
          status: 'active'
        }
      });

      usersWithRoles.forEach(u => finalUserIds.add(u.id));
    }

    // 2. Broadcast to the unique set of IDs
    return this.broadcast(Array.from(finalUserIds), payload);
  },

  async getUnreadCount(userId) {
    return await Notification.count({
      where: { userId, isRead: false }
    });
  },

  async list(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    return await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  },

  async markAsRead(userId, notificationIds) {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { 
        where: { 
          userId, 
          id: { [Op.in]: Array.isArray(notificationIds) ? notificationIds : [notificationIds] } 
        } 
      }
    );
    socketService.emitToUser(userId, 'notification:read', { ids: notificationIds });
  },

  async markAllRead(userId) {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );
    socketService.emitToUser(userId, 'notification:read_all');
  }
};
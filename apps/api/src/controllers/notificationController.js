import { notificationService } from '../services/notificationService.js';
import { User } from '../models/index.js';

export const listNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await notificationService.list(req.user.id, { 
      page: Number(page) || 1, 
      limit: Number(limit) || 20 
    });
    res.json(result);
  } catch (err) { next(err); }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) { next(err); }
};

export const markRead = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await notificationService.markAsRead(req.user.id, ids);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// [TEST METHOD]
export const sendTestNotification = async (req, res, next) => {
  try {
    await notificationService.send(req.user.id, {
      title: 'Test Notification',
      message: `System alert generated at ${new Date().toLocaleTimeString()}`,
      type: 'success',
      data: { link: '/dashboard' }
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// [TEST METHOD]
export const broadcastTestNotification = async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: ['id'], where: { status: 'active' } });
    const ids = users.map(u => u.id);

    if (ids.length === 0) return res.json({ message: 'No users.' });

    await notificationService.broadcast(ids, {
      title: '📢 System Broadcast',
      message: `Announcement to ${ids.length} users at ${new Date().toLocaleTimeString()}.`,
      type: 'warning',
      data: { broadcast: true }
    });

    res.json({ success: true, count: ids.length });
  } catch (err) { next(err); }
};

// [NEW] Targeted Broadcast Endpoint
export const sendTargetedNotification = async (req, res, next) => {
  try {
    const { users, roles, title, message, type, data } = req.body;

    if ((!users || users.length === 0) && (!roles || roles.length === 0)) {
        return res.status(400).json({ error: "Must specify at least one user or role." });
    }

    const result = await notificationService.broadcastToTargets(
        { users, roles },
        { title, message, type: type || 'info', data }
    );

    res.json({ success: true, sentCount: result.length });
  } catch (err) { next(err); }
};
import { userService } from '../services/userService.js';
import { trackActivity } from '../utils/audit.js'; 
import { buildQuery, formatPaginated } from '../utils/pagination.js';

export const getUsers = async (req, res, next) => {
  try {
    if (req.query.sort_by === 'name') req.query.sort_by = 'firstName';
    if (req.query.sort_by === 'activity') req.query.sort_by = 'lastActiveAt';

    const queryConfig = {
      searchFields: ['firstName', 'lastName', 'email'],
      allowedFilters: ['status', 'roles'],
      allowedSort: ['firstName', 'lastName', 'email', 'createdAt', 'lastActiveAt']
    };

    const queryOptions = buildQuery(req.query, queryConfig);
    const { rows, count } = await userService.getUsers(queryOptions);

    res.json(formatPaginated(rows, count, req.query.page || 1, queryOptions.limit));
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await userService.findById(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.isActive !== undefined) {
      updates.status = updates.isActive ? 'active' : 'disabled';
    }

    const targetId = (!req.params.id || req.params.id === 'me') 
      ? req.user.id 
      : req.params.id;

    const updatedUser = await userService.updateUser(req.user, targetId, updates);

    if (updates.status === 'disabled' || updates.status === 'banned') {
        trackActivity(req, 'DISABLE_USER', 'users', { targetId, status: updates.status });
    } else if (updates.status === 'active') {
        trackActivity(req, 'ENABLE_USER', 'users', { targetId });
    } else {
        trackActivity(req, 'UPDATE_USER', 'users', { targetId, fields: Object.keys(updates) });
    }

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.user, req.params.id);

    trackActivity(req, 'DELETE_USER', 'users', { targetId: req.params.id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const forceDisconnect = async (req, res, next) => {
  try {
    await userService.disconnectUser(req.user, req.params.id);

    trackActivity(req, 'FORCE_DISCONNECT', 'users', { targetId: req.params.id });

    res.json({ message: 'User forced to disconnect' });
  } catch (error) {
    next(error);
  }
};
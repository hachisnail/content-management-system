import { userService } from '../services/userService.js';
import { buildQuery, formatPaginated } from '../utils/pagination.js';

// ... (getUsers, getMe, getUser, updateUser, deleteUser remain unchanged) ...
export const getUsers = async (req, res, next) => {
  try {
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
    const updatedUser = await userService.updateUser(req.user, req.params.id, updates);
    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.user, req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const forceDisconnect = async (req, res, next) => {
  try {
    // [FIX] Pass req.user to service for permission check
    await userService.disconnectUser(req.user, req.params.id);
    res.json({ message: 'User forced to disconnect' });
  } catch (error) {
    next(error);
  }
};
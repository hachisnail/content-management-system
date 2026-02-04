import { userService } from '../services/userService.js';
import { trackActivity } from '../utils/audit.js'; 
import { buildQuery, formatPaginated } from '../utils/pagination.js';
import { notificationService } from '../services/notificationService.js'; 
import { ROLES } from '../config/roles.js'; 

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

    // [FIX] Explicit Role Handling (Audit + Notification)
    if (updates.roles) {
      const requesterName = `${req.user.firstName} ${req.user.lastName}`;
      
      // 1. Enhanced Notification with "Who did it"
      await notificationService.broadcastToTargets(
        { roles: [ROLES.SUPERADMIN] },
        {
          title: "User Roles Updated",
          message: `Roles for ${updatedUser.firstName} ${updatedUser.lastName} were updated to [${updates.roles.join(', ')}] by ${requesterName}.`,
          type: "warning",
          data: { link: `/users/${updatedUser.id}` }
        }
      );

      // 2. Explicit Audit Log
      // This runs independently of status changes, ensuring the log is never skipped.
      trackActivity(req, 'UPDATE_ROLES', 'users', { 
        targetId, 
        roles: updates.roles,
        updatedBy: req.user.id
      });
    }

    // [FIX] Status & Generic Logging
    if (updates.status === 'disabled' || updates.status === 'banned') {
        trackActivity(req, 'DISABLE_USER', 'users', { targetId, status: updates.status });
    } else if (updates.status === 'active') {
        trackActivity(req, 'ENABLE_USER', 'users', { targetId });
    } else {
        // Only log generic UPDATE_USER if fields OTHER than roles/status were changed
        // (e.g., name, email, phone)
        const otherFields = Object.keys(updates).filter(key => !['roles', 'status', 'isActive'].includes(key));
        
        if (otherFields.length > 0) {
            trackActivity(req, 'UPDATE_USER', 'users', { targetId, fields: otherFields });
        }
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
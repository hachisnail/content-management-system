import { User, FileLink } from "../models/index.js"; 
import { hashPassword } from "../utils/auth.js";
import { canModifyUser, ROLES } from "../config/roles.js"; 
import { isSingleInstance, RESOURCES } from "../config/resources.js"; 
import { UserScopes } from "../models/scopes.js"; 
import { recycleBinService } from "./recycleBinService.js";
import { socketService } from "../core/socket/SocketManager.js";

export const userService = {
  async findById(id) {
    const user = await User.findByPk(id, UserScopes.withAvatar());
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    return user;
  },

  async findByEmail(email) {
    const scope = UserScopes.withAvatar();
    if (scope.attributes && Array.isArray(scope.attributes.exclude)) {
      scope.attributes.exclude = scope.attributes.exclude.filter(field => !['password', 'currentSessionId'].includes(field));
    }
    return User.findOne({ where: { email }, ...scope });
  },

  async getUsers(queryOptions) {
    const count = await User.count({ where: queryOptions.where || {}, distinct: true, col: "id" });
    const rows = await User.findAll({ ...queryOptions, ...UserScopes.withAvatar() });
    return { rows, count };
  },

  async updateUser(requester, targetId, updates) {
    const targetUser = await User.findByPk(targetId);
    if (!targetUser) throw Object.assign(new Error("User not found"), { status: 404 });

    const isSelf = requester.id === targetUser.id;
    const isSuperAdmin = requester.roles.includes(ROLES.SUPERADMIN);

    if (updates.roles || updates.status) {
      if (!canModifyUser(requester.roles, targetUser.roles) && !isSuperAdmin) {
        throw Object.assign(new Error("Access Denied: Cannot change roles/status"), { status: 403 });
      }
    }

    if (!isSelf && !canModifyUser(requester.roles, targetUser.roles)) {
      throw Object.assign(new Error("Access Denied: Target has equal or higher rank"), { status: 403 });
    }

    const allowedUpdates = {};
    const publicFields = ["firstName", "lastName", "contactNumber", "birthDate"];

    publicFields.forEach((f) => {
      if (updates[f] !== undefined) allowedUpdates[f] = updates[f];
    });

    if ((!isSelf && canModifyUser(requester.roles, targetUser.roles)) || isSuperAdmin) {
      if (updates.roles) allowedUpdates.roles = updates.roles;
      if (updates.status) allowedUpdates.status = updates.status;
      if (updates.isActive !== undefined) allowedUpdates.isActive = updates.isActive;
    }

    if (updates.password) {
      allowedUpdates.password = await hashPassword(updates.password);
    }

    if (updates.avatarId) {
      const recordType = RESOURCES.USERS;
      const category = 'avatar';

      if (isSingleInstance(recordType, category)) {
        await FileLink.destroy({
          where: { recordId: targetId, recordType: recordType, category: category }
        });
      }

      await FileLink.create({
        fileId: updates.avatarId,
        recordId: targetId,
        recordType: recordType,
        category: category,
        createdBy: requester.id
      });
    }

    await targetUser.update(allowedUpdates);

    const isDisabled = allowedUpdates.status === 'disabled' || allowedUpdates.status === 'banned' || allowedUpdates.isActive === false;
    
    if (isDisabled && socketService) {
        socketService.emitToUser(targetId, 'forced_logout', { 
            message: 'Your account has been disabled by an administrator.' 
        });
        socketService.disconnectUser(targetId);
        
        await targetUser.update({ currentSessionId: null, isOnline: false });
    }

    return this.findById(targetId);
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const { comparePassword, hashPassword } = await import('../utils/auth.js');
    
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      throw new Error("Incorrect current password");
    }

    const hashedPassword = await hashPassword(newPassword);

    await user.update({ password: hashedPassword });
    return true;
  },

  async deleteUser(requester, targetId) {
    const targetUser = await User.findByPk(targetId);
    if (!targetUser) throw Object.assign(new Error("User not found"), { status: 404 });

    if (requester.id === targetUser.id) {
        throw Object.assign(new Error("Cannot delete your own account via this method"), { status: 403 });
    }
    
    if (!canModifyUser(requester.roles, targetUser.roles)) {
        throw Object.assign(new Error("Access Denied: Insufficient permissions"), { status: 403 });
    }

    if (socketService) {
        socketService.emitToUser(targetId, 'forced_logout', { 
            message: 'Your account has been deleted.' 
        });
        socketService.disconnectUser(targetId);
    }

    await recycleBinService.moveToBin(RESOURCES.USERS, targetId, requester.id);
    
    await targetUser.update({ currentSessionId: null, isOnline: false });
    
    return true;
  },

  async disconnectUser(requester, targetId) {
    const user = await User.findByPk(targetId);
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

    if (requester.id === user.id) {
        throw Object.assign(new Error("Cannot force disconnect yourself. Use logout."), { status: 403 });
    }

    if (!canModifyUser(requester.roles, user.roles)) {
        throw Object.assign(new Error("Access Denied: Insufficient permissions"), { status: 403 });
    }

    await user.update({ currentSessionId: null, isOnline: false });

    if (socketService) {
        socketService.emitToUser(targetId, 'forced_logout', { message: 'You have been disconnected by an administrator.' });
        socketService.disconnectUser(targetId);
    }

    return true;
  }
};
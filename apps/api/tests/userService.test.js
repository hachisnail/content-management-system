/* api/tests/userService.test.js */
jest.mock('../src/models/index.js', () => ({
  User: { findByPk: jest.fn() },
  FileLink: { destroy: jest.fn(), create: jest.fn() },
  sequelize: {}
}));

jest.mock('../src/services/socketService.js', () => ({
  socketService: {
    emitToUser: jest.fn(),
    disconnectUser: jest.fn()
  }
}));

jest.mock('../src/services/recycleBinService.js', () => ({
  recycleBinService: { moveToBin: jest.fn() }
}));

jest.mock('../src/config/roles.js', () => ({
  ROLES: { SUPERADMIN: 'superadmin', ADMIN: 'admin' },
  canModifyUser: jest.fn((actorRoles, targetRoles) => {
    if (targetRoles.includes('superadmin')) return false;
    return true;
  })
}));

import { userService } from '../src/services/userService.js';
import { User } from '../src/models/index.js';
import { socketService } from '../src/services/socketService.js';

describe('UserService', () => {
  const mockRequester = { id: 'admin-id', roles: ['admin'] };
  
  beforeEach(() => jest.clearAllMocks());

  describe('updateUser', () => {
    it('should allow updates if permissions are sufficient', async () => {
      const targetUser = { 
        id: 'user-id', 
        roles: ['user'], 
        update: jest.fn() 
      };
      User.findByPk.mockResolvedValue(targetUser);

      await userService.updateUser(mockRequester, 'user-id', { firstName: 'NewName' });

      expect(targetUser.update).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'NewName'
      }));
    });

    it('should deny role changes if requester is not authorized', async () => {
      const targetUser = { id: 'super-id', roles: ['superadmin'] };
      User.findByPk.mockResolvedValue(targetUser);

      await expect(userService.updateUser(mockRequester, 'super-id', { roles: ['user'] }))
        .rejects.toThrow('Access Denied');
    });

    it('should disconnect user if status is changed to banned', async () => {
      const targetUser = { 
        id: 'user-id', 
        roles: ['user'], 
        update: jest.fn() 
      };
      User.findByPk.mockResolvedValue(targetUser);

      await userService.updateUser(mockRequester, 'user-id', { status: 'banned' });

      expect(socketService.emitToUser).toHaveBeenCalledWith('user-id', 'forced_logout', expect.any(Object));
      expect(socketService.disconnectUser).toHaveBeenCalledWith('user-id');
    });
  });

  describe('deleteUser', () => {
    it('should prevent self-deletion', async () => {
      const self = { id: 'admin-id', roles: ['admin'] };
      User.findByPk.mockResolvedValue(self);

      await expect(userService.deleteUser(self, 'admin-id'))
        .rejects.toThrow('Cannot delete your own account');
    });
  });
});
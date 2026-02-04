/* api/src/tests/controllers/authController.test.js */
import { inviteUser, completeRegistration } from '../src/controllers/authController.js';
import { authService } from '../src/services/authService.js';
import { trackActivity } from '../src/utils/audit.js';

// [FIX] Mock DB config to prevent real connection attempts AND satisfy session store if loaded
jest.mock('../src/config/db.js', () => ({
  define: jest.fn(() => ({ sync: jest.fn() })),
  authenticate: jest.fn()
}));

// [FIX] Mock userService to prevent loading socketService -> session.js -> db connection
jest.mock('../src/services/userService.js', () => ({
  userService: {
    findById: jest.fn(),
    changePassword: jest.fn()
  }
}));

jest.mock('../src/services/authService.js');
jest.mock('../src/utils/audit.js'); 
jest.mock('../src/models/index.js', () => ({
  User: { update: jest.fn() }
}));

// Mock Roles Helper
jest.mock('../src/config/roles.js', () => ({
  ROLES: { SUPERADMIN: 'superadmin', ADMIN: 'admin', USER: 'user' },
  ROLE_HIERARCHY: { superadmin: 100, admin: 50, user: 10 }
}));

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      user: { id: 'admin-id', roles: ['admin'] }, // Default requester is Admin
      login: jest.fn((user, cb) => cb(null)) // Mock passport login
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('inviteUser', () => {
    it('should deny access if Admin tries to invite Superadmin', async () => {
      req.body = { email: 'boss@test.com', roles: ['superadmin'] };
      
      await inviteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Access Denied')
      }));
      expect(authService.inviteUser).not.toHaveBeenCalled();
    });

    it('should allow Admin to invite User', async () => {
      req.body = { email: 'new@test.com', roles: ['user'] };
      authService.inviteUser.mockResolvedValue({ id: 'new-id' });

      await inviteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(authService.inviteUser).toHaveBeenCalled();
      expect(trackActivity).toHaveBeenCalledWith(req, 'INVITE_USER', 'users', expect.any(Object));
    });

    it('should handle "User already exists" error with 409', async () => {
      req.body = { email: 'exist@test.com', roles: ['user'] };
      authService.inviteUser.mockRejectedValue(new Error('User already exists'));

      await inviteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('completeRegistration', () => {
    it('should reject if passwords do not match', async () => {
      req.body = { 
        token: 'abc', 
        password: 'pass', 
        confirmPassword: 'fail' 
      };

      await completeRegistration(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Passwords do not match' });
    });

    it('should log user in after successful completion', async () => {
      req.body = { 
        token: 'valid', 
        password: 'pass', 
        confirmPassword: 'pass' 
      };
      
      const mockUser = { id: 1, email: 'test@test.com', roles: ['user'] };
      authService.completeRegistration.mockResolvedValue(mockUser);

      await completeRegistration(req, res, jest.fn());

      expect(authService.completeRegistration).toHaveBeenCalled();
      expect(req.login).toHaveBeenCalled();
      // Ensure we verify the user object sent to frontend
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ id: 1 })
      }));
    });
  });
});
/* api/tests/authService.test.js */
// [FIX] Added /src/ to all mock paths
jest.mock('../src/models/index.js', () => ({
  User: {
    count: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  Op: { gt: Symbol('gt') }
}));

jest.mock('../src/config/email.js', () => ({
  sendInvitationEmail: jest.fn()
}));

jest.mock('../src/utils/auth.js', () => ({
  hashPassword: jest.fn(pw => `hashed_${pw}`),
  comparePassword: jest.fn()
}));

import { authService } from '../src/services/authService.js';
import { User } from '../src/models/index.js';
import { sendInvitationEmail } from '../src/config/email.js';

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('onboardSuperadmin', () => {
    it('should create superadmin if no users exist', async () => {
      User.count.mockResolvedValue(0); 
      User.create.mockResolvedValue({ id: 1, email: 'admin@test.com' });

      await authService.onboardSuperadmin({
        email: 'admin@test.com',
        password: 'password123'
      });

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        roles: ['superadmin'],
        status: 'active'
      }));
    });

    it('should forbid creation if users already exist', async () => {
      User.count.mockResolvedValue(1); 

      await expect(authService.onboardSuperadmin({}))
        .rejects.toThrow('Onboarding is no longer available');
    });
  });

  describe('inviteUser', () => {
    it('should create a pending user and send email', async () => {
      User.findOne.mockResolvedValue(null); 
      User.create.mockResolvedValue({ id: 2, email: 'invitee@test.com' });

      await authService.inviteUser({
        email: 'invitee@test.com',
        roles: ['editor']
      });

      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        status: 'pending',
        invitationToken: expect.any(String)
      }));
      expect(sendInvitationEmail).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      User.findOne.mockResolvedValue({ id: 1 });
      
      await expect(authService.inviteUser({ email: 'existing@test.com' }))
        .rejects.toThrow('User already exists');
    });
  });

  describe('completeRegistration', () => {
    it('should activate user if token is valid', async () => {
      const mockUser = {
        update: jest.fn(),
        birthDate: null
      };
      User.findOne.mockResolvedValue(mockUser);

      await authService.completeRegistration('valid_token', {
        password: 'newPassword',
        birthDate: '1990-01-01'
      });

      expect(mockUser.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'active',
        invitationToken: null,
        password: 'hashed_newPassword'
      }));
    });

    it('should throw if token is invalid or expired', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.completeRegistration('bad_token', {}))
        .rejects.toThrow('Invalid or expired');
    });
  });
});
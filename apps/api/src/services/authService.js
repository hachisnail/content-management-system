import crypto from 'crypto';
import { User } from '../models/index.js';
import { hashPassword } from '../utils/auth.js';
import { sendInvitationEmail } from '../config/email.js';
import { Op } from 'sequelize';
import { ROLES } from '../config/roles.js';

class AuthService {


  /**
   * Check if any users exist in the system.
   * Used to determine if onboarding is needed.
   */
  async isOnboardingNeeded() {
    const userCount = await User.count({ paranoid: false }); 
    return userCount === 0;
  }

  /**
   * Register the initial Superadmin.
   * Only allowed if no users exist.
   */
  async onboardSuperadmin(data) {
    const isNeeded = await this.isOnboardingNeeded();
    if (!isNeeded) {
      const error = new Error('Onboarding is no longer available. System is already initialized.');
      error.status = 403;
      throw error;
    }

    const hashedPassword = await hashPassword(data.password);

    const superadmin = await User.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      contactNumber: data.contactNumber,
      birthDate: data.birthDate,
      roles: [ROLES.SUPERADMIN], // Now ROLES is defined
      status: 'active',
      lastLoginAt: new Date()
    });

    return superadmin;
  }

/**
   * Invite a new user
   */
  async inviteUser({ email, roles, firstName, lastName }) {
    // 1. Check if exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new Error('User already exists');
    }

    // 2. Generate Token & Placeholder Password
    const token = crypto.randomBytes(32).toString('hex');
    // [FIX] Database requires a non-null password. We generate a secure random one 
    // that the user will never know (they will overwrite it via the invite link).
    const placeholderPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(placeholderPassword);
    
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // 3. Create User (Status: Pending)
    const newUser = await User.create({
      email,
      password: hashedPassword, // [FIX] Added password
      roles,
      firstName,
      lastName,
      status: 'pending',
      invitationToken: token,
      invitationExpiresAt: expiresAt,
    });

    // 4. Send Email (Async, don't block)
    await sendInvitationEmail(email, token);

    return newUser;
  }

  async resendInvitation(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");
    
    if (user.status !== 'pending') {
      throw new Error("Cannot resend invite. User is already active or banned.");
    }

    // Regenerate Token & Extend Expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // Reset to 48 hours from now

    await user.update({
      invitationToken: token,
      invitationExpiresAt: expiresAt
    });

    await sendInvitationEmail(user.email, token);
    return true;
  }
  /**
   * Complete Registration
   */
  async completeRegistration(token, { password, birthDate, contactNumber }) {
    const user = await User.findOne({ 
      where: { 
        invitationToken: token,
        invitationExpiresAt: { [Op.gt]: new Date() } 
      } 
    });

    if (!user) {
      const error = new Error('Invalid or expired invitation token.');
      error.status = 400;
      throw error;
    }

    const hashedPassword = await hashPassword(password);

    await user.update({
      password: hashedPassword,
      invitationToken: null,
      invitationExpiresAt: null,
      status: 'active',
      // Only update additional profile info
      birthDate: birthDate || user.birthDate,
      contactNumber: contactNumber || user.contactNumber,
      lastLoginAt: new Date()
    });

    return user;
  }

  /**
   * Request Password Reset
   */
  async requestPasswordReset(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) return; // Silent return for security (don't reveal user existence)

    // Generate Token (1 hour expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

    await user.update({
      resetPasswordToken: token, // NOTE: You need to add these columns to your User model!
      resetPasswordExpires: expiresAt
    });

    // Send Email
    // Implement this in api/src/config/email.js
    // await sendPasswordResetEmail(email, token); 
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    console.log(`[MOCK EMAIL] Password Reset Link: ${clientUrl}/auth/reset-password?token=${token}`);
  }

  /**
   * Reset Password with Token
   */
  async resetPassword(token, newPassword) {
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() } // Check if not expired
      }
    });

    if (!user) {
      const error = new Error('Password reset token is invalid or has expired.');
      error.status = 400;
      throw error;
    }

    const hashedPassword = await hashPassword(newPassword);

    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    return user;
  }
};
export const authService = new AuthService();
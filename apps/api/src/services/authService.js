import crypto from 'crypto';
import { User } from '../models/index.js';
import { hashPassword, hashToken } from '../utils/auth.js';
import { sendInvitationEmail } from '../config/email.js';
import { Op } from 'sequelize';
import { ROLES } from '../config/roles.js';
import { AppError } from '../core/errors/AppError.js'; 
import { sendEmail } from '../config/email.js';
import { config } from '../config/env.js';

class AuthService {
  async validateInvitationToken(token) {
    const hashedToken = hashToken(token);
    const user = await User.findOne({ 
      where: { 
        invitationToken: hashedToken, 
        invitationExpiresAt: { [Op.gt]: new Date() } 
      },
      attributes: ['id', 'email', 'firstName', 'lastName'] // Return basic info for UI context
    });

    if (!user) {
      throw new AppError('Invitation link is invalid or has expired.', 400);
    }
    return user;
  }

  async validateResetToken(token) {
    const hashedToken = hashToken(token);
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: new Date() }
      },
      attributes: ['id', 'email']
    });

    if (!user) {
      throw new AppError('Password reset link is invalid or has expired.', 400);
    }
    return true; 
  }

  async isOnboardingNeeded() {
    const userCount = await User.count({ paranoid: false }); 
    return userCount === 0;
  }

  async onboardSuperadmin(data) {
    const isNeeded = await this.isOnboardingNeeded();
    if (!isNeeded) {
      throw new AppError('Onboarding is no longer available. System is already initialized.', 403);
    }

    const hashedPassword = await hashPassword(data.password);

    return await User.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      contactNumber: data.contactNumber,
      birthDate: data.birthDate,
      roles: [ROLES.SUPERADMIN],
      status: 'active',
      lastLoginAt: new Date()
    });
  }

  async inviteUser({ email, roles, firstName, lastName }) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new AppError('User already exists', 409); 
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(token); 

    const placeholderPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(placeholderPassword);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      roles,
      firstName,
      lastName,
      status: 'pending',
      invitationToken: hashedToken, 
      invitationExpiresAt: expiresAt,
    });

    await sendInvitationEmail(email, token); 
    return newUser;
  }

  async resendInvitation(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError("User not found", 404);
    
    if (user.status !== 'pending') {
      throw new AppError("Cannot resend invite. User is already active or banned.", 400);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await user.update({
      invitationToken: hashedToken,
      invitationExpiresAt: expiresAt
    });

    await sendInvitationEmail(user.email, token); 
    return true;
  }

  async completeRegistration(token, { password, birthDate, contactNumber }) {
    const hashedToken = hashToken(token); 

    const user = await User.findOne({ 
      where: { 
        invitationToken: hashedToken, 
        invitationExpiresAt: { [Op.gt]: new Date() } 
      } 
    });

    if (!user) {
      throw new AppError('Invalid or expired invitation token.', 400);
    }

    const hashedPassword = await hashPassword(password);

    await user.update({
      password: hashedPassword,
      invitationToken: null,
      invitationExpiresAt: null,
      status: 'active',
      birthDate: birthDate || user.birthDate,
      contactNumber: contactNumber || user.contactNumber,
      lastLoginAt: new Date()
    });

    return user;
  }

  async requestPasswordReset(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) return; 

    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

    await user.update({
      resetPasswordToken: hashedToken, 
      resetPasswordExpires: expiresAt
    });

    const clientUrl = config.webOrigin;
    const resetLink = `${clientUrl}/reset-password?token=${token}`; 
    console.log(`[MOCK EMAIL] Password Reset Link: ${clientUrl}/reset-password?token=${token}`);

    await sendEmail({
    to: email,
    subject: 'Reset your Museo Bulawan password',
    html: `
      <div style="font-family: Arial">
        <h3>Password Reset Request</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}"
           style="background:#4F46E5;color:white;padding:10px 16px;border-radius:5px;text-decoration:none">
           Reset Password
        </a>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
  }

  async resetPassword(token, newPassword) {
    const hashedToken = hashToken(token); 

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken, 
        resetPasswordExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired.', 400);
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
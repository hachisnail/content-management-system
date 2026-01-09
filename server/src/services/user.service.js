import { db } from '../models/index.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendMail } from './mailer.js';
import { logOperation } from './logger.js';
import {
  getAllowedRoles,
  ROLE_DEFINITIONS,
  PERMISSIONS,
} from '../config/permissions.js';
import { buildQueryOptions } from '../utils/queryBuilder.js';

const checkPerm = (userRoles, permission) => {
  if (!userRoles) return false;
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  if (roles.includes('super_admin')) return true;
  return roles.some((role) =>
    (ROLE_DEFINITIONS[role] || []).includes(permission),
  );
};

export const updateUser = async (id, updateData, initiatorEmail) => {
  const user = await db.User.findByPk(id);
  if (!user) throw new Error('User not found');

  const initiator = await db.User.findOne({ where: { email: initiatorEmail } });
  if (!initiator) throw new Error('Initiator not found');

  // --- PERMISSION CHECKING ---
  const iRoles = initiator.role;
  const targetRoles = user.role || [];

  const isInitiatorSuper = iRoles.includes('super_admin');
  const isTargetSuper = targetRoles.includes('super_admin');

  // 1. SECURITY FIX: Prevent Admins from modifying Super Admins
  if (isTargetSuper && !isInitiatorSuper) {
    throw new Error('Access Denied: You cannot modify a Super Admin account.');
  }

  const isSelf = user.id === initiator.id;
  const canManageUsers = checkPerm(iRoles, PERMISSIONS.MANAGE_USERS);
  const canManageRoles = checkPerm(iRoles, PERMISSIONS.MANAGE_USER_ROLES);
  const canManageStatus = checkPerm(iRoles, PERMISSIONS.MANAGE_USER_STATUS);

  const basicFields = [
    'firstName',
    'lastName',
    'middleName',
    'contactNumber',
    'birthDay',
  ];
  let allowedFields = [];

  if (isSelf || canManageUsers) {
    allowedFields = [...basicFields];
  }

  if (canManageRoles) allowedFields.push('role');
  if (canManageStatus) allowedFields.push('status');

  if (isInitiatorSuper) {
    allowedFields.push('email', 'username');
    allowedFields = [
      ...new Set([...allowedFields, ...basicFields, 'role', 'status']),
    ];
  }

  const beforeState = user.toJSON();
  delete beforeState.password;
  delete beforeState.socketId;

  if (updateData.roles && !updateData.role) updateData.role = updateData.roles;

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  if (user.changed('role')) {
    const rawRole = user.getDataValue('role');
    const roleArray = Array.isArray(rawRole) ? rawRole : [rawRole];
    const validRoleList = getAllowedRoles();

    const invalidRoles = roleArray.filter((r) => !validRoleList.includes(r));
    if (invalidRoles.length > 0)
      throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);

    user.setDataValue('role', roleArray);
  }

  user.last_active = new Date();

  await user.save();

  await logOperation({
    description: `User profile updated for ${user.email}`,
    operation: 'UPDATE',
    affectedResource: `user:${user.id}`,
    beforeState,
    afterState: { ...user.toJSON(), password: undefined, socketId: undefined },
    initiator: initiatorEmail,
  });

  return findById(user.id);
};

export const deleteUser = async (id, initiatorEmail) => {
  const user = await db.User.findByPk(id);
  if (!user) throw new Error('User not found');

  const initiator = await db.User.findOne({ where: { email: initiatorEmail } });

  // --- SECURITY FIX: Hierarchy Check for Deletion ---
  if (initiator) {
    const iRoles = initiator.role || [];
    const tRoles = user.role || [];

    const isInitiatorSuper = iRoles.includes('super_admin');
    const isTargetSuper = tRoles.includes('super_admin');

    if (isTargetSuper && !isInitiatorSuper) {
      throw new Error(
        'Access Denied: You cannot delete a Super Admin account.',
      );
    }
  }

  const userEmail = user.email;
  const beforeState = user.toJSON();

  await user.destroy();

  await logOperation({
    description: `User/Invitation revoked for ${userEmail}`,
    operation: 'DELETE',
    affectedResource: `user:${id}`,
    beforeState,
    afterState: null,
    initiator: initiatorEmail,
  });

  return true;
};

export const findById = async (id) => {
  return await db.User.findByPk(id, {
    attributes: { exclude: ['password', 'socketId', 'registrationToken'] },
    include: [
      {
        model: db.File,
        as: 'profilePicture',
        attributes: ['id', 'fileName', 'mimeType'],
      },
    ],
  });
};

export const findAll = async (queryParams = {}) => {
  const searchableFields = ['firstName', 'lastName', 'email', 'username'];
  const options = buildQueryOptions(queryParams, searchableFields);

  try {
    const { count, rows } = await db.User.findAndCountAll({
      ...options,
      attributes: { exclude: ['password', 'registrationToken'] },
      subQuery: false,
      distinct: true,
      include: [
        {
          model: db.File,
          as: 'profilePicture',
          attributes: ['id', 'fileName', 'relatedType'],
          required: false,
        },
      ],
    });

    return { count, rows };
  } catch (error) {
    console.error('[User Service] Error fetching users:', error);
    throw error;
  }
};

export const createUser = async ({
  email,
  firstName,
  lastName,
  middleName,
  roles,
  initiatorEmail,
}) => {
  const existingUser = await db.User.findOne({ where: { email } });
  if (existingUser) throw new Error('User already exists');

  const validRoleList = getAllowedRoles();
  const assignedRoles = Array.isArray(roles) ? roles : [roles];

  const invalidRoles = assignedRoles.filter((r) => !validRoleList.includes(r));
  if (invalidRoles.length > 0)
    throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);

  const registrationToken = crypto.randomBytes(32).toString('hex');
  const EXPIRE_HOURS = 48;
  const invitationExpiresAt = new Date(
    Date.now() + EXPIRE_HOURS * 60 * 60 * 1000,
  );

  const newUser = await db.User.create({
    email,
    firstName,
    lastName,
    middleName,
    role: assignedRoles,
    registrationToken,
    invitationExpiresAt,
    status: 'pending',
  });

  await logOperation({
    description: 'Admin created a new user invitation.',
    operation: 'CREATE',
    affectedResource: `user:${newUser.id}`,
    beforeState: null,
    afterState: newUser.toJSON(),
    initiator: initiatorEmail,
  });

  const registrationLink = `http://localhost:5173/complete-registration?token=${registrationToken}`;

  await sendMail({
    to: email,
    subject: 'Action Required: Complete your MASCD Registration',
    html: getInvitationTemplate(registrationLink, firstName),
  });

  const userJson = newUser.toJSON();
  delete userJson.password;
  delete userJson.registrationToken;
  return userJson;
};

export const completeRegistration = async (
  token,
  { password, username, contactNumber, birthDay },
) => {
  const user = await db.User.findOne({ where: { registrationToken: token } });
  if (!user) throw new Error('Invalid registration token');

  const beforeState = user.toJSON();
  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;
  user.username = username;
  user.contactNumber = contactNumber;
  user.birthDay = birthDay;
  user.status = 'active';
  user.registrationToken = null;

  await user.save();

  await logOperation({
    description: 'User completed their registration.',
    operation: 'UPDATE',
    affectedResource: `user:${user.id}`,
    beforeState,
    afterState: user.toJSON(),
    initiator: user.email,
  });

  const userJson = user.toJSON();
  delete userJson.password;
  delete userJson.registrationToken;
  return userJson;
};

const getInvitationTemplate = (link, firstName) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #51545E; margin: 0; padding: 0; }
    .email-wrapper { width: 100%; background-color: #f4f4f7; padding: 40px 0; }
    .email-content { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .email-header { background-color: #4F46E5; padding: 24px; text-align: center; color: #ffffff; }
    .email-body { padding: 40px 24px; }
    .button { display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #6b7280; background-color: #f9fafb; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-content">
      <div class="email-header">
        <h1 style="margin:0; font-size: 24px;">Welcome to MASCD MIS</h1>
      </div>
      <div class="email-body">
        <p>Hello <strong>${firstName}</strong>,</p>
        <p>You have been invited to join the <strong>Museum Audit & Collection System</strong>. A secure account has been reserved for you.</p>
        <p>Please click the button below to set your password and complete your registration:</p>
        <div style="text-align: center;">
          <a href="${link}" class="button" style="color: #ffffff;">Complete Registration</a>
        </div>
        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">This link will expire in 48 hours.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} MASCD MIS Portal. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

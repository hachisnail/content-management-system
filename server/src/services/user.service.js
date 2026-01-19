import { db } from '../models/index.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendMail } from './mailer.js';
import { logOperation } from './logger.js';
import * as FileService from './file.service.js';
import {
  getAllowedRoles,
  ROLE_DEFINITIONS,
  PERMISSIONS,
  ROLE_HIERARCHY, // <--- Import Hierarchy
} from '../config/permissions.js';
import { buildQueryOptions } from '../utils/queryBuilder.js';
import { Transaction } from 'sequelize';

// --- HELPER: Calculate Power Level ---
const getRolePower = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  // Returns the highest power level the user possesses
  return Math.max(...roleArray.map((r) => ROLE_HIERARCHY[r] || 0));
};

const checkPerm = (userRoles, permission) => {
  if (!userRoles) return false;
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  if (roles.includes('super_admin')) return true;
  return roles.some((role) =>
    (ROLE_DEFINITIONS[role] || []).includes(permission),
  );
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const userObj = typeof user.toJSON === 'function' ? user.toJSON() : user;
  const {
    password,
    registrationToken,
    socketId,
    resetPasswordToken,
    ...safeData
  } = userObj;
  return safeData;
};

export const isSystemSetup = async () => {
  const count = await db.User.count();
  return count > 0;
};

export const createFirstAdmin = async ({ email, password, firstName, lastName }) => {
  // FIX: Use a transaction to prevent race conditions during setup
  return await db.sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (t) => {
    const count = await db.User.count({ transaction: t });
    
    if (count > 0) {
      throw new Error('Setup Forbidden: System already has registered users.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: ['super_admin'],
      status: 'active',
      isOnline: false
    }, { transaction: t });

    // Move logging outside or keep it (logging usually doesn't need to be in the transaction unless strict)
    // For safety, we can log after commit, but here is fine.
    
    return sanitizeUser(user);
  });
};



export const updateUser = async (id, updateData, initiatorEmail) => {
  const user = await db.User.findByPk(id);
  if (!user) throw new Error('User not found');

  const initiator = await db.User.findOne({ where: { email: initiatorEmail } });
  if (!initiator) throw new Error('Initiator not found');

  const iRoles = initiator.role || [];
  const targetRoles = user.role || [];
  const isSelf = user.id === initiator.id;

  // --- HIERARCHY CHECK ---
  if (!isSelf) {
    const initiatorPower = getRolePower(iRoles);
    const targetPower = getRolePower(targetRoles);

    // 1. Prevent editing higher tiers (e.g. Admin editing Super Admin)
    if (initiatorPower < targetPower) {
      throw new Error(
        'Access Denied: You cannot modify a user with higher authority.',
      );
    }

    // 2. Prevent editing peers (e.g. Admin editing another Admin), unless you are Super Admin
    const isInitiatorSuper = iRoles.includes('super_admin');
    if (initiatorPower === targetPower && !isInitiatorSuper) {
      throw new Error(
        'Access Denied: You cannot modify a user with equal authority.',
      );
    }
  }

  // --- PERMISSION CHECKS ---
  const canUpdateGeneral = checkPerm(iRoles, PERMISSIONS.UPDATE_USERS);
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

  if (isSelf || canUpdateGeneral) {
    allowedFields = [...basicFields];
  }

  if (canManageRoles) allowedFields.push('role');
  if (canManageStatus) allowedFields.push('status');

  // Super Admins can edit system fields
  if (iRoles.includes('super_admin')) {
    allowedFields.push('email', 'username');
    allowedFields = [
      ...new Set([...allowedFields, ...basicFields, 'role', 'status']),
    ];
  }

  // --- APPLY UPDATES ---
  const beforeState = user.toJSON();
  delete beforeState.password;
  delete beforeState.socketId;

  if (updateData.roles && !updateData.role) updateData.role = updateData.roles;

  let hasChanges = false;
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined && user[field] !== updateData[field]) {
      user[field] = updateData[field];
      hasChanges = true;
    }
  });

  // --- VALIDATE ROLE CHANGES ---
  if (user.changed('role')) {
    const rawRole = user.getDataValue('role');
    const roleArray = Array.isArray(rawRole) ? rawRole : [rawRole];

    // Safety: Ensure you aren't assigning a role HIGHER than your own
    // (e.g. An Admin shouldn't be able to promote someone to Super Admin)
    const newRolePower = getRolePower(roleArray);
    const myPower = getRolePower(iRoles);
    if (newRolePower > myPower) {
      throw new Error(
        'Access Denied: You cannot assign a role higher than your own.',
      );
    }

    const validRoleList = getAllowedRoles();
    const invalidRoles = roleArray.filter((r) => !validRoleList.includes(r));
    if (invalidRoles.length > 0)
      throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);
    user.setDataValue('role', roleArray);
  }

  if (hasChanges || user.changed('role')) {
    user.last_active = new Date();
    await user.save();

    await logOperation({
      description: `User profile updated for ${user.email}`,
      operation: 'UPDATE',
      affectedResource: `user:${user.id}`,
      beforeState,
      afterState: sanitizeUser(user),
      initiator: initiatorEmail,
    });
  }

  return findById(user.id);
};

export const deleteUser = async (id, initiatorEmail) => {
  const transaction = await db.sequelize.transaction();
  try {
    const user = await db.User.findByPk(id, { transaction });
    if (!user) throw new Error('User not found');

    const initiator = await db.User.findOne({
      where: { email: initiatorEmail },
      transaction,
    });

    if (initiator) {
      const iRoles = initiator.role || [];
      const tRoles = user.role || [];

      // --- HIERARCHY CHECK FOR DELETION ---
      const initiatorPower = getRolePower(iRoles);
      const targetPower = getRolePower(tRoles);

      if (initiatorPower < targetPower) {
        throw new Error(
          'Access Denied: You cannot delete a user with higher authority.',
        );
      }

      // Prevent deleting peers (except Super Admin)
      const isInitiatorSuper = iRoles.includes('super_admin');
      if (initiatorPower === targetPower && !isInitiatorSuper) {
        throw new Error(
          'Access Denied: You cannot delete a user with equal authority.',
        );
      }
    }

    const userEmail = user.email;

    await FileService.deleteRelatedFiles(
      { relatedType: 'users', relatedId: id },
      transaction,
    );

    await user.destroy({ transaction });
    await transaction.commit();

    await logOperation({
      description: `User/Invitation revoked for ${userEmail}`,
      operation: 'DELETE',
      affectedResource: `user:${id}`,
      beforeState: sanitizeUser(user),
      afterState: null,
      initiator: initiatorEmail,
    });

    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const findById = async (id) => {
  return await db.User.findByPk(id, {
    attributes: { exclude: ['password', 'socketId', 'registrationToken'] },
    include: [
      {
        model: db.File,
        as: 'profilePicture',
        attributes: ['id', 'fileName', 'mimeType', 'path'],
        through: { attributes: [] },
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
          attributes: ['id', 'fileName', 'mimeType'],
          required: false,
          through: { attributes: [] },
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

  // --- HIERARCHY CHECK (Creation) ---
  // Ensure creator doesn't create a role higher than themselves
  const initiator = await db.User.findOne({ where: { email: initiatorEmail } });
  if (initiator) {
    const myPower = getRolePower(initiator.role);
    const newRolePower = getRolePower(assignedRoles);
    if (newRolePower > myPower) {
      throw new Error(
        'Access Denied: You cannot create a user with a higher role than your own.',
      );
    }
  }

  const registrationToken = crypto.randomBytes(32).toString('hex');
  const invitationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

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
    afterState: sanitizeUser(newUser),
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

// ... (completeRegistration and getInvitationTemplate remain unchanged)
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
    afterState: sanitizeUser(user),
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

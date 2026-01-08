import { db } from '../models/index.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendMail } from './mailer.js';
import { logOperation } from './logger.js';
import { getAllowedRoles } from '../config/permissions.js'; 
import { buildQueryOptions } from '../utils/queryBuilder.js';


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
// --- CREATE ---
// Updated to accept initiatorEmail from Controller
export const createUser = async ({ email, firstName, lastName, middleName, roles, initiatorEmail }) => {
  const existingUser = await db.User.findOne({ where: { email } });
  if (existingUser) throw new Error('User already exists');

  const validRoleList = getAllowedRoles(); 
  const assignedRoles = Array.isArray(roles) ? roles : [roles];
  
  const invalidRoles = assignedRoles.filter(r => !validRoleList.includes(r));
  if (invalidRoles.length > 0) throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);

  const registrationToken = crypto.randomBytes(32).toString('hex');
  const EXPIRE_HOURS = 48;
  const invitationExpiresAt = new Date(Date.now() + EXPIRE_HOURS * 60 * 60 * 1000);

  const newUser = await db.User.create({
    email, 
    firstName, 
    lastName, 
    middleName, 
    role: assignedRoles, 
    registrationToken,
    invitationExpiresAt, 
    status: 'pending'
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
  
  // FIX: Use the new HTML template
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

// --- UPDATE (Complete Registration) ---
export const completeRegistration = async (token, { password, username, contactNumber, birthDay }) => {
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

  // Log Completion
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

export const updateUser = async (id, updateData, initiatorEmail) => {
  const user = await db.User.findByPk(id);
  if (!user) throw new Error('User not found');

  const initiator = await db.User.findOne({ where: { email: initiatorEmail } });
  if (!initiator) throw new Error('Initiator not found');

  const initiatorRoles = Array.isArray(initiator.role) ? initiator.role : [initiator.role];
  const isSuperAdmin = initiatorRoles.includes('super_admin');

  const beforeState = user.toJSON();
  delete beforeState.password;
  delete beforeState.socketId;

  const basicFields = ['firstName', 'lastName', 'middleName', 'contactNumber', 'birthDay'];
  let allowedFields = [...basicFields];

  if (isSuperAdmin) {
    allowedFields.push('email');
    allowedFields.push('status');
  }

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  // FIX: Force update "Live Status" so they appear Online immediately
  user.last_active = new Date();

  // Saving triggers the hooks we configured in models/index.js
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

// --- DELETE (Revoke) - [NEW] ---
export const deleteUser = async (id, initiatorEmail) => {
  const user = await db.User.findByPk(id);
  if (!user) throw new Error('User not found');

  const userEmail = user.email;
  const beforeState = user.toJSON();

  // Hard Delete
  await user.destroy();

  // Log Deletion
  await logOperation({
    description: `User/Invitation revoked for ${userEmail}`,
    operation: 'DELETE',
    affectedResource: `user:${id}`,
    beforeState, // Keep record of what was deleted
    afterState: null,
    initiator: initiatorEmail,
  });
  
  return true;
};

// --- READ ---
export const findById = async (id) => {
  return await db.User.findByPk(id, {
    attributes: { exclude: ['password', 'socketId', 'registrationToken'] },
    include: [{
      model: db.File,
      as: 'profilePicture',
      attributes: ['id', 'fileName', 'mimeType']
    }]
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
      include: [{
        model: db.File,
        as: 'profilePicture',
        attributes: ['id', 'fileName', 'relatedType'],
        required: false
      }]
    });

    return { count, rows };
  } catch (error) {
    console.error('[User Service] Error fetching users:', error);
    throw error;
  }
};
// server/src/services/user.service.js
import { db } from '../models/index.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendMail } from './mailer.js';
import { logOperation } from './logger.js';
// 1. ADD THIS IMPORT
import { getAllowedRoles } from '../config/permissions.js'; 

export const createUser = async ({
  email,
  firstName,
  lastName,
  middleName,
  roles, 
}) => {
  // 1. Check if user exists
  const existingUser = await db.User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // 2. Validate Roles (Dynamic)
  const validRoleList = getAllowedRoles(); 
  const assignedRoles = Array.isArray(roles) ? roles : [roles];
  
  const invalidRoles = assignedRoles.filter(r => !validRoleList.includes(r));
  if (invalidRoles.length > 0) {
    throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);
  }

  // 3. Generate Token
  const registrationToken = crypto.randomBytes(32).toString('hex');

  // 4. Create User
  const newUser = await db.User.create({
    email,
    firstName,
    lastName,
    middleName,
    role: assignedRoles, // Store as JSON array
    registrationToken,
  });

  // 5. Log operation
  await logOperation({
    description: 'Admin created a new user invitation.',
    operation: 'CREATE',
    affectedResource: `user:${newUser.id}`,
    beforeState: null,
    afterState: newUser.toJSON(),
    initiator: 'admin',
  });

  // 6. Send Registration Email
  const registrationLink = `http://localhost:5173/complete-registration?token=${registrationToken}`;
  await sendMail({
    to: email,
    subject: 'Complete your registration',
    html: `<p>Please click the following link to complete your registration: <a href="${registrationLink}">${registrationLink}</a></p>`,
  });

  const userJson = newUser.toJSON();
  delete userJson.password;
  delete userJson.registrationToken;

  return userJson;
};

export const completeRegistration = async (token, {
  password,
  username,
  contactNumber,
  birthDay,
}) => {
  // 1. Find user by token
  const user = await db.User.findOne({ where: { registrationToken: token } });
  if (!user) {
    throw new Error('Invalid registration token');
  }

  const beforeState = user.toJSON();

  // 2. Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Update user
  user.password = hashedPassword;
  user.username = username;
  user.contactNumber = contactNumber;
  user.birthDay = birthDay;
  user.status = 'active';
  user.registrationToken = null;

  await user.save();

  // 4. Log operation
  await logOperation({
    description: 'User completed their registration.',
    operation: 'UPDATE',
    affectedResource: `user:${user.id}`,
    beforeState,
    afterState: user.toJSON(),
    // IMPROVEMENT: Log the actual email instead of just "user"
    initiator: user.email, 
  });

  // 5. Return user without sensitive data
  const userJson = user.toJSON();
  delete userJson.password;
  delete userJson.registrationToken;

  return userJson;
};

export const findById = async (id) => {
  return await db.User.findByPk(id, {
    attributes: { exclude: ['password', 'socketId'] }
  });
};

export const findAll = async () => {
  return await db.User.findAll({
    attributes: { exclude: ['password'] },
  });
};
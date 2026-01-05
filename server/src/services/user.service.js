import { db } from '../models/index.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendMail } from './mailer.js';
import { logOperation } from './logger.js';
import { getAllowedRoles } from '../config/permissions.js'; 
import { Op } from 'sequelize'; 

export const createUser = async ({
  email,
  firstName,
  lastName,
  middleName,
  roles, 
}) => {
  const existingUser = await db.User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const validRoleList = getAllowedRoles(); 
  const assignedRoles = Array.isArray(roles) ? roles : [roles];
  
  const invalidRoles = assignedRoles.filter(r => !validRoleList.includes(r));
  if (invalidRoles.length > 0) {
    throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);
  }

  const registrationToken = crypto.randomBytes(32).toString('hex');

  const newUser = await db.User.create({
    email,
    firstName,
    lastName,
    middleName,
    role: assignedRoles,
    registrationToken,
  });

  await logOperation({
    description: 'Admin created a new user invitation.',
    operation: 'CREATE',
    affectedResource: `user:${newUser.id}`,
    beforeState: null,
    afterState: newUser.toJSON(),
    initiator: 'admin',
  });

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
  const user = await db.User.findOne({ where: { registrationToken: token } });
  if (!user) {
    throw new Error('Invalid registration token');
  }

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

export const findById = async (id) => {
  return await db.User.findByPk(id, {
    attributes: { exclude: ['password', 'socketId'] }
  });
};

export const findAll = async (params = {}) => {
  const where = {};

  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const offset = (page - 1) * limit;

  // Search and Filters
  if (params.search) {
    where[Op.or] = [
      { firstName: { [Op.like]: `%${params.search}%` } },
      { lastName: { [Op.like]: `%${params.search}%` } },
      { email: { [Op.like]: `%${params.search}%` } },
    ];
  }
  if (params.role) where.role = { [Op.like]: `%"${params.role}"%` };
  if (params.status) where.status = params.status;

  // --- DYNAMIC SORTING ---
  const sortBy = params.sortBy || 'createdAt';
  const sortDir = (params.sortDir || 'DESC').toUpperCase();

  return await db.User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    order: [[sortBy, sortDir]], // Apply dynamic sort
    limit,
    offset,
  });
};
import { db } from '../models/index.js';
import bcrypt from 'bcrypt';

export const createUser = async ({ email, password, role }) => {
  // 1. Check if user exists
  const existingUser = await db.User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // 2. Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Create User
  const newUser = await db.User.create({
    email,
    password: hashedPassword,
    role: role || 'viewer',
  });

  // 4. Return user without password
  const userJson = newUser.toJSON();
  delete userJson.password;

  return userJson;
};

export const findById = async (id) => {
  return await db.User.findByPk(id);
};

export const findAll = async () => {
  return await db.User.findAll({
    attributes: { exclude: ['password'] },
  });
};
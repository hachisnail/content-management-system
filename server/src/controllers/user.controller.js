import * as UserService from '../services/user.service.js';

export const createUser = async (req, res, next) => {
  try {
    // Admin creates the user. 
    // In a real invite system, you might send an email here instead of setting a password directly.
    const { email, password, role } = req.body;
    
    const user = await UserService.createUser({ email, password, role });
    
    res.status(201).json({
      success: true,
      message: 'New user account created successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await UserService.findAll();
    res.json(users);
  } catch (error) {
    next(error);
  }
};
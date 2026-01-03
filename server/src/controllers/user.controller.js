import * as UserService from '../services/user.service.js';

export const createUser = async (req, res, next) => {
  try {
    // Admin invites a new user.
    const { email, firstName, lastName, middleName, role } = req.body;
    console.log('Creating user with data:', { email, firstName, lastName, middleName, role });
    const user = await UserService.createUser({
      email,
      firstName,
      lastName,
      middleName,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'Invitation email sent successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const completeRegistration = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { password, username, contactNumber, birthDay } = req.body;

    const user = await UserService.completeRegistration(token, {
      password,
      username,
      contactNumber,
      birthDay,
    });

    res.json({
      success: true,
      message: 'Registration completed successfully',
      user,
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
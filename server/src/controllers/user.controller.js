import * as UserService from '../services/user.service.js';

export const createUser = async (req, res, next) => {
  try {
    // Destructure 'roles' (plural) from body
    const { email, firstName, lastName, middleName, roles } = req.body;
    
    console.log('Creating user:', { email, roles });

    const user = await UserService.createUser({
      email,
      firstName,
      lastName,
      middleName,
      roles, // Pass array to service
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
    
    // --- PASSIVE CHECK LOGIC ---
    // If a user hasn't been active in 12 hours, we tell the UI they are offline.
    const TIMEOUT = 12 * 60 * 60 * 1000; // 12 Hours
    const now = Date.now();

    const safeUsers = users.map(u => {
      // Convert Sequelize instance to a plain object so we can modify it
      const user = u.toJSON();
      
      if (user.isOnline && user.last_active) {
        const lastActiveTime = new Date(user.last_active).getTime();
        
        // If the time gap is larger than 12 hours
        if (now - lastActiveTime > TIMEOUT) {
          user.isOnline = false; // Override status for the response
          // user.socketId = []; // Optional: hide socket ID too
        }
      }
      return user;
    });

    res.json(safeUsers);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await UserService.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return the user object directly (or wrap it, but your hook handles both)
    // Using .toJSON() is safer if you want to ensure password is stripped (service handles attributes though)
    res.json(user);
  } catch (error) {
    next(error);
  }
};
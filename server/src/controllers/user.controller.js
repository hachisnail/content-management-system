import * as UserService from '../services/user.service.js';

export const createUser = async (req, res, next) => {
  try {
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
    // 1. Get raw data + count from Service
    const { count, rows } = await UserService.findAll(req.query);
    
    // --- PASSIVE CHECK LOGIC (Applied to the current page's rows) ---
    const TIMEOUT = 12 * 60 * 60 * 1000; // 12 Hours
    const now = Date.now();

    const safeUsers = rows.map(u => {
      // Convert Sequelize instance to a plain object
      const user = u.toJSON();
      
      if (user.isOnline && user.last_active) {
        const lastActiveTime = new Date(user.last_active).getTime();
        
        // If the time gap is larger than 12 hours
        if (now - lastActiveTime > TIMEOUT) {
          user.isOnline = false; 
        }
      }
      return user;
    });

    // 2. Prepare Pagination Metadata
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const totalPages = Math.ceil(count / limit);

    // 3. Return structured response
    res.json({
      data: safeUsers,
      meta: {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
      }
    });
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

    res.json(user);
  } catch (error) {
    next(error);
  }
};
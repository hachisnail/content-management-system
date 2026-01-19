import * as UserService from '../services/user.service.js';

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // CHANGED: Use String comparison instead of parseInt
    // Check if user is updating themselves OR is an admin
    const isSelf = String(req.user.id) === String(id);
    const isAdmin =
      req.user.role.includes('admin') || req.user.role.includes('super_admin');

    if (!isSelf && !isAdmin) {
      return res
        .status(403)
        .json({
          success: false,
          message: 'Forbidden: You can only update your own profile.',
        });
    }

    const updatedUser = await UserService.updateUser(
      id,
      req.body,
      req.user.email,
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// ... (rest of the file remains the same as previous step) ...
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

export const createUser = async (req, res, next) => {
  try {
    const { email, firstName, lastName, middleName, roles } = req.body;
    const initiatorEmail = req.user.email;

    const user = await UserService.createUser({
      email,
      firstName,
      lastName,
      middleName,
      roles,
      initiatorEmail,
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

export const getAllUsers = async (req, res, next) => {
  try {
    const { count, rows } = await UserService.findAll(req.query);

    const TIMEOUT = 12 * 60 * 60 * 1000;
    const now = Date.now();

    const safeUsers = rows.map((u) => {
      const user = u.toJSON();
      
      // 1. Online Status Check
      if (user.isOnline && user.last_active) {
        const lastActiveTime = new Date(user.last_active).getTime();
        if (now - lastActiveTime > TIMEOUT) {
          user.isOnline = false;
        }
      }

      // 2. FIX: Flatten profilePicture Array -> Object
      // The frontend expects user.profilePicture to be a single object, not an array.
      if (Array.isArray(user.profilePicture)) {
        user.profilePicture = user.profilePicture.length > 0 ? user.profilePicture[0] : null;
      }

      return user;
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const totalPages = Math.ceil(count / limit);

    res.json({
      data: safeUsers,
      meta: {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const userInstance = await UserService.findById(req.params.id);
    if (!userInstance) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // FIX: Handle Single User Fetch too
    const user = userInstance.toJSON();
    if (Array.isArray(user.profilePicture)) {
        user.profilePicture = user.profilePicture.length > 0 ? user.profilePicture[0] : null;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const revokeUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UserService.deleteUser(id, req.user.email);
    res.json({ success: true, message: 'Invitation revoked.' });
  } catch (error) {
    next(error);
  }
};

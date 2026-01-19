import passport from 'passport';
import { handleNewLogin } from '../services/session.service.js';
import { logOperation } from '../services/logger.js';
import { db } from '../models/index.js';
import * as UserService from '../services/user.service.js'; // Import User Service

export const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: info.message });

    req.logIn(user, async (err) => {
      if (err) return next(err);

      try {
        await handleNewLogin(user);

        await logOperation({
          operation: 'LOGIN',
          description: `User ${user.email} logged in.`,
          affectedResource: 'users',
          afterState: { id: user.id, email: user.email },
          initiator: user.email, 
        });

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: { id: user.id, email: user.email, role: user.role },
        });
      } catch (error) {
        return next(error);
      }
    });
  })(req, res, next);
};

export const logout = (req, res, next) => {
  const user = req.user;
  if (!user) {
      res.clearCookie('user_sid');
      return res.status(200).json({ message: 'Session already expired, logged out.' });
  }

  const userEmail = user.email;
  const userId = user.id;

  req.logout(async (err) => {
    if (err) return next(err);
    
    try {
      const fullUser = await db.User.findByPk(userId);
      if (fullUser) {
        fullUser.isOnline = false;
        fullUser.socketId = [];
        await fullUser.save(); 
      }

      await logOperation({
          operation: 'LOGOUT', 
          description: `User ${userEmail} logged out.`,
          affectedResource: 'users',
          afterState: { id: userId, email: userEmail },
          initiator: userEmail, 
      });

      req.session.destroy(() => {
        res.clearCookie('user_sid');
        res.status(200).json({ success: true, message: 'Logged out' });
      });
    } catch (error) {
      return next(error);
    }
  });
};

export const checkAuth = (req, res) => {
  if (req.isAuthenticated()) {
    const safeUser = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
    res.json({ isAuthenticated: true, user: safeUser });
  } else {
    res.status(401).json({ isAuthenticated: false });
  }
};

// --- SETUP ROUTES ---
export const getSetupStatus = async (req, res, next) => {
  try {
    const isSetup = await UserService.isSystemSetup();
    // If system is setup (users exist), then setup is NOT required.
    // If count == 0, isSetupRequired = true
    res.json({ isSetupRequired: !isSetup });
  } catch (error) {
    next(error);
  }
};

export const setupAdmin = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Create the admin (Service throws error if users already exist)
    const user = await UserService.createFirstAdmin({ email, password, firstName, lastName });

    res.json({
      success: true,
      message: 'System Setup Complete. You may now login.',
      user
    });
  } catch (error) {
    // Return 403 Forbidden if setup is blocked
    if (error.message.includes('forbidden')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
};
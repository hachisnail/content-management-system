import passport from 'passport';
import { handleNewLogin } from '../services/session.service.js';
import { logOperation } from '../services/logger.js';
import { db } from '../models/index.js';


export const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: info.message });

    req.logIn(user, async (err) => {
      if (err) return next(err);

      try {
        // This function updates the DB (last_login), which triggers the NEW User Hook
        await handleNewLogin(user);

        // This function creates a DB entry, which triggers the Audit Log Hook
        await logOperation({
          operation: 'LOGIN',
          description: `User ${user.email} logged in.`,
          affectedResource: 'users',
          afterState: { id: user.id, email: user.email },
          initiator: user.email, 
        });

        // REMOVED: Manual io.emit('users_updated') 
        // The db.User.afterUpdate hook handles it now.

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: { id: user.id, email: user.email, role: user.role }
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
        
        // Saving triggers the NEW User Hook (emitUserUpdate)
        await fullUser.save(); 
      }

      await logOperation({
          operation: 'LOGOUT', 
          description: `User ${userEmail} logged out.`,
          affectedResource: 'users',
          afterState: { id: userId, email: userEmail },
          initiator: userEmail, 
      });

      // REMOVED: Manual io.emit('users_updated')

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
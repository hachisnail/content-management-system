import { User } from '../models/index.js';

export const updateLastActive = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) return next();

    const now = new Date();
    const lastActive = req.user.lastActiveAt ? new Date(req.user.lastActiveAt) : new Date(0);
    const timeDiff = now - lastActive; 
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (timeDiff > FIVE_MINUTES) {
      await User.update(
        { lastActiveAt: now },
        { 
          where: { id: req.user.id }, 
          silent: true, 
          hooks: false  
        } 
      );
    }
  } catch (err) {
    // Non-blocking error handling
    console.error('Activity track fail:', err.message);
  }
  next();
};
import { User } from '../models/index.js';

export const updateLastActive = async (req, res, next) => {
  try {
    // 1. Safety Checks
    if (!req.user || !req.user.id) return next();

    // 2. Throttling: Only update if 5 minutes have passed
    const now = new Date();
    const lastActive = req.user.lastActiveAt ? new Date(req.user.lastActiveAt) : new Date(0);
    const timeDiff = now - lastActive; // in milliseconds
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (timeDiff > FIVE_MINUTES) {
      // 3. Silent Update (No Hooks = No Socket Event)
      await User.update(
        { lastActiveAt: now },
        { 
          where: { id: req.user.id }, 
          silent: true,  // Don't update 'updatedAt'
          hooks: false   // CRITICAL: Don't trigger 'afterUpdate' socket hooks
        } 
      );
    }
  } catch (err) {
    // Non-blocking error handling
    console.error('Activity track fail:', err.message);
  }
  next();
};
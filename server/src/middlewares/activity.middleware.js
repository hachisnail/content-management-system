import { db } from '../models/index.js';


export const updateUserActivity = async (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    try {
      const THRESHOLD = 60 * 1000; // 1 minute
      const lastActive = new Date(req.user.last_active).getTime();
      const now = Date.now();

      if (now - lastActive > THRESHOLD) {
         const user = await db.User.findByPk(req.user.id);
         if (user) {
           user.last_active = new Date();
           await user.save();
           // Update req.user so next middleware sees fresh data
           req.user.last_active = user.last_active; 
         }
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }
  next();
};
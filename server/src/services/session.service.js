import { db } from '../models/index.js';
import { getIO } from '../socket-store.js';
// ADD THIS IMPORT
import { logOperation } from './logger.js'; 

export const handleNewLogin = async (user) => {
  try {
    const io = getIO();
    const fullUser = await db.User.findByPk(user.id);

    // Check if there is an existing session to kick
    if (fullUser.socketId && fullUser.socketId.length > 0) {
      
      // 1. Notify the old device
      io.to(`user:${user.id}`).emit('force_logout', { 
        message: 'You have been logged out because you logged in from another device.' 
      });

      // 2. LOG THE REVOCATION (Single Instance Logout)
      await logOperation({
        operation: 'LOGOUT', 
        description: `Previous session revoked due to new login on device/browser.`,
        affectedResource: 'users',
        afterState: { id: user.id, email: user.email },
        initiator: user.email // The user themselves initiated this by logging in again
      });
    }

    fullUser.isOnline = true;
    fullUser.last_active = new Date();
    await fullUser.save();
  } catch (error) {
    console.error('Error handling new session:', error);
  }
};
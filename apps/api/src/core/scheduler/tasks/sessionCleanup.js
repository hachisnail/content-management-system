import {User} from '../../../models/index.js';
import { Op } from 'sequelize';
import { trackSystemActivity } from '../../../utils/audit.js'; // [FIX] Import standard tracker

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000 + (5 * 60 * 1000); 

export const cleanupExpiredSessions = async () => {
  try {
    const cutoffDate = new Date(Date.now() - SESSION_TIMEOUT_MS);

    const staleUsers = await User.findAll({
      where: {
        isOnline: true,
        lastActiveAt: { [Op.lt]: cutoffDate }
      },
      attributes: ['id', 'email', 'currentSessionId', 'lastActiveAt'] 
    });

    if (staleUsers.length === 0) return;

    const promises = staleUsers.map(async (user) => {
      await user.update({ isOnline: false, currentSessionId: null });

      trackSystemActivity(
        'SESSION_EXPIRED', 
        'auth', 
        {
          reason: 'Inactivity timeout (Auto-cleanup)',
          lastActive: user.lastActiveAt,
          targetId: user.id
        },
        user.id 
      );
    });

    await Promise.all(promises);
    
    if (process.env.NODE_ENV !== 'test') {
       console.log(`[CRON] Cleaned ${staleUsers.length} sessions.`);
    }

  } catch (error) {
    console.error('[CRON] Session cleanup failed:', error);
  }
};
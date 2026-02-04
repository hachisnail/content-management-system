import { PresenceAdapter } from './PresenceAdapter.js';
import { User } from '../../models/index.js';

export class MemoryPresenceAdapter extends PresenceAdapter {
  constructor() {
    super();
    this.timeouts = new Map();
    this.lastWrite = new Map(); 
    this.WRITE_THROTTLE_MS = 60 * 1000; 
    this.OFFLINE_DELAY_MS = 5000;
  }

  async userConnected(userId) {
    // 1. Cancel any pending "Offline" write
    if (this.timeouts.has(userId)) {
      clearTimeout(this.timeouts.get(userId));
      this.timeouts.delete(userId);
    }

    // 2. Throttle DB Writes: Only write to DB if we haven't written recently
    const now = Date.now();
    const lastWriteTime = this.lastWrite.get(userId) || 0;

    if (now - lastWriteTime > this.WRITE_THROTTLE_MS) {
      this.lastWrite.set(userId, now);
      this._updateUserStatus(userId, true);
    }
  }

  async userDisconnected(userId) {
    // Prevent duplicate timeouts
    if (this.timeouts.has(userId)) return;

    // Schedule Offline Write
    const timeout = setTimeout(() => {
      this.timeouts.delete(userId);
      this.lastWrite.delete(userId); 

      // [FIX] Use the unified helper method
      this._updateUserStatus(userId, false);
    }, this.OFFLINE_DELAY_MS);

    this.timeouts.set(userId, timeout);
  }

  /**
   * Helper to perform efficient bulk update and trigger socket events
   */
  async _updateUserStatus(userId, isOnline) {
    try {
      await User.update({
        isOnline: isOnline,
        lastActiveAt: new Date()
      }, {
        where: { id: userId }
      });
    } catch (err) {
      console.error(`Failed to update user status for ${userId}:`, err);
    }
  }

  async getOnlineUsers() {
    return []; 
  }
}
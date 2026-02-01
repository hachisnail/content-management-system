export const updateLastActive = async (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    const now = new Date();
    const lastActive = req.user.lastActiveAt ? new Date(req.user.lastActiveAt) : new Date(0);
    const diffMinutes = (now - lastActive) / 1000 / 60;

    // [FIX] Throttle reduced from 5 mins to 1 min
    // This provides "fresher" data for the frontend "Last Active" timer
    // without overloading the DB on every single request.
    if (diffMinutes >= 1) {
      // Use update() which triggers the 'afterUpdate' instance hook in socketHooks.js
      req.user.update({ lastActiveAt: now }).catch(err => {
          console.warn('Failed to update lastActiveAt', err.message);
      });
    }
  }
  next();
};
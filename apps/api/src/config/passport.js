import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { userService } from '../services/userService.js'; 
import { comparePassword } from '../utils/auth.js';

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await userService.findByEmail(email);
      
      if (!user) {
        return done(null, false, { message: 'Incorrect email/password.' });
      }

      // Security: Prevent disabled/banned users from logging in
      if (!user.isActive || user.status === 'disabled' || user.status === 'banned') {
        return done(null, false, { message: 'Account is disabled. Please contact support.' });
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect email/password.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

// [FIX] Strict Session Validation
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userService.findById(id);
    
    // 1. Check if user still exists
    if (!user) return done(null, null);

    // 2. Check if account is active
    // If Admin disabled the user, this will immediately invalidate their session
    if (!user.isActive || user.status === 'disabled' || user.status === 'banned') {
        return done(null, null); 
    }

    // 3. Check if session was terminated (Force Logout)
    // When Admin clicks "Force Disconnect", currentSessionId becomes null.
    // We check this against the persistence layer.
    if (!user.currentSessionId && user.isOnline === false) {
        return done(null, null); // Reject request -> Triggers 401 on frontend
    }

    done(null, user);
  } catch (err) {
    done(null, null);
  }
});

export default passport;
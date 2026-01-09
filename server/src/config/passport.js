import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { db } from '../models/index.js';

export const initializePassport = (passport) => {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' }, 
      async (email, password, done) => {
        try {
          // Select only needed fields for login check
          const user = await db.User.findOne({ 
            where: { email },
            attributes: ['id', 'email', 'password', 'role', 'status', 'firstName', 'lastName'] 
          });

          if (!user) {
            return done(null, false, { message: 'Incorrect email/password.' });
          }

          if (user.status === 'disabled') {
            return done(null, false, { message: 'Account is disabled. Please contact the administrator.' });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: 'Incorrect email/password.' });
          }

          return done(null, user);
        } catch (err) {
          console.error('[Passport] Login Strategy Error:', err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // --- FIX: OPTIMIZED DESERIALIZER ---
  passport.deserializeUser(async (id, done) => {
    try {
      // 1. Fetch ONLY essential session data
      // avoiding 'socketId' or other heavy columns reduces packet size/memory usage
      const user = await db.User.findByPk(id, {
        attributes: ['id', 'email', 'role', 'status', 'firstName', 'lastName', 'last_active']
      });

      // 2. Handle "User Not Found" (Deleted while logged in)
      if (!user) {
        return done(null, null); // Logs the user out cleanly
      }

      // 3. Security Check: Force logout if disabled
      if (user.status === 'disabled') {
        return done(null, null); 
      }
      
      const cleanUser = user.toJSON();
      done(null, cleanUser);

    } catch (err) {
      // 4. Log the ACTUAL error message to console
      console.error('[Passport] Deserialization Error:', err.message);
      // Return null (logout) instead of crashing the server
      done(null, null);
    }
  });
};
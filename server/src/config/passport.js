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
          const user = await db.User.findOne({
            where: { email },
            attributes: [
              'id',
              'email',
              'password',
              'role',
              'status',
              'firstName',
              'lastName',
            ],
          });

          if (!user) {
            return done(null, false, { message: 'Incorrect email/password.' });
          }

          if (user.status === 'disabled') {
            return done(null, false, {
              message: 'Account is disabled. Please contact the administrator.',
            });
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
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.User.findByPk(id, {
        attributes: [
          'id',
          'email',
          'role',
          'status',
          'firstName',
          'lastName',
          'last_active',
        ],
      });

      if (!user) return done(null, null);
      if (user.status === 'disabled') return done(null, null);

      const cleanUser = user.toJSON();

      // --- FIX: FORCE ROLE PARSING ---
      // Ensure role is ALWAYS an array, even if DB returns a string
      if (typeof cleanUser.role === 'string') {
        try {
          cleanUser.role = JSON.parse(cleanUser.role);
        } catch (e) {
          cleanUser.role = [cleanUser.role]; // Fallback
        }
      }
      if (!Array.isArray(cleanUser.role)) {
        cleanUser.role = [];
      }
      // -------------------------------

      done(null, cleanUser);
    } catch (err) {
      console.error('[Passport] Deserialization Error:', err.message);
      done(null, null);
    }
  });
};

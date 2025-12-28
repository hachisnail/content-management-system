import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { db } from '../models/index.js'; // Your Sequelize models

export const initializePassport = (passport) => {
  // 1. Define the "Local" Strategy (Email/Password)
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' }, // We use email, not username
      async (email, password, done) => {
        try {
          // Find user in MariaDB
          const user = await db.User.findOne({ where: { email } });

          if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
          }

          // Check Password
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: 'Incorrect password.' });
          }

          // Success! Return the user
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // 2. Serialize: What data to store in the Session (just the ID to keep it lite)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // 3. Deserialize: How to retrieve the full user from the ID in the session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.User.findByPk(id);
      // Optional: Remove sensitive fields like password before attaching to req.user
      const cleanUser = user ? user.toJSON() : null;
      if(cleanUser) delete cleanUser.password;
      
      done(null, cleanUser);
    } catch (err) {
      done(err, null);
    }
  });
};
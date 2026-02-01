import session from 'express-session';
import SequelizeStoreConstructor from 'connect-session-sequelize';
import sequelize from './db.js';
import { config } from './env.js';

const SequelizeStore = SequelizeStoreConstructor(session.Store);

const store = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions', 
});

// Sync the session table immediately
store.sync();

export const sessionConfig = session({
  name: 'sid', // <--- We name the cookie 'sid' here
  secret: config.jwtSecret,
  store: store,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production', // true required if https
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 Day
  }
});
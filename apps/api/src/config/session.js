import session from 'express-session';
import SequelizeStoreConstructor from 'connect-session-sequelize';
import sequelize from './db.js';
import { config } from './env.js';

const SequelizeStore = SequelizeStoreConstructor(session.Store);

const store = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions', 
});

store.sync();

export const sessionConfig = session({
  name: 'sid', 
  secret: config.sessionSecret,
  store: store,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production', 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 
  }
});
import session from 'express-session';
import MySQLStore from 'express-mysql-session';
import { config } from './env.js';
import { dbConfig } from './database.js';

// 1. Initialize the Store Factory
// Pass the 'session' object to the library so it inherits correctly
const StoreFactory = MySQLStore(session);

// 2. Configure the Store
const sessionStore = new StoreFactory({
  host: dbConfig.host,
  port: 3306, // Ensure this matches your MariaDB port
  user: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  createDatabaseTable: true, // Automatically creates the 'sessions' table
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
});

// 3. Create the Configuration Object
// This consolidates your previous two objects into one complete config
export const sessionConfig = {
  key: 'user_sid',
  secret: config.session.secret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false, // Helps with login logic (only save if modified/logged in)
  cookie: {
    secure: config.app.env === 'production', // true if using HTTPS
    httpOnly: true, // Security: JS cannot read this cookie
    maxAge: 1000 * 60 * 60 * 24, // 1 Day
    sameSite: 'lax' // Helps with CSRF
  }
};

// 4. Export the Middleware
// This is what you will use in your server.js or socket.js
export const sessionMiddleware = session(sessionConfig);
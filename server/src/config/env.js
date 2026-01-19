import 'dotenv/config'; 

const requireEnv = (name) => {
  if (process.env[name] === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return process.env[name];
};

export const config = {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    version: '0.5.1',
  },
  db: {
    name: requireEnv('DB_NAME'),
    user: requireEnv('DB_USER'),
    pass: requireEnv('DB_PASS'),
    host: requireEnv('DB_HOST'),
    dialect: 'mariadb',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'a-default-session-secret-for-development',
  },
  mail: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
cors: {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:5173'], 
},

};
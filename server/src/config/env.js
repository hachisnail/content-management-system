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
  },
  db: {
    name: requireEnv('DB_NAME'),
    user: requireEnv('DB_USER'),
    pass: requireEnv('DB_PASS'),
    host: requireEnv('DB_HOST'),
    dialect: 'mariadb', 
  },
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: '7d',
  },
};
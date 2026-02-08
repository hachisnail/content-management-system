import 'dotenv/config';
import * as yup from 'yup';

const envSchema = yup.object({
  // --- Server ---
  NODE_ENV: yup.string()
    .oneOf(['development', 'production', 'test'])
    .default('development'),
  PORT: yup.number().default(3000),

  // --- Database (MariaDB) ---
  DB_HOST: yup.string().required('DB_HOST is required'),
  DB_USER: yup.string().required('DB_USER is required'),
  DB_PASSWORD: yup.string().default(''),
  DB_NAME: yup.string().required('DB_NAME is required'),
  DB_PORT: yup.number().default(3306),

  // --- Security ---
  SESSION_SECRET: yup.string()
    .min(32, 'SESSION_SECRET should be at least 32 chars long')
    .required('SESSION_SECRET is required'),
  
  BCRYPT_SALT_ROUNDS: yup.number().default(10),
  SECURITY_PEPPER: yup.string().default('default-secret-pepper-change-me-in-prod'),

  PRESENCE_ADAPTER: yup.string()
    .oneOf(['memory', 'redis'], 'PRESENCE_ADAPTER must be either "memory" or "redis"')
    .default('memory'),

  STORAGE_DRIVER: yup.string()
    .default('memory'), 

  MAX_UPLOAD_SIZE: yup.number().default(5242880),
  
  // --- CORS & Independent Origins ---
  CORS_ORIGINS: yup.string().default(''), 
  
  WEB_ORIGIN: yup.string().required('WEB_ORIGIN is required (e.g. http://localhost:5173)'),
  PORTAL_ORIGIN: yup.string().required('PORTAL_ORIGIN is required (e.g. http://localhost:3001)'),
  LANDING_ORIGIN: yup.string().required('LANDING_ORIGIN is required (e.g. http://localhost:4321)'),

  SMTP_HOST: yup.string().required('SMTP_HOST is required'),
  SMTP_PORT: yup.number().default(587),
  SMTP_USER: yup.string().required('SMTP_USER is required'),
  SMTP_PASS: yup.string().required('SMTP_PASS is required'),
  SMTP_FROM: yup.string().default('"Museum CMS" <no-reply@example.com>'),
});

let envConfig;

try {
  envConfig = envSchema.validateSync(process.env, { 
    abortEarly: false, 
    stripUnknown: true 
  });
} catch (error) {
  console.error('Invalid Environment Variables:');
  error.inner.forEach((err) => {
    console.error(`   - ${err.path}: ${err.message}`);
  });
  process.exit(1); 
}

const getUniqueOrigins = () => {
  const extras = envConfig.CORS_ORIGINS.split(',').filter(Boolean);
  const defaults = [
    envConfig.WEB_ORIGIN,
    envConfig.PORTAL_ORIGIN,
    envConfig.LANDING_ORIGIN
  ];
  return [...new Set([...defaults, ...extras])];
};

export const config = {
  env: envConfig.NODE_ENV,
  port: envConfig.PORT,
  db: {
    host: envConfig.DB_HOST,
    user: envConfig.DB_USER,
    password: envConfig.DB_PASSWORD,
    name: envConfig.DB_NAME,
    port: envConfig.DB_PORT,
  },
  sessionSecret: envConfig.SESSION_SECRET,
  
  bcryptSaltRounds: envConfig.BCRYPT_SALT_ROUNDS,
  securityPepper: envConfig.SECURITY_PEPPER,

  presenceAdapter: envConfig.PRESENCE_ADAPTER,
  storageDriver: envConfig.STORAGE_DRIVER,
  
  corsOrigins: getUniqueOrigins(),
  
  webOrigin: envConfig.WEB_ORIGIN,
  portalOrigin: envConfig.PORTAL_ORIGIN,
  landingOrigin: envConfig.LANDING_ORIGIN,
  
  maxUploadSize: envConfig.MAX_UPLOAD_SIZE,
  email: {
    host: envConfig.SMTP_HOST,
    port: envConfig.SMTP_PORT,
    user: envConfig.SMTP_USER,
    pass: envConfig.SMTP_PASS,
    from: envConfig.SMTP_FROM,
  }
};
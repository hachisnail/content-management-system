import 'dotenv/config';
import * as yup from 'yup';

// 1. Define the Schema for your Environment
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
  JWT_SECRET: yup.string()
    .min(32, 'JWT_SECRET should be at least 32 chars long')
    .required('JWT_SECRET is required'),

    MAX_UPLOAD_SIZE: yup.number().default(5242880),
  
  // --- CORS (Optional whitelist override) ---
  CORS_ORIGINS: yup.string().default('http://localhost:5173,http://localhost:3001,http://localhost:4321'),

  // --- Email (SMTP) ---
  SMTP_HOST: yup.string().required('SMTP_HOST is required'),
  SMTP_PORT: yup.number().default(587),
  SMTP_USER: yup.string().required('SMTP_USER is required'),
  SMTP_PASS: yup.string().required('SMTP_PASS is required'),
  SMTP_FROM: yup.string().default('"Museum CMS" <no-reply@example.com>'),
});

// 2. Validate process.env
let envConfig;

try {
  // strict: true ensures we don't accidentally ignore extra fields if we care, 
  // but for env vars, we usually just want to check presence.
  envConfig = envSchema.validateSync(process.env, { 
    abortEarly: false, // Show ALL missing vars, not just the first one
    stripUnknown: true // Remove system env vars (like PATH) from our config object
  });
} catch (error) {
  console.error('Invalid Environment Variables:');
  error.inner.forEach((err) => {
    console.error(`   - ${err.path}: ${err.message}`);
  });
  process.exit(1); // Kill the server immediately
}

// 3. Export the clean config
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
  jwtSecret: envConfig.JWT_SECRET,
  corsOrigins: envConfig.CORS_ORIGINS.split(','),
  maxUploadSize: envConfig.MAX_UPLOAD_SIZE,
  email: {
    host: envConfig.SMTP_HOST,
    port: envConfig.SMTP_PORT,
    user: envConfig.SMTP_USER,
    pass: envConfig.SMTP_PASS,
    from: envConfig.SMTP_FROM,
  }
};
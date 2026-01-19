import express from 'express';
import passport from 'passport';
import cors from 'cors'; 
import helmet from 'helmet';

import { corsOptions } from './config/cors.js'; 

import { sessionMiddleware } from './config/session.js'; 
import { initializePassport } from './config/passport.js';
import { routes } from './routes/index.js';
import { updateUserActivity } from './middlewares/activity.middleware.js';

const app = express();

// --- Middleware ---

// 1. SECURITY: Apply Helmet for HTTP Headers
// This sets X-Content-Type-Options, X-Frame-Options, etc.
app.use(helmet({
  crossOriginResourcePolicy: false 
}));

// 2. Apply Centralized CORS Config
app.use(cors(corsOptions)); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session & Auth ---
app.use(sessionMiddleware); 
initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// 3. Update user activity timestamp
app.use(updateUserActivity);

// --- Routes ---
app.use('/api', routes);

export { app };
import express from 'express';
import passport from 'passport';
import cors from 'cors';

// Import the SHARED middleware, not just the config object
import { sessionMiddleware } from './config/session.js'; 
import { initializePassport } from './config/passport.js';
import routes from './routes/index.js';

const app = express();

// --- Middleware ---
// Ensure this origin matches your frontend exactly
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session & Auth ---
// 1. Use the shared session middleware (Same instance used in server.js)
app.use(sessionMiddleware); 

// 2. Initialize Passport (Auth Strategy)
initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// --- Routes ---
app.use('/api', routes); // I removed the trailing slash for cleaner URLs

export { app };
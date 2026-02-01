// api/src/app.js
import express from 'express';
import compression from 'compression'; 
import rateLimit from 'express-rate-limit'
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express'; 
import { swaggerSpec } from './config/swagger.js'; 
import routes from './routes/index.js'; 
import { errorHandler } from './middleware/errorHandler.js';
import { corsOptions } from './config/cors.js'; 
import { updateLastActive } from './middleware/activityTracker.js';
import passport from 'passport'; 
import './config/passport.js';   
import { sessionConfig } from './config/session.js'; 

const app = express();


app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

app.use(compression());
app.use(cors(corsOptions)); 

app.options(/.*/, cors(corsOptions));

app.use(morgan('dev')); 
app.use(express.json()); 

app.use(sessionConfig);      
app.use(passport.initialize()); 
app.use(passport.session());    

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 400, 
  message: 'Too many requests from this IP, please try again later.'
});

app.use(updateLastActive);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', limiter, routes);

app.use(errorHandler);

export default app;
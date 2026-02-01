import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Museo Bulawan CMS API',
      version: '1.0.0',
      description: 'API Documentation for the Museo Bulawan Content Management System',
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Local Server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sid', 
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  // Path to files containing documentation
  apis: ['./src/routes/*.js'], 
};

export const swaggerSpec = swaggerJsdoc(options);
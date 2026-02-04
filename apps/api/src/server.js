import { createServer } from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { testConnection } from './config/db.js';
import { syncDatabase } from './models/index.js';
import { corsOptions } from './config/cors.js';
import { initSocket } from './core/socket/SocketManager.js';
import { initCronJobs } from './core/scheduler/index.js';

const startServer = async () => {
  process.setMaxListeners(20);

  await testConnection();
  await syncDatabase();

  const httpServer = createServer(app);

  initSocket(httpServer, corsOptions);
  initCronJobs();

  httpServer.listen(config.port, () => {
    console.log(`API & Socket running in ${config.env} mode on port ${config.port}`);
  });
};

startServer();
import { createServer } from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { testConnection } from './config/db.js';
import { syncDatabase } from './models/index.js';
import { corsOptions } from './config/cors.js';
import { initSocket } from './services/socket.js'; // <--- Import

const startServer = async () => {
  await testConnection();
  await syncDatabase();

  const httpServer = createServer(app);

  initSocket(httpServer, corsOptions);

  httpServer.listen(config.port, () => {
    console.log(`API & Socket running in ${config.env} mode on port ${config.port}`);
  });
};

startServer();
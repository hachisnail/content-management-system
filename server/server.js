import 'dotenv/config';
import http from 'http';
import { app } from './src/app.js';
import { db } from './src/models/index.js';
import { initSocket } from './src/socket.js';
import { sessionMiddleware } from './src/config/session.js'; 

const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);

initSocket(httpServer, sessionMiddleware);

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected.');
    // await db.sequelize.sync({ force: true });
    await db.sequelize.sync({ alter: true });

    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
};

startServer();
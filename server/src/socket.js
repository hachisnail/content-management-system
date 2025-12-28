import { Server } from 'socket.io';
import passport from 'passport';

let io;

export const initSocket = (httpServer, sessionMiddleware) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.engine.use(sessionMiddleware);
  io.engine.use(passport.initialize());
  io.engine.use(passport.session());

  io.use((socket, next) => {
    if (socket.request.user) {
      socket.user = socket.request.user;
      next();
    } else {
      next(new Error("Unauthorized"));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.email}`);
    
    socket.on('join_resource', (room) => socket.join(room));
    socket.on('leave_resource', (room) => socket.leave(room));
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
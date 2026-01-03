import { Server } from 'socket.io';
import passport from 'passport';
import { db } from './models/index.js';
import { setIO, getIO } from './socket-store.js'; 
import { logOperation } from './services/logger.js'; 
import { config } from './config/env.js';
import { corsOptions } from './config/cors.js';

/**
 * HELPER: Unified Logging
 * 1. Logs to console (in development)
 * 2. Broadcasts to 'server_logs' room (for Admin Dashboard streaming)
 */
const logInfo = (message, ...args) => {
  // 1. Console Output (Dev only)
  if (config.app.env !== 'production') {
    console.log(`[Socket] ${message}`, ...args);
  }

  // 2. Broadcast to Admins (Stream)
  try {
    const io = getIO();
    if (io) {
      // Create a formatted string for the dashboard
      const payload = args.length > 0 
        ? `${message} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`
        : message;

      io.to('server_logs').emit('server_log', { 
        message: payload,
        timestamp: new Date()
      });
    }
  } catch (e) {
    // Ignore broadcast errors during startup (when IO isn't ready yet)
  }
};

export const initSocket = (httpServer, sessionMiddleware) => {
  const io = new Server(httpServer, {
    cors: corsOptions
  });

  // Pass the instance to the Store immediately
  setIO(io);

  // Middleware Setup
  io.engine.use(sessionMiddleware);
  io.engine.use(passport.initialize());
  io.engine.use(passport.session());

  // Authentication Middleware
  io.use((socket, next) => {
    if (socket.request.user) {
      socket.user = socket.request.user;
      socket.isGuest = false;
    } else {
      socket.isGuest = true;
    }
    next();
  });

  // Main Connection Handler
  io.on('connection', async (socket) => {
    
    // ============================================================
    // 0. RATE LIMITING MIDDLEWARE (Safety Layer)
    // ============================================================
    // Allow max 10 events per second per socket
    const RATE_LIMIT = 10; 
    const RATE_WINDOW_MS = 1000; 
    
    const rateLimiter = {
      count: 0,
      lastReset: Date.now()
    };

    socket.use(([event, ...args], next) => {
      const now = Date.now();
      
      if (now - rateLimiter.lastReset > RATE_WINDOW_MS) {
        rateLimiter.count = 0;
        rateLimiter.lastReset = now;
      }

      if (rateLimiter.count >= RATE_LIMIT) {
        if (config.app.env !== 'production') {
           console.warn(`[RateLimit] Socket ${socket.id} throttled. Event: ${event}`);
        }
        return next(new Error('Rate limit exceeded. Please slow down.'));
      }

      rateLimiter.count++;
      next();
    });

    // ============================================================
    // 1. CONNECTION & SESSION LOGIC
    // ============================================================
    if (socket.isGuest) {
      logInfo(`Guest connected: ${socket.id}`);
    } else {
      logInfo(`User connected: ${socket.user.email}`);
      
      try {
        const user = await db.User.findByPk(socket.user.id);
        if (user) {
          // A. Enforce Single Session
          if (user.socketId && user.socketId.length > 0) {
            io.to(`user:${user.id}`).emit('force_logout', { 
              message: 'You have been logged out because you logged in from another device.' 
            });

            await logOperation({
                operation: 'LOGOUT',
                description: 'Concurrent socket connection revoked previous session.',
                affectedResource: 'users',
                afterState: { id: user.id },
                initiator: user.email
            });
          }

          // B. Register Socket
          user.socketId = [socket.id];
          user.isOnline = true;
          user.last_active = new Date();
          await user.save(); 

          // C. Join Rooms
          socket.join(`user:${user.id}`);
          socket.join(`role:${user.role}`);

          socket.emit('log', { message: 'Welcome!', user: user.email });
        }
      } catch (err) {
        console.error('Error handling user connection:', err);
      }
    }

    // ============================================================
    // 2. SECURE RESOURCE SUBSCRIPTION
    // ============================================================
    socket.on('subscribe_resource', (resourceName) => {
      const canAccess = (resource) => {
        const userRole = socket.user ? socket.user.role : 'guest';
        
        switch (resource) {
          // Public
          case 'donations': 
            return true; 
          
          // Authenticated
          case 'museum_events':
          case 'inventory': 
            return !socket.isGuest;

          // Admin Only (Includes server_logs for streaming)
          case 'server_logs':
          case 'users':           
          case 'audit_logs':      
          case 'reports':
            return ['super_admin', 'admin'].includes(userRole);

          default:
            return false;
        }
      };

      if (canAccess(resourceName)) {
        socket.join(resourceName);
        
        // Prevent infinite logging loops if we are watching the log stream
        if (resourceName !== 'server_logs') {
            logInfo(`Socket ${socket.id} subscribed to ${resourceName}`);
        }
      } else {
        if (config.app.env !== 'production') {
           console.warn(`[Socket] Unauthorized subscription: ${socket.id} -> ${resourceName}`);
        }
        socket.emit('log', { message: 'Access Denied: Unauthorized resource.' });
      }
    });

    socket.on('unsubscribe_resource', (resourceName) => {
      socket.leave(resourceName);
    });

    // ============================================================
    // 3. DONATION LOGIC
    // ============================================================
    socket.on('create_donation', async (data) => {
      try {
        if (socket.isGuest) {
          socket.emit('log', { message: 'Login required.' });
          return;
        }

        const { donorName, donorEmail, itemDescription, quantity } = data;
        
        if (!itemDescription || !quantity) {
          socket.emit('log', { message: 'Missing fields.' });
          return;
        }

        const donation = await db.Donation.create({
          donorName: donorName || socket.user.email,
          donorEmail: donorEmail || socket.user.email,
          itemDescription,
          quantity
        });
        
        if (typeof logOperation === 'function') {
          await logOperation({
            operation: 'CREATE',
            description: `Donation created: ${itemDescription}`,
            affectedResource: 'donations',
            afterState: donation, 
            initiator: socket.user.email
          });
        }

      } catch (error) {
        console.error('Error creating donation:', error);
        socket.emit('log', { message: 'Error creating donation.' });
      }
    });

    // ============================================================
    // 4. ADMIN ACTIONS
    // ============================================================
    socket.on('force_disconnect_user', async ({ userId }) => {
      if (socket.user && socket.user.role === 'super_admin') {
        try {
          const targetUser = await db.User.findByPk(userId);
          if (targetUser) {
            // A. Notify Client
            io.to(`user:${targetUser.id}`).emit('force_logout', { 
              message: 'You have been disconnected by an administrator.' 
            });
            
            // B. Hard Disconnect
            const socketIds = targetUser.socketId || [];
            socketIds.forEach((socketId) => {
              const targetSocket = io.sockets.sockets.get(socketId);
              if (targetSocket) targetSocket.disconnect(true); 
            });

            // C. Update DB
            targetUser.isOnline = false;
            targetUser.socketId = [];
            await targetUser.save();
            
            // D. Log Operation
            await logOperation({
                operation: 'FORCE_LOGOUT',
                description: `Administrator ${socket.user.email} forced logout for user ${targetUser.email}.`,
                affectedResource: `user:${targetUser.id}`,
                afterState: { isOnline: false },
                initiator: socket.user.email
            });
          }
        } catch (error) {
          console.error('Error forcing user disconnect:', error);
        }
      } else {
        socket.emit('log', { message: 'Unauthorized action.' });
      }
    });

    // ============================================================
    // 5. DISCONNECT HANDLER
    // ============================================================
    socket.on('disconnect', async () => {
      if (!socket.isGuest) {
        try {
          const user = await db.User.findByPk(socket.user.id);
          if (user) {
            const currentSockets = user.socketId || [];
            user.socketId = currentSockets.filter(id => id !== socket.id);
            if (user.socketId.length === 0) user.isOnline = false;
            user.last_active = new Date();
            await user.save();
            
            logInfo(`User disconnected: ${user.email}`);
          }
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      } else {
         logInfo(`Guest disconnected: ${socket.id}`);
      }
    });
  });

  return io;
};
import { Server } from 'socket.io';
import passport from 'passport';
import { db } from './models/index.js';
import { setIO, getIO } from './socket-store.js'; 
import { logOperation } from './services/logger.js'; 
import { config } from './config/env.js';
import { corsOptions } from './config/cors.js';

// 1. IMPORT RBAC CONFIGURATION
import { ROLE_DEFINITIONS, PERMISSIONS } from './config/permissions.js';

/**
 * HELPER: Unified Logging
 */
const formatArg = (arg) => {
  if (arg instanceof Error) {
    return `[ERROR: ${arg.message}] ${arg.stack}`;
  }
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return '[Circular/Unserializable Object]';
    }
  }
  return arg;
};

const logInfo = (message, ...args) => {
  if (config.app.env !== 'production') {
    console.log(`[Socket] ${message}`, ...args);
  }

  try {
    const io = getIO();
    if (io) {
      const payload = args.length > 0 
        ? `${message} ${args.map(formatArg).join(' ')}`
        : message;

      io.to('server_logs').emit('server_log', { 
        type: 'info',
        message: payload,
        timestamp: new Date()
      });
    }
  } catch (e) { /* Ignore startup errors */ }
};

const logError = (message, ...args) => {
  console.error(`[Socket ERROR] ${message}`, ...args);

  try {
    const io = getIO();
    if (io) {
      const payload = args.length > 0 
        ? `${message} ${args.map(formatArg).join(' ')}`
        : message;

      io.to('server_logs').emit('server_log', { 
        type: 'error',
        message: payload,
        timestamp: new Date()
      });
    }
  } catch (e) { /* Ignore */ }
};

/**
 * HELPER: Check Permission Dynamic
 */
const hasPermission = (user, requiredPermission) => {
  if (!user || !user.role) return false;
  
  // Normalize roles to array (DB might return string or array)
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];

  // Check if ANY of the user's roles allow this permission
  return userRoles.some(role => {
    const allowedPermissions = ROLE_DEFINITIONS[role] || [];
    return allowedPermissions.includes(requiredPermission);
  });
};

/**
 * CONFIG: Resource Map
 * Maps a socket room/resource to a specific Permission Requirement.
 */
const RESOURCE_PERMISSIONS = {
  // Public (No permission required, handled separately)
  'donations': null, 

  // Basic Auth (Just needs to be logged in)
  'museum_events': 'AUTHENTICATED',
  'inventory': 'AUTHENTICATED',

  // RBAC Protected
  'users': PERMISSIONS.VIEW_MONITOR,         // "Monitor" page needs users stream
  'audit_logs': PERMISSIONS.VIEW_AUDIT_LOGS, // "Audit Logs" page
  'server_logs': PERMISSIONS.VIEW_SOCKET_TEST, // "Socket Test" page console
  'reports': PERMISSIONS.VIEW_ADMIN_TOOLS,   
};

export const initSocket = (httpServer, sessionMiddleware) => {
  const io = new Server(httpServer, {
    cors: corsOptions
  });

  setIO(io);

  io.engine.use(sessionMiddleware);
  io.engine.use(passport.initialize());
  io.engine.use(passport.session());

  io.use((socket, next) => {
    if (socket.request.user) {
      socket.user = socket.request.user;
      socket.isGuest = false;
    } else {
      socket.isGuest = true;
    }
    next();
  });

  io.on('connection', async (socket) => {
    
    // 0. RATE LIMITING
    const RATE_LIMIT = 10; 
    const RATE_WINDOW_MS = 1000; 
    const rateLimiter = { count: 0, lastReset: Date.now() };

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

    // 1. CONNECTION & SESSION LOGIC
    if (socket.isGuest) {
      logInfo(`Guest connected: ${socket.id}`);
    } else {
      logInfo(`User connected: ${socket.user.email}`);
      
      try {
        const user = await db.User.findByPk(socket.user.id);
        
        if (user) {
          const currentSessionId = socket.request.sessionID || socket.request.session?.id;
          
          let activeSockets = user.socketId || [];
          const socketsToKeep = [];

          activeSockets.forEach((oldSocketId) => {
             const oldSocket = io.sockets.sockets.get(oldSocketId);
             if (oldSocket) {
                 const oldSessionId = oldSocket.request.sessionID || oldSocket.request.session?.id;
                 
                 if (oldSessionId === currentSessionId) {
                     // Same session (new tab) -> Keep it
                     socketsToKeep.push(oldSocketId);
                 } else {
                     // Different session (new device) -> Kick it
                     oldSocket.emit('force_logout', { 
                         message: 'You have been logged out because you signed in on another device.' 
                     });
                     oldSocket.disconnect(true);
                     logInfo(`Kicked old session for ${user.email} (Socket: ${oldSocketId})`);
                 }
             }
          });

          socketsToKeep.push(socket.id);

          user.socketId = socketsToKeep;
          user.isOnline = true;
          user.last_active = new Date();
          await user.save();

          socket.join(`user:${user.id}`);
          
          // Join rooms for all roles (useful for role-based notifications)
          if (Array.isArray(user.role)) {
            user.role.forEach(r => socket.join(`role:${r}`));
          } else {
            socket.join(`role:${user.role}`);
          }
          
          socket.emit('log', { message: 'Welcome!', user: user.email });
        }
      } catch (err) {
        logError('Error handling user connection:', err);
      }
    }

    // ============================================================
    // 2. SECURE SUBSCRIPTION (RBAC INTEGRATED)
    // ============================================================
    socket.on('subscribe_resource', (resourceName) => {
      const requiredPerm = RESOURCE_PERMISSIONS[resourceName];

      let allowed = false;

      if (requiredPerm === null) {
        // Public Resource (e.g., Donations)
        allowed = true;
      } else if (requiredPerm === 'AUTHENTICATED') {
        // Basic Auth
        allowed = !socket.isGuest;
      } else if (requiredPerm) {
        // RBAC Check
        allowed = !socket.isGuest && hasPermission(socket.user, requiredPerm);
      } else {
        // Unknown Resource (Deny by default)
        allowed = false;
      }

      if (allowed) {
        socket.join(resourceName);
        // Don't log server_logs subscriptions to avoid infinite loops
        if (resourceName !== 'server_logs') {
            logInfo(`Socket ${socket.id} subscribed to ${resourceName}`);
        }
      } else {
        if (config.app.env !== 'production') {
           console.warn(`[Socket] Access Denied: ${socket.id} -> ${resourceName}`);
        }
        socket.emit('log', { message: 'Access Denied: Unauthorized resource.' });
      }
    });

    socket.on('unsubscribe_resource', (resourceName) => {
      socket.leave(resourceName);
      if (resourceName !== 'server_logs') {
        logInfo(`Socket ${socket.id} unsubscribed from ${resourceName}`);
      }
    });

    // 3. DONATIONS
    socket.on('create_donation', async (data) => {
      try {
        if (socket.isGuest) return socket.emit('log', { message: 'Login required.' });

        const { donorName, donorEmail, itemDescription, quantity } = data;
        if (!itemDescription || !quantity) return socket.emit('log', { message: 'Missing fields.' });

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
        logError('Error creating donation:', error);
        socket.emit('log', { message: 'Error creating donation.' });
      }
    });

    // ============================================================
    // 4. ADMIN ACTIONS (RBAC INTEGRATED)
    // ============================================================
    socket.on('force_disconnect_user', async ({ userId }) => {
      // DYNAMIC CHECK: Does the user have the 'disconnect_users' permission?
      if (!socket.isGuest && hasPermission(socket.user, PERMISSIONS.DISCONNECT_USERS)) {
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
            
            // D. Log
            await logOperation({
                operation: 'FORCE_LOGOUT',
                description: `Administrator ${socket.user.email} forced logout for user ${targetUser.email}.`,
                affectedResource: `user:${targetUser.id}`,
                afterState: { isOnline: false },
                initiator: socket.user.email
            });
          }
        } catch (error) {
          logError('Error forcing user disconnect:', error);
        }
      } else {
        socket.emit('log', { message: 'Unauthorized action.' });
      }
    });

    // 5. DISCONNECT
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
          logError('Disconnect error:', error);
        }
      } else {
         logInfo(`Guest disconnected: ${socket.id}`);
      }
    });

  });

  return io;
};
import { Server } from 'socket.io';
import passport from 'passport';
import { db } from './models/index.js';
import { setIO, getIO } from './socket-store.js';
import { logOperation } from './services/logger.js';
import { config } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { ROLE_DEFINITIONS, PERMISSIONS } from './config/permissions.js';

const formatArg = (arg) => {
  if (arg instanceof Error) return `[ERROR: ${arg.message}] ${arg.stack}`;
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg);
    } catch {
      return '[Object]';
    }
  }
  return arg;
};

const logInfo = (message, ...args) => {
  if (config.app.env !== 'production')
    console.log(`[Socket] ${message}`, ...args);
  try {
    const io = getIO();
    if (io)
      io.to('server_logs').emit('server_log', {
        type: 'info',
        message: args.length
          ? `${message} ${args.map(formatArg).join(' ')}`
          : message,
        timestamp: new Date(),
      });
  } catch (e) {}
};

const logError = (message, ...args) => {
  console.error(`[Socket ERROR] ${message}`, ...args);
  try {
    const io = getIO();
    if (io)
      io.to('server_logs').emit('server_log', {
        type: 'error',
        message: args.length
          ? `${message} ${args.map(formatArg).join(' ')}`
          : message,
        timestamp: new Date(),
      });
  } catch (e) {}
};

const hasPermission = (user, requiredPermission) => {
  if (!user || !user.role) return false;
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  return userRoles.some((role) => {
    const allowedPermissions = ROLE_DEFINITIONS[role] || [];
    return allowedPermissions.includes(requiredPermission);
  });
};

const RESOURCE_PERMISSIONS = {
  donations: null,
  museum_events: 'AUTHENTICATED',
  inventory: 'AUTHENTICATED',
  users: 'AUTHENTICATED',
  audit_logs: PERMISSIONS.VIEW_AUDIT_LOGS,
  server_logs: PERMISSIONS.VIEW_SOCKET_TEST,
  reports: PERMISSIONS.VIEW_ADMIN_TOOLS,
};

const disconnectTimeouts = new Map();
const OFFLINE_GRACE_PERIOD_MS = 2000;
const forcedDisconnects = new Set();

export const initSocket = (httpServer, sessionMiddleware) => {
  // QUEUE SYSTEM: Connection State Recovery
  // This is the server-side buffer logic.
  const io = new Server(httpServer, {
    cors: corsOptions,
    connectionStateRecovery: {
      // Buffer packets for 2 minutes. If client reconnects within 2 mins,
      // all missed "users_updated" or "donations_created" events are sent instantly.
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
  });

  setIO(io);

  io.engine.use(sessionMiddleware);
  io.engine.use(passport.initialize());
  io.engine.use(passport.session());

  io.use((socket, next) => {
    if (socket.request.user) {
      socket.user = socket.request.user;
      socket.data.user = socket.request.user; // Required for recovery
      socket.isGuest = false;
    } else {
      socket.isGuest = true;
    }
    next();
  });

  io.on('connection', async (socket) => {
    if (socket.recovered) {
      logInfo(
        `[Recovery] Socket ${socket.id} recovered. Missed packets flushed.`,
      );
    }

    const RATE_LIMIT = 10;
    const RATE_WINDOW_MS = 1000;
    const rateLimiter = { count: 0, lastReset: Date.now() };

    socket.use(([event, ...args], next) => {
      const now = Date.now();
      if (now - rateLimiter.lastReset > RATE_WINDOW_MS) {
        rateLimiter.count = 0;
        rateLimiter.lastReset = now;
      }
      if (rateLimiter.count >= RATE_LIMIT)
        return next(new Error('Rate limit exceeded.'));
      rateLimiter.count++;
      next();
    });

    socket.on('ping_activity', async () => {
      if (socket.isGuest || !socket.user) return;
      try {
        const user = await db.User.findByPk(socket.user.id);
        if (!user) return;
        const now = Date.now();
        const lastActive = user.last_active
          ? new Date(user.last_active).getTime()
          : 0;
        const THRESHOLD = 30 * 1000;
        if (now - lastActive > THRESHOLD) {
          user.last_active = new Date();
          await user.save();
        }
      } catch (err) {
        logError('Activity ping error:', err);
      }
    });

    if (socket.isGuest) {
      logInfo(`Guest connected: ${socket.id}`);
    } else {
      const userId = socket.user.id;
      logInfo(`User connected: ${socket.user.email}`);
      if (disconnectTimeouts.has(userId)) {
        clearTimeout(disconnectTimeouts.get(userId));
        disconnectTimeouts.delete(userId);
      }
      socket.join(`user:${userId}`);
      const userRoles = Array.isArray(socket.user.role)
        ? socket.user.role
        : [socket.user.role];
      userRoles.forEach((r) => socket.join(`role:${r}`));

      try {
        const user = await db.User.findByPk(userId);
        if (user) {
          const currentSockets = user.socketId || [];
          if (!currentSockets.includes(socket.id)) {
            user.socketId = [...currentSockets, socket.id];
          }
          user.isOnline = true;
          user.last_active = new Date();
          await user.save();
          // Emit immediate updates
          socket.emit('users_updated', user.toJSON());
          socket.emit('log', { message: 'Welcome!', user: user.email });
        }
      } catch (err) {
        logError('Error handling user connection:', err);
      }
    }

    socket.on('subscribe_resource', (resourceName) => {
      let allowed = false;
      let baseResource = resourceName;
      let specificId = null;

if (resourceName.includes('_')) {
        const parts = resourceName.split('_');
        const potentialId = parts[parts.length - 1];
        
        // FIX: Allow UUIDs (strings) or Integers
        // We assume anything after the last underscore is an ID
        if (potentialId) {
          specificId = potentialId; 
          baseResource = parts.slice(0, -1).join('_'); 
        }
      }

      const requiredPerm = RESOURCE_PERMISSIONS[baseResource];

      if (requiredPerm === undefined) {
        allowed = false;
      } else if (requiredPerm === null) {
        allowed = true; // Public
      } else if (requiredPerm === 'AUTHENTICATED') {
        allowed = !socket.isGuest;
      } else {
        allowed = !socket.isGuest && hasPermission(socket.user, requiredPerm);
      }

      if (allowed) {
        socket.join(resourceName);
        if (resourceName !== 'server_logs')
          logInfo(`Socket ${socket.id} subscribed to ${resourceName}`);
      } else {
        socket.emit('log', {
          message: `Access Denied: You do not have permission to view ${resourceName}.`,
          type: 'error',
        });
        logInfo(`Access denied for ${socket.id} to ${resourceName}`);
      }
    });

    socket.on('unsubscribe_resource', (resourceName) => {
      socket.leave(resourceName);
      if (resourceName !== 'server_logs') {
        logInfo(`Socket ${socket.id} unsubscribed from ${resourceName}`);
      }
    });

    socket.on('create_donation', async (data) => {
      try {
        if (socket.isGuest)
          return socket.emit('log', { message: 'Login required.' });
        const { itemDescription, quantity } = data;
        const donation = await db.Donation.create({
          donorName: socket.user.email,
          donorEmail: socket.user.email,
          itemDescription,
          quantity,
        });
        if (typeof logOperation === 'function') {
          await logOperation({
            operation: 'CREATE',
            description: `Donation: ${itemDescription}`,
            affectedResource: 'donations',
            afterState: donation,
            initiator: socket.user.email,
          });
        }
      } catch (error) {
        logError('Donation error', error);
      }
    });

    socket.on('force_disconnect_user', async ({ userId }) => {
      if (
        !socket.isGuest &&
        hasPermission(socket.user, PERMISSIONS.DISCONNECT_USERS)
      ) {
        try {
          forcedDisconnects.add(userId);
          const targetUser = await db.User.findByPk(userId);
          if (targetUser) {
            io.to(`user:${targetUser.id}`).emit('force_logout', {
              message: 'Disconnected by admin.',
            });
            const socketIds = targetUser.socketId || [];
            socketIds.forEach((sid) => {
              const s = io.sockets.sockets.get(sid);
              if (s) s.disconnect(true);
            });
            targetUser.isOnline = false;
            targetUser.socketId = [];
            await targetUser.save();
            await logOperation({
              operation: 'FORCE_LOGOUT',
              description: `Kicked user ${targetUser.email}`,
              affectedResource: `user:${targetUser.id}`,
              initiator: socket.user.email,
            });
          }
          setTimeout(() => forcedDisconnects.delete(userId), 5000);
        } catch (error) {
          logError('Kick error', error);
        }
      }
    });

    socket.on('disconnect', async () => {
      if (!socket.isGuest) {
        const userId = socket.user.id;
        const userEmail = socket.user.email;
        if (forcedDisconnects.has(userId)) return;

        try {
          const user = await db.User.findByPk(userId);
          if (user) {
            const currentSockets = user.socketId || [];
            user.socketId = currentSockets.filter((id) => id !== socket.id);
            await user.save();
          }
          const timeoutId = setTimeout(async () => {
            const freshUser = await db.User.findByPk(userId);
            const userRoom = io.sockets.adapter.rooms.get(`user:${userId}`);
            const activeConnectionCount = userRoom ? userRoom.size : 0;
            if (freshUser && activeConnectionCount === 0) {
              freshUser.isOnline = false;
              freshUser.last_active = new Date();
              await freshUser.save();
              logInfo(`User marked offline: ${userEmail} (Grace period ended)`);
            }
            if (disconnectTimeouts.get(userId) === timeoutId)
              disconnectTimeouts.delete(userId);
          }, OFFLINE_GRACE_PERIOD_MS);
          disconnectTimeouts.set(userId, timeoutId);
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

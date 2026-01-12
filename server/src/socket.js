import { Server } from 'socket.io';
import passport from 'passport';
import { db } from './models/index.js';
import { setIO, getIO } from './socket-store.js';
import { logOperation } from './services/logger.js';
import { config } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { ROLE_DEFINITIONS, PERMISSIONS } from './config/permissions.js';


const ALLOWED_CHANNELS = [
  'donations',
  'users',
  'audit_logs',
  'inventory',
  'server_logs',
  'reports'
];

// --- HELPER FUNCTIONS ---

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

// --- PERMISSION LOGIC ---

const hasPermission = (user, requiredPermission) => {
  if (!user || !user.role) return false;
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];

  // 1. CRITICAL: Super Admin Bypass (Fixes your access denied issue)
  if (userRoles.includes('super_admin')) return true;

  // 2. Standard Permission Check
  return userRoles.some((role) => {
    const allowedPermissions = ROLE_DEFINITIONS[role] || [];
    return allowedPermissions.includes(requiredPermission);
  });
};

// Map resources to the specific PERMISSION required to view them
const RESOURCE_MAP = {
  // Public
  donations: null,

  // Restricted Data Tables
  users: PERMISSIONS.VIEW_USERS,
  audit_logs: PERMISSIONS.VIEW_AUDIT_LOGS,
  inventory: PERMISSIONS.MANAGE_INVENTORY, // Example

  // Developer Tools
  server_logs: PERMISSIONS.VIEW_SOCKET_TEST,
  reports: PERMISSIONS.VIEW_ADMIN_TOOLS,
};

// --- STATE MANAGEMENT ---
const disconnectTimeouts = new Map();
const OFFLINE_GRACE_PERIOD_MS = 2000;
const forcedDisconnects = new Set();

export const initSocket = (httpServer, sessionMiddleware) => {
  const io = new Server(httpServer, {
    cors: corsOptions,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
  });

  setIO(io);

  // Attach Middleware
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
    if (socket.recovered) {
      logInfo(`[Recovery] Socket ${socket.id} restored connection.`);
    }

    // --- 1. SESSION INITIALIZATION ---
    if (socket.isGuest) {
      logInfo(`Guest connected: ${socket.id}`);
    } else {
      const userId = socket.user.id;
      logInfo(`User connected: ${socket.user.email}`);

      // Clear pending disconnect timers (user reconnected fast)
      if (disconnectTimeouts.has(userId)) {
        clearTimeout(disconnectTimeouts.get(userId));
        disconnectTimeouts.delete(userId);
      }

      // Join Identity Rooms
      socket.join(`user:${userId}`); // For system messages (kicks, alerts)
      const userRoles = Array.isArray(socket.user.role)
        ? socket.user.role
        : [socket.user.role];
      userRoles.forEach((r) => socket.join(`role:${r}`)); // For role-based broadcasts

      // Update Database Status
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

          // Acknowledge connection
          socket.emit('log', {
            message: 'Connected to Realtime Server',
            type: 'success',
          });
        }
      } catch (err) {
        logError('Error handling user connection:', err);
      }
    }

    // --- 2. DATA RESOURCES (Tables) ---
    // Usage: socket.emit('subscribe_resource', 'audit_logs')
    socket.on('subscribe_resource', (resourceName) => {
      let allowed = false;
      let baseResource = resourceName;

      // 2. FIX: STRICT VALIDATION BEFORE PARSING
      // Prevent parsing massive strings or random garbage
      if (!resourceName || typeof resourceName !== 'string' || resourceName.length > 50) {
        return; // Silent reject
      }

      // Check if it's a base resource OR a valid specific ID pattern
      // Simple heuristic: Must start with a known channel
      const isKnownChannel = ALLOWED_CHANNELS.some(ch => resourceName === ch || resourceName.startsWith(`${ch}_`));
      
      if (!isKnownChannel) {
        return socket.emit('log', { type: 'error', message: 'Invalid channel name' });
      }

      // Handle specific ID subscriptions (e.g. 'users_123')
      if (resourceName.includes('_')) {
        // Logic to extract base resource if needed
        // For now, we assume strict mapping to RESOURCE_MAP keys
      }

      const requiredPerm = RESOURCE_MAP[baseResource];

      // Determine Access
      if (requiredPerm === undefined) {
        allowed = false; // Unknown resource
      } else if (requiredPerm === null) {
        allowed = true; // Public
      } else if (requiredPerm === 'AUTHENTICATED') {
        allowed = !socket.isGuest;
      } else {
        allowed = !socket.isGuest && hasPermission(socket.user, requiredPerm);
      }

      if (allowed) {
        socket.join(resourceName);
        if (resourceName !== 'server_logs') {
          logInfo(
            `Socket ${socket.id} joined resource stream: ${resourceName}`,
          );
        }
      } else {
        socket.emit('log', {
          message: `Access Denied: Insufficient permissions for ${resourceName}`,
          type: 'error',
        });
        logInfo(`Access denied for ${socket.id} to ${resourceName}`);
      }
    });

    socket.on('unsubscribe_resource', (resourceName) => {
      socket.leave(resourceName);
    });

    // --- 3. NOTIFICATIONS SYSTEM ---
    // Usage: socket.emit('subscribe_notifications')
    socket.on('subscribe_notifications', () => {
      if (socket.isGuest) return;

      const room = `notifications:${socket.user.id}`;
      socket.join(room);
      logInfo(`User ${socket.user.email} subscribed to alerts`);
    });

    // --- 4. DIRECT MESSAGING (Chat) ---
    // Usage: socket.emit('join_chat')
    socket.on('join_chat', () => {
      if (socket.isGuest) return;

      const room = `chat:${socket.user.id}`;
      socket.join(room);
      logInfo(`User ${socket.user.email} enabled Direct Messaging`);
    });

    // --- 5. SYSTEM ACTIONS ---

    // Keep Alive Ping
    socket.on('ping_activity', async () => {
      if (socket.isGuest || !socket.user) return;
      try {
        const user = await db.User.findByPk(socket.user.id);
        if (user) {
          const now = Date.now();
          // Only update DB every 30s to save write ops
          const THRESHOLD = 30 * 1000;
          const lastActive = user.last_active
            ? new Date(user.last_active).getTime()
            : 0;

          if (now - lastActive > THRESHOLD) {
            user.last_active = new Date();
            await user.save();
          }
        }
      } catch (err) {
        logError('Ping error', err);
      }
    });

    // Legacy Donation Handler (Keep for compatibility)
    socket.on('create_donation', async (data) => {
      try {
        if (socket.isGuest)
          return socket.emit('log', { message: 'Login required.' });

        await db.Donation.create({
          donorName: socket.user.email,
          donorEmail: socket.user.email,
          itemDescription: data.itemDescription,
          quantity: data.quantity,
        });
        // Note: The DB Hook in models/index.js will handle the broadcast
      } catch (error) {
        logError('Donation socket error', error);
      }
    });

    // Admin Action: Force Kick
    socket.on('force_disconnect_user', async ({ userId }) => {
      // 1. Permission Check
      if (
        !socket.isGuest &&
        hasPermission(socket.user, PERMISSIONS.DISCONNECT_USERS)
      ) {
        try {
          const targetUser = await db.User.findByPk(userId);

          if (targetUser) {
            // 2. Hierarchy Check (Admin cannot kick Super Admin)
            const initiatorRoles = Array.isArray(socket.user.role)
              ? socket.user.role
              : [socket.user.role];
            const targetRoles = Array.isArray(targetUser.role)
              ? targetUser.role
              : [targetUser.role];

            const isInitiatorSuper = initiatorRoles.includes('super_admin');
            const isTargetSuper = targetRoles.includes('super_admin');

            if (isTargetSuper && !isInitiatorSuper) {
              return socket.emit('log', {
                message: 'Security Alert: You cannot disconnect a Super Admin.',
                type: 'error',
              });
            }

            // 3. Execution
            forcedDisconnects.add(userId);

            // Notify target
            io.to(`user:${targetUser.id}`).emit('force_logout', {
              message: 'Session terminated by administrator.',
            });

            // Disconnect all their sockets
            const socketIds = targetUser.socketId || [];
            socketIds.forEach((sid) => {
              const s = io.sockets.sockets.get(sid);
              if (s) s.disconnect(true);
            });

            // Update DB
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

          // Clear lock after 5s
          setTimeout(() => forcedDisconnects.delete(userId), 5000);
        } catch (error) {
          logError('Kick error', error);
        }
      }
    });

    // Disconnect Handler
    socket.on('disconnect', async () => {
      if (!socket.isGuest) {
        const userId = socket.user.id;
        const userEmail = socket.user.email;

        // If they were kicked, don't run normal disconnect logic
        if (forcedDisconnects.has(userId)) return;

        try {
          // Remove this specific socket ID from the user's list
          const user = await db.User.findByPk(userId);
          if (user) {
            const currentSockets = user.socketId || [];
            user.socketId = currentSockets.filter((id) => id !== socket.id);
            await user.save();
          }

          // Grace Period: Wait 2s to see if they reconnect (page refresh)
          const timeoutId = setTimeout(async () => {
            const freshUser = await db.User.findByPk(userId);
            const userRoom = io.sockets.adapter.rooms.get(`user:${userId}`);

            // If no sockets remain in their room, mark offline
            const activeConnectionCount = userRoom ? userRoom.size : 0;

            if (freshUser && activeConnectionCount === 0) {
              freshUser.isOnline = false;
              freshUser.last_active = new Date();
              await freshUser.save();
              logInfo(`User marked offline: ${userEmail}`);
            }

            if (disconnectTimeouts.get(userId) === timeoutId) {
              disconnectTimeouts.delete(userId);
            }
          }, OFFLINE_GRACE_PERIOD_MS);

          disconnectTimeouts.set(userId, timeoutId);
        } catch (error) {
          logError('Disconnect cleanup error:', error);
        }
      } else {
        logInfo(`Guest disconnected: ${socket.id}`);
      }
    });
  });

  return io;
};

import { Server } from 'socket.io';
import passport from 'passport';
import { db } from './models/index.js';
import { setIO, getIO } from './socket-store.js';
import { logOperation } from './services/logger.js';
import { config } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { ROLE_DEFINITIONS, PERMISSIONS } from './config/permissions.js';

// --- CONFIGURATION ---
const ALLOWED_CHANNELS = [
  'donations',
  'users',
  'audit_logs',
  'inventory',
  'server_logs',
  'reports',
  'test_items',
  'admin/trash', // Added admin/trash
];

// Prevents database spamming on rapid page reloads
const PRESENCE_OPTS = {
  DEBOUNCE_MS: 2000, // Wait 2s before marking offline (handles refresh)
  ACTIVITY_THROTTLE: 60000, // Only write last_active to DB once per minute
};

// --- HELPER FUNCTIONS ---
const logInfo = (message, ...args) => {
  if (config.app.env !== 'production')
    console.log(`[Socket] ${message}`, ...args);
  try {
    const io = getIO();
    if (io)
      io.to('server_logs').emit('server_log', {
        type: 'info',
        message: `${message}`,
        timestamp: new Date(),
      });
  } catch (e) {}
};

// --- PERMISSION LOGIC ---
const hasPermission = (user, requiredPermission) => {
  if (!user || !user.role) return false;

  let userRoles = user.role;
  // Robust parsing handling
  if (typeof userRoles === 'string') {
    try {
      userRoles = JSON.parse(userRoles);
    } catch {
      userRoles = [userRoles];
    }
  }
  if (!Array.isArray(userRoles)) userRoles = [userRoles];

  if (userRoles.includes('super_admin')) return true;

  return userRoles.some((role) => {
    const allowed = ROLE_DEFINITIONS[role] || [];
    return allowed.includes(requiredPermission);
  });
};

const RESOURCE_MAP = {
  donations: null,
  test_items: null,
  users: PERMISSIONS.READ_USERS || PERMISSIONS.VIEW_USERS,
  audit_logs: PERMISSIONS.READ_AUDIT_LOGS || PERMISSIONS.VIEW_AUDIT_LOGS,
  inventory: PERMISSIONS.MANAGE_INVENTORY,
  server_logs: PERMISSIONS.VIEW_SOCKET_TEST,
  reports: PERMISSIONS.VIEW_ADMIN_TOOLS,
  'admin/trash': PERMISSIONS.READ_TRASH, // FIX: Allow subscription to trash
};

// --- PRESENCE MANAGER (The Fix for Stale User Data) ---
class PresenceManager {
  constructor() {
    this.userSockets = new Map(); // Map<UserId, Set<SocketId>>
    this.timeouts = new Map(); // Map<UserId, TimeoutID>
    this.lastActivity = new Map(); // Map<UserId, Timestamp>
  }

  addSocket(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);

    // Clear any pending "mark offline" timeouts (User reconnected/refreshed)
    if (this.timeouts.has(userId)) {
      clearTimeout(this.timeouts.get(userId));
      this.timeouts.delete(userId);
    }

    // Return true if this is the FIRST connection (User just came Online)
    return this.userSockets.get(userId).size === 1;
  }

  removeSocket(userId, socketId) {
    if (!this.userSockets.has(userId)) return false;

    const sockets = this.userSockets.get(userId);
    sockets.delete(socketId);

    // Return true if NO sockets remain (User might be going offline)
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      return true;
    }
    return false;
  }

  shouldUpdateActivity(userId) {
    const now = Date.now();
    const last = this.lastActivity.get(userId) || 0;
    if (now - last > PRESENCE_OPTS.ACTIVITY_THROTTLE) {
      this.lastActivity.set(userId, now);
      return true;
    }
    return false;
  }
}

const presence = new PresenceManager();

export const initSocket = (httpServer, sessionMiddleware) => {
  const io = new Server(httpServer, {
    cors: corsOptions,
    connectionStateRecovery: { maxDisconnectionDuration: 120000 },
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
    // 1. SESSION INIT
    if (!socket.isGuest) {
      const userId = socket.user.id;

      // Join Personal Rooms
      socket.join(`user:${userId}`);

      let roles = socket.user.role;
      if (typeof roles === 'string')
        try {
          roles = JSON.parse(roles);
        } catch {}
      if (Array.isArray(roles)) roles.forEach((r) => socket.join(`role:${r}`));

      // PRESENCE: Handle Connection
      const isFirstConnection = presence.addSocket(userId, socket.id);

      // Immediate DB Update only if coming online for the first time
      // OR if we haven't updated 'last_active' in a while
      if (isFirstConnection || presence.shouldUpdateActivity(userId)) {
        try {
          await db.User.update(
            { isOnline: true, last_active: new Date() },
            { where: { id: userId }, silent: true }, // silent: true to avoid recursive hooks
          );
          // Manually broadcast update to avoid hook loops, but ensure client sees it
          io.emit('users_updated', {
            id: userId,
            isOnline: true,
            last_active: new Date(),
          });
        } catch (e) {
          console.error('Presence update failed', e);
        }
      }

      logInfo(`User connected: ${socket.user.email}`);
    }

    // 2. DATA SUBSCRIPTIONS
    socket.on('subscribe_resource', (resourceName) => {
      if (!resourceName || typeof resourceName !== 'string') return;

      let permissionKey = null;
      if (RESOURCE_MAP.hasOwnProperty(resourceName)) {
        permissionKey = resourceName;
      } else {

        const matchedKey = Object.keys(RESOURCE_MAP)
          .sort((a, b) => b.length - a.length)
          .find((key) => resourceName === key || resourceName.startsWith(`${key}/`));
          
        if (matchedKey) permissionKey = matchedKey;
      }

      const baseResource = permissionKey || resourceName;
      const requiredPerm = RESOURCE_MAP[baseResource];

      let allowed = false;
      if (requiredPerm === undefined) allowed = false;
      else if (requiredPerm === null) allowed = true;
      else
        allowed = !socket.isGuest && hasPermission(socket.user, requiredPerm);

      if (allowed) {
        socket.join(resourceName);
      } else {
        socket.emit('log', {
          type: 'error',
          message: `Access Denied to ${resourceName}`,
        });
      }
    });

    socket.on('unsubscribe_resource', (r) => socket.leave(r));

    // 3. ACTIVITY PING (Throttled)
    socket.on('ping_activity', async () => {
      if (socket.isGuest) return;
      const userId = socket.user.id;

      if (presence.shouldUpdateActivity(userId)) {
        try {
          await db.User.update(
            { isOnline: true, last_active: new Date() },
            { where: { id: userId }, silent: true },
          );
          // Broadcast 'active' to keep UI fresh without full refetch
          io.emit('users_updated', {
            id: userId,
            isOnline: true,
            last_active: new Date(),
          });
        } catch (e) {}
      }
    });

    // 4. DISCONNECT
    socket.on('disconnect', () => {
      if (!socket.isGuest) {
        const userId = socket.user.id;

        // Remove from tracker
        const isCompletelyGone = presence.removeSocket(userId, socket.id);

        if (isCompletelyGone) {
          // DEBOUNCE: Wait 2s before marking offline (in case of refresh)
          const timeoutId = setTimeout(async () => {
            // Double check: Did they reconnect in the meantime?
            if (!presence.userSockets.has(userId)) {
              try {
                await db.User.update(
                  { isOnline: false, last_active: new Date() },
                  { where: { id: userId }, silent: true },
                );
                io.emit('users_updated', {
                  id: userId,
                  isOnline: false,
                  last_active: new Date(),
                });
                logInfo(`User marked offline: ${socket.user.email}`);
              } catch (e) {}
            }
          }, PRESENCE_OPTS.DEBOUNCE_MS);

          presence.timeouts.set(userId, timeoutId);
        }
      }
    });

    // ... (Keep force_disconnect_user and legacy handlers)
    socket.on('force_disconnect_user', async ({ userId }) => {
      if (
        !socket.isGuest &&
        hasPermission(socket.user, PERMISSIONS.DISCONNECT_USERS)
      ) {
        io.to(`user:${userId}`).emit('force_logout', {
          message: 'Session terminated.',
        });
        // Force socket disconnects
        // Note: In clustered environments, use Redis adapter. For single node:
        const room = io.sockets.adapter.rooms.get(`user:${userId}`);
        if (room) {
          for (const clientId of room) {
            const clientSocket = io.sockets.sockets.get(clientId);
            if (clientSocket) clientSocket.disconnect(true);
          }
        }
        await db.User.update({ isOnline: false }, { where: { id: userId } });
        io.emit('users_updated', { id: userId, isOnline: false });
      }
    });
  });

  return io;
};

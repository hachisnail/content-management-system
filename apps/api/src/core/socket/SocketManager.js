import { Server } from 'socket.io';
import passport from 'passport';
import { sessionConfig } from '../../config/session.js';
import { appEvents, EVENTS } from '../events/EventBus.js';
import { RESOURCES, default as ac } from '../../config/roles.js';
import { presenceService } from '../presence/index.js'; 

let io;

export const getIO = () => io;

export const socketService = {
  /**
   * Emit an event to a specific user's private room.
   */
  emitToUser: (userId, event, payload) => {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, payload);
  },

  /**
   * Forcefully disconnect all sockets for a specific user.
   */
  disconnectUser: (userId) => {
    if (!io) return;
    io.in(`user:${userId}`).disconnectSockets(true);
  }
};

/**
 * Permission Helper
 * Checks if the user's roles allow the requested action on a resource.
 */
const hasPermission = (userRoles, action, resource) => {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.some(role => {
    try { return ac.can(role)[action](resource).granted; } 
    catch (e) { return false; }
  });
};

/**
 * Support Chat Handlers
 * Handles ephemeral messaging for support agents.
 */
const registerSupportHandlers = (io, socket) => {
  const { userRoles } = socket;

  socket.on('send_support_message', (payload) => {
    // Security: Only users who can create their own support requests can send messages
    if (!hasPermission(userRoles, 'createOwn', RESOURCES.SUPPORT)) {
      return socket.emit('error', { message: 'Forbidden: You cannot send support messages.' });
    }
    
    // Relay to Support Agents Room
    io.to('agent:support').emit('incoming_support_message', {
      ...payload,
      senderId: socket.user.id,
      timestamp: new Date()
    }); 
    
    socket.emit('message_sent', { status: 'delivered' });
  });
};

/**
 * Data Subscription Handlers
 * Allows clients to listen for real-time updates on specific resources (e.g., 'files', 'users').
 */
const registerSubscriptionHandlers = (io, socket) => {
  const { userRoles } = socket;

socket.on('subscribe', (resourceName) => {
    // [DEBUG] Log the attempt
    console.log(`Socket [${socket.id}] User [${socket.user?.email}] attempting to join: ${resourceName}`);

    if (hasPermission(userRoles, 'readAny', resourceName)) {
      socket.join(`resource:${resourceName}`);
      
      // [DEBUG] Log success
      console.log(`Socket [${socket.id}] Successfully joined room: resource:${resourceName}`);
      
      socket.emit('subscription_success', { resource: resourceName });
    } else {
      // [DEBUG] Log failure
      console.warn(`Socket [${socket.id}] Permission denied for: ${resourceName}`);
      
      socket.emit('subscription_error', { 
        message: `Forbidden: You do not have permission to view ${resourceName}.` 
      });
    }
  });

  socket.on('unsubscribe', (resourceName) => {
    socket.leave(`resource:${resourceName}`);
  });
};

export const initSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
  });

  // Share Session & Auth Middleware with Express
  const wrap = m => (s, next) => m(s.request, {}, next);
  io.use(wrap(sessionConfig));
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));

  // Authentication Guard
  io.use((socket, next) => {
    if (socket.request.user) {
      socket.user = socket.request.user;
      socket.userRoles = socket.user.roles || [];
      next();
    } else {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const { user } = socket;
    const userId = user.id;

    // 1. PRESENCE: Mark user as connected via Service (handles throttling)
    presenceService.userConnected(userId);

    // 2. ROOMS: Join private user room and session room
    socket.join(`user:${userId}`);
    if (socket.request.sessionID) {
      socket.join(`session:${socket.request.sessionID}`);
    }
    
    // 3. AGENT ROLES: Auto-join support channel if applicable
    if (hasPermission(socket.userRoles, 'readAny', RESOURCES.SUPPORT)) {
      socket.join('agent:support');
    }

    registerSupportHandlers(io, socket);

    
    registerSubscriptionHandlers(io, socket);

    socket.on('disconnect', async () => {
      const userRoom = io.sockets.adapter.rooms.get(`user:${userId}`);
      const remainingConnections = userRoom ? userRoom.size : 0;

      if (remainingConnections === 0) {
        presenceService.userDisconnected(userId);
      }
    });
  });

// --- Scalable Event Listeners ---
  
  appEvents.on(EVENTS.SESSION_TERMINATED, ({ sessionId, reason }) => {
    const room = `session:${sessionId}`;
    io.to(room).emit('forced_logout', { message: reason });
    io.in(room).disconnectSockets(true);
  });

  [EVENTS.DB_CREATE, EVENTS.DB_UPDATE, EVENTS.DB_DELETE].forEach(evtType => {
    appEvents.on(evtType, (payload) => {
      if (payload && payload.resource) {
        const room = `resource:${payload.resource}`;
        
        console.log(`[SOCKET] Broadcasting ${evtType} to room: ${room} | Data: ${payload.data ? payload.data.id : 'N/A'}`);
        
        // Check if anyone is actually in the room (Useful for debugging "ghost" updates)
        const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
        if (roomSize === 0) {
           console.log(`[SOCKET] Warning: No clients currently in room: ${room}`);
        }

        io.to(room).emit('db_event', { 
          type: evtType.split(':')[1].toUpperCase(), 
          ...payload 
        });
      }
    });
  });

  return io;
};
// client/src/socket.js
import { io } from 'socket.io-client';
import { SOCKET_SERVER_URL } from './config';

// 1. Initialize the raw socket instance
const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

// 2. QUEUING SYSTEM STATE
const eventQueue = [];
let isFlushing = false;
const SETTLING_DELAY = 500; // 500ms delay to let connection stabilize

// 3. FLUSH MECHANISM
const flushQueue = () => {
  if (!socket.connected || eventQueue.length === 0 || isFlushing) return;
  
  isFlushing = true;
  console.log(`[SocketQueue] Flushing ${eventQueue.length} buffered events...`);

  // Process all queued events
  while (eventQueue.length > 0 && socket.connected) {
    const { event, data } = eventQueue.shift();
    try {
      socket.emit(event, data);
      console.log(`[SocketQueue] Re-emitted buffered event: ${event}`);
    } catch (err) {
      console.error(`[SocketQueue] Failed to flush event ${event}:`, err);
      // Optional: Re-queue at head if critical, but avoid infinite loops
    }
  }
  isFlushing = false;
};

// 4. CONNECTION LISTENERS
socket.on('connect', () => {
  console.log('[Socket] Connected. Waiting for link to stabilize...');
  
  // DELAY: Wait before sending buffered events
  setTimeout(() => {
    console.log('[Socket] Link stable. Flushing queue.');
    flushQueue();
  }, SETTLING_DELAY);
});

// 5. ENHANCED EMITTER (The "Safe Emit")
// This function replaces raw socket.emit in your app to ensure delivery
socket.emitSafe = (event, data) => {
  if (socket.connected) {
    // Direct emit if connected, but we can add a tiny delay to ensure order
    setTimeout(() => socket.emit(event, data), 10);
  } else {
    // Check if this specific event+data combo is already queued (Deduping)
    // This prevents 50 'subscribe' requests from stacking up while offline
    const isDuplicate = eventQueue.some(
      item => item.event === event && JSON.stringify(item.data) === JSON.stringify(data)
    );

    if (!isDuplicate) {
      console.log(`[SocketQueue] Connection down. Buffering event: ${event}`);
      eventQueue.push({ event, data });
    }
  }
};

export default socket;
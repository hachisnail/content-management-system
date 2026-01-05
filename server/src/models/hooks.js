// server/src/models/hooks.js
import { getIO } from '../socket-store.js';

// Changed signature: We pass roomName explicitly to avoid 'audit_logs' split errors
const safeEmit = (roomName, eventName, payload) => {
  try {
    const io = getIO();
    if (io) {
      const data = payload && typeof payload.toJSON === 'function' ? payload.toJSON() : payload;
      
      // Emit strictly to the room matching the resource name
      io.to(roomName).emit(eventName, data);
      
      console.log(`[Socket] Emitted ${eventName} to room ${roomName}`);
    }
  } catch (err) {
    console.warn(`[Socket] Failed to emit ${eventName}:`, err.message);
  }
};

// ==========================================
// SMART HANDLERS
// ==========================================

/**
 * Handle Append-Only Resources (Audit Logs, Donations)
 * Usage: Attach to afterCreate only.
 */
export const notifyNewResource = (resourceName) => (instance) => {
  // Explicitly pass resourceName as the room
  console.log(`[Hook] Notifying new ${resourceName} creation.`);
  safeEmit(resourceName, `${resourceName}_created`, instance);

};

/**
 * Handle Mutable Resources (Users)
 * Usage: Attach to afterSave.
 */
export const notifyMutableResource = (resourceName) => (instance, options) => {
  // 1. Handle Soft Deletes
  console.log(`[Hook] Notifying mutable ${resourceName} change.`);
  if (instance.deletedAt && instance.changed('deletedAt')) {
      safeEmit(resourceName, `${resourceName}_deleted`, instance);
      return;
  }

  // 2. Handle Creation (New Record)
  // This ensures the client "appends" the new user instead of trying to "update" a missing one
  const isNew = options.isNewRecord === undefined ? instance._options?.isNewRecord : options.isNewRecord;
  
  if (isNew) {
    console.log(`[Hook] Detected new ${resourceName} creation via mutable hook.`);
      safeEmit(resourceName, `${resourceName}_created`, instance);
      return;
  }

  // 3. Handle Updates
  safeEmit(resourceName, `${resourceName}_updated`, instance);
};
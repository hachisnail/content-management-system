import { getIO } from '../socket-store.js';

const safeEmit = (roomName, eventName, payload) => {
  try {
    const io = getIO();
    if (io) {
      const data = payload && typeof payload.toJSON === 'function' ? payload.toJSON() : payload;
      io.to(roomName).emit(eventName, data);
      console.log(`[Socket] Emitted ${eventName} to room ${roomName}`);
    }
  } catch (err) {
    console.warn(`[Socket] Failed to emit ${eventName}:`, err.message);
  }
};

// ... (keep triggerSmartUpdate as is) ...
export const triggerSmartUpdate = (resourceName, payload) => {
  const data = (typeof payload === 'string' || typeof payload === 'number') 
    ? { id: payload } 
    : payload;
  console.log(`[Hook] Manual trigger for ${resourceName} update.`);
  safeEmit(resourceName, `${resourceName}_updated`, data);
};

/**
 * Helper to populate associations before emitting
 */
const reloadWithAssociations = async (instance, include) => {
  if (!include || !instance.reload) return instance;
  try {
    return await instance.reload({ include });
  } catch (error) {
    console.error('[Hook] Failed to reload associations:', error.message);
    return instance; // Fallback to raw instance on error
  }
};

// 1. CREATE HOOK (Supports Eager Loading)
export const notifyNewResource = (resourceName, eagerLoad = null) => async (instance) => {
  console.log(`[Hook] Notifying new ${resourceName} creation.`);
  
  // FIX: Load associations (Avatar, User) before sending
  const payload = await reloadWithAssociations(instance, eagerLoad);
  
  safeEmit(resourceName, `${resourceName}_created`, payload);
};

// 2. MUTABLE HOOK (Update/Soft Delete)
export const notifyMutableResource = (resourceName, eagerLoad = null) => async (instance, options) => {
  console.log(`[Hook] Notifying mutable ${resourceName} change.`);

  // Handle Soft Delete
  if (instance.deletedAt && instance.changed('deletedAt')) {
      safeEmit(resourceName, `${resourceName}_deleted`, instance);
      return;
  }

  // Handle Create vs Update
  const isNew = options.isNewRecord === undefined ? instance._options?.isNewRecord : options.isNewRecord;
  const eventName = isNew ? `${resourceName}_created` : `${resourceName}_updated`;

  // FIX: Load associations before sending
  const payload = await reloadWithAssociations(instance, eagerLoad);

  safeEmit(resourceName, eventName, payload);
};

// 3. HARD DELETE HOOK
export const notifyDeletedResource = (resourceName) => (instance) => {
  console.log(`[Hook] Notifying ${resourceName} deletion.`);
  safeEmit(resourceName, `${resourceName}_deleted`, instance);
};
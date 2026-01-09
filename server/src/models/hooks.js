import { getIO } from '../socket-store.js';

// REDUNDANCY: Wait 300ms even after commit to ensure total system stability
const BROADCAST_DELAY = 300;

const safeEmit = (roomName, eventName, payload) => {
  try {
    const io = getIO();
    if (io) {
      const data =
        payload && typeof payload.toJSON === 'function'
          ? payload.toJSON()
          : payload;

      // The actual emission is delayed
      setTimeout(() => {
        io.to(roomName).emit(eventName, data);
        console.log(
          `[Socket] Emitted ${eventName} to room ${roomName} (Delayed ${BROADCAST_DELAY}ms)`,
        );
      }, BROADCAST_DELAY);
    }
  } catch (err) {
    console.warn(`[Socket] Failed to emit ${eventName}:`, err.message);
  }
};

// Helper to decide WHEN to trigger the safeEmit
const scheduleEmission = (options, roomName, eventName, payload) => {
  if (options && options.transaction) {
    // BEST PRACTICE: Wait for Transaction Commit
    options.transaction.afterCommit(() => {
      console.log(
        `[Hook] Transaction committed. Scheduling emit for ${eventName}...`,
      );
      safeEmit(roomName, eventName, payload);
    });
  } else {
    // STANDARD: Emit immediately (the safeEmit function handles the 300ms delay)
    console.log(
      `[Hook] No transaction detected. Scheduling emit for ${eventName}...`,
    );
    safeEmit(roomName, eventName, payload);
  }
};

// --- DATA RELOADING HELPERS ---
const reloadWithAssociations = async (instance, include, transaction) => {
  if (!include || !instance.reload) return instance;
  try {
    // We must reload using the SAME transaction to see the new data
    return await instance.reload({ include, transaction });
  } catch (error) {
    console.error('[Hook] Failed to reload associations:', error.message);
    return instance;
  }
};

export const triggerSmartUpdate = (resourceName, payload) => {
  const data =
    typeof payload === 'string' || typeof payload === 'number'
      ? { id: payload }
      : payload;

  // Manual triggers usually happen outside transactions, but safeEmit still adds delay
  console.log(`[Hook] Manual trigger for ${resourceName} update.`);
  safeEmit(resourceName, `${resourceName}_updated`, data);

  if (data.id) {
    safeEmit(`${resourceName}_${data.id}`, `${resourceName}_updated`, data);
  }
};

// 1. CREATE HOOK
export const notifyNewResource =
  (resourceName, eagerLoad = null) =>
  async (instance, options) => {
    console.log(`[Hook] Notifying new ${resourceName} creation.`);

    // Pass transaction to reload so we see the data inside the transaction
    const payload = await reloadWithAssociations(
      instance,
      eagerLoad,
      options.transaction,
    );

    scheduleEmission(options, resourceName, `${resourceName}_created`, payload);
  };

// 2. MUTABLE HOOK (Update/Soft Delete)
export const notifyMutableResource =
  (resourceName, eagerLoad = null) =>
  async (instance, options) => {
    console.log(`[Hook] Notifying mutable ${resourceName} change.`);

    const recordRoom = `${resourceName}_${instance.id}`;

    // Pass transaction to reload
    const payload = await reloadWithAssociations(
      instance,
      eagerLoad,
      options.transaction,
    );

    // Handle Soft Delete
    if (instance.deletedAt && instance.changed('deletedAt')) {
      scheduleEmission(
        options,
        resourceName,
        `${resourceName}_deleted`,
        instance,
      );
      scheduleEmission(
        options,
        recordRoom,
        `${resourceName}_deleted`,
        instance,
      );
      return;
    }

    // Handle Create vs Update
    const isNew =
      options.isNewRecord === undefined
        ? instance._options?.isNewRecord
        : options.isNewRecord;
    const eventName = isNew
      ? `${resourceName}_created`
      : `${resourceName}_updated`;

    // 1. Emit to Master Room
    scheduleEmission(options, resourceName, eventName, payload);

    // 2. Emit to Specific Room
    if (!isNew) {
      scheduleEmission(options, recordRoom, eventName, payload);
    }
  };

// 3. HARD DELETE HOOK
export const notifyDeletedResource = (resourceName) => (instance, options) => {
  console.log(`[Hook] Notifying ${resourceName} deletion.`);
  const recordRoom = `${resourceName}_${instance.id}`;

  scheduleEmission(options, resourceName, `${resourceName}_deleted`, instance);
  scheduleEmission(options, recordRoom, `${resourceName}_deleted`, instance);
};

import { getIO } from '../socket-store.js';
import { db } from './index.js';

const safeEmit = (roomName, eventName, payload) => {
  try {
    const io = getIO();
    if (io) {
      let data =
        payload && typeof payload.toJSON === 'function'
          ? payload.toJSON()
          : payload;

      // Flatten profilePicture arrays for frontend consistency
      if (data.profilePicture && Array.isArray(data.profilePicture)) {
        data.profilePicture =
          data.profilePicture.length > 0 ? data.profilePicture[0] : null;
      }
      if (
        data.user &&
        data.user.profilePicture &&
        Array.isArray(data.user.profilePicture)
      ) {
        data.user.profilePicture =
          data.user.profilePicture.length > 0
            ? data.user.profilePicture[0]
            : null;
      }

      io.to(roomName).emit(eventName, data);
    }
  } catch (err) {
    console.warn(`[Socket] Failed to emit ${eventName}:`, err.message);
  }
};

const scheduleEmission = (options, roomName, eventName, payload) => {
  if (options && options.transaction) {
    options.transaction.afterCommit(() => {
      safeEmit(roomName, eventName, payload);
    });
  } else {
    safeEmit(roomName, eventName, payload);
  }
};

const reloadWithAssociations = async (instance, include, transaction) => {
  if (!include || !instance.reload) return instance;
  try {
    return await instance.reload({ include, transaction });
  } catch (error) {
    return instance;
  }
};

export const triggerSmartUpdate = (resourceName, payload) => {
  const data =
    typeof payload === 'string' || typeof payload === 'number'
      ? { id: payload }
      : payload;
  safeEmit(resourceName, `${resourceName}_updated`, data);
  if (data.id) {
    safeEmit(`${resourceName}_${data.id}`, `${resourceName}_updated`, data);
  }
};

/**
 * AUTOMATIC TRASH SYNC HOOK
 * Scalable approach:
 * 1. Checks for a custom `getTrashData()` method on the model instance (for custom logic).
 * 2. If not found, it "scrapes" common fields automatically.
 */
export const handleTrashBinSync =
  (resourceType, labelField, action) => async (instance, options) => {
    const transaction = options.transaction;

    try {
      // 1. SOFT DELETE: Capture Data
      if (action === 'soft_delete' && !options.force && instance.deletedAt) {
        let displayData = {};

        // STRATEGY A: Custom Method (Highest Priority)
        // If you add `getTrashData() { return { ... } }` to any Model, it uses that.
        if (typeof instance.getTrashData === 'function') {
          displayData = instance.getTrashData();
        }
        // STRATEGY B: Auto-Scrape Common Fields
        else {
          displayData.label = instance[labelField] || 'Unknown';

          // List of useful fields to capture if they exist
          const fieldsToCapture = [
            'description',
            'summary',
            'content', // Text content
            'email',
            'username',
            'firstName',
            'lastName', // User info
            'quantity',
            'amount',
            'price',
            'status', // E-commerce/Inventory
            'size',
            'mimeType',
            'path',
            'originalName', // Files
            'donorName',
            'donorEmail', // Donations
          ];

          fieldsToCapture.forEach((field) => {
            if (
              instance.dataValues[field] !== undefined &&
              instance.dataValues[field] !== null
            ) {
              displayData[field] = instance[field];
            }
          });
        }

        // Create Trash Entry
        await db.TrashItem.create(
          {
            resourceType,
            resourceId: instance.id,
            originalDeletedAt: instance.deletedAt,
            displayData,
            deletedBy: options.userId || 'system',
          },
          { transaction },
        );

        // Notify Frontend
        const io = getIO();
        if (io) {
          io.to('admin/trash').emit('admin/trash_created', {
            id: instance.id,
            resourceType,
            displayData,
          });
        }
      }
      // 2. RESTORE: Cleanup
      else if (action === 'restore') {
        await db.TrashItem.destroy({
          where: { resourceType, resourceId: instance.id },
          transaction,
        });

        const io = getIO();
        if (io) {
          io.to('admin/trash').emit('admin/trash_deleted', { id: instance.id });
        }
      }
    } catch (err) {
      console.error(
        `[TrashSync] Failed to sync ${resourceType}:${instance.id}`,
        err,
      );
    }
  };

// ... (Rest of the hooks remain unchanged)
export const notifyNewResource =
  (resourceName, eagerLoad = null) =>
  async (instance, options) => {
    const payload = await reloadWithAssociations(
      instance,
      eagerLoad,
      options.transaction,
    );
    scheduleEmission(options, resourceName, `${resourceName}_created`, payload);
  };

export const notifyMutableResource =
  (resourceName, eagerLoad = null) =>
  async (instance, options) => {
    const recordRoom = `${resourceName}_${instance.id}`;
    const payload = await reloadWithAssociations(
      instance,
      eagerLoad,
      options.transaction,
    );

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

    const isNew =
      options.isNewRecord === undefined
        ? instance._options?.isNewRecord
        : options.isNewRecord;
    const eventName = isNew
      ? `${resourceName}_created`
      : `${resourceName}_updated`;

    scheduleEmission(options, resourceName, eventName, payload);
    if (!isNew) {
      scheduleEmission(options, recordRoom, eventName, payload);
    }
  };

export const notifyRestoredResource =
  (resourceName, eagerLoad = null) =>
  async (instance, options) => {
    const payload = await reloadWithAssociations(
      instance,
      eagerLoad,
      options.transaction,
    );
    scheduleEmission(options, resourceName, `${resourceName}_created`, payload);
    scheduleEmission(
      options,
      `${resourceName}_${instance.id}`,
      `${resourceName}_updated`,
      payload,
    );
  };

export const notifyDeletedResource = (resourceName) => (instance, options) => {
  const recordRoom = `${resourceName}_${instance.id}`;
  scheduleEmission(options, resourceName, `${resourceName}_deleted`, instance);
  scheduleEmission(options, recordRoom, `${resourceName}_deleted`, instance);
};

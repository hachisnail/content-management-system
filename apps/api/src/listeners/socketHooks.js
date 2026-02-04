import { appEvents, EVENTS } from '../core/events/EventBus.js';

const PUBLIC_MODELS = [
  'User', 
  'File', 
  'FileLink', 
  'RecycleBin', 
  'AuditLog'  
];

export const attachSocketHooks = (models) => {
  Object.values(models).forEach((model) => {
    if (!model || !PUBLIC_MODELS.includes(model.name)) return;

    const emit = (type, instance) => {
      setImmediate(async () => {
        try {
            if (model.name === 'User' && models.File && !instance.avatarFiles) {
                try {
                    await instance.reload({ 
                        include: [{ 
                            model: models.File, 
                            as: 'avatarFiles',
                            attributes: ['id', 'path', 'visibility', 'mimetype'] 
                        }] 
                    });
                } catch (err) {
                    // Ignore reload errors
                }
            }

            if (model.name === 'AuditLog' && models.User && !instance.user) {
                try {
                    await instance.reload({
                        include: [{
                            model: models.User,
                            as: 'user',
                            attributes: ['id', 'firstName', 'lastName', 'email', 'roles']
                        }]
                    });
                } catch (err) {
                     console.warn(`[SocketHook] Failed to reload AuditLog user: ${err.message}`);
                }
            }

            const payload = {
                model: model.name,
                resource: model.tableName,
                data: instance.toJSON ? instance.toJSON() : instance
            };
            
            if (process.env.NODE_ENV === 'development') {
                console.log(`[SOCKET] Broadcasting ${type} on ${model.tableName}`);
            }
            
            appEvents.emit(type, payload);
        } catch (err) {
            console.error(`Socket hook error for ${model.name}:`, err);
        }
      });
    };

    model.afterCreate((i) => emit(EVENTS.DB_CREATE, i));
    model.afterUpdate((i) => emit(EVENTS.DB_UPDATE, i));
    model.afterDestroy((i) => emit(EVENTS.DB_DELETE, i));

    model.afterBulkUpdate(async (options) => {
      try {
        if (!options.where) return;

        const updatedRecords = await model.findAll({
          where: options.where,
          transaction: options.transaction,
          include: [
            ...(model.name === 'User' && models.File ? [{ 
                model: models.File, 
                as: 'avatarFiles',
                attributes: ['id', 'path', 'visibility', 'mimetype'] 
            }] : []),
            ...(model.name === 'AuditLog' && models.User ? [{
                model: models.User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }] : [])
          ]
        });

        updatedRecords.forEach(record => emit(EVENTS.DB_UPDATE, record));
      } catch (err) {
        console.error(`Bulk Update Hook Error [${model.name}]:`, err);
      }
    });

    // --- 3. OPTIMIZED Bulk Destroy Hook ---
    model.beforeBulkDestroy(async (options) => {
      try {
        if (!options.where) return;

        const recordsToDelete = await model.findAll({
          where: options.where,
          transaction: options.transaction
        });

        options.recordsToDelete = recordsToDelete;
      } catch (err) {
        console.error(`Bulk Destroy Hook Error [${model.name}]:`, err);
      }
    });

    model.afterBulkDestroy((options) => {
      if (options.recordsToDelete && Array.isArray(options.recordsToDelete)) {
        options.recordsToDelete.forEach(record => emit(EVENTS.DB_DELETE, record));
      }
    });

  });
};
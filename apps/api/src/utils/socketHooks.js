import { appEvents, EVENTS } from './events.js';

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

    // Helper to standardize the emit logic
    const emit = (type, instance) => {
      setImmediate(async () => {
        try {
            // Re-hydrate User avatar if needed
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
                    // Ignore reload errors (record might be deleted)
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

    // --- 1. Standard Hooks (Single Operations) ---
    model.afterCreate((i) => emit(EVENTS.DB_CREATE, i));
    model.afterUpdate((i) => emit(EVENTS.DB_UPDATE, i));
    model.afterDestroy((i) => emit(EVENTS.DB_DELETE, i));

    // --- 2. OPTIMIZED Bulk Update Hook ---
    // Triggered by Model.update(..., { where: ... })
    model.afterBulkUpdate(async (options) => {
      try {
        if (!options.where) return;

        // Fetch the updated records in ONE query
        const updatedRecords = await model.findAll({
          where: options.where,
          transaction: options.transaction,
          // Include associations specifically for User model
          include: model.name === 'User' && models.File ? [{ 
              model: models.File, 
              as: 'avatarFiles',
              attributes: ['id', 'path', 'visibility', 'mimetype'] 
          }] : []
        });

        // Emit events for all found records
        updatedRecords.forEach(record => emit(EVENTS.DB_UPDATE, record));
      } catch (err) {
        console.error(`Bulk Update Hook Error [${model.name}]:`, err);
      }
    });

    // --- 3. OPTIMIZED Bulk Destroy Hook ---
    // Triggered by Model.destroy({ where: ... })
    // We must fetch BEFORE destroying, otherwise the data is gone.
    model.beforeBulkDestroy(async (options) => {
      try {
        if (!options.where) return;

        // Fetch records to be deleted in ONE query
        const recordsToDelete = await model.findAll({
          where: options.where,
          transaction: options.transaction
        });

        // Store them in the options object to access them in afterBulkDestroy
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
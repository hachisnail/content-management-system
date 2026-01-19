import { db } from '../models/index.js';
import * as FileService from './file.service.js';
import { logOperation } from './logger.js';
import { Op } from 'sequelize';
import { getIO } from '../socket-store.js';
import { buildQueryOptions } from '../utils/queryBuilder.js';

const RESOURCE_CONFIG = {
  users: { model: db.User, label: 'email' },
  donations: { model: db.Donation, label: 'itemDescription' },
  test_items: { model: db.TestItem, label: 'name' },
  files: { model: db.File, label: 'originalName' },
};

const parseDisplayData = (data) => {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }
  return data;
};

// --- UPDATED: PAGINATED FETCH ---
export const getSystemTrash = async (queryParams = {}) => {
  // FIX: Destructure '_r' out to prevent "Unknown column" error in SQL
  const { _r, ...cleanParams } = queryParams;
  const { search } = cleanParams;

  // 1. Only include standard STRING columns here (exclude JSON 'displayData')
  const searchableFields = ['resourceType', 'deletedBy'];

  // FIX: Pass sanitized 'cleanParams' to the builder
  const options = buildQueryOptions(cleanParams, searchableFields);

  // 2. Manually handle JSON Search if a search term exists
  if (search && typeof search === 'string' && search.trim().length > 0) {
    // Ensure the OR array exists
    if (!options.where[Op.or]) {
      options.where[Op.or] = [];
    }

    // CAST the JSON column to CHAR so 'LIKE' works
    options.where[Op.or].push(
      db.Sequelize.where(
        db.Sequelize.cast(db.Sequelize.col('displayData'), 'CHAR'),
        { [Op.like]: `%${search}%` }
      )
    );
  }

  // Default Sort
  let order = [['originalDeletedAt', 'DESC']];
  if (options.order && options.order.length > 0) {
    order = options.order;
  }

  try {
    const { count, rows } = await db.TrashItem.findAndCountAll({
      where: options.where,
      limit: options.limit,
      offset: options.offset,
      order: order,
    });

    const formattedRows = rows.map((item) => {
      const parsedData = parseDisplayData(item.displayData);
      return {
        id: item.resourceId,
        trashId: item.id,
        resourceType: item.resourceType,
        label: parsedData.label || 'Unknown Item',
        deletedAt: item.originalDeletedAt,
        data: parsedData,
        deletedBy: item.deletedBy,
      };
    });

    return { rows: formattedRows, count };
  } catch (error) {
    console.error("Trash Fetch Error:", error);
    // Return empty state instead of crashing
    return { rows: [], count: 0 };
  }
};

export const getTrashItemById = async (resourceId) => {
  const item = await db.TrashItem.findOne({ where: { resourceId } });
  if (!item) return null;

  const parsedData = parseDisplayData(item.displayData);
  return {
    id: item.resourceId,
    resourceType: item.resourceType,
    label: parsedData.label || 'Unknown',
    deletedAt: item.originalDeletedAt,
    data: parsedData,
    deletedBy: item.deletedBy,
  };
};

export const restoreResource = async (resourceType, id, user) => {
  const config = RESOURCE_CONFIG[resourceType];
  if (!config) throw new Error(`Unknown resource type: ${resourceType}`);

  const finalizeRestore = async () => {
    await db.TrashItem.destroy({ where: { resourceType, resourceId: id } });
    
    const io = getIO();
    if (io) {
      io.to('admin/trash').emit('admin/trash_deleted', { id });
    }

    await logOperation({
      description: `Restored ${resourceType} item (${id}) from trash`,
      operation: 'RESTORE',
      affectedResource: resourceType,
      initiator: user?.email || 'System'
    });
  };

  if (resourceType === 'files') {
    const result = await FileService.restoreFile(id);
    await finalizeRestore();
    return result;
  }

  const transaction = await db.sequelize.transaction();
  try {
    const record = await config.model.findByPk(id, {
      paranoid: false,
      transaction,
    });
    if (!record) throw new Error('Original record not found.');

    await FileService.restoreRelatedFiles(
      { relatedType: resourceType, relatedId: id },
      transaction,
    );
    await record.restore({ transaction });

    await transaction.commit();
    await finalizeRestore();

    return record;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const purgeResource = async (resourceType, id, user) => {
  const config = RESOURCE_CONFIG[resourceType];
  if (!config) throw new Error(`Unknown resource type: ${resourceType}`);

  const transaction = await db.sequelize.transaction();
  try {
    const record = await config.model.findByPk(id, {
      paranoid: false,
      transaction,
    });
    
    if (record) {
      if (resourceType === 'files') {
        await FileService.purgeFile(id, transaction);
      } else {
        await FileService.purgeRelatedFiles(
          { relatedType: resourceType, relatedId: id },
          transaction,
        );
        await record.destroy({ force: true, transaction });
      }
    }
    
    await db.TrashItem.destroy({
      where: { resourceType, resourceId: id },
      transaction,
    });

    await transaction.commit();

    const io = getIO();
    if (io) {
      io.to('admin/trash').emit('admin/trash_deleted', { id });
    }

    await logOperation({
      description: `Permanently deleted ${resourceType} item (${id})`,
      operation: 'DELETE',
      affectedResource: resourceType,
      initiator: user?.email || 'System'
    });

    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};


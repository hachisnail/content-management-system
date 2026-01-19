import { db } from '../models/index.js';
import { buildQueryOptions } from '../utils/queryBuilder.js';

export const findAll = async (queryParams = {}) => {
  const searchableFields = ['description', 'affectedResource', 'initiator', 'operation'];
  const options = buildQueryOptions(queryParams, searchableFields);

  let order = [['createdAt', 'DESC']];
  if (options.order && options.order.length > 0) {
    order = options.order;
  }

  try {
    const { count, rows } = await db.AuditLog.findAndCountAll({
      where: options.where,
      limit: options.limit,
      offset: options.offset,
      order: order,
      subQuery: false, 
      distinct: true, 
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName'],
        required: false, 
        include: [{
          model: db.File,
          as: 'profilePicture',
          attributes: ['id', 'fileName', 'mimeType'],
          required: false,
          // FIX: Don't return the join table data
          through: { attributes: [] } 
        }]
      }]
    });

    return { count, rows };
  } catch (error) {
    console.error('[AuditLog Service] Error fetching logs:', error);
    throw error;
  }
};

export const findById = async (id) => {
  return await db.AuditLog.findByPk(id, {
    include: [{
      model: db.User,
      as: 'user',
      attributes: ['id', 'email', 'firstName', 'lastName'],
      required: false, 
      include: [{
        model: db.File,
        as: 'profilePicture',
        attributes: ['id', 'fileName', 'mimeType'],
        required: false,
        // FIX: Don't return the join table data
        through: { attributes: [] }
      }]
    }]
  });
};
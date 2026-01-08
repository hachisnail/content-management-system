import { db } from '../models/index.js';
import { buildQueryOptions } from '../utils/queryBuilder.js';

export const findAll = async (queryParams = {}) => {
  const searchableFields = ['description', 'affectedResource', 'initiator', 'operation'];
  const options = buildQueryOptions(queryParams, searchableFields);

  // 1. ROBUST SORTING
  // Default to createdAt DESC if no sort provided.
  // We use strict array syntax [['col', 'dir']] so Sequelize handles table aliases automatically.
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

      // CRITICAL: prevents 'Unknown column' errors when sorting on joined tables
      subQuery: false, 
      distinct: true, 

      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName'],
        required: false, // LEFT JOIN (keep log even if user is deleted)
        
        // --- NEW: NESTED PROFILE PICTURE ---
        include: [{
          model: db.File,
          as: 'profilePicture', // Matches alias in models/index.js
          attributes: ['id', 'fileName', 'relatedType'], // Data needed to build the URL
          required: false // LEFT JOIN (user might not have a pic)
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
  return await db.AuditLog.findByPk(id);
};
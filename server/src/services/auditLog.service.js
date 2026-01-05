// server/src/services/auditLog.service.js
import { db } from '../models/index.js';
import { buildQueryOptions } from '../utils/queryBuilder.js';

export const findAll = async (queryParams = {}) => {
  const searchableFields = ['description', 'affectedResource', 'initiator', 'operation'];
  const options = buildQueryOptions(queryParams, searchableFields);

  const { count, rows } = await db.AuditLog.findAndCountAll({
    ...options,
    include: [{
      model: db.User,
      as: 'user', 
      attributes: ['email', 'firstName', 'lastName']
    }],
    distinct: true, 
  });

  return { count, rows };
};

export const findById = async (id) => {
  return await db.AuditLog.findByPk(id); //
};
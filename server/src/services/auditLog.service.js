// server/src/services/auditLog.service.js
import { db } from '../models/index.js';
import { Op } from 'sequelize'; // Required for search operators

export const findAll = async (params = {}) => {
  const where = {};

  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 10;
  const offset = (page - 1) * limit;

  // Search Logic
  if (params.search) {
    where[Op.or] = [
      { description: { [Op.like]: `%${params.search}%` } },
      { affectedResource: { [Op.like]: `%${params.search}%` } },
      { initiator: { [Op.like]: `%${params.search}%` } },
      { operation: { [Op.like]: `%${params.search}%` } },
    ];
  }

  if (params.operation) where.operation = params.operation;

  // Sort Logic
  const sortBy = params.sortBy || 'createdAt';
  const sortDir = (params.sortDir || 'DESC').toUpperCase();

  const { count, rows } = await db.AuditLog.findAndCountAll({
    where,
    // --- JOIN USER TABLE ---
    // This allows us to see who the initiator is if "initiator" is an ID
    include: [{
      model: db.User,
      as: 'user', // Ensure this matches your model association alias
      attributes: ['email', 'firstName', 'lastName']
    }],
    order: [[sortBy, sortDir]],
    limit,
    offset, 
  });

  return { count, rows };
};

export const findById = async (id) => {
  return await db.AuditLog.findByPk(id); //
};
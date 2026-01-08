import { Op } from 'sequelize';

/**
 * Extracts pagination options from query parameters.
 * @param {object} query - The query object from the request (req.query).
 * @returns {{limit: number, offset: number}}
 */
export const getPagination = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  return { limit, offset };
};

/**
 * Builds a Sequelize 'where' clause from query parameters.
 * @param {object} query - The query object from the request (req.query).
 * @param {string[]} [searchableFields=[]] - A list of fields to search against for the 'search' param.
 * @returns {object} A Sequelize 'where' clause object.
 */
export const buildWhereClause = (query, searchableFields = []) => {
  const where = {};
  // Exclude special query params from being treated as direct filters
  const { search, sortBy, sortDir, page, limit, ...filters } = query;

  // Handle generic 'search' parameter across specified fields
  if (search && searchableFields.length > 0) {
    where[Op.or] = searchableFields.map(field => ({
      [field]: { [Op.like]: `%${search}%` }
    }));
  }

  // Handle all other query params as specific filters
  for (const rawKey in filters) {
    if (Object.prototype.hasOwnProperty.call(filters, rawKey)) {
      const value = filters[rawKey];
      
      // --- FIX: Strip '[]' from keys (e.g., 'status[]' -> 'status') ---
      const key = rawKey.endsWith('[]') ? rawKey.slice(0, -2) : rawKey;

      // Special handling for 'role' to check within a JSON array
      if (key === 'role' && value) {
        where.role = { [Op.contains]: [value] };
      } else if (value) {
        where[key] = value;
      }
    }
  }

  return where;
};

/**
 * Determines the sorting order from query parameters.
 * @param {object} query - The query object from the request (req.query).
 * @returns {Array} A Sequelize 'order' clause array.
 */
export const getOrder = (query) => {
  const sortBy = query.sortBy || 'createdAt';
  const sortDir = (query.sortDir || 'DESC').toUpperCase();
  
  // Basic validation to prevent SQL injection in sortDir
  if (sortDir !== 'ASC' && sortDir !== 'DESC') {
    return [['createdAt', 'DESC']];
  }

  return [[sortBy, sortDir]];
};

/**
 * Constructs a full options object for Sequelize's findAndCountAll method.
 * @param {object} query - The query object from the request (req.query).
 * @param {string[]} [searchableFields=[]] - Fields to be used for the generic 'search' param.
 * @returns {{where: object, limit: number, offset: number, order: Array}}
 */
export const buildQueryOptions = (query, searchableFields = []) => {
  const { limit, offset } = getPagination(query);
  const where = buildWhereClause(query, searchableFields);
  const order = getOrder(query);

  return { where, limit, offset, order };
};
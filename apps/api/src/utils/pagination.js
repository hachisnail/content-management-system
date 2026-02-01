import { Op } from 'sequelize';

/**
 * Universal Query Builder
 * Transforms raw req.query into safe Sequelize find options.
 * @param {Object} query - The req.query object
 * @param {Object} config - Whitelist configuration
 * @param {Array} config.searchFields - Fields to search with partial match (LIKE %...%)
 * @param {Array} config.allowedFilters - Fields allowed for exact match filtering
 * @param {Array} config.allowedSort - Fields allowed for sorting
 */
export const buildQuery = (query, { searchFields = [], allowedFilters = [], allowedSort = [] }) => {
  const { page = 1, limit = 10, search, sort_by, sort_dir, ...filters } = query;

  // 1. Pagination Safety (Max 100 items per page)
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit))); 
  const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;

  // 2. Sorting (Default: Newest First)
  let order = [['createdAt', 'DESC']];
  if (sort_by && allowedSort.includes(sort_by)) {
    const direction = sort_dir && ['ASC', 'DESC'].includes(sort_dir.toUpperCase()) 
      ? sort_dir.toUpperCase() 
      : 'ASC';
    order = [[sort_by, direction]];
  }

  // 3. Where Clause Construction
  const where = {};

  // A. Exact Filters (Allow-list only to prevent pollution)
  Object.keys(filters).forEach((key) => {
    if (allowedFilters.includes(key)) {
      const value = filters[key];
      // Support comma-separated values (e.g. status=active,pending)
      if (typeof value === 'string' && value.includes(',')) {
        where[key] = { [Op.in]: value.split(',') };
      } else {
        where[key] = value;
      }
    }
  });

  // B. Fuzzy Search (OR condition across multiple fields)
  if (search && searchFields.length > 0) {
    const searchCondition = searchFields.map((field) => ({
      [field]: { [Op.like]: `%${search}%` },
    }));
    
    // Merge with existing filters using AND
    where[Op.and] = [
      ...(where[Op.and] || []),
      { [Op.or]: searchCondition }
    ];
  }

  return {
    limit: safeLimit,
    offset,
    order,
    where,
  };
};

/**
 * Helper to format the paginated response standard
 */
export const formatPaginated = (rows, count, page, limit) => {
  return {
    data: rows,
    meta: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
    },
  };
};
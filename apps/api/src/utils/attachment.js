import { File, FileLink } from '../models/index.js';

/**
 * Generates a Sequelize 'include' object for fetching associated files.
 * This is still useful to keep your code clean!
 */
export const getFileInclude = (categories = null, alias = 'fileLinks') => {
  const where = {};
  if (categories) {
    where.category = Array.isArray(categories) ? categories : categories;
  }

  return {
    model: FileLink,
    as: alias,
    where: Object.keys(where).length > 0 ? where : undefined,
    required: false, 
    include: [
      {
        model: File,
        as: 'file',
        attributes: ['id', 'path', 'mimetype', 'originalName', 'visibility', 'size']
      }
    ]
  };
};
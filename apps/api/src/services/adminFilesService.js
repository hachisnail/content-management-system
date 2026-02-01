import { File, FileLink, User, sequelize } from '../models/index.js'; 
import { Op } from 'sequelize';
import path from 'path';
import { UserScopes } from "../models/scopes.js"; 

export const adminFilesService = {
  async getAllFiles(queryParams) {
    const { 
      visibility, category, recordType, year, month, search, 
      page = 1, limit = 50 
    } = queryParams;

    // 1. Build Main WHERE clause
    const where = {};
    if (visibility) where.visibility = visibility;
    if (search) where.originalName = { [Op.like]: `%${search}%` };

    // Filter Date via Database (createdAt)
    if (year) {
      const yearNum = parseInt(year);
      let startDate, endDate;

      if (month) {
         const monthNum = parseInt(month) - 1; 
         startDate = new Date(yearNum, monthNum, 1);
         endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59);
      } else {
         startDate = new Date(yearNum, 0, 1);
         endDate = new Date(yearNum, 11, 31, 23, 59, 59);
      }
      
      where.createdAt = { [Op.between]: [startDate, endDate] };
    }

    // [FIX] Filter by RecordType AND Category via Association
    let includeLinks = {
      model: FileLink,
      as: 'links',
      attributes: ['id', 'recordType', 'recordId', 'category']
    };

    if (category || recordType) {
      if (category === 'uncategorized' || recordType === 'uncategorized') {
        // Handle Orphans: Files with NO links
        includeLinks.required = false; 
        where['$links.id$'] = null; 
      } else {
        // Handle Specific Logical Group
        includeLinks.where = {};
        if (category) includeLinks.where.category = category;
        if (recordType) includeLinks.where.recordType = recordType;
        includeLinks.required = true; 
      }
    }

    const limitVal = parseInt(limit);
    const offset = (Math.max(1, parseInt(page)) - 1) * limitVal;

    // 2. Count Total
    const count = await File.count({
      where,
      include: (category || recordType) ? [includeLinks] : [],
      distinct: true,
      col: 'id'
    });

    // 3. Fetch Rows
    const rows = await File.findAll({
      where,
      limit: limitVal,
      offset: offset,
      order: [['createdAt', 'DESC']],
      include: [
        UserScopes.includeUploader(),
        includeLinks 
      ],
      distinct: true 
    });

    // 4. Format rows with DB-based metadata
    const formattedRows = rows.map(file => {
      const f = file.toJSON();
      const date = new Date(f.createdAt);
      
      // Extract Logical Path from DB Link
      let displayRecordType = 'uncategorized';
      let displayCategory = 'others';

      if (f.links && f.links.length > 0) {
          displayRecordType = f.links[0].recordType;
          displayCategory = f.links[0].category;
      }

      const meta = {
        visibility: f.visibility,
        recordType: displayRecordType,
        category: displayCategory,
        // Normalized path for UI: "users/avatar" or "posts/cover"
        logicalPath: `${displayRecordType}/${displayCategory}`,
        year: date.getFullYear().toString(),
        month: (date.getMonth() + 1).toString().padStart(2, '0')
      };

      return { ...f, meta };
    });

    return {
      rows: formattedRows,
      count, 
      page: parseInt(page),
      totalPages: Math.ceil(count / limitVal)
    };
  },

  async getDirectoryTree() {
    // [FIX] Build tree strictly based on DB Link Entries
    // New Hierarchy: RecordType -> Category -> Year -> Month
    const files = await File.findAll({
      attributes: ['id', 'createdAt'], // Visibility removed from grouping
      include: [{
        model: FileLink,
        as: 'links',
        attributes: ['recordType', 'category']
      }]
    });

    const tree = {};

    files.forEach(file => {
      const date = new Date(file.createdAt);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      // Determine Logical Grouping
      let rType = 'uncategorized';
      let cat = 'others';

      if (file.links && file.links.length > 0) {
          rType = file.links[0].recordType || 'misc';
          cat = file.links[0].category || 'general';
      }

      // 1. Ensure RecordType Level (e.g., 'users', 'posts')
      if (!tree[rType]) tree[rType] = {};

      // 2. Ensure Category Level (e.g., 'avatar', 'cover')
      if (!tree[rType][cat]) tree[rType][cat] = {};

      // 3. Ensure Year Level
      if (!tree[rType][cat][year]) tree[rType][cat][year] = [];
      
      // 4. Add Month (if not exists)
      if (!tree[rType][cat][year].includes(month)) {
        tree[rType][cat][year].push(month);
      }
    });

    return tree;
  },

  async updateVisibility(fileIds, newVisibility) {
    if (!['public', 'private'].includes(newVisibility)) {
      throw new Error('Invalid visibility');
    }
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];
    return await File.update(
      { visibility: newVisibility },
      { where: { id: { [Op.in]: ids } } }
    );
  },

  async renameFile(id, newName) {
    const file = await File.findByPk(id);
    if (!file) throw new Error('File not found');
    file.originalName = newName;
    await file.save();
    return file;
  },

  async getOrphanedFiles() {
    // Find files with NO active links
    return await File.findAll({
      include: [{
          model: FileLink,
          as: 'links',
          required: false,
          attributes: ['id']
      }],
      where: {
        '$links.id$': null, 
        deletedAt: null
      },
      include: [{ 
          model: User, 
          as: 'uploader', 
          attributes: ['id', 'email', 'firstName', 'lastName'] 
      }],
      order: [['createdAt', 'DESC']]
    });
  },

  async deleteFile(id) {
    const file = await File.findByPk(id);
    if (!file) throw new Error('File not found');
    await file.destroy(); 
    return true;
  }
};
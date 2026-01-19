import { db } from '../models/index.js';
import { Op } from 'sequelize';
import * as FileService from '../services/file.service.js';
import * as TrashService from '../services/trash.service.js';
import { logOperation } from '../services/logger.js'; // Import Logger

export const getAllTestItems = async (req, res, next) => {
  try {
    const items = await db.TestItem.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.File,
          as: 'attachments',
          attributes: ['id'],
          through: { attributes: [] },
        },
      ],
    });

    const safeItems = items.map((item) => ({
      ...item.toJSON(),
      fileCount: item.attachments ? item.attachments.length : 0,
      attachments: undefined,
    }));

    res.json({ success: true, data: safeItems });
  } catch (error) {
    next(error);
  }
};

// --- Trash Retrieval ---
export const getTrash = async (req, res, next) => {
  try {
    const items = await db.TestItem.findAll({
      where: { deletedAt: { [Op.not]: null } },
      paranoid: false,
      order: [['deletedAt', 'DESC']],
      include: [
        {
          model: db.File,
          as: 'attachments',
          attributes: ['id'],
          through: { attributes: [], paranoid: false },
          paranoid: false,
        },
      ],
    });

    const safeItems = items.map((item) => ({
      ...item.toJSON(),
      fileCount: item.attachments ? item.attachments.length : 0,
      attachments: undefined,
    }));

    res.json({ success: true, data: safeItems });
  } catch (error) {
    next(error);
  }
};

export const createTestItem = async (req, res, next) => {
  try {
    const item = await db.TestItem.create({
      name: req.body.name || 'Untitled Test',
      description: req.body.description || 'Created for file upload testing',
    });
    // Audit Log for Creation
    await logOperation({
      description: `Created test item: ${item.name}`,
      operation: 'CREATE',
      affectedResource: 'test_items',
      initiator: req.user ? req.user.email : 'System',
      afterState: item,
    });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const getTestItem = async (req, res, next) => {
  try {
    const item = await db.TestItem.findByPk(req.params.id, {
      include: [
        {
          model: db.File,
          as: 'attachments',
          attributes: [
            'id',
            'fileName',
            'originalName',
            'mimeType',
            'size',
            'createdAt',
            'path',
          ],
          through: { attributes: ['category'] },
        },
      ],
    });

    if (!item) return res.status(404).json({ message: 'Not Found' });

    const plainItem = item.toJSON();
    const grouped = { general: [], contracts: [], gallery: [], reports: [] };

    if (plainItem.attachments) {
      plainItem.attachments.forEach((file) => {
        const cat = file.FileLink?.category || 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(file);
      });
    }

    plainItem.files = grouped;
    delete plainItem.attachments;

    res.json({ success: true, data: plainItem });
  } catch (error) {
    next(error);
  }
};

export const deleteTestItem = async (req, res, next) => {
  try {
    // 1. Find the item
    const item = await db.TestItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // 2. SOFT DELETE (Move to Trash)
    // We pass userId in options so the 'handleTrashBinSync' hook can record who deleted it.
    await item.destroy({
      userId: req.user ? req.user.email : 'System',
    });

    // 3. AUDIT LOG
    // Explicitly log this action since hooks handles TrashItem creation, not AuditLog
    await logOperation({
      description: `Moved test_items item (${item.name || item.id}) to trash.`,
      operation: 'DELETE', // Soft delete
      affectedResource: 'test_items',
      initiator: req.user ? req.user.email : 'System',
      beforeState: item,
    });

    res.json({ success: true, message: 'Item moved to trash.' });
  } catch (error) {
    next(error);
  }
};

// --- Restore Item ---
export const restoreTestItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Pass req.user to service for Audit Logging inside restoreResource
    await TrashService.restoreResource('test_items', id, req.user);

    res.json({ success: true, message: 'Item restored.' });
  } catch (error) {
    next(error);
  }
};

export const triggerCleanup = async (req, res, next) => {
  try {
    const result = await FileService.purgeOldDeletedFiles();
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

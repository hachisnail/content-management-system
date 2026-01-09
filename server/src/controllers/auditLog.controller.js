import * as AuditLogService from '../services/auditLog.service.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { count, rows } = await AuditLogService.findAll(req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const totalPages = Math.ceil(count / limit);

    res.json({
      data: rows,
      meta: {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- NEW: Get Single Log ---
export const getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await AuditLogService.findById(id);

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found' });
    }

    res.json(log);
  } catch (error) {
    next(error);
  }
};
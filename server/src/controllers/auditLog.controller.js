import * as AuditLogService from '../services/auditLog.service.js';

const sanitizeLog = (log) => {
  const cleanLog = log.toJSON ? log.toJSON() : log;

  // FIX: Flatten 'user.profilePicture' array -> object
  if (cleanLog.user && Array.isArray(cleanLog.user.profilePicture)) {
    cleanLog.user.profilePicture = 
      cleanLog.user.profilePicture.length > 0 
        ? cleanLog.user.profilePicture[0] 
        : null;
  }

  return cleanLog;
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { count, rows } = await AuditLogService.findAll(req.query);
    
    // Flatten arrays for the frontend
    const flattenedRows = rows.map(r => sanitizeLog(r));

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const totalPages = Math.ceil(count / limit);

    res.json({
      data: flattenedRows,
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

export const getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await AuditLogService.findById(id);

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found' });
    }

    res.json(sanitizeLog(log));
  } catch (error) {
    next(error);
  }
};
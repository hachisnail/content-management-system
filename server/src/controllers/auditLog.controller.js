// server/src/controllers/auditLog.controller.js
import * as AuditLogService from '../services/auditLog.service.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    // Pass query params (page, limit, search) to the service
    const { count, rows } = await AuditLogService.findAll(req.query);
    
    // Calculate Metadata based on actual query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const totalPages = Math.ceil(count / limit);

    // Return structured response matching your frontend requirements
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
    next(error); //
  }
};
import * as AuditLogService from '../services/auditLog.service.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLogService.findAll();
    
    // Direct JSON response array to match what useRealtimeResource expects
    res.json(logs);
  } catch (error) {
    next(error);
  }
};
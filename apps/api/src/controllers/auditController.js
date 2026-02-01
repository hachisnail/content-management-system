import { auditService } from '../services/auditService.js';

// [FIX] Added 'next' to arguments
export const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await auditService.findAll(req.query);
    
    res.json(logs);
  } catch (error) {
    console.error('Audit Log Controller Error:', error);
    
    next(error);
  }
};

// [FIX] Added 'next' to arguments
export const getAuditLogById = async (req, res, next) => {
  try {
    const log = await auditService.findById(req.params.id);
    res.json(log);
  } catch (error) {
    next(error);
  }
};
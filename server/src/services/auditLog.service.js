import { db } from '../models/index.js';


export const findAll = async () => {
  // Sort by newest first by default
  return await db.AuditLog.findAll({
    order: [['createdAt', 'DESC']], 
    limit: 100 // Safety limit, maybe paginate later
  });
};
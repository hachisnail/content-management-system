import client from './client';

export const auditApi = {
  getLogs: async (params) => {
    const response = await client.get('/audit-logs', { params });
    return response.data;
  },

  // [FIX] Renamed to getAuditLog to match consumer expectations
  getAuditLog: async (id) => {
    const response = await client.get(`/audit-logs/${id}`);
    return response.data;
  },

  getResourceTypes: async () => {
    const response = await client.get('/audit-logs/resources');
    return response.data;
  }
};
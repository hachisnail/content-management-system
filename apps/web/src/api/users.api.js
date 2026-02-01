import client from './client';

export const userApi = {
  list: async (params) => {
    const response = await client.get('/users', { params });
    return response.data; // Expecting { data: [], meta: {} }
  },
  
  get: async (id) => {
    const response = await client.get(`/users/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await client.patch(`/users/${id}`, data);
    return response.data;
  },

  disable: async (id, isActive) => {
    // Assuming backend accepts { isActive: boolean } or { status: 'active'|'inactive' }
    const response = await client.patch(`/users/${id}`, { isActive }); 
    return response.data;
  },

  delete: async (id) => {
    const response = await client.delete(`/users/${id}`);
    return response.data;
  },

  forceDisconnect: async (id) => {
    // Needs a backend endpoint like POST /users/:id/logout or /disconnect
    const response = await client.post(`/users/${id}/disconnect`);
    return response.data;
  }
};
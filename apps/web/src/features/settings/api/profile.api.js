import client from '../../../api/client';

export const profileApi = {
  // Get current user details
  get: async () => {
    const response = await client.get('/users/me');
    return response.data;
  },

  // Update profile (Self)
  update: async (data) => {
    // Assuming the backend endpoint /users/me accepts PATCH
    const response = await client.patch('/users/me', data);
    return response.data;
  },

  // Change Password
  changePassword: async (data) => {
    const response = await client.post('/auth/change-password', data);
    return response.data;
  }
};
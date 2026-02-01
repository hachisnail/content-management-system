import apiClient from './client'; // Fixed path

export const fetchUsers = async (params) => {
  const { data } = await apiClient.get('/users', { params });
  return data;
};

export const updateUser = async (id, payload) => {
  const { data } = await apiClient.patch(`/users/${id}`, payload);
  return data;
};
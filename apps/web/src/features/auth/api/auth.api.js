import apiClient from '../../../api/client';

export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const inviteUser = async (data) => {
  const response = await apiClient.post('/auth/invite', data);
  return response.data;
};

export const completeRegistration = async (payload) => {
  const response = await apiClient.post('/auth/register/complete', payload);
  return response.data;
};

export const onboardSuperadmin = async (payload) => {
  const response = await apiClient.post('/auth/onboard', payload);
  return response.data;
};

export const checkOnboarding = async () => {
  const response = await apiClient.get('/auth/onboard/status');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (payload) => {
  const response = await apiClient.post('/auth/reset-password', payload);
  return response.data;
};

export const resendInvite = async (userId) => {
  const response = await client.post(`/auth/invite/${userId}/resend`);
  return response.data;
};

export const validateInvitationToken = async (token) => {
  const response = await apiClient.get(`/auth/invite/validate?token=${token}`);
  return response.data; // Expects { valid: boolean, message?: string, email?: string }
};

export const validateResetToken = async (token) => {
  const response = await apiClient.get(`/auth/reset-password/validate?token=${token}`);
  return response.data; // Expects { valid: boolean, message?: string }
};
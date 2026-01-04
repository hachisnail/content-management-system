// client/src/api.js
import axios from 'axios';
import { API_BASE_URL } from './config';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, 
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timed out. Server is busy.'));
      }
      return Promise.reject(new Error('Network error. Check connection.'));
    }

    const { status, config } = error.response;
    const errorMessage = error.response.data?.message || error.message;

    // Handle 401 Unauthorized
    if (status === 401 && !config.url.includes('/auth/login')) {
      // Dispatch a custom event so AuthContext can handle the cleanup
      // This keeps api.js pure and avoids circular dependencies
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject({ status, message: errorMessage });
  }
);

const api = {
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),
  
  // Login
  login: async (email, password) => {
    try {
      return await axiosInstance.post('/auth/login', { email, password });
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  // Logout - JUST the API call. No redirects here.
  logout: async () => {
    return await axiosInstance.post('/auth/logout');
  },
};

export default api;
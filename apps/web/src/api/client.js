import axios from 'axios';

export const AUTH_SESSION_EXPIRED = 'auth:session_expired';

const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api', 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401) {

      if (originalRequest.url && originalRequest.url.includes('/auth/me')) {
         return Promise.reject(error);
      }

      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
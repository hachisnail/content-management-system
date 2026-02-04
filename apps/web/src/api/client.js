import axios from 'axios';

// Export the event name for consistency
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
    // Check for 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Dispatch a custom event that AuthProvider will listen to
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
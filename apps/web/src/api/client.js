import axios from 'axios';

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
    // Optional: Handle global 401 (Unauthorized) to trigger logout
    if (error.response && error.response.status === 401) {
      // You might emit a custom event or use a global store to logout
      // window.location.href = '/login'; // distinct from forced_logout
    }
    return Promise.reject(error);
  }
);

export default apiClient;
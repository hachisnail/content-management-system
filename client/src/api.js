import axios from 'axios';
import { API_BASE_URL } from './config';

// 1. Create the Axios Instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout for robustness
});

// 2. Request Interceptor (Optional: Good place for CSRF tokens)
axiosInstance.interceptors.request.use(
  (config) => {
    // If you need to attach a CSRF token from a meta tag or cookie, do it here.
    // const csrfToken = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    // if (csrfToken) config.headers['X-XSRF-TOKEN'] = csrfToken[1];
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (Global Error Handling)
axiosInstance.interceptors.response.use(
  (response) => {
    // Return only data to simplify calling code
    return response.data;
  },
  (error) => {
    // A. Handle Network Errors (Server down / No Internet)
    if (!error.response) {
      console.error('Network Error:', error);
      return Promise.reject(new Error('Network error - please check your internet connection or server status.'));
    }

    const { status, config } = error.response;
    const errorMessage = error.response.data?.message || error.message || 'An unknown error occurred';

    // B. Handle Unauthorized (401)
    if (status === 401) {
      // CRITICAL: Don't auto-logout if the 401 came from the Login endpoint itself.
      // If we don't check this, a wrong password will cause a page refresh loop.
      const isLoginRequest = config.url.includes('/auth/login');

      if (!isLoginRequest) {
        // Clear local storage (user preferences, not tokens, since we use cookies)
        localStorage.removeItem('user');
        
        // Redirect to login
        // window.location.href = '/login-test'; 
        // Better: Use a custom event so React/Vue can handle the redirect smoothly
        window.location.href = '/login-test?session_expired=true';
      }
    }

    // C. Handle Server Errors (500)
    if (status >= 500) {
        console.error('Server Error:', errorMessage);
    }

    // Return a clean error object to the calling function
    return Promise.reject({ 
        status, 
        message: errorMessage, 
        data: error.response.data 
    });
  }
);

// 4. API Service Object
const api = {
  // Expose standard methods using the instance
  get: (url, config = {}) => axiosInstance.get(url, config),
  post: (url, data, config = {}) => axiosInstance.post(url, data, config),
  put: (url, data, config = {}) => axiosInstance.put(url, data, config),
  delete: (url, config = {}) => axiosInstance.delete(url, config),
  patch: (url, data, config = {}) => axiosInstance.patch(url, data, config),

  // 5. Custom Auth Methods
  login: async (email, password) => {
    try {
      // We use the instance here to keep config consistent.
      // The interceptor will run, but we bypass the auto-redirect logic 
      // because of the check on line 45.
      const response = await axiosInstance.post('/auth/login', { email, password });
      return response;
    } catch (error) {
      // Re-throw a clean error message for the UI to display
      throw new Error(error.message || 'Login failed');
    }
  },

logout: async () => {
    try {
      console.log("Attempting logout..."); // Debug Log
      
      // 1. Force the POST request
      // Ensure your API_BASE_URL matches your server (e.g., http://localhost:3000/api)
      await axiosInstance.post('/auth/logout');
      
      console.log("Logout request sent to server.");
    } catch (error) {
       // Check the Browser Console for this error! 
       // If you see 404, your URL is wrong.
       console.error("Logout Network Error:", error);
    } finally {
      // 2. Clear Client Data
      localStorage.removeItem('user');
      
      // 3. Redirect ONLY after the attempt is done
      // Using window.location.replace prevents the user from clicking "Back" to a protected page
      window.location.replace('/login-test');
    }
  },
};

export default api;
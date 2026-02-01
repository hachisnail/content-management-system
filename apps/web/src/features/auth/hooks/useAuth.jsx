import { useState, useContext, createContext, useCallback } from 'react';
import * as authApi from '../api/auth.api'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [logoutMessage, setLogoutMessage] = useState(null);

  const login = async (credentials) => {
    setLogoutMessage(null);
    try {
      const response = await authApi.login(credentials);
      const userData = response.user;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed';
      throw new Error(message);
    }
  };

  const onboard = async (data) => {
    setLogoutMessage(null);
    try {
      const response = await authApi.onboardSuperadmin(data);
      const userData = response.user;

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Onboarding failed';
      throw new Error(message);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  }, []);

  // [FIX] Updated logout to accept a reason string
  const logout = useCallback(async (callApi = true, reason = null) => {
    try {
      // If there is a specific reason (Force Logout/Ban), set the message
      if (reason) {
        setLogoutMessage(reason);
      } else {
        setLogoutMessage(null); // Clear previous messages on voluntary logout
      }

      if (callApi) {
        await authApi.logout();
      }
    } catch (err) {
      console.error("Logout API failed (ignoring):", err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  }, []);

  // [NEW] Helper to close the alert manually
  const dismissLogoutMessage = () => setLogoutMessage(null);

  const updateProfile = (updates) => {
    setUser(prev => {
      const newUser = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      onboard, 
      logout, 
      updateProfile, 
      refreshUser, 
      logoutMessage, 
      dismissLogoutMessage 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
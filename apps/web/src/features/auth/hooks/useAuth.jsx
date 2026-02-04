import { useState, useContext, createContext, useCallback, useEffect } from 'react';
import * as authApi from '../api/auth.api'; 
import { AUTH_SESSION_EXPIRED } from '../../../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('user')); 
  const [logoutMessage, setLogoutMessage] = useState(null);

  // Define logout first so it can be used in effects
  const logout = useCallback(async (callApi = true, reason = null) => {
    try {
      if (reason) setLogoutMessage(reason);
      else setLogoutMessage(null);

      // Only call API if we think the session is still valid (voluntary logout)
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

const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error("Failed to verify session:", error);
      // Optional: If check fails, clear user immediately to prevent flash
      // setUser(null); 
      // localStorage.removeItem('user');
    } finally {
      // [ADD] Verification done
      setIsLoading(false); 
    }
  }, []);

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

  const updateProfile = (updates) => {
    setUser(prev => {
      const newUser = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  };

  const dismissLogoutMessage = () => setLogoutMessage(null);

  // --- EFFECT: Handle Automatic Logout (401 Interceptor) ---
  useEffect(() => {
    const handleSessionExpired = () => {
      if (user) { // Only trigger if we currently think we are logged in
        logout(false, "Your session has expired. Please log in again.");
      }
    };

    window.addEventListener(AUTH_SESSION_EXPIRED, handleSessionExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED, handleSessionExpired);
  }, [user, logout]);

  // --- EFFECT: Verify Session on Mount ---
  useEffect(() => {
    if (user) {
      refreshUser();
    } else {
      setIsLoading(false); // No user, not loading
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
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
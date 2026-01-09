import React, { createContext, useContext, useState, useEffect } from 'react';
import socket from '../socket';
import api from '../api';
import { useRealtimeResource } from '../hooks/useRealtimeResource';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 1. Initialize State from Local Storage
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // 2. Fetch Fresh Data (Real-time) using the new centralized hook
  const { 
    data: liveUser, 
    loading: liveLoading, 
    error: liveError 
  } = useRealtimeResource('users', { 
    id: session?.id, 
    isEnabled: !!session?.id 
  });

  // 3. SYNC: Merge Real-time Data into Session
  // This effect runs whenever the liveUser data from the hook changes.
  useEffect(() => {
    if (liveUser && !Array.isArray(liveUser)) {
       setSession(prev => {
          // Ensure we don't wipe the session if liveUser is briefly null during a delete
          const newSessionData = { ...prev, ...liveUser };
          localStorage.setItem('user', JSON.stringify(newSessionData));
          return newSessionData;
       });
    }
  }, [liveUser]);

  // 4. Loading State
  const loading = liveLoading && !!session;

  // --- ACTIONS ---

  useEffect(() => {
    if (session && !socket.connected) {
      socket.connect();
    }
  }, [session]);

  const login = (userData) => {
    setSession(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (!socket.connected) socket.connect();
  };

  const logout = async (callApi = true) => {
    setSession(null);
    localStorage.removeItem('user');
    if (socket.connected) socket.disconnect();

    if (callApi) {
      api.logout().catch(err => console.error("Logout API failed (harmless):", err));
    }
  };

  // --- GLOBAL EVENT LISTENERS ---

  useEffect(() => {
    const handleUnauthorized = () => {
        logout(false); 
        window.location.href = '/auth/login?session_expired=true';
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const handleAuthInvalidated = () => {
      logout(false);
      window.location.href = '/auth/login?reason=invalidated';
    };

    const handleForceLogout = () => {
      logout(false);
      window.location.href = '/auth/login?reason=force_logout';
    };

    socket.on('auth_invalidated', handleAuthInvalidated);
    socket.on('force_logout', handleForceLogout);

    return () => {
      socket.off('auth_invalidated', handleAuthInvalidated);
      socket.off('force_logout', handleForceLogout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user: session, // The UI now always reads from 'session', enabling optimistic updates
      login, 
      logout, 
      loading, 
      error: liveError,
      isAuthenticated: !!session 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
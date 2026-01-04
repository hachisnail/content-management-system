// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import socket from '../socket';
import api from '../api';
import useRealtimeResource from '../hooks/useRealtimeResource';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // CRITICAL FIX: 
  // We pass a dummy ID ('_guest_') when session is null. 
  // This forces the hook into "Singleton Mode" (defaulting to null) 
  // instead of "List Mode" (defaulting to []).
  const { 
    data: liveUser, 
    loading: liveLoading, 
    error: liveError 
  } = useRealtimeResource('users', { 
    id: session?.id || '_guest_', 
    isEnabled: !!session?.id 
  });

  // STRICT LOGIC: If session is null, user MUST be null.
  // We also explicitly handle the case where liveUser might be an array to be safe.
  const user = session 
    ? (Array.isArray(liveUser) ? session : (liveUser || session)) 
    : null;

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
    // 1. Clear Client State IMMEDIATELY
    setSession(null);
    localStorage.removeItem('user');
    if (socket.connected) socket.disconnect();

    // 2. Call API in the background
    if (callApi) {
      api.logout().catch(err => console.error("Logout API failed (harmless):", err));
    }
  };

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
      user, 
      login, 
      logout, 
      loading, 
      error: liveError,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
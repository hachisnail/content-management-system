// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes.jsx';
import './index.css'; 
import socket from './socket';
import api from './api'; 

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      if (!socket.connected) socket.connect();
    }
    setLoading(false);

    // --- CLEANUP HELPER ---
    const cleanupClient = () => {
      setUser(null);
      localStorage.removeItem('user');
      if (socket.connected) socket.disconnect();
    };

    const handleAuthInvalidated = (data) => {
      console.log('Authentication invalidated:', data);
      cleanupClient();
      // Redirect with specific query param
      window.location.href = '/login-test?reason=invalidated';
    };

    const handleForceLogout = (data) => {
      console.log('Forced logout:', data);
      cleanupClient();
      // Redirect with specific query param
      window.location.href = '/login-test?reason=force_logout';
    };

    socket.on('auth_invalidated', handleAuthInvalidated);
    socket.on('force_logout', handleForceLogout);

    return () => {
      socket.off('auth_invalidated', handleAuthInvalidated);
      socket.off('force_logout', handleForceLogout);
    };
  }, []); 

  const handleLogin = (user) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    if (!socket.connected) socket.connect();
  };

  const logout = async () => {
    try {
      await api.logout(); 
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      if (socket.connected) socket.disconnect();
      window.location.href = '/login-test';
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-lg">Loading application...</div>;
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} handleLogin={handleLogin} logout={logout} />
    </BrowserRouter>
  );
}

export default App;
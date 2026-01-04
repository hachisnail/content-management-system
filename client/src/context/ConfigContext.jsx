import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { LoadingSpinner } from '../components/StateComponents';

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.get('/config/roles');
        setConfig(data);
      } catch (err) {
        console.error("Failed to load system config:", err);
        setError("Failed to load role configuration.");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  /**
   * Universal Permission Checker
   */
  const hasPermission = (user, permissionName) => {
    if (!config || !user) return false;
    
    // Normalize user roles to array
    let userRoles = [];
    if (Array.isArray(user.role)) {
      userRoles = user.role;
    } else if (user.role) {
      userRoles = [user.role];
    }

    // Check against the Dynamic Definitions
    return userRoles.some(role => {
      const allowed = config.ROLE_DEFINITIONS[role] || [];
      return allowed.includes(permissionName);
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner message="Loading System Config..." /></div>;
  if (error) return <div className="h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <ConfigContext.Provider value={{ 
      ROLES: config.ROLES, 
      PERMISSIONS: config.PERMISSIONS, 
      ROLE_DEFINITIONS: config.ROLE_DEFINITIONS,
      hasPermission 
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
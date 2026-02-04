import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessControl } from 'accesscontrol';
import apiClient from '../api/client';
import { useAuth } from '../features/auth/hooks/useAuth';

const PermissionContext = createContext(null);

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) throw new Error("usePermission must be used within a PermissionProvider");
  return context;
};

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth(); 
  
  const [ac, setAc] = useState(new AccessControl()); 
  const [hierarchy, setHierarchy] = useState({}); // Stores { superadmin: 100, guest: 0 }
  const [rolesConfig, setRolesConfig] = useState({});
  const [resourcesConfig, setResourcesConfig] = useState({}); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false); 
      return; 
    }

    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const { data } = await apiClient.get('/config/roles');
        
        if (data.grants) setAc(new AccessControl(data.grants));
        if (data.ROLE_HIERARCHY) setHierarchy(data.ROLE_HIERARCHY);
        if (data.ROLES) setRolesConfig(data.ROLES);
        if (data.RESOURCES) setResourcesConfig(data.RESOURCES);
        
      } catch (err) {
        console.error("Failed to sync permissions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [user]);

  const can = (action, resource) => {
    if (isLoading || !user || !user.roles) return { granted: false };
    
    const hasPermission = user.roles.some(role => {
      try {
        return ac.can(role)[action](resource).granted;
      } catch (e) {
        return false;
      }
    });

    return { granted: hasPermission };
  };

  const canManageUser = (targetUser) => {
    if (!user || !targetUser) return false;
    if (user.id === targetUser.id) return false; 

    const currentRank = Math.max(...(user.roles || []).map(r => hierarchy[r] || 0));
    const targetRank = Math.max(...(targetUser.roles || []).map(r => hierarchy[r] || 0));

    if (user.roles.includes(rolesConfig.SUPERADMIN)) return true;

    return currentRank > targetRank;
  };

  return (
    <PermissionContext.Provider value={{ 
      can, 
      canManageUser, 
      rolesConfig,     
      resourcesConfig, 
      hierarchy, 
      isLoading 
    }}>
      {children}
    </PermissionContext.Provider>
  );
};
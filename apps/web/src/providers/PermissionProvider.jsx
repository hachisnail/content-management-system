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
  const [ac, setAc] = useState(new AccessControl()); // Default deny-all
  const [hierarchy, setHierarchy] = useState({});
  const [rolesConfig, setRolesConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // 1. Sync Rules from Backend on Mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // [CRITICAL] Fetch the Single Source of Truth from Backend
        const { data } = await apiClient.get('/config/roles');
        
        // Hydrate AccessControl with backend grants
        if (data.grants) setAc(new AccessControl(data.grants));
        if (data.ROLE_HIERARCHY) setHierarchy(data.ROLE_HIERARCHY);
        if (data.ROLES) setRolesConfig(data.ROLES);
        
      } catch (err) {
        console.error("Failed to sync permissions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have a token (or if your endpoint is public)
    fetchConfig();
  }, []);

  // 2. "Can I do X on Resource Y?"
  const can = (action, resource) => {
    if (isLoading || !user || !user.roles) return { granted: false };
    
    // Check if ANY of the user's roles grant permission
    const hasPermission = user.roles.some(role => {
      try {
        return ac.can(role)[action](resource).granted;
      } catch (e) {
        return false;
      }
    });

    return { granted: hasPermission };
  };

  // 3. "Can I manage (edit/delete) this specific user?"
  // Enforces the Rank Hierarchy (e.g., Admin cannot delete Superadmin)
  const canManageUser = (targetUser) => {
    if (!user || !targetUser) return false;
    if (user.id === targetUser.id) return false; // Self-management is handled in Settings

    // Get numeric ranks from the fetched hierarchy
    const currentRank = Math.max(...(user.roles || []).map(r => hierarchy[r] || 0));
    const targetRank = Math.max(...(targetUser.roles || []).map(r => hierarchy[r] || 0));

    // Superadmin bypass (using the config key, not hardcoded string)
    if (user.roles.includes(rolesConfig.SUPERADMIN)) return true;

    // Strict Rule: You must be STRICTLY higher rank to manage someone
    return currentRank > targetRank;
  };

  return (
    <PermissionContext.Provider value={{ can, canManageUser, rolesConfig, isLoading }}>
      {children}
    </PermissionContext.Provider>
  );
};
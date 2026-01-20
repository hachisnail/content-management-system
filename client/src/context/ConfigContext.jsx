import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../api";
import { LoadingSpinner, ErrorAlert } from "../components/StateComponents";

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/config");
      setConfig(data);
    } catch (err) {
      console.error("Failed to load system config:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const can = useCallback((permissionName) => {
    if (!config || !config.my_permissions) return false;
    return config.my_permissions.includes(permissionName);
  }, [config]);


/**
   * LEGACY/ADVANCED: Checks ANY user's permissions via their Role.
   * Use this when checking if a "target user" (not you) has a permission.
   */
  const hasPermission = (user, permissionName) => {
    if (!config || !user) return false;
    
    // Optimization: If checking myself, use the fast path
    // Note: requires you to know if 'user' is 'me', usually simplified by just using can() directly
    
    let userRoles = Array.isArray(user.role) ? user.role : [user.role];

    return userRoles.some((role) => {
      const allowed = config.ROLE_DEFINITIONS?.[role] || [];
      return allowed.includes(permissionName);
    });
  };


  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <LoadingSpinner
          message="Initializing System..."
          subtitle="Loading permissions and role configurations"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full">
          <ErrorAlert
            title="System Initialization Failed"
            message={
              error.message ||
              "Unable to retrieve role configurations from the server."
            }
            errorCode="ERR_CONFIG_LOAD"
            onRetry={fetchConfig}
            className="shadow-xl border-red-200"
          />
        </div>
      </div>
    );
  }

return (
    <ConfigContext.Provider
      value={{
        ROLES: config?.ROLES || {},
        PERMISSIONS: config?.PERMISSIONS || {},
        ROLE_DEFINITIONS: config?.ROLE_DEFINITIONS || {},
        myPermissions: config?.my_permissions || [], 
        hasPermission, // Keep for backward compatibility
        can,           // <--- NEW: Use this in your pages!
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

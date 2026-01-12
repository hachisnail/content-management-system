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

  // Extracted fetch logic to allow retries
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/config/roles");
      setConfig(data);
    } catch (err) {
      console.error("Failed to load system config:", err);
      setError(err); // Store the full error object for the UI to handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

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
    return userRoles.some((role) => {
      const allowed = config.ROLE_DEFINITIONS[role] || [];
      return allowed.includes(permissionName);
    });
  };

  // --- VISUAL STATES ---

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
        ROLES: config.ROLES,
        PERMISSIONS: config.PERMISSIONS,
        ROLE_DEFINITIONS: config.ROLE_DEFINITIONS,
        hasPermission,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";
import { usePublicConfig } from "../../context/PublicContext";
import { Alert } from "../UI";
import { LoadingSpinner } from "./StateComponents";

export const RequireFeature = ({ flag, children }) => {
  const config = usePublicConfig();

  if (config.loading) return <LoadingSpinner />;

  if (config[flag] === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full">
          <Alert
            type="warning"
            title="Feature Unavailable"
            message="This feature is currently disabled by the system administrator."
          />
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner message="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export const RequirePermission = ({ permission, children }) => {
  const { can } = useConfig();

  if (permission && !can(permission)) {
    throw new Response("Access Denied", { status: 403 });
  }

  return children ? children : <Outlet />;
};

import { useAuth } from "../../features/auth/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Show a full-screen spinner while we verify the cookie
    return (
      <div className="h-screen w-full flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};
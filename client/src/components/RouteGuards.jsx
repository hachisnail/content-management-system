import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { LoadingSpinner } from "./StateComponents";

export const RequireAuth = () => {
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

  return <Outlet />;
};

export const RequirePermission = ({ permission }) => {
  const { user } = useAuth();
  const { hasPermission } = useConfig();

  if (!user) return null;

  if (permission && !hasPermission(user, permission)) {
    // FIX: Throw a 403 Response instead of rendering a component.
    // This forces the router to bubble up to the Layout's errorElement,
    // causing the Sidebar and Header to unmount.
    throw new Response("You do not have permission to view this page.", {
      status: 403,
      statusText: "Access Denied",
    });
  }

  return <Outlet />;
};

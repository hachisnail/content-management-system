import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth'; // Importing directly is safer

export const ProtectedRoute = () => {
  const { user } = useAuth();

  // If user is null, they are not authenticated
  const isAuthenticated = !!user;

  // Since we read from localStorage synchronously, we don't strictly need a loading spinner here 
  // unless you implement an async "verify token" call in AuthProvider later.
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/private/Dashboard';
import Monitor from './pages/private/Monitor';
import AuditLogs from './pages/private/AuditLogs';
import AdminTest from './pages/private/AdminTest';
import LoginTest from './pages/LoginTest';
import SocketTest from './pages/SocketTest';

import Register from './pages/public/Register';
import CompleteRegistration from './pages/public/CompleteRegistration';

// Guards
const RequireAuth = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* --- PUBLIC ROUTES --- */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginTest />} />
          <Route path="register" element={<Register />} />
          <Route path="complete-registration" element={<CompleteRegistration />} />
      </Route>

      {/* --- PRIVATE APP SHELL --- */}
      <Route element={<RequireAuth />}>
        <Route element={<MainLayout />}>
          
          {/* All these pages render INSIDE the MainLayout Outlet */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="monitor" element={<Monitor />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="admin-test" element={<AdminTest />} />
          <Route path="socket-test" element={<SocketTest />} />
          
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
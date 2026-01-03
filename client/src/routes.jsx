// client/src/routes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginTest from './pages/LoginTest';
import SocketTest from './pages/SocketTest';
import Dashboard from './pages/private/Dashboard';
import AdminTest from './pages/private/AdminTest';
import TestDashboard from './pages/private/TestDashboard';
import Monitor from './pages/private/Monitor';
import Register from './pages/public/Register';
import CompleteRegistration from './pages/public/CompleteRegistration';
import AuditLogs from './pages/private/AuditLogs';

const Home = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-800">Welcome to CMS MIS Client!</h1>
    <p className="mt-2 text-lg text-gray-600">Use the navigation above to test API and Socket functionalities.</p>
  </div>
);

const PrivateWrapper = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login-test" replace />;
};

export const AppRoutes = ({ user, handleLogin, logout }) => {
  return (
    <Layout user={user} logout={logout} isAuthenticated={!!user}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
        <Route path="/login-test" element={<LoginTest handleLogin={handleLogin} isAuthenticated={!!user} />} />
        <Route path="/socket-test" element={<SocketTest />} />
        <Route
          path="/dashboard"
          element={
            <PrivateWrapper isAuthenticated={!!user}>
              <Dashboard user={user} />
            </PrivateWrapper>
          }
        />
        <Route
          path="/admin-test"
          element={
            <PrivateWrapper isAuthenticated={!!user}>
              <AdminTest />
            </PrivateWrapper>
          }
        />
        <Route
          path="/test-dashboard"
          element={
            <PrivateWrapper isAuthenticated={!!user}>
              <TestDashboard />
            </PrivateWrapper>
          }
        />
        <Route
          path="/monitor"
          element={
            <PrivateWrapper isAuthenticated={!!user}>
              <Monitor user={user} />
            </PrivateWrapper>
          }
        />
        <Route path="/audit-logs" element={<PrivateWrapper isAuthenticated={!!user}>
          <AuditLogs />
        </PrivateWrapper>} />
        {/* Add other routes here */}
      </Routes>
    </Layout>
  );
};

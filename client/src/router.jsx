import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";

// --- LAYOUTS ---
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { RequireAuth, RequirePermission } from "./components/RouteGuards";

// --- PUBLIC PAGES ---
import LoginTest from "./pages/LoginTest";
import Register from "./pages/public/Register";
import CompleteRegistration from "./pages/public/CompleteRegistration";
import ErrorPage from "./pages/error/ErrorPage"; // <--- IMPORT ADDED

// --- PRIVATE MODULES ---
import Dashboard from "./pages/private/dashboard";
import Profile from "./pages/private/user-profile";

// Users Module
import UserDirectory from "./pages/private/users-dashboard";
import InviteUser from "./pages/private/users-dashboard/subpages/InviteUser";
import UserProfile from "./pages/private/users-dashboard/subpages/UserProfile";

// Audit Logs Module
import AuditLogs from "./pages/private/audit-logs";
import AuditLogDetails from "./pages/private/audit-logs/subpages/AuditLogDetails";

// --- DEVELOPMENT / ADMIN TOOLS ---
import Monitor from "./pages/private/_development_pages/Monitor";
import AdminTest from "./pages/private/_development_pages/AdminTest";
import SocketTest from "./pages/private/_development_pages/SocketTest";
import TestDashboard from "./pages/private/_development_pages/TestDashboard";

// Permission Constants
const P = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_MONITOR: "view_monitor",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  VIEW_ADMIN_TOOLS: "view_admin_tools",
  VIEW_SOCKET_TEST: "view_socket_test",
  VIEW_USERS: "view_users",
  MANAGE_USERS: "manage_users",
  CREATE_USERS: "create_users",
};

const routes = createRoutesFromElements(
  <Route>
    {/* 1. PUBLIC AUTHENTICATION */}
    <Route
      path="/auth"
      element={<AuthLayout />}
      errorElement={<ErrorBoundary />}
    >
      <Route path="login" element={<LoginTest />} />
      <Route path="register" element={<Register />} />
    </Route>

    <Route
      path="/complete-registration"
      element={<CompleteRegistration />}
      errorElement={<ErrorBoundary />}
    />

    {/* 2. PROTECTED APP SHELL */}
    <Route element={<RequireAuth />}>
      <Route path="/" element={<MainLayout />} errorElement={<ErrorBoundary />}>
        
        {/* Redirect Root to Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Core Pages */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />

        {/* --- MODULE: USER MANAGEMENT --- */}
        <Route element={<RequirePermission permission={P.VIEW_USERS} />}>
          <Route path="users" element={<UserDirectory />} />
          <Route path="users/:id" element={<UserProfile />} />
        </Route>
        
        <Route element={<RequirePermission permission={P.CREATE_USERS} />}>
          <Route path="users/invite" element={<InviteUser />} />
        </Route>

        {/* --- MODULE: SYSTEM LOGS --- */}
        <Route element={<RequirePermission permission={P.VIEW_AUDIT_LOGS} />}>
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="audit-logs/:id" element={<AuditLogDetails />} />
        </Route>

        {/* --- MODULE: DEVELOPMENT & ADMIN TOOLS --- */}
        <Route element={<RequirePermission permission={P.VIEW_MONITOR} />}>
          <Route path="monitor" element={<Monitor />} />
        </Route>

        <Route element={<RequirePermission permission={P.VIEW_ADMIN_TOOLS} />}>
          <Route path="admin-test" element={<AdminTest />} />
        </Route>

        <Route element={<RequirePermission permission={P.VIEW_SOCKET_TEST} />}>
          <Route path="socket-test" element={<SocketTest />} />
          <Route path="test-dashboard" element={<TestDashboard />} />
        </Route>

      </Route>
    </Route>

    {/* 3. CATCH-ALL (404) */}
    {/* UPDATED: Now renders the ErrorPage instead of redirecting */}
    <Route path="*" element={<ErrorPage code={404} />} />
  </Route>
);

export const router = createBrowserRouter(routes);
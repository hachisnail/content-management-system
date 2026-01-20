// src/routeConfig.jsx
import { LayoutGrid, Users, FileCode, Trash2, Activity, Zap, ShieldAlert, User, Database } from "lucide-react";

/* Public Pages */
import LandingPage from "../pages/public/home";
import LoginTest from "../pages/LoginTest";
import CompleteRegistration from "../pages/public/CompleteRegistration";
import SetupAdmin from "../pages/public/SetupAdmin";
import Register from "../pages/public/Register"; // Ensure this import exists

/* Private Pages */
import Dashboard from "../pages/dashboard";
import Profile from "../pages/private/user-profile";
import UserDirectory from "../pages/private/users-dashboard";
import InviteUser from "../pages/private/users-dashboard/subpages/InviteUser";
import UserProfile from "../pages/private/users-dashboard/subpages/UserProfile";
import AuditLogs from "../pages/private/audit-logs";
import AuditLogDetails from "../pages/private/audit-logs/subpages/AuditLogDetails";
import GeneralTrashBin from "../pages/private/trash-bin";
import TrashItemDetails from "../pages/private/trash-bin/subpages/TrashItemDetails";
import Monitor from "../pages/private/_development_pages/Monitor";
import AdminTest from "../pages/private/_development_pages/AdminTest";
import SocketTest from "../pages/private/_development_pages/SocketTest";
import TestDashboard from "../pages/private/_development_pages/TestDashboard";
import FileTestPage from "../pages/test/FileTestPage";

// Permissions Constants
export const P = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_MONITOR: "view_monitor",
  VIEW_AUDIT_LOGS: "read_audit_logs",
  VIEW_ADMIN_TOOLS: "view_admin_tools",
  VIEW_SOCKET_TEST: "view_socket_test",
  VIEW_USERS: "read_users",
  CREATE_USERS: "create_users",
  READ_TRASH: "read_trash",
};

/**
 * routeConfig structure:
 * - path: The URL path
 * - element: The component to render
 * - permission: Required permission (Private only)
 * - isPublic: Boolean to distinguish public routes
 * - featureFlag: Optional flag for RequireFeature
 * - nav: Metadata for sidebar
 */
export const routeConfig = [
  /* =========================
     PUBLIC ROUTES
  ========================= */
  {
    path: "/",
    element: <LandingPage />,
    isPublic: true,
  },
  {
    path: "auth",
    isPublic: true,
    children: [
      { path: "login", element: <LoginTest /> },
      { path: "setup-admin", element: <SetupAdmin /> },
      { 
        path: "register", 
        element: <Register />, 
        featureFlag: "registrationEnabled" // Handle the feature guard
      },
    ]
  },
  {
    path: "complete-registration",
    element: <CompleteRegistration />,
    isPublic: true,
  },

  /* =========================
     PRIVATE ROUTES
  ========================= */
 {
    path: "dashboard",
    element: <Dashboard />,
    permission: P.VIEW_DASHBOARD,
    nav: { label: "Dashboard", icon: LayoutGrid }
  },
  {
    path: "profile",
    element: <Profile />,
  },
  {
    type: "section",
    label: "Management",
    permissions: [P.VIEW_USERS, P.VIEW_AUDIT_LOGS],
    children: [
      {
        path: "users",
        permission: P.VIEW_USERS,
        nav: { label: "Directory", icon: Users },
        children: [
          // Use index for the list view
          { index: true, element: <UserDirectory />, permission: P.VIEW_USERS },
          { path: ":id", element: <UserProfile />, permission: P.VIEW_USERS }
        ]
      },
      {
        path: "users/invite",
        element: <InviteUser />,
        permission: P.CREATE_USERS
      },
      {
        path: "audit-logs",
        permission: P.VIEW_AUDIT_LOGS,
        nav: { label: "Audit Logs", icon: FileCode },
        children: [
          // Use index for the list view
          { index: true, element: <AuditLogs />, permission: P.VIEW_AUDIT_LOGS },
          { path: ":id", element: <AuditLogDetails />, permission: P.VIEW_AUDIT_LOGS }
        ]
      }
    ]
  },
  {
    type: "section",
    label: "System Tools",
    permissions: [P.READ_TRASH, P.VIEW_MONITOR, P.VIEW_ADMIN_TOOLS],
    children: [
      {
        path: "admin/trash",
        permission: P.READ_TRASH,
        nav: { label: "Recycle Bin", icon: Trash2 },
        children: [
          // Use index for the list view
          { index: true, element: <GeneralTrashBin />, permission: P.READ_TRASH },
          { path: ":id", element: <TrashItemDetails />, permission: P.READ_TRASH }
        ]
      },

    ]
  },
  {
    type: "section",
    label: "Development Test Pages",
    permissions: [P.VIEW_MONITOR, P.VIEW_ADMIN_TOOLS, P.VIEW_SOCKET_TEST],
    children: [
            {
        path: "dev",
        permission: P.VIEW_ADMIN_TOOLS,
        children: [
          {
            path: "monitor",
            element: <Monitor />,
            permission: P.VIEW_MONITOR,
            nav: { label: "Live Monitor", icon: Activity }
          },
          {
            path: "socket-test",
            element: <SocketTest />,
            permission: P.VIEW_SOCKET_TEST,
            nav: { label: "Socket IO", icon: Zap }
          },
          {
            path: "admin-test",
            element: <AdminTest />,
            nav: { label: "Admin Sandbox", icon: ShieldAlert }
          },
          {
            path: "test-dashboard",
            element: <TestDashboard />,
          },
          {
            path: "file-test",
            element: <FileTestPage />,
            nav: { label: "File Lab", icon: Database }
          }
        ]
      }


    ]
  }
];
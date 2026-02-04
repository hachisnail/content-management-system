import { Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, Database } from 'lucide-react';
import PermissionGuard from '../components/common/PermissionGuard';
// Auth Pages
import { 
  LoginPage, 
  ForgotPasswordPage, 
  ResetPasswordPage, 
  CompleteRegistrationPage 
} from '../features/auth';

// Feature Pages
import { DashboardPage } from '../features/dashboard';
import { SettingsPage } from '../features/settings'; 
import { FileManagerPage, RecycleBinPage } from '../features/file'; 
import { 
  UserDirectoryPage, 
  UserInvitePage, 
  UserDetailsPage 
} from '../features/users';
import { 
  AuditLogPage, 
  AuditLogDetailsPage 
} from '../features/audit';

export const publicRoutes = [
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/accept-invite', element: <CompleteRegistrationPage /> }
];

export const routeConfig = [
  {
    path: '/dashboard',
    element: <DashboardPage />,
    nav: { label: 'Dashboard', icon: LayoutDashboard },
  },
  {
    type: 'section',
    label: 'System & Management',
    children: [
      {
        path: '/users',
        // [RBAC] Permission Metadata (used by SidebarLayout to show/hide)
        permission: { action: 'readAny', resource: 'users' },
        // [RBAC] Route Guard (used by Router to protect URL)
        element: (
          <PermissionGuard action="readAny" resource="users">
            <UserDirectoryPage />
          </PermissionGuard>
        ),
        nav: { label: 'User Directory', icon: Users },
      },
      {
        path: '/users/invite',
        permission: { action: 'createAny', resource: 'users' },
        element: (
          <PermissionGuard action="createAny" resource="users">
            <UserInvitePage />
          </PermissionGuard>
        ),
        hidden: true,
      },
      {
        path: '/users/:id',
        permission: { action: 'readAny', resource: 'users' },
        element: (
          <PermissionGuard action="readAny" resource="users">
            <UserDetailsPage />
          </PermissionGuard>
        ),
        hidden: true,
      },
      {
        path: '/files',
        permission: { action: 'readAny', resource: 'files' },
        element: (
          <PermissionGuard action="readAny" resource="files">
            <FileManagerPage />
          </PermissionGuard>
        ),
        nav: { label: 'File Manager', icon: FileText },
      },
      {
        path: '/files/recycle-bin',
        // [RBAC] Restricted to roles with 'recycle_bin' access (e.g. Superadmin)
        permission: { action: 'readAny', resource: 'recycle_bin' },
        element: (
          <PermissionGuard action="readAny" resource="recycle_bin">
            <RecycleBinPage />
          </PermissionGuard>
        ),
        hidden: true, 
      },
      {
        path: '/audit',
        permission: { action: 'readAny', resource: 'audit_logs' },
        element: (
          <PermissionGuard action="readAny" resource="audit_logs">
            <AuditLogPage />
          </PermissionGuard>
        ),
        nav: { label: 'Audit Logs', icon: Database }
      },
      {
        path: '/audit/:id',
        permission: { action: 'readAny', resource: 'audit_logs' },
        element: (
          <PermissionGuard action="readAny" resource="audit_logs">
            <AuditLogDetailsPage />
          </PermissionGuard>
        ),
        hidden: true,
      },
    ]
  },
  {
    path: '/settings',
    element: <SettingsPage />,
    hidden: true,
    nav: { label: 'Settings', icon: Settings }
  }
];

export default routeConfig;
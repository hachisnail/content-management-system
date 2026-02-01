// web/src/config/routeConfig.jsx
import { LayoutDashboard, Users, FileText, Settings, File, Database } from 'lucide-react';

// Import Protected Pages
import { DashboardPage } from '../features/dashboard'; //
import { SettingsPage, FileManager, AuditLogPage, AuditLogDetailsPage, UserDetailsPage, UserDirectoryPage, UserInvitePage } from '../features/system';

// Import Public/Auth Pages
import { 
  LoginPage, 
  ForgotPasswordPage, 
  ResetPasswordPage, 
  CompleteRegistrationPage 
} from '../features/auth'; //

// Placeholder

// --- Public Routes (No Auth Required) ---
export const publicRoutes = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/accept-invite',
    element: <CompleteRegistrationPage />,
  }
];

// --- Protected Routes (Sidebar Navigation) ---
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
// [NEW] Users moved here
      {
        path: '/system/users',
        element: <UserDirectoryPage />,
        nav: { label: 'User Directory', icon: Users },
      },
      {
        path: '/system/users/invite',
        element: <UserInvitePage />,
        hidden: true,
      },
      {
        path: '/system/users/:id',
        element: <UserDetailsPage />,
        hidden: true,
      },
      {
        path: '/files',
        element: <FileManager />,
        nav: { label: 'File Manager', icon: FileText },
      },
      {
        path: '/audit',
        element: <AuditLogPage />,
        nav: {label: 'Audit Logs', icon: Database}
      },
      {
        path: '/audit/:id',
        element: <AuditLogDetailsPage />,
        hidden: true,
      },
    ]
  },
  // Hidden Routes
  {
    path: '/settings',
    element: <SettingsPage />,
    hidden: true,
    nav: { label: 'Settings', icon: Settings }
  }
];

export default routeConfig;
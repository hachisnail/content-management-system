import { Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Database,
  // [NEW] Icons for the new features
  Inbox,       // Acquisition/Intake
  Archive,     // Accessioning
  Box,         // Inventory/Artifacts
  Calendar,    // Appointments
  Newspaper    // Articles
} from 'lucide-react';

import PermissionGuard from '../components/common/PermissionGuard';

// Auth Pages
import { 
  LoginPage, 
  ForgotPasswordPage, 
  ResetPasswordPage, 
  CompleteRegistrationPage 
} from '../features/auth';

// Feature Pages (Existing)
import { DashboardPage } from '../features/dashboard';
import { SettingsPage } from '../features/settings'; 
import { FileManagerPage, RecycleBinPage } from '../features/file'; 
import { UserDirectoryPage, UserInvitePage, UserDetailsPage } from '../features/users';
import { AuditLogPage, AuditLogDetailsPage } from '../features/audit';

/* [SCAFFOLDING] 
  Uncomment these imports once you have created the index.js files 
  in web/src/features/{featureName} 
*/
// import { IntakePage } from '../features/intake';
// import { AccessionPage } from '../features/accessions';
// import { InventoryPage } from '../features/inventory';
// import { AppointmentPage } from '../features/appointments';
// import { ArticlePage } from '../features/articles';

// [TEMPORARY] Placeholder for scaffolding (Remove this when pages are ready)
const Placeholder = ({ title }) => (
  <div className="p-8 text-neutral-content/60">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p>This module is under construction.</p>
  </div>
);

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
    label: 'Collections',
    children: [
      {
        path: '/acquisitions',
        // Backend Resource: 'intake'
        permission: { action: 'readAny', resource: 'intake' },
        element: (
          <PermissionGuard action="readAny" resource="intake">
            {/* <IntakePage /> */}
            <Placeholder title="Acquisitions (Intake)" />
          </PermissionGuard>
        ),
        nav: { label: 'Acquisitions', icon: Inbox },
      },
      {
        path: '/accessions',
        // Backend Resource: 'accessions'
        permission: { action: 'readAny', resource: 'accessions' },
        element: (
          <PermissionGuard action="readAny" resource="accessions">
            {/* <AccessionPage /> */}
            <Placeholder title="Accessioning" />
          </PermissionGuard>
        ),
        nav: { label: 'Accessioning', icon: Archive },
      },
      {
        path: '/inventory',
        // Backend Resource: 'artifacts'
        permission: { action: 'readAny', resource: 'artifacts' },
        element: (
          <PermissionGuard action="readAny" resource="artifacts">
            {/* <InventoryPage /> */}
            <Placeholder title="Inventory (Artifacts)" />
          </PermissionGuard>
        ),
        nav: { label: 'Inventory', icon: Box },
      },
    ]
  },

  // --- [NEW] PROGRAMS & CONTENT ---
  {
    type: 'section',
    label: 'Programs',
    children: [
      {
        path: '/appointments',
        // Backend Resource: 'appointments'
        permission: { action: 'readAny', resource: 'appointments' },
        element: (
          <PermissionGuard action="readAny" resource="appointments">
            {/* <AppointmentPage /> */}
            <Placeholder title="Appointments" />
          </PermissionGuard>
        ),
        nav: { label: 'Appointments', icon: Calendar },
      },
      {
        path: '/articles',
        // Backend Resource: 'articles'
        permission: { action: 'readAny', resource: 'articles' },
        element: (
          <PermissionGuard action="readAny" resource="articles">
            {/* <ArticlePage /> */}
            <Placeholder title="Articles" />
          </PermissionGuard>
        ),
        nav: { label: 'Articles', icon: Newspaper },
      },
    ]
  },

  {
    type: 'section',
    label: 'System & Management',
    children: [
      {
        path: '/users',
        permission: { action: 'readAny', resource: 'users' },
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
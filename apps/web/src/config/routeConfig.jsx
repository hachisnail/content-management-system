import { Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Database,       
  Calendar,    
  Newspaper,
  HeartHandshake,
  Layers
} from 'lucide-react';

import PermissionGuard from '../components/common/PermissionGuard';

import { 
  LoginPage, 
  ForgotPasswordPage, 
  ResetPasswordPage, 
  CompleteRegistrationPage 
} from '../features/auth';

import { VisitorFeedbackPage } from '../features/feedback';

import { DashboardPage } from '../features/dashboard';
import { SettingsPage } from '../features/settings'; 
import { FileManagerPage, RecycleBinPage } from '../features/file'; 
import { UserDirectoryPage, UserInvitePage, UserDetailsPage } from '../features/users';
import { AuditLogPage, AuditLogDetailsPage } from '../features/audit';
import { QRScannerPage } from '../features/mobile';

import { CollectionManagerPage } from '../features/collections';
import { AppointmentPage } from '../features/appointments';
import { ArticlePage } from '../features/articles';


export const publicRoutes = [
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/accept-invite', element: <CompleteRegistrationPage /> }
];


export const standaloneRoutes = [
  {
    path: '/scanner',
    permission: { action: 'updateAny', resource: 'artifacts' },
    element: (
       <PermissionGuard action="updateAny" resource="artifacts">
          <QRScannerPage /> 
       </PermissionGuard>
    ),
  }
];

export const routeConfig = [
  {
    path: '/dashboard',
    element: <DashboardPage />,
    nav: { label: 'Dashboard', icon: LayoutDashboard },
  },
  

{
    path: '/collections',
    permission: { action: 'readAny', resource: 'artifacts' },
    element: (
      <PermissionGuard action="readAny" resource="artifacts">
        <CollectionManagerPage />
      </PermissionGuard>
    ),
    nav: { label: 'Collections Hub', icon: Layers },
  },

{
    type: 'section',
    label: 'Public Engagement', 
    children: [
      {
        path: '/appointments',
        permission: { action: 'readAny', resource: 'appointments' },
        element: (
          <PermissionGuard action="readAny" resource="appointments">
            <AppointmentPage />
          </PermissionGuard>
        ),
        nav: { label: 'Visits & Appointments', icon: Calendar },
      },
      {
        path: '/articles',
        permission: { action: 'readAny', resource: 'articles' },
        element: (
          <PermissionGuard action="readAny" resource="articles">
            <ArticlePage />
          </PermissionGuard>
        ),
        nav: { label: 'Articles & Research', icon: Newspaper },
      },
      {
        path: '/feedback',
        permission: { action: 'readAny', resource: 'feedback' }, 
        element: (
          <PermissionGuard action="readAny" resource="feedback">
            <VisitorFeedbackPage />
          </PermissionGuard>
        ),
        nav: { label: 'Visitor Feedback', icon: HeartHandshake },
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
import { 
  LayoutGrid, 
  Users, 
  FileCode, 
  Trash2, 
  Activity, 
  Zap, 
  ShieldAlert, 
  Database,
  BookOpen,
  Box,
  Calendar,
  ClipboardList,
  Archive,
  PackagePlus
} from "lucide-react";

// --- FEATURE MODULE IMPORTS ---
import { 
  LandingPage, 
  DonationPage, 
  BookAppointmentPage 
} from "@/features/public";

import { 
  LoginPage, 
  SetupAdminPage, 
  CompleteRegistrationPage 
} from "@/features/auth";

import { DashboardPage } from "@/features/dashboard";
import { MyProfilePage } from "@/features/my-profile"; 

import { 
  UserDirectoryPage, 
  UserDetailsPage, 
  InviteUserPage 
} from "@/features/user-management";

import { 
  AuditLogListPage, 
  AuditLogDetailsPage,
  TrashListPage,
  TrashItemDetailsPage,
} from "@/features/system-tools";

import { 
  ArticleListPage, 
  CreateArticlePage, 
  EditArticlePage 
} from "@/features/article-management";

import { 
  InventoryListPage, 
  InventoryItemPage, 
  IntakeProcessPage, 
  AccessionSetupPage 
} from "@/features/inventory";

import { 
  AppointmentCalendarPage, 
  AppointmentListPage 
} from "@/features/appointments";

import { 
  AdminTestPage, 
  SocketTestPage, 
  TestDashboardPage, 
  FileTestPage 
} from "@/features/dev-sandbox";

import { ErrorPage } from "@/features/shared";

// --- PERMISSIONS ---
export const P = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_ADMIN_TOOLS: "view_admin_tools",
  VIEW_SOCKET_TEST: "view_socket_test",
  READ_USERS: "read_users",
  CREATE_USERS: "create_users",
  READ_AUDIT_LOGS: "read_audit_logs",
  READ_TRASH: "read_trash",
  READ_INVENTORY: "read_inventory",
  CREATE_INVENTORY: "create_inventory",
  READ_DONATIONS: "read_donations",
  READ_ACQUISITIONS: "read_acquisitions",
  READ_ARTICLES: "read_articles",
  CREATE_ARTICLES: "create_articles",
  READ_APPOINTMENTS: "read_appointments",
};

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
    path: "donate",
    element: <DonationPage />,
    isPublic: true,
  },
  {
    path: "book-visit",
    element: <BookAppointmentPage />,
    isPublic: true,
  },
  {
    path: "complete-registration",
    element: <CompleteRegistrationPage />,
    isPublic: true,
  },

  /* =========================
     AUTH ROUTES (Public but need Context)
  ========================= */
  {
    path: "login",
    element: <LoginPage />,
    isPublic: true,
    needsAuthContext: true, // <--- New Flag
  },
  {
    path: "setup-admin",
    element: <SetupAdminPage />,
    isPublic: true,
    needsAuthContext: true, // <--- New Flag
  },

  /* =========================
     PRIVATE ROUTES
  ========================= */
  
  // 1. DASHBOARD
  {
    path: "dashboard",
    element: <DashboardPage />,
    permission: P.VIEW_DASHBOARD,
    nav: { label: "Dashboard", icon: LayoutGrid }
  },

  // 2. APPOINTMENTS
  {
    path: "appointments",
    permission: P.READ_APPOINTMENTS,
    nav: { label: "Calendar", icon: Calendar },
    children: [
      { index: true, element: <AppointmentCalendarPage />, permission: P.READ_APPOINTMENTS },
      { path: "list", element: <AppointmentListPage />, permission: P.READ_APPOINTMENTS }
    ]
  },

  // 3. ARTICLES
  {
    path: "articles",
    permission: P.READ_ARTICLES,
    nav: { label: "Articles", icon: BookOpen },
    children: [
      { index: true, element: <ArticleListPage />, permission: P.READ_ARTICLES },
      { path: "new", element: <CreateArticlePage />, permission: P.CREATE_ARTICLES },
      { path: ":id/edit", element: <EditArticlePage />, permission: P.CREATE_ARTICLES }
    ]
  },

  // 4. COLLECTIONS MANAGEMENT
  {
    type: "section",
    label: "Collections Management",
    permissions: [P.READ_INVENTORY],
    children: [
      {
        path: "inventory/entry",
        element: <IntakeProcessPage />,
        permission: P.READ_DONATIONS,
        nav: { label: "Object Entry", icon: PackagePlus } 
      },
      {
        path: "inventory/accession",
        element: <AccessionSetupPage />,
        permission: P.READ_ACQUISITIONS,
        nav: { label: "Accessioning", icon: Archive } 
      },
      {
        path: "inventory",
        permission: P.READ_INVENTORY,
        nav: { label: "The Collection", icon: Box },
        children: [
          { index: true, element: <InventoryListPage />, permission: P.READ_INVENTORY },
          { path: ":id", element: <InventoryItemPage />, permission: P.READ_INVENTORY }
        ]
      },
    ]
  },

  // 5. USER ADMINISTRATION
  {
    type: "section",
    label: "Administration",
    permissions: [P.READ_USERS, P.READ_AUDIT_LOGS],
    children: [
      {
        path: "users",
        permission: P.READ_USERS,
        nav: { label: "User Directory", icon: Users },
        children: [
          { index: true, element: <UserDirectoryPage />, permission: P.READ_USERS },
          { path: ":id", element: <UserDetailsPage />, permission: P.READ_USERS }
        ]
      },
      {
        path: "users/invite",
        element: <InviteUserPage />,
        permission: P.CREATE_USERS
      },
      {
        path: "audit-logs",
        permission: P.READ_AUDIT_LOGS,
        nav: { label: "Audit Trail", icon: FileCode },
        children: [
          { index: true, element: <AuditLogListPage />, permission: P.READ_AUDIT_LOGS },
          { path: ":id", element: <AuditLogDetailsPage />, permission: P.READ_AUDIT_LOGS }
        ]
      },
      {
        path: "admin/trash",
        permission: P.READ_TRASH,
        nav: { label: "Recycle Bin", icon: Trash2 },
        children: [
          { index: true, element: <TrashListPage />, permission: P.READ_TRASH },
          { path: ":id", element: <TrashItemDetailsPage />, permission: P.READ_TRASH }
        ]
      },
      // {
      //   path: "monitor",
      //   element: <LiveMonitorPage />,
      //   permission: P.VIEW_ADMIN_TOOLS,
      //   nav: { label: "System Health", icon: Activity }
      // }
    ]
  },

  // 6. DEV LAB
  {
    type: "section",
    label: "Dev Lab",
    permissions: [P.VIEW_ADMIN_TOOLS],
    children: [
      {
        path: "dev",
        children: [
          { path: "socket-test", element: <SocketTestPage />, nav: { label: "Socket IO", icon: Zap } },
          { path: "admin-test", element: <AdminTestPage />, nav: { label: "Admin Sandbox", icon: ShieldAlert } },
          { path: "file-test", element: <FileTestPage />, nav: { label: "File Lab", icon: Database } },
          { path: "test-dashboard", element: <TestDashboardPage /> },
        ]
      }
    ]
  },

  // HIDDEN / UTILITY
  {
    path: "profile",
    element: <MyProfilePage />,
  },
  {
    path: "unauthorized",
    element: <ErrorPage code={403} />,
    isPublic: true,
  },
  {
    path: "*",
    element: <ErrorPage code={404} />,
    isPublic: true,
  }
];
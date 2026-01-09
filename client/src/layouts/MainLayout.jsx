import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";

import {
  LayoutGrid,
  FileCode,
  Zap,
  Users,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  MoreVertical,
  ChevronRight,
  Home,
  Activity,
  ShieldAlert,
  Terminal
} from "lucide-react";

import { ConfirmationModal, Dropdown, Avatar } from "../components/UI";

const WIDTH_EXPANDED = "w-[260px]";
const WIDTH_COLLAPSED = "w-[72px]";

const NavItem = ({ to, icon: Icon, label, isCollapsed, isActive }) => (
  <Link
    to={to}
    className={`group flex items-center h-[44px] mx-3 mb-1 rounded-lg transition-all duration-200 relative overflow-hidden active:scale-[0.97]
      ${
        isActive
          ? "bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.05)] font-semibold"
          : "text-zinc-400 hover:text-white hover:bg-zinc-900"
      }
    `}
    title={isCollapsed ? label : ""}
  >
    <div className="h-[44px] w-[48px] flex items-center justify-center flex-shrink-0">
      <Icon
        className={`w-5 h-5 transition-all duration-300 ${
          isActive
            ? "scale-110"
            : "group-hover:scale-110 group-hover:text-white"
        }`}
        strokeWidth={2}
      />
    </div>
    <div
      className={`text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${
        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
      }`}
    >
      {label}
    </div>
  </Link>
);

const NavSectionTitle = ({ label, isCollapsed }) => {
  if (isCollapsed) return <div className="h-4 my-2" />;
  return (
    <div className="px-6 mt-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
      {label}
    </div>
  );
};

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { hasPermission, PERMISSIONS } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [breadcrumbLabel, setBreadcrumbLabel] = useState(null);

  useEffect(() => {
    setBreadcrumbLabel(null);
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    
    return (
      <div className="flex items-center space-x-2 text-sm text-zinc-500">
        <Link to="/dashboard" className="hover:text-black transition-colors flex items-center gap-1">
          <Home size={14} />
        </Link>
        {pathnames.length > 0 && <ChevronRight size={14} className="text-zinc-300" />}
        
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          let label = value.replace(/-/g, " ");
          
          if (isLast && breadcrumbLabel) {
            label = breadcrumbLabel; 
          }

          return (
            <React.Fragment key={index}>
              {isLast ? (
                <span className="font-semibold text-black capitalize truncate max-w-[200px]">
                  {label}
                </span>
              ) : (
                <span className="capitalize">{label}</span>
              )}
              {!isLast && <ChevronRight size={14} className="text-zinc-300" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Check if user has ANY dev permissions to show the section header
  const hasDevAccess = hasPermission(user, PERMISSIONS.VIEW_MONITOR) || 
                       hasPermission(user, PERMISSIONS.VIEW_SOCKET_TEST) || 
                       hasPermission(user, PERMISSIONS.VIEW_ADMIN_TOOLS);

  return (
    <div className="flex h-screen bg-zinc-100 text-zinc-900 overflow-hidden font-sans selection:bg-black selection:text-white">
      {/* SIDEBAR */}
      <aside
        className={`
        flex flex-col bg-black text-white h-full flex-shrink-0 border-r border-zinc-800 
        transition-[width,transform] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${
          isMobileOpen
            ? "fixed inset-y-0 left-0 w-[260px] shadow-2xl z-[60] translate-x-0"
            : "hidden lg:flex -translate-x-full lg:translate-x-0"
        } 
        ${!isMobileOpen && isCollapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED}
      `}
      >
        {/* LOGO AREA */}
        <div className="h-[64px] flex items-center px-4 relative flex-shrink-0 border-b border-zinc-900">
          <div className="flex items-center justify-center flex-shrink-0 min-w-[40px]">
             <img src="/LOGO.png" alt="M" className="w-8 h-8 object-contain" />
          </div>
          <span
            className={`font-bold text-lg tracking-tight ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            MASCD<span className="font-light text-zinc-500">MIS</span>
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex absolute right-4 text-zinc-500 hover:text-white transition-colors ${
              isCollapsed ? "opacity-0 invisible" : ""
            }`}
          >
            <PanelLeftClose size={18} />
          </button>
           {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute inset-0 z-20 cursor-pointer"
              title="Expand Menu"
            />
          )}
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden absolute right-4 text-zinc-400 hover:text-white p-2">
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4 space-y-1">
          
          <NavItem
            to="/dashboard"
            icon={LayoutGrid}
            label="Dashboard"
            isCollapsed={isCollapsed}
            isActive={isActive("/dashboard")}
          />
          
          {hasPermission(user, PERMISSIONS.VIEW_USERS) && (
            <NavItem
              to="/users"
              icon={Users}
              label="Directory"
              isCollapsed={isCollapsed}
              isActive={isActive("/users")}
            />
          )}
          
          {hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS) && (
            <NavItem
              to="/audit-logs"
              icon={FileCode}
              label="Audit Logs"
              isCollapsed={isCollapsed}
              isActive={isActive("/audit-logs")}
            />
          )}

          {/* DEVELOPMENT SECTION */}
          {hasDevAccess && (
            <>
              <NavSectionTitle label="System Tools" isCollapsed={isCollapsed} />
              
              {hasPermission(user, PERMISSIONS.VIEW_MONITOR) && (
                <NavItem
                  to="/monitor"
                  icon={Activity}
                  label="Live Monitor"
                  isCollapsed={isCollapsed}
                  isActive={isActive("/monitor")}
                />
              )}
              
              {hasPermission(user, PERMISSIONS.VIEW_SOCKET_TEST) && (
                <NavItem
                  to="/socket-test"
                  icon={Zap}
                  label="Socket IO"
                  isCollapsed={isCollapsed}
                  isActive={isActive("/socket-test")}
                />
              )}

              {hasPermission(user, PERMISSIONS.VIEW_SOCKET_TEST) && (
                <NavItem
                  to="/test-dashboard"
                  icon={Terminal}
                  label="Console"
                  isCollapsed={isCollapsed}
                  isActive={isActive("/test-dashboard")}
                />
              )}

              {hasPermission(user, PERMISSIONS.VIEW_ADMIN_TOOLS) && (
                <NavItem
                  to="/admin-test"
                  icon={ShieldAlert}
                  label="Admin Sandbox"
                  isCollapsed={isCollapsed}
                  isActive={isActive("/admin-test")}
                />
              )}
            </>
          )}
        </nav>

        {/* USER PROFILE DROPDOWN */}
        <div className="p-3 border-t border-zinc-900 mt-auto flex-shrink-0 bg-black">
          <Dropdown
            align="top"
            matchWidth={!isCollapsed}
            trigger={
              <div
                className={`flex items-center transition-all duration-300 rounded-lg bg-zinc-900/60 border border-zinc-800/50 p-1.5 h-[52px] overflow-hidden cursor-pointer hover:bg-zinc-800 ${
                  isCollapsed
                    ? "justify-center w-full"
                    : "justify-between w-full"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Avatar
                    user={user}
                    size="sm"
                    className="bg-zinc-800 border-zinc-700 text-zinc-300"
                  />
                  <div
                    className={`ml-3 overflow-hidden transition-all duration-300 flex flex-col justify-center ${
                      isCollapsed
                        ? "w-0 opacity-0 hidden"
                        : "w-auto opacity-100"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white truncate leading-tight">
                      {user?.firstName}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate leading-tight capitalize">
                      {Array.isArray(user?.role) ? user.role[0] : user?.role}
                    </p>
                  </div>
                </div>
                {!isCollapsed && (
                  <MoreVertical size={16} className="text-zinc-500 mr-2" />
                )}
              </div>
            }
          >
            <div className={isCollapsed ? "w-56" : ""}>
              <Link
                to={`/profile`}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <User size={16} /> My Profile
              </Link>
              <div className="h-px bg-zinc-100 my-1" />
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </Dropdown>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-100">
        <header className="h-[60px] bg-white text-black flex items-center px-4 lg:hidden z-10 justify-between flex-shrink-0 shadow-sm border-b border-zinc-200">
          <div className="flex items-center">
            <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 text-zinc-500 hover:text-black">
              <Menu size={24} />
            </button>
            <span className="ml-3 font-bold text-lg tracking-tight">MASCD MIS</span>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth p-0 lg:p-4">
          <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-2rem)] bg-white lg:rounded-lg shadow-sm border border-zinc-200 flex flex-col overflow-hidden">
            
            {/* Top Bar with Breadcrumbs */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 px-6 h-[64px] flex items-center justify-between supports-[backdrop-filter]:bg-white/80">
              <div className="flex items-center space-x-2">
                 {isCollapsed && (
                  <button onClick={() => setIsCollapsed(false)} className="hidden lg:block mr-2 text-zinc-400 hover:text-black transition-colors">
                    <PanelLeftOpen size={18} />
                  </button>
                 )}
                 {generateBreadcrumbs()}
              </div>

              <div className="flex items-center space-x-3">
                 <div className="hidden md:flex items-center bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 focus-within:border-zinc-400 focus-within:bg-white transition-all w-64 group">
                    <Search size={14} className="text-zinc-400 mr-2 group-focus-within:text-black transition-colors" />
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      placeholder="Quick find..." 
                      className="bg-transparent border-none outline-none text-xs w-full text-zinc-700 h-full placeholder:text-zinc-400"
                    />
                 </div>
                 <button className="text-zinc-400 hover:text-black p-2 rounded-full hover:bg-zinc-100 transition-colors relative">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white"></span>
                 </button>
              </div>
            </div>

            {/* Page Content */}
            <div className="flex-1 p-6 md:p-8 relative">
              <Outlet context={{ setBreadcrumbLabel }} />
            </div>
          </div>
        </main>
      </div>

      {/* LOGOUT CONFIRMATION */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Terminate Session?"
        message="Are you sure you want to log out?"
        confirmLabel="Logout Now"
        isDangerous={true}
      />
      
      {/* MOBILE BACKDROP */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[50] lg:hidden animate-in fade-in" onClick={() => setIsMobileOpen(false)} />
      )}
    </div>
  );
};

export default MainLayout;
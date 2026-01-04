import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// 1. IMPORT THE HOOK
import { useConfig } from '../context/ConfigContext'; 

// 2. DELETE THIS LINE (The static import is no longer needed)
// import { hasPermission, PERMISSIONS } from '../config/permissions'; <--- REMOVE THIS

import { 
  LayoutDashboard, 
  Activity, 
  FileText, 
  Zap, 
  Users, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Menu 
} from 'lucide-react';

// --- SUB-COMPONENT: BREADCRUMBS ---
const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="text-gray-500 text-sm mb-4 flex items-center space-x-2">
      <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Home</Link>
      {pathnames.length > 0 && <span>/</span>}
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const name = value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        return isLast ? (
          <span key={to} className="font-semibold text-gray-800 cursor-default">{name}</span>
        ) : (
          <React.Fragment key={to}>
            <Link to={to} className="hover:text-indigo-600 transition-colors">{name}</Link>
            <span>/</span>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// --- SUB-COMPONENT: NAV ITEM ---
const NavItem = ({ to, icon: Icon, label, isCollapsed, isActive }) => (
  <Link 
    to={to} 
    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 mb-1 whitespace-nowrap
      ${isActive 
        ? "bg-gray-800 text-white shadow-sm border-l-4 border-indigo-500" 
        : "text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent"
      }
      ${isCollapsed ? "justify-center px-0" : ""}
    `}
    title={isCollapsed ? label : ""}
  >
    <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? "text-indigo-400" : ""} ${isCollapsed ? "" : "mr-3"}`} />
    
    <span 
      className={`transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
    >
      {label}
    </span>
  </Link>
);

const MainLayout = () => {
  const { user, logout, loading, error } = useAuth();
  
  // 3. USE THE HOOK (This is the correct source of truth)
  const { hasPermission, PERMISSIONS } = useConfig(); 
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout(); 
    navigate('/auth/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`bg-gray-900 text-white flex flex-col shadow-xl z-30 transition-all duration-300 ease-in-out ${isMobileOpen ? "fixed inset-y-0 left-0 w-64" : "hidden lg:flex"} ${!isMobileOpen && isCollapsed ? "w-20" : "w-64"}`}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-900 flex-shrink-0">
          <div className={`font-bold tracking-wider text-indigo-500 overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 text-xl"}`}>CMS MIS</div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={`hidden lg:flex items-center justify-center bg-indigo-600 text-white p-1 rounded-full shadow-md hover:bg-indigo-500 transition-all ${isCollapsed ? "mx-auto" : ""}`}>
             {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden ml-auto text-gray-400 hover:text-white"><ChevronLeft size={24} /></button>
        </div>

        {/* Dynamic Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {!isCollapsed && (
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-2 transition-opacity duration-300">Menu</p>
          )}

          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" isCollapsed={isCollapsed} isActive={isActive('/dashboard')} />
          
          {/* Permission Checks using the Dynamic Config */}
          {hasPermission(user, PERMISSIONS.VIEW_MONITOR) && (
            <NavItem to="/monitor" icon={Activity} label="Real-time Monitor" isCollapsed={isCollapsed} isActive={isActive('/monitor')} />
          )}
          {hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS) && (
            <NavItem to="/audit-logs" icon={FileText} label="Audit Logs" isCollapsed={isCollapsed} isActive={isActive('/audit-logs')} />
          )}
          {hasPermission(user, PERMISSIONS.VIEW_SOCKET_TEST) && (
            <NavItem to="/socket-test" icon={Zap} label="Socket Test" isCollapsed={isCollapsed} isActive={isActive('/socket-test')} />
          )}
          {hasPermission(user, PERMISSIONS.MANAGE_USERS) && (
            <>
              <div className="mt-8 mb-2">
                {!isCollapsed && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-2">Admin</p>}
                {isCollapsed && <div className="h-px w-8 bg-gray-700 mx-auto my-4" />}
              </div>
              <NavItem to="/admin-test" icon={Users} label="User Management" isCollapsed={isCollapsed} isActive={isActive('/admin-test')} />
            </>
          )}
        </nav>

        {/* Footer (User Profile) */}
        <div className="border-t border-gray-800 p-4 bg-gray-900 flex-shrink-0">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : ""}`}>
             {!loading && !error && <div className="h-2 w-2 rounded-full bg-green-500 border border-gray-900 absolute mb-6 ml-6"></div>}
            <div className={`flex items-center w-full ${isCollapsed ? "justify-center" : "justify-between"}`}>
               <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg ring-2 ring-gray-800">
                  {user?.firstName?.charAt(0) || "U"}
               </div>
               <div className={`ml-3 overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 flex-1"}`}>
                   <p className="text-sm font-medium text-white truncate">{user?.firstName}</p>
                   <p className="text-xs text-gray-500 truncate" title={user?.email}>{user?.email}</p>
               </div>
               <button onClick={handleLogout} className={`text-gray-400 hover:text-red-400 transition-colors p-2 rounded-md hover:bg-gray-800 ${isCollapsed ? "hidden" : "block"}`} title="Log out"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white shadow-sm flex items-center px-4 lg:hidden z-10 justify-between flex-shrink-0">
            <div className="flex items-center"><button onClick={() => setIsMobileOpen(true)} className="text-gray-600 hover:text-indigo-600 p-2 -ml-2 rounded-md hover:bg-gray-100"><Menu size={24} /></button><span className="ml-4 font-bold text-gray-800 text-lg">CMS MIS</span></div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto min-h-full flex flex-col">
             <Breadcrumbs />
             <div className="flex-1"><Outlet /></div>
          </div>
        </main>
      </div>
      {isMobileOpen && <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />}
    </div>
  );
};

export default MainLayout;
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

import { 
  LayoutGrid, 
  Activity, 
  FileCode, 
  Zap, 
  Users, 
  LogOut, 
  Menu,
  Hexagon,
  X,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  History,
  Info
} from 'lucide-react';

import { 
  ConfirmationModal, 
  Dropdown, 
  Badge, 
} from '../components/UI';

const WIDTH_EXPANDED = "w-[260px]";
const WIDTH_COLLAPSED = "w-[72px]";

const NavItem = ({ to, icon: Icon, label, isCollapsed, isActive }) => (
  <Link 
    to={to} 
    className={`group flex items-center h-[44px] mx-3 mb-1 rounded-lg transition-all duration-200 relative overflow-hidden
      ${isActive 
        ? "bg-white text-black shadow-sm font-semibold" 
        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
      }
    `}
    title={isCollapsed ? label : ""}
  >
    <div className={`h-[44px] w-[48px] flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-105" : "group-hover:scale-105"}`} strokeWidth={2} />
    </div>
    <div className={`text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
      {label}
    </div>
  </Link>
);

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { hasPermission, PERMISSIONS } = useConfig(); 
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Local notification state for UI demonstration
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Socket Connected', desc: 'Real-time stream established.', icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 2, title: 'System Healthy', desc: 'All services operating normally.', icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ]);

  const handleLogout = async () => {
    await logout(); 
    navigate('/auth/login');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-zinc-100 text-zinc-900 overflow-hidden font-sans selection:bg-black selection:text-white">
      
      {/* --- SIDEBAR --- */}
      {/* Added z-[60] and bg-black to ensure it is not blurred by the backdrop on mobile */}
      <aside className={`
        flex flex-col bg-black text-white h-full flex-shrink-0 border-r border-zinc-800 
        transition-[width,transform] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        ${isMobileOpen ? "fixed inset-y-0 left-0 w-[260px] shadow-2xl z-[60] translate-x-0" : "hidden lg:flex -translate-x-full lg:translate-x-0"} 
        ${!isMobileOpen && isCollapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED}
      `}>
        <div className="h-[64px] flex items-center px-4 relative flex-shrink-0">
          <div className="flex items-center justify-center flex-shrink-0 min-w-[40px]">
             {/* <Hexagon size={24} strokeWidth={2} className="text-white fill-white" /> */}
             <img src="/LOGO.png" alt="Museo Bulawan" className='w-8 h-8'/>
          </div>
          <span className={`font-bold text-lg tracking-tight ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
            MASCD<span className="font-light text-zinc-500">MIS</span>
          </span>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={`hidden lg:flex absolute right-4 text-zinc-500 hover:text-white transition-colors ${isCollapsed ? "opacity-0 invisible" : ""}`}>
            <PanelLeftClose size={18} />
          </button>
          {isCollapsed && <button onClick={() => setIsCollapsed(false)} className="absolute inset-0 z-20 cursor-pointer" title="Expand Menu" />}
          
          {/* Mobile Close Button inside Sidebar */}
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden absolute right-4 text-zinc-400 hover:text-white p-2">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-6 space-y-1">
          <NavItem to="/dashboard" icon={LayoutGrid} label="Feed" isCollapsed={isCollapsed} isActive={isActive('/dashboard')} />
          {hasPermission(user, PERMISSIONS.VIEW_MONITOR) && <NavItem to="/monitor" icon={Activity} label="Live View" isCollapsed={isCollapsed} isActive={isActive('/monitor')} />}
          {hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS) && <NavItem to="/audit-logs" icon={FileCode} label="System Logs" isCollapsed={isCollapsed} isActive={isActive('/audit-logs')} />}
          {hasPermission(user, PERMISSIONS.VIEW_SOCKET_TEST) && <NavItem to="/socket-test" icon={Zap} label="Signals" isCollapsed={isCollapsed} isActive={isActive('/socket-test')} />}
          {hasPermission(user, PERMISSIONS.MANAGE_USERS) && <NavItem to="/admin-test" icon={Users} label="Administration" isCollapsed={isCollapsed} isActive={isActive('/admin-test')} />}
        </nav>

        <div className="p-3 border-t border-zinc-900 mt-auto flex-shrink-0">
           <div className={`flex items-center transition-all duration-300 rounded-lg bg-zinc-900/40 border border-zinc-800/50 p-1.5 h-[52px] overflow-hidden ${isCollapsed ? "justify-center w-full" : "justify-between w-full"}`}>
               <div className="flex items-center min-w-0">
                 <div className="w-8 h-8 bg-zinc-800 text-white rounded-md flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 border border-zinc-700">
                   {user?.firstName?.charAt(0) || "U"}
                 </div>
                 <div className={`ml-3 overflow-hidden transition-all duration-300 flex flex-col justify-center ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
                    <p className="text-sm font-semibold text-white truncate leading-tight">{user?.firstName}</p>
                    <p className="text-[10px] text-zinc-500 truncate leading-tight capitalize">{Array.isArray(user?.role) ? user.role[0] : user?.role}</p>
                 </div>
               </div>
               <button onClick={() => setShowLogoutConfirm(true)} className={`${isCollapsed ? "hidden" : "block"} p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors flex-shrink-0`} title="Logout"><LogOut size={16} /></button>
           </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-100">
        <header className="h-[60px] bg-white text-black flex items-center px-4 lg:hidden z-10 justify-between flex-shrink-0 shadow-sm border-b border-zinc-200">
            <div className="flex items-center">
                <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 text-zinc-500 hover:text-black transition-colors"><Menu size={24} /></button>
                <span className="ml-3 font-bold text-lg tracking-tight">MASCD<span className="font-light text-zinc-400">MIS</span></span>
            </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth p-0 lg:p-4">
          <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-2rem)] bg-white lg:rounded-lg shadow-sm border border-zinc-200 flex flex-col overflow-hidden">
             
             {/* TOP HEADER BAR */}
             <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-zinc-100 px-6 h-[64px] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                   {isCollapsed && (
                      <button onClick={() => setIsCollapsed(false)} className="hidden lg:block mr-2 text-zinc-400 hover:text-black transition-transform active:scale-95"><PanelLeftOpen size={18} /></button>
                   )}
                   <Link to="/dashboard" className="text-zinc-500 hover:text-black transition-colors font-medium">Home</Link>
                   {location.pathname !== '/dashboard' && (
                     <>
                       <span className="text-zinc-300">/</span>
                       <span className="font-semibold text-black capitalize">{location.pathname.split('/').pop().replace(/-/g, ' ')}</span>
                     </>
                   )}
                </div>
                
                <div className="flex items-center space-x-3">
                   {/* Search Implementation */}
                   <div className="hidden md:flex items-center bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 focus-within:border-zinc-400 focus-within:bg-white transition-all w-64 group">
                      <Search size={14} className="text-zinc-400 mr-2 group-focus-within:text-black" />
                      <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Quick find..." 
                        className="bg-transparent border-none outline-none text-xs w-full placeholder-zinc-400 text-zinc-700 h-full" 
                      />
                   </div>

                   {/* Notifications Dropdown */}
                   <Dropdown align="right" trigger={
                      <button className="text-zinc-400 hover:text-black transition-colors relative p-2 rounded-full hover:bg-zinc-50">
                        <Bell size={18} />
                        {notifications.length > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
                        )}
                      </button>
                   }>
                      <div className="w-80">
                         <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Notifications</h4>
                            <Badge variant="success" size="xs">{notifications.length} New</Badge>
                         </div>
                         <div className="max-h-64 overflow-y-auto scrollbar-hide">
                            {notifications.length > 0 ? notifications.map((n) => (
                              <div key={n.id} className="p-4 flex gap-3 hover:bg-zinc-50 cursor-pointer border-b border-zinc-50 transition-colors">
                                <div className={`w-8 h-8 rounded-lg ${n.bg} flex items-center justify-center ${n.color} shrink-0`}>
                                  <n.icon size={14}/>
                                </div>
                                <div>
                                   <p className="text-xs font-semibold text-zinc-900">{n.title}</p>
                                   <p className="text-[10px] text-zinc-500 mt-0.5">{n.desc}</p>
                                </div>
                              </div>
                            )) : (
                              <div className="p-8 text-center">
                                <Info size={24} className="mx-auto text-zinc-200 mb-2" />
                                <p className="text-xs text-zinc-400">All caught up!</p>
                              </div>
                            )}
                         </div>
                         <button 
                            onClick={() => setNotifications([])}
                            className="w-full py-2 text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-tighter bg-zinc-50/30 transition-colors"
                          >
                            Clear All Notifications
                          </button>
                      </div>
                   </Dropdown>

                   {/* <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 select-none">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold tracking-wide uppercase">Online</span>
                   </div> */}
                </div>
             </div>

             {/* MAIN CONTENT OUTLET */}
             <div className="flex-1 p-6 md:p-8 relative">
                  <Outlet />
             </div>

             <div className="px-8 py-3 border-t border-zinc-50 flex justify-between items-center text-[10px] text-zinc-400 font-mono bg-zinc-50/30">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><History size={12}/> {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  <span className="flex items-center gap-1.5 border-l border-zinc-200 pl-4 uppercase font-bold text-zinc-300">v2.0.4 • Stable</span>
                </div>
                <span className="font-sans font-bold text-zinc-300 tracking-tighter">SECURE ENCLAVE</span>
             </div>

          </div>
        </main>
      </div>

      <ConfirmationModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Terminate Session?"
        message="Are you sure you want to log out? You will need to re-authenticate to access the dashboard."
        confirmLabel="Logout Now"
        isDangerous={true}
      />

      {/* MOBILE BACKDROP */}
      {/* Set z-[50] so it sits below the sidebar (z-[60]) but above the content */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[50] lg:hidden animate-in fade-in duration-300" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}
    </div>
  );
};

export default MainLayout;
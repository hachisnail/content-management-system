import React, { useState, useEffect } from "react";
import { useLocation, Link, Outlet, useNavigate } from "react-router-dom";
import {
  Menu, Bell, Calendar, ChevronRight,
  PanelLeftClose, PanelLeftOpen, Home,
  Check, MailOpen
} from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { routeConfig } from "../../config/routeConfig";
import { usePermission } from "../../providers/PermissionProvider"; 
import { useNotifications } from "../../providers/NotificationProvider"; // [NEW] Import
import {
  SidebarNavItem,
  SidebarSectionTitle,
  SidebarUserMenu,
} from "./SidebarComponents";
import { ConfirmationModal } from "@repo/ui"; 

export const SidebarLayout = () => {
  const { user, logout } = useAuth();
  const { can, isLoading } = usePermission(); 
  
  // [NEW] Notification Hooks
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // [NEW] Handler: Open Notification & Navigate
  const handleNotificationClick = (notification) => {
    // 1. Mark as read automatically when opened
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // 2. Close the dropdown (by blurring the active element)
    const elem = document.activeElement;
    if (elem) elem.blur();

    // 3. Navigate if a link is provided
    if (notification.data?.link) {
      navigate(notification.data.link);
    }
  };

  // [NEW] Handler: Mark specific item read (without navigating)
  const handleMarkItemRead = (e, id) => {
    e.stopPropagation(); // Prevent triggering the parent click (navigation)
    markAsRead(id);
  };

  const isRouteActive = (path) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isSettingsActive = location.pathname.startsWith('/settings');

  const isAllowed = (route) => {
    if (isLoading) return false; 
    if (!route.permission) return true;
    return can(route.permission.action, route.permission.resource).granted;
  };

  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    return (
      <div className="flex items-center text-sm text-base-content/60 space-x-2">
        <Link to="/" className="hover:bg-base-200 p-1 rounded transition-colors"><Home size={16} /></Link>
        {pathnames.length > 0 && <ChevronRight size={14} className="opacity-50" />}
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          return (
             <React.Fragment key={to}>
              <span className={`capitalize ${isLast ? "font-semibold text-base-content" : ""}`}>{value.replace(/-/g, " ")}</span>
              {!isLast && <ChevronRight size={14} className="opacity-50" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="drawer lg:drawer-open bg-base-200 min-h-screen font-sans">
      <input
        id="app-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={mobileOpen}
        onChange={(e) => setMobileOpen(e.target.checked)}
      />

      {/* RIGHT SIDE CONTENT */}
      <div className="drawer-content p-4 md:p-6 flex flex-col min-h-screen transition-all duration-300">
        <header className="navbar bg-base-100 h-16 px-4 flex-none z-30 border-b border-base-300 rounded-t-xl shadow-sm w-auto">
          <div className="flex grow gap-4">
            <label htmlFor="app-drawer" className="btn btn-square btn-ghost btn-sm lg:hidden"><Menu size={20} /></label>
            <div className="hidden md:flex">{generateBreadcrumbs()}</div>
          </div>
          
          <div className="flex gap-2">
             <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-base-200 rounded-full text-xs font-medium text-base-content/70">
              <Calendar size={14} />
              <span>{currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            </div>

            {/* [NEW] Notification Dropdown */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-base-100 animate-pulse"></span>
                )}
              </div>
              <div tabIndex={0} className="mt-3 z-[1] card card-compact dropdown-content w-80 sm:w-96 bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-0">
                  <div className="flex justify-between items-center p-3 border-b border-base-200 bg-base-100 rounded-t-xl sticky top-0 z-10">
                    <h3 className="font-bold text-sm">Notifications ({unreadCount})</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <MailOpen size={12}/> Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="text-center opacity-50 py-8 text-sm">
                        <div className="flex justify-center mb-2"><Bell size={24} className="opacity-20"/></div>
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`
                            group relative p-3 border-b border-base-100 hover:bg-base-200 transition-all cursor-pointer flex gap-3
                            ${n.isRead ? 'bg-base-100 opacity-60' : 'bg-base-100'}
                          `}
                        >
                          {/* Unread Indicator Dot */}
                          {!n.isRead && (
                            <div className="absolute top-4 left-2 w-1.5 h-1.5 bg-primary rounded-full"></div>
                          )}

                          <div className="pl-2 flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-sm ${n.isRead ? 'font-normal' : 'font-bold'}`}>{n.title}</span>
                              <span className="text-[10px] opacity-40 whitespace-nowrap ml-2">
                                {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <p className="text-xs opacity-70 line-clamp-2 leading-relaxed">{n.message}</p>
                          </div>

                          {/* Hover Actions */}
                          {!n.isRead && (
                            <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => handleMarkItemRead(e, n.id)}
                                className="btn btn-ghost btn-xs btn-circle text-primary tooltip tooltip-left"
                                data-tip="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                     <div className="p-2 border-t border-base-200 text-center bg-base-100/50">
                        <span className="text-[10px] opacity-40">Only recent notifications are shown</span>
                     </div>
                  )}
                </div>
              </div>
            </div>
            {/* End Notification Dropdown */}

          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* LEFT SIDE: SIDEBAR (Unchanged) */}
      <div className="drawer-side z-40 lg:!overflow-visible">
        <label htmlFor="app-drawer" className="drawer-overlay"></label>

        <aside
          className={`
          flex flex-col h-full 
          bg-neutral text-neutral-content border-r border-neutral-content/10
          transition-[width] duration-300 ease-in-out whitespace-nowrap overflow-visible
          ${isCollapsed ? "w-20" : "w-72"}
        `}
        >
          {/* Sidebar Header */}
          <div className="h-20 flex items-center border-b border-neutral-content/10 shrink-0 overflow-hidden relative group">
            <div className="w-20 flex-none flex items-center justify-center transition-all duration-300 h-full">
              <img src="/LOGO.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>

            <div
              className={`
               font-bold text-lg text-neutral-content transition-all duration-300 overflow-hidden
               ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-0"}
              `}
            >
              MASCD MIS
            </div>

            {isCollapsed ? (
              <button
                className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => setIsCollapsed(false)}
                title="Expand Sidebar"
              >
                <PanelLeftOpen size={24} className="text-neutral-content" />
              </button>
            ) : (
              <button
                className="btn btn-square btn-ghost btn-sm ml-auto text-neutral-content/50 hover:text-neutral-content mr-4"
                onClick={() => setIsCollapsed(true)}
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar space-y-1">
            {routeConfig.map((route, idx) => {
              if (route.hidden) return null;
              
              if (!isAllowed(route)) return null;

              return (
                <React.Fragment key={idx}>
                  {route.type === "section" ? (
                    <>
                      {(() => {
                        const visibleChildren = route.children.filter(child => !child.hidden && isAllowed(child));
                        if (visibleChildren.length === 0) return null;

                        return (
                          <>
                            <SidebarSectionTitle label={route.label} isCollapsed={isCollapsed} />
                            {visibleChildren.map((child) => (
                              <SidebarNavItem
                                key={child.path}
                                to={child.path}
                                icon={child.nav.icon}
                                label={child.nav.label}
                                isCollapsed={isCollapsed}
                                isActive={isRouteActive(child.path)}
                              />
                            ))}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <SidebarNavItem
                      to={route.path}
                      icon={route.nav.icon}
                      label={route.nav.label}
                      isCollapsed={isCollapsed}
                      isActive={isRouteActive(route.path)}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="shrink-0">
            <SidebarUserMenu
              user={user}
              isCollapsed={isCollapsed}
              onLogout={() => setShowLogoutConfirm(true)}
              isActive={isSettingsActive}
            />
          </div>
        </aside>
      </div>

      {showLogoutConfirm && (
        <ConfirmationModal
          isOpen={showLogoutConfirm}
          title="Terminate Session?"
          message="Are you sure you want to log out?"
          confirmText="Logout Now"
          variant="danger"
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logout();
          }}
        />
      )}
    </div>
  );
};
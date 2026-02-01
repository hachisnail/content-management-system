import React, { useState, useEffect } from "react";
import { useLocation, Link, Outlet } from "react-router-dom";
import {
  Menu, Bell, Calendar, ChevronRight,
  PanelLeftClose, PanelLeftOpen, Home,
} from "lucide-react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { routeConfig } from "../../config/routeConfig";
import {
  SidebarNavItem,
  SidebarSectionTitle,
  SidebarUserMenu,
} from "./SidebarComponents";
import { ConfirmationModal } from "@repo/ui"; // Ensure this exists or replace with standard modal

export const SidebarLayout = () => {
  const { user, logout } = useAuth();
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

  // [FIX] Robust Active State Logic
  const isRouteActive = (path) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    // Matches exact path OR sub-routes (e.g. /users matches /users/123)
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
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
      <div className="drawer-content  p-2 md:p-4 flex flex-col  min-h-screen transition-all duration-300">
        {/* Header */}
        <header className=" navbar bg-base-100 h-16  px-4 flex-none z-30 border-b border-base-300 rounded-t-xl shadow-sm  w-auto">
          <div className="flex grow gap-4">
            <label htmlFor="app-drawer" className="btn btn-square btn-ghost btn-sm lg:hidden"><Menu size={20} /></label>
            <div className="hidden md:flex">{generateBreadcrumbs()}</div>
          </div>
          <div className="flex gap-3">
             <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-base-200 rounded-full text-xs font-medium text-base-content/70">
              <Calendar size={14} />
              <span>{currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            </div>
            <button className="btn btn-circle btn-sm btn-ghost relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-base-100"></span>
            </button>
          </div>
        </header>


        <main className="flex-1 pt-4 overflow-x-hidden">
          
          <Outlet />
        </main>
      </div>

      {/* LEFT SIDE: SIDEBAR */}
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

            {/* Toggle Button */}
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
              return (
                <React.Fragment key={idx}>
                  {route.type === "section" ? (
                    <>
                      <SidebarSectionTitle label={route.label} isCollapsed={isCollapsed} />
                      {route.children.map((child) => !child.hidden && (
                        <SidebarNavItem
                          key={child.path}
                          to={child.path}
                          icon={child.nav.icon}
                          label={child.nav.label}
                          isCollapsed={isCollapsed}
                          // [FIX] Use updated Active Check
                          isActive={isRouteActive(child.path)}
                        />
                      ))}
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
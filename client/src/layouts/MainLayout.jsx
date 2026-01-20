import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { routeConfig } from "../config/routeConfig"; //

import {
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
  ChevronDown,
  Home,
  Plus,
  Calendar,
} from "lucide-react";

import { ConfirmationModal, Dropdown, Avatar } from "../components/UI";

const WIDTH_EXPANDED = "w-[260px]";
const WIDTH_COLLAPSED = "w-[72px]";

// --- Custom Scrollbar Styles ---
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 5px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
  
  .content-scrollbar::-webkit-scrollbar { width: 8px; }
  .content-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .content-scrollbar::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 4px; }
  .content-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }
`;

const NavItem = ({ to, icon: Icon, label, isCollapsed, isActive }) => (
  <Link
    to={to}
    className={`group flex items-center h-[40px] mx-3 mb-1 rounded-md transition-all duration-200 relative overflow-hidden 
      ${
        isActive
          ? "bg-zinc-800 text-white font-medium"
          : "text-zinc-400 hover:text-white hover:bg-zinc-900"
      }
    `}
    title={isCollapsed ? label : ""}
  >
    <div className="h-[40px] w-[48px] min-w-[48px] flex items-center justify-center flex-shrink-0">
      <Icon
        className={`w-4 h-4 transition-all duration-300 ${
          isActive
            ? "scale-100 text-white"
            : "group-hover:scale-110 group-hover:text-white"
        }`}
        strokeWidth={2}
      />
    </div>

    <div
      className={`text-sm tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
        isCollapsed
          ? "max-w-0 opacity-0 translate-x-[-10px]"
          : "max-w-[200px] opacity-100 translate-x-0"
      }`}
    >
      {label}
    </div>
  </Link>
);

const NavSectionTitle = ({ label, isCollapsed, isOpen, onToggle }) => {
  if (isCollapsed) {
    return (
      <div className="transition-all duration-300 ease-in-out h-4 my-2 opacity-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 whitespace-nowrap">
            {label}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between h-auto px-6 mt-6 mb-2 group focus:outline-none"
    >
      <div className="flex items-center gap-2 w-full">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 whitespace-nowrap group-hover:text-zinc-400 transition-colors">
          {label}
        </div>
        <div className="h-px bg-zinc-800 flex-1 opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <ChevronDown
          size={14}
          className={`text-zinc-600 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
        />
      </div>
    </button>
  );
};

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { hasPermission } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [breadcrumbLabel, setBreadcrumbLabel] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [sectionStates, setSectionStates] = useState(() => {
    const states = {};
    const initStates = (routes) => {
      routes.forEach((route) => {
        if (route.type === "section") {
          states[route.label] = !route.defaultCollapsed;
          if (route.children) initStates(route.children);
        }
      });
    };
    initStates(routeConfig);
    return states;
  });

  const toggleSection = (label) => {
    setSectionStates((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  useEffect(() => {
    setBreadcrumbLabel(null);
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login", { state: { manualLogout: true } });
  };

  // --- FIX: BEST MATCH STRATEGY ---
  // Calculates the single most specific nav item that matches the current URL
  const activeNavPath = useMemo(() => {
    const currentPath = location.pathname;
    let bestMatch = "";

    const traverse = (routes, basePath = "") => {
      routes.forEach((route) => {
        // Construct full path for this route relative to parent
        let fullRoutePath = basePath;
        if (route.path) {
          fullRoutePath = route.path.startsWith("/")
            ? route.path
            : `${basePath}/${route.path}`.replace(/\/+/g, "/");
        }

        // If this route is a Nav Item, check if it matches
        if (route.nav) {
          // Match Logic: Exact match OR Prefix match with boundary
          const isMatch =
            currentPath === fullRoutePath ||
            (currentPath.startsWith(fullRoutePath) &&
              currentPath.charAt(fullRoutePath.length) === "/");

          if (isMatch) {
            // If this match is longer (more specific) than previous best, take it
            if (fullRoutePath.length > bestMatch.length) {
              bestMatch = fullRoutePath;
            }
          }
        }

        // Recursively check children
        if (route.children) {
          traverse(route.children, fullRoutePath);
        }
      });
    };

    traverse(routeConfig);
    return bestMatch;
  }, [location.pathname]);

  // Simplified isActive check
  const isActive = (path) => path === activeNavPath;

  // --- BREADCRUMBS ---
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);
    return (
      <div className="flex items-center space-x-2 text-sm text-zinc-500">
        <Link
          to="/dashboard"
          className="hover:text-black transition-colors flex items-center gap-1 hover:bg-zinc-100 p-1 rounded-md"
        >
          <Home size={14} />
        </Link>
        {pathnames.length > 0 && (
          <ChevronRight size={14} className="text-zinc-300" />
        )}
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          let label = value.replace(/-/g, " ");
          if (isLast && breadcrumbLabel) {
            label = breadcrumbLabel;
          }
          return (
            <React.Fragment key={index}>
              {isLast ? (
                <span className="font-semibold cursor-default text-black uppercase truncate max-w-100 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200 shadow-sm text-xs tracking-wide">
                  {label}
                </span>
              ) : (
                <span className="capitalize cursor-default hover:text-zinc-800 transition-colors">
                  {label}
                </span>
              )}
              {!isLast && <ChevronRight size={14} className="text-zinc-300" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const generateNav = useCallback(() => {
    const privateRoutes = routeConfig.filter((r) => !r.isPublic);

    const buildNav = (routes, basePath = "") => {
      return routes.flatMap((route) => {
        if (route.permission && !hasPermission(user, route.permission)) {
          return [];
        }

        // --- SECTION LOGIC ---
        if (route.type === "section") {
          const canViewSection = route.permissions
            ? route.permissions.some((p) => hasPermission(user, p))
            : true;
          if (!canViewSection) return [];

          const visibleChildren = buildNav(route.children || [], basePath);
          if (visibleChildren.length === 0) return [];

          const isOpen = sectionStates[route.label];

          return [
            <NavSectionTitle
              key={`section-${route.label}`}
              label={route.label}
              isCollapsed={isCollapsed}
              isOpen={isOpen}
              onToggle={() => toggleSection(route.label)}
            />,
            isCollapsed || isOpen ? visibleChildren : null,
          ];
        }

        if (route.nav) {
          const fullPath = route.path.startsWith("/")
            ? route.path
            : `${basePath}/${route.path}`.replace(/\/+/g, "/");
          return [
            <NavItem
              key={fullPath}
              to={fullPath}
              icon={route.nav.icon}
              label={route.nav.label}
              isCollapsed={isCollapsed}
              isActive={isActive(fullPath)} // Uses new exact match logic
            />,
            ...(route.children ? buildNav(route.children, fullPath) : []),
          ];
        }
        if (route.children) {
          const nextBasePath = route.path
            ? `${basePath}/${route.path}`.replace(/\/+/g, "/")
            : basePath;
          return buildNav(route.children, nextBasePath);
        }
        return [];
      });
    };
    return buildNav(privateRoutes);
  }, [
    user,
    isCollapsed,
    location.pathname,
    hasPermission,
    sectionStates,
    activeNavPath,
  ]); // Added activeNavPath dependency

  return (
    <div className="flex h-screen bg-zinc-100 text-zinc-900 overflow-hidden font-sans selection:bg-zinc-200 selection:text-black">
      <style>{scrollbarStyles}</style>

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
          <div className="flex items-center justify-center flex-shrink-0 min-w-[40px] bg-white/10 rounded-lg h-10 w-10">
            <img src="/LOGO.png" alt="M" className="w-6 h-6 object-contain" />
          </div>
          <div
            className={`ml-3 overflow-hidden transition-all duration-300 flex flex-col ${
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            <span className="font-bold text-lg tracking-tight whitespace-nowrap">
              MASCD<span className="font-light text-zinc-500">MIS</span>
            </span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex absolute right-4 text-zinc-500 hover:text-white transition-colors hover:bg-zinc-800 p-1 rounded-md ${
              isCollapsed ? "opacity-0 invisible" : ""
            }`}
          >
            <PanelLeftClose size={16} />
          </button>

          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute inset-0 z-20 cursor-pointer"
              title="Expand Menu"
            />
          )}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden absolute right-4 text-zinc-400 hover:text-white p-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 space-y-1">
          {generateNav()}
        </nav>

        {/* USER PROFILE */}
        <div className="p-3 border-t border-zinc-900 mt-auto flex-shrink-0 bg-black">
          <Dropdown
            align="top"
            matchWidth={!isCollapsed}
            trigger={
              <div
                className={`flex items-center transition-all duration-300 rounded-lg bg-zinc-900 border border-zinc-800 p-1.5 h-[52px] overflow-hidden cursor-pointer hover:bg-zinc-800 hover:border-zinc-700 group ${
                  isCollapsed
                    ? "justify-center w-full"
                    : "justify-between w-full"
                }`}
              >
                <div className="flex items-center min-w-0">
                  <Avatar
                    user={user}
                    size="sm"
                    className="bg-zinc-800 border-zinc-700 text-zinc-300 group-hover:bg-zinc-700 transition-colors"
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
                  <MoreVertical
                    size={16}
                    className="text-zinc-500 mr-2 group-hover:text-zinc-300"
                  />
                )}
              </div>
            }
          >
            {({ close }) => (
              <div className={isCollapsed ? "w-56" : ""}>
                <Link
                  to={`/profile`}
                  onClick={close}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <User size={16} /> My Profile
                </Link>
                <div className="h-px bg-zinc-100 my-1" />
                <button
                  onClick={() => {
                    setShowLogoutConfirm(true);
                    close();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </Dropdown>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-100">
        <header className="h-[60px] bg-white text-black flex items-center px-4 lg:hidden z-10 justify-between flex-shrink-0 shadow-sm border-b border-zinc-200">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 text-zinc-500 hover:text-black"
            >
              <Menu size={24} />
            </button>
            <span className="ml-3 font-bold text-lg tracking-tight">
              MASCD MIS
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth p-0 lg:p-4 content-scrollbar">
          <div className="w-full max-w-7xl mx-auto min-h-[calc(100vh-2rem)] bg-white lg:rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-zinc-200 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 h-[64px] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isCollapsed && (
                  <button
                    onClick={() => setIsCollapsed(false)}
                    className="hidden lg:block mr-2 text-zinc-400 hover:text-black transition-colors"
                  >
                    <PanelLeftOpen size={18} />
                  </button>
                )}
                {generateBreadcrumbs()}
              </div>

              <div className="flex items-center space-x-3">
                <div className="hidden xl:flex items-center gap-2 text-xs text-zinc-500 border-r border-zinc-200 pr-4 mr-1">
                  <Calendar size={14} />
                  <span>
                    {currentDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="hidden md:flex items-center bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-500/10 focus-within:bg-white transition-all w-64 group">
                  <Search
                    size={14}
                    className="text-zinc-400 mr-2 group-focus-within:text-zinc-900 transition-colors"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="bg-transparent border-none outline-none text-xs w-full text-zinc-700 h-full placeholder:text-zinc-400"
                  />
                  <div className="hidden group-hover:flex items-center gap-0.5 pointer-events-none">
                    <kbd className="bg-white border border-zinc-200 rounded px-1.5 text-[10px] font-mono text-zinc-400 shadow-sm">
                      ⌘K
                    </kbd>
                  </div>
                </div>

                <button
                  className="hidden md:flex items-center justify-center h-8 w-8 rounded-full bg-zinc-900 text-white hover:bg-zinc-700 transition-colors shadow-sm"
                  title="Quick Action"
                >
                  <Plus size={16} />
                </button>

                <button className="text-zinc-400 hover:text-black p-2 rounded-full hover:bg-zinc-100 transition-colors relative">
                  <Bell size={18} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
                </button>
              </div>
            </div>

            {/* Page Content */}
            <div className="flex-1 p-6 md:p-8 relative">
              <div
                key={location.pathname}
                className="animate-in fade-in slide-in-from-bottom-3 duration-500 ease-in-out"
              >
                <Outlet context={{ setBreadcrumbLabel }} />
              </div>
            </div>
          </div>
        </main>
      </div>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Terminate Session?"
        message="Are you sure you want to log out?"
        confirmLabel="Logout Now"
        isDangerous={true}
      />

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[50] lg:hidden animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;

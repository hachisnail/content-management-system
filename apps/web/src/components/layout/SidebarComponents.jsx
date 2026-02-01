import React from "react";
import { Link } from "react-router-dom";
import { MoreVertical, LogOut, User, Settings } from "lucide-react";
import { Avatar } from "../common"; 

export const SidebarSectionTitle = ({ label, isCollapsed }) => {
  if (isCollapsed) return <div className="h-4 my-2" />;

  return (
    <div className="px-6 py-3 mt-2 flex items-center animate-in fade-in duration-300">
      <span className="text-xs font-bold text-neutral-content/60 uppercase tracking-wider">
        {label}
      </span>
      <div className="h-px bg-neutral-content/10 flex-1 ml-2"></div>
    </div>
  );
};

export const SidebarNavItem = ({
  to,
  icon: Icon,
  label,
  isCollapsed,
  isActive,
}) => {
  return (
    <Link
      to={to}
      className={`
        flex items-center h-12 mx-2 rounded-md transition-all duration-200 group relative
        ${
          isActive 
            /* [FIX] ROBUST ACTIVE STATE:
               - bg-base-100: Uses the "paper" color to contrast against the "neutral" sidebar 
               - text-primary: Applies the brand color to the text/icon
               - shadow-md: Adds depth to lift it off the background
            */
            ? "bg-base-100 text-primary shadow-md font-semibold" 
            : "text-neutral-content/70 hover:bg-neutral-content/10 hover:text-neutral-content"
        }
      `}
    >


      <div className="w-[64px] flex-none flex items-center justify-center">
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
      </div>

      <span
        className={`
        text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-1"}
      `}
      >
        {label}
      </span>
    </Link>
  );
};

export const SidebarUserMenu = ({ user, isCollapsed, onLogout }) => {
  return (
    <div className="border-t border-neutral-content/10 bg-black/10 p-2">
      <div
        className={`dropdown dropdown-top ${isCollapsed ? "dropdown-right" : "dropdown-end"} w-full`}
      >
        <div
          tabIndex={0}
          role="button"
          className="flex items-center h-12 rounded-lg hover:bg-neutral-content/10 transition-colors cursor-pointer group outline-none w-full"
        >
          <div className="w-[64px] flex-none flex items-center justify-center">
             <Avatar 
               user={user} 
               size="w-8 h-8" 
               textSize="text-xs"
               className="bg-neutral-content/20 text-neutral-content border rounded-full border-neutral-content/30"
             />
          </div>

          <div
            className={`
            flex-1 overflow-hidden text-left transition-all duration-300 
            ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-1"}
          `}
          >
            <p className="text-sm font-semibold text-neutral-content truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-neutral-content/60 truncate">{user?.roles?.[0]}</p>
          </div>
          
          <div className={`mr-2 ${isCollapsed ? "hidden" : "block"}`}>
             <MoreVertical size={16} className="text-neutral-content/50" />
          </div>
        </div>

        <ul
          tabIndex={0}
          className={`
          dropdown-content z-[100] menu p-2 shadow-xl bg-base-100 border border-base-200 rounded-box w-52 text-base-content
          ${isCollapsed ? "ml-4 -mb-12" : "mb-2"}
        `}
        >
          <li><Link to="/settings"><Settings size={16} /> Settings</Link></li>
          <div className="divider my-1 border-base-200"></div>
          <li><button onClick={onLogout} className="text-error"><LogOut size={16} /> Sign Out</button></li>
        </ul>
      </div>
    </div>
  );
};
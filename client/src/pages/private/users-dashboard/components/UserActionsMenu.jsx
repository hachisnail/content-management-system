import React from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown, Button } from "../../../../components/UI";
import { MoreVertical, Eye, Power, Ban, Lock, CheckCircle } from "lucide-react";
import { encodeId } from "../../../../utils/idEncoder";
import { useConfig } from "../../../../context/ConfigContext";

const UserActionsMenu = ({
  user,
  currentUser,
  onDisconnect,
  onDisable,
  onEnable,
  hasPermission,
  PERMISSIONS,
}) => {
  const navigate = useNavigate();

  // --- ROLE CHECKS ---
  const isMySuper = currentUser?.role?.includes("super_admin");
  const isTargetSuper = user.role?.includes("super_admin");

  // Rule: You can only touch a Super Admin if YOU are a Super Admin.
  const isProtectedTarget = isTargetSuper && !isMySuper;

  // --- ACTIONS AVAILABILITY ---

  // Disconnect: Permission + Not Protected
  const { can } = useConfig();
  const canDisconnect = can(PERMISSIONS.DISCONNECT_USERS) && !isProtectedTarget;

  // Disable/Enable: Permission + Not Protected + Not Self
  const canManageStatus =
    hasPermission(currentUser, PERMISSIONS.MANAGE_USER_STATUS) &&
    !isProtectedTarget;

  return (
    <div className="flex justify-end pr-2">
      <Dropdown
        align="right"
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-zinc-100"
          >
            <MoreVertical size={18} className="text-zinc-400" />
          </Button>
        }
      >
        {/* FIX: Use render prop to access 'close' method */}
        {({ close }) => (
          <div className="w-60 font-sans">
            <button
              onClick={() => {
                navigate(`/users/${encodeId(user.id)}`);
                close();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors"
            >
              <Eye size={14} /> View Profile
            </button>

            <div className="h-px bg-zinc-100 my-1" />

            {/* FORCE DISCONNECT */}
            {hasPermission(currentUser, PERMISSIONS.DISCONNECT_USERS) && (
              <button
                onClick={() => {
                  onDisconnect(user.id);
                  close(); // Close dropdown!
                }}
                disabled={
                  !canDisconnect || !user.isOnline || user.id === currentUser.id
                }
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProtectedTarget ? (
                  <Lock size={14} className="text-zinc-400" />
                ) : (
                  <Power size={14} />
                )}
                {isProtectedTarget ? "Protected Session" : "Force Disconnect"}
              </button>
            )}

            {/* TOGGLE ACCOUNT STATUS */}
            {canManageStatus && (
              <>
                {user.status === "disabled" ? (
                  <button
                    onClick={() => {
                      onEnable(user.id);
                      close(); // Close dropdown!
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                  >
                    <CheckCircle size={14} /> Enable Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onDisable(user.id);
                      close(); // Close dropdown!
                    }}
                    disabled={user.id === currentUser.id}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Ban size={14} /> Disable Account
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </Dropdown>
    </div>
  );
};

export default UserActionsMenu;

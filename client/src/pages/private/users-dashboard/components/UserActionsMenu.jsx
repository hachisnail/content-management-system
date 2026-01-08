import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, Button } from '../../../../components/UI';
import { MoreVertical, Eye, Power, Ban, Lock, CheckCircle } from 'lucide-react';
import { encodeId } from '../../../../utils/idEncoder';

const UserActionsMenu = ({ 
  user, 
  currentUser, 
  onDisconnect, 
  onDisable, 
  onEnable, // <--- NEW PROP
  hasPermission, 
  PERMISSIONS 
}) => {
  const navigate = useNavigate();
  
  const isSuperAdmin = currentUser?.role?.includes('super_admin');
  const isAdmin = currentUser?.role?.includes('admin');
  const targetIsSuperAdmin = user.role?.includes('super_admin');

  const canDisconnect = hasPermission(currentUser, PERMISSIONS.DISCONNECT_USERS) && 
                        !(isAdmin && targetIsSuperAdmin);

  return (
    <div className="flex justify-end pr-2">
      <Dropdown 
        align="right"
        trigger={
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100">
            <MoreVertical size={18} className="text-zinc-400" />
          </Button>
        }
      >
        <div className="w-60 font-sans">
          <button
            onClick={() => navigate(`/users/${encodeId(user.id)}`)}
            className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors"
          >
            <Eye size={14} /> View Profile
          </button>
          
          <div className="h-px bg-zinc-100 my-1" />

          {/* FORCE DISCONNECT */}
          {hasPermission(currentUser, PERMISSIONS.DISCONNECT_USERS) && (
            <button
              onClick={() => onDisconnect(user.id)}
              disabled={!canDisconnect || !user.isOnline || user.id === currentUser.id}
              className="w-full text-left px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {targetIsSuperAdmin && isAdmin ? <Lock size={14} /> : <Power size={14} />}
              Force Disconnect
            </button>
          )}

          {/* TOGGLE ACCOUNT STATUS (Super Admin Only) */}
          {isSuperAdmin && (
            <>
              {user.status === 'disabled' ? (
                // ENABLE BUTTON
                <button
                  onClick={() => onEnable(user.id)}
                  className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Enable Account
                </button>
              ) : (
                // DISABLE BUTTON
                <button
                  onClick={() => onDisable(user.id)}
                  disabled={user.id === currentUser.id}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                >
                  <Ban size={14} /> Disable Account
                </button>
              )}
            </>
          )}
        </div>
      </Dropdown>
    </div>
  );
};

export default UserActionsMenu;
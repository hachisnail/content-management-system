import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealtimeResource } from '../../../hooks/useRealtimeResource';
import { useTableControls } from '../../../hooks/useTableControls';
import { useUserManagement } from './hooks/useUserManagement';
import api from '../../../api'; 
import socket from '../../../socket'; // <--- NEW IMPORT for verification

import { UserIdentity, UserRole, UserStatus } from './components/UserTableCells';
import UserActionsMenu from './components/UserActionsMenu';

import { 
  DataTable, 
  Button, 
  ConfirmationModal,
  Alert
} from '../../../components/UI';
import { UserPlus, Trash2, Users, Clock, XCircle, Zap } from 'lucide-react';

function UserDirectory() {
  const navigate = useNavigate();
  // We update 'now' every second to force the UserStatus component to re-evaluate timestamps
  const [now, setNow] = useState(Date.now());

  // --- 1. TABLE CONTROLS ---
  const activeControls = useTableControls({ defaultLimit: 10, initialSort: { key: 'last_active', direction: 'desc' } });
  const pendingControls = useTableControls({ defaultLimit: 5, initialSort: { key: 'createdAt', direction: 'desc' } });

  // --- 2. DATA FETCHING ---
  
  // A. Active & Disabled Users
  const { 
    data: activeData, 
    meta: activeMeta, 
    loading: activeLoading,
    error: activeError
  } = useRealtimeResource('users', { 
    queryParams: { 
      ...activeControls.queryParams,
      status: ['active', 'disabled'] 
    },
    filterFn: (user) => user && ['active', 'disabled'].includes(user.status)
  });

  // B. Pending Users (Invites)
  const { 
    data: pendingData, 
    meta: pendingMeta, 
    loading: pendingLoading
  } = useRealtimeResource('users', { 
    queryParams: { 
      ...pendingControls.queryParams,
      status: 'pending' 
    },
    filterFn: (user) => user && user.status === 'pending'
  });

  const activeUsers = activeData || [];
  const pendingUsers = pendingData || [];
  
  const allUsers = [...activeUsers, ...pendingUsers];

  // --- 3. MANAGEMENT LOGIC ---
  const {
    selectedUsers, setSelectedUsers,
    disconnectTarget, setDisconnectTarget,
    disableTarget, setDisableTarget,
    enableTarget, setEnableTarget,
    revokeTarget, setRevokeTarget, 
    showBulkConfirm, setShowBulkConfirm,
    statusMsg, setStatusMsg,
    confirmDisconnect, confirmDisable, confirmEnable, confirmBulkDisconnect,
    confirmRevoke, 
    currentUser, hasPermission, PERMISSIONS
  } = useUserManagement(allUsers);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60_000); 
    return () => clearInterval(interval);
  }, []);

  // --- DEBUG VERIFICATION (NEW) ---
  // This helps you verify if this specific page is receiving the broadcast
  useEffect(() => {
    const handleUpdate = (data) => {
        console.log("%c[UserDirectory] Socket Event: users_updated", "color: #00ff00; background: #000; padding: 2px 5px;", data);
    };
    const handleCreate = (data) => {
        console.log("%c[UserDirectory] Socket Event: users_created", "color: #00ff00; background: #000; padding: 2px 5px;", data);
    };
    
    socket.on('users_updated', handleUpdate);
    socket.on('users_created', handleCreate);

    return () => {
        socket.off('users_updated', handleUpdate);
        socket.off('users_created', handleCreate);
    };
  }, []);

  // --- DEBUG FUNCTION ---
  const handleDebugActivityUpdate = async () => {
    if (!currentUser) return;
    try {
      console.log("[UserDirectory] Sending Debug Signal via API...");
      // Force update the 'last_active' timestamp to NOW via the API
      // The server is configured to emit 'users_updated' whenever this endpoint is hit
      await api.updateUser(currentUser.id, { last_active: new Date() });
      setStatusMsg({ type: 'success', text: 'Debug: Signal sent. Check console for [UserDirectory] logs.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Debug failed: ' + err.message });
    }
  };


  // --- COLUMNS ---
  const getColumns = (isPendingTable = false) => [
    { 
      header: "Identity", 
      accessor: "lastName",
      sortable: true,
      render: (user) => <UserIdentity user={user} />
    },
    { 
      header: "Access Level", 
      accessor: "role",
      sortable: true,
      render: (user) => <UserRole user={user} />
    },
    // ACTIVE TABLE SPECIFIC COLUMNS
    ...(!isPendingTable ? [{
      header: "Live Status", 
      accessor: "last_active",
      sortable: true,
      // Pass 'now' so the cell re-renders every second
      render: (user) => <UserStatus user={user} now={now} />
    },
    { 
      header: "", 
      accessor: "id",
      render: (user) => (
        <UserActionsMenu 
          user={user} 
          currentUser={currentUser}
          hasPermission={hasPermission}
          PERMISSIONS={PERMISSIONS}
          onDisconnect={setDisconnectTarget} 
          onDisable={setDisableTarget} 
          onEnable={setEnableTarget}
        />
      )
    }] : []), 

    // PENDING TABLE SPECIFIC COLUMNS
    ...(isPendingTable ? [{
      header: "Invited At",
      accessor: "createdAt",
      render: (user) => (
        <div className="flex flex-col">
           <span className="text-xs font-mono text-zinc-600">{new Date(user.createdAt).toLocaleDateString()}</span>
           <span className="text-[10px] text-zinc-400">Expires in 48h</span>
        </div>
      )
    },
    {
      header: "",
      accessor: "id",
      render: (user) => (
         <div className="flex justify-start">
           <Button 
             variant="secondary" 
             size="xs" 
             icon={XCircle}
             className="text-red-600 hover:bg-red-50 border-red-100 hover:text-white hover:border-red-600"
             onClick={() => setRevokeTarget(user.id)}
           >
             Revoke
           </Button>
         </div>
      )
    }] : [])
  ];

  if (activeError) return <Alert type="error" title="Sync Error" message={activeError} />;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">User Management</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage active members and pending invitations.</p>
        </div>
        <div className="flex gap-2">
            {/* DEBUG BUTTON */}
            <Button variant="secondary" icon={Zap} onClick={handleDebugActivityUpdate}>
              Debug: Touch Activity
            </Button>

            <Button variant="primary" icon={UserPlus} onClick={() => navigate(`/users/invite`)}>
              Invite User
            </Button>
        </div>
      </div>

      {statusMsg && (
        <Alert type={statusMsg.type} message={statusMsg.text} onClose={() => setStatusMsg(null)} />
      )}

      {/* --- TABLE 1: ACTIVE MEMBERS --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-800 font-bold">
          <div className="p-1.5 bg-green-100 rounded text-green-700"><Users size={18}/></div>
          <h3>Active Directory</h3>
          <span className="text-xs font-normal text-zinc-500 ml-2">({activeMeta?.totalItems || 0} users)</span>
        </div>

        <DataTable 
          columns={getColumns(false)} 
          data={activeUsers} 
          isLoading={activeLoading && activeControls.queryParams.page === 1}
          onSearch={activeControls.setSearch}
          onSort={activeControls.handleSortChange}
          searchPlaceholder="Search active members..."
          enableMultiSelect={hasPermission(currentUser, PERMISSIONS.DISCONNECT_USERS)}
          onSelectionChange={setSelectedUsers}
          bulkActionSlot={
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setShowBulkConfirm(true)}>
                  Disconnect ({selectedUsers.length})
              </Button>
          }
          serverSidePagination={{
            totalItems: activeMeta?.totalItems || 0,
            currentPage: activeControls.queryParams.page,
            itemsPerPage: activeControls.queryParams.limit,
            onPageChange: activeControls.setPage
          }}
        />
      </div>

      {/* --- TABLE 2: PENDING INVITATIONS --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-800 font-bold">
          <div className="p-1.5 bg-amber-100 rounded text-amber-700"><Clock size={18}/></div>
          <h3>Pending Invitations</h3>
          <span className="text-xs font-normal text-zinc-500 ml-2">({pendingMeta?.totalItems || 0} invited)</span>
        </div>

        <DataTable 
          columns={getColumns(true)} 
          data={pendingUsers} 
          isLoading={pendingLoading && pendingControls.queryParams.page === 1}
          onSearch={pendingControls.setSearch}
          onSort={pendingControls.handleSortChange}
          searchPlaceholder="Search pending invites..."
          serverSidePagination={{
            totalItems: pendingMeta?.totalItems || 0,
            currentPage: pendingControls.queryParams.page,
            itemsPerPage: pendingControls.queryParams.limit,
            onPageChange: pendingControls.setPage
          }}
        />
      </div>

      {/* MODALS */}
      <ConfirmationModal 
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={confirmRevoke}
        title="Revoke Invitation?"
        message="Are you sure? This will permanently delete the invitation. The link sent to the user will no longer work."
        confirmLabel="Revoke & Delete"
        isDangerous={true}
      />

      <ConfirmationModal 
        isOpen={!!disconnectTarget}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={confirmDisconnect}
        title="Disconnect User?"
        message="This will immediately terminate the user's active session."
        confirmLabel="Force Disconnect"
        isDangerous={true}
      />

      <ConfirmationModal 
        isOpen={!!disableTarget}
        onClose={() => setDisableTarget(null)}
        onConfirm={confirmDisable}
        title="Disable Account?"
        message="This will disconnect the user and prevent them from logging in again."
        confirmLabel="Disable Account"
        isDangerous={true}
      />

      <ConfirmationModal 
        isOpen={!!enableTarget}
        onClose={() => setEnableTarget(null)}
        onConfirm={confirmEnable}
        title="Re-enable Account?"
        message="This user will be allowed to log in again immediately."
        confirmLabel="Enable Account"
      />

      <ConfirmationModal 
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={confirmBulkDisconnect}
        title="Bulk Disconnect"
        message={`Are you sure you want to disconnect ${selectedUsers.length} users?`}
        confirmLabel="Disconnect All"
        isDangerous={true}
      />
    </div>
  );
}

export default UserDirectory;
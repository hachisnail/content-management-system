import React, { useState, useEffect } from 'react';
import { Power, Check, Filter, RefreshCcw, Activity, MoreHorizontal, Trash2, Eye, FileText } from 'lucide-react';

import { formatTimeAgo } from '../../../utils/time';
import { useRealtimeResource } from '../../../hooks/useRealtimeResource';
import { useTableControls } from '../../../hooks/useTableControls'; 
import socket from '../../../socket';
import { useAuth } from '../../../context/AuthContext';
import { useConfig } from '../../../context/ConfigContext';

import { 
  DataTable, 
  Badge, 
  Button, 
  Alert, 
  ConfirmationModal, 
  Dropdown,
  Avatar
} from '../../../components/UI';

const INACTIVE_THRESHOLD_MS = 60 * 1000; 
const UI_REFRESH_INTERVAL_MS = 1000;

function Monitor() {
  const { user: currentUser } = useAuth(); 
  const { hasPermission, PERMISSIONS } = useConfig();
  const [validationError, setValidationError] = useState(null);

  // --- 1. TABLE CONTROLS ---
  // Managed state for search, pagination, and dynamic sorting
  const { 
    page, setPage, 
    limit, 
    search, setSearch, 
    filters, handleFilterChange, 
    handleSortChange,
    queryParams 
  } = useTableControls({ defaultLimit: 10 });

  // --- 2. DATA FETCHING ---
  // Real-time hook synced with server-side query params
  const { data, meta, loading, error } = useRealtimeResource('users', { queryParams });

  // Handle flexible backend response structures
  const users = Array.isArray(data) ? data : (data?.rows || []);
  const totalCount = meta?.totalItems || 0;

  const [now, setNow] = useState(Date.now());
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // UI Tick for "Time Ago" and "Idle" status accuracy
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), UI_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleSingleDisconnect = () => {
    if (disconnectTarget) {
      socket.emit('force_disconnect_user', { userId: disconnectTarget });
      setDisconnectTarget(null);
    }
  };

  const handleBulkDisconnect = () => {
    // 1. Filter selection for eligible users (Online & Not Self)
    const eligibleIds = selectedUsers.filter(userId => {
      const userObject = users.find(u => u.id === userId);
      return userObject && userObject.isOnline && userObject.id !== currentUser.id;
    });

    // 2. Validate selection
    if (eligibleIds.length === 0) {
      setValidationError("No eligible online users were selected for disconnection.");
      setShowBulkConfirm(false);
      setTimeout(() => setValidationError(null), 5000); // Auto-clear
      return;
    }

    // 3. Emit events and clean up
    eligibleIds.forEach(userId => socket.emit('force_disconnect_user', { userId }));
    setValidationError(null);
    setShowBulkConfirm(false);
    setSelectedUsers([]); 
  };

  const getUserStatus = (user) => {
    if (!user.isOnline) return { label: 'Offline', variant: 'neutral' };
    if (!user.last_active) return { label: 'Online', variant: 'success' };
    
    const diff = now - new Date(user.last_active).getTime();
    return diff > INACTIVE_THRESHOLD_MS 
      ? { label: 'Idle', variant: 'warning' }
      : { label: 'Online', variant: 'success' };
  };

  const columns = [
{ 
  header: "User Identity", 
  accessor: "firstName",
  sortable: true,
  render: (user) => (
    <div className="flex items-center gap-3">
      {/* NEW AVATAR */}
      <Avatar user={user} size="md" />

      <div className="min-w-0">
        <div className="font-semibold text-zinc-900 leading-tight truncate">
          {user.firstName} {user.lastName}
        </div>
        <div className="text-xs text-zinc-400 font-mono truncate">{user.email}</div>
      </div>
    </div>
  )
},
    { 
      header: "Status & Activity", 
      accessor: "last_active", // Using last_active for sorting timestamp
      sortable: true,
      render: (user) => {
        const { label, variant } = getUserStatus(user);
        return (
          <div className="flex flex-col items-start gap-1.5">
            <Badge variant={variant} className="shadow-sm">{label}</Badge>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono uppercase tracking-wide">
              <Activity size={10} />
              <span>{user.last_active ? formatTimeAgo(user.last_active) : 'Just now'}</span>
            </div>
          </div>
        );
      }
    },
    ...(hasPermission(currentUser, PERMISSIONS.DISCONNECT_USERS) ? [{
      header: "",
      accessor: "id",
      render: (user) => (
        <div className="flex justify-end">
          <Dropdown align="right" trigger={
            <button className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors">
              <MoreHorizontal size={18} />
            </button>
          }>
            <div className="w-48">
              <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 font-sans"><Eye size={14} /> View Profile</button>
              <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 font-sans"><FileText size={14} /> View Logs</button>
              <div className="h-px bg-zinc-100 my-1" />
              <button 
                onClick={() => setDisconnectTarget(user.id)}
                disabled={!user.isOnline || user.id === currentUser.id}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 font-sans"
              ><Power size={14} /> Force Disconnect</button>
            </div>
          </Dropdown>
        </div>
      )
    }] : [])
  ];

  if (error) return <Alert type="error" title="Sync Error" message={error} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 font-sans">Live Monitor</h1>
          <p className="text-zinc-500 text-sm mt-1 font-sans">Real-time session tracking (Synced with Server).</p>
        </div>
        <div className="px-3 py-1 bg-white border border-zinc-200 rounded-full text-xs font-bold text-zinc-600 shadow-sm flex items-center gap-2 font-sans">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
           </span>
           {totalCount} Recorded Users
        </div>
      </div>

      {/* Persistence and Validation Alerts */}
      {validationError && (
        <Alert 
          type="warning" 
          message={validationError} 
          onClose={() => setValidationError(null)} 
        />
      )}

      {/* Main Table Section */}
      <DataTable 
        columns={columns} 
        data={users} 
        onSearch={setSearch} 
        onSort={handleSortChange}
        isLoading={loading}
        searchPlaceholder="Find user by name or email..."
        enableMultiSelect={hasPermission(currentUser, PERMISSIONS.DISCONNECT_USERS)}
        onSelectionChange={setSelectedUsers}
        serverSidePagination={{
            totalItems: totalCount,
            currentPage: page,
            itemsPerPage: limit,
            onPageChange: setPage
        }}
        bulkActionSlot={
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setShowBulkConfirm(true)}>
                Disconnect Selected
            </Button>
        }
        filterSlot={
          <Dropdown trigger={
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 shadow-sm group transition-all font-sans">
              <Filter size={16} className="text-zinc-500 group-hover:text-black" />
              <span>Status: <span className="text-black font-semibold uppercase">{filters.status || 'All'}</span></span>
            </button>
          }>
            <div className="w-48 font-sans">
              {['All', 'active', 'pending'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterChange('status', status === 'All' ? undefined : status)}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center justify-between transition-colors"
                >
                  <span className="capitalize">{status}</span>
                  {(filters.status === status || (!filters.status && status === 'All')) && <Check size={14} className="text-black" />}
                </button>
              ))}
            </div>
          </Dropdown>
        }
      />

      {/* Modals */}
      <ConfirmationModal 
        isOpen={!!disconnectTarget}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={handleSingleDisconnect}
        title="Disconnect User?"
        message="This will immediately terminate the user's session."
        confirmLabel="Force Disconnect"
        isDangerous={true}
      />

      <ConfirmationModal 
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={handleBulkDisconnect}
        title={`Disconnect ${selectedUsers.length} Users?`}
        message="Are you sure you want to force disconnect all selected users? Note: Offline users and your own session will be skipped."
        confirmLabel={`Disconnect All (${selectedUsers.length})`}
        isDangerous={true}
      />
    </div>
  );
}

export default Monitor;
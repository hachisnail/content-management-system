import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/common/DataTable';
import { Avatar } from '../../../components/common';
import { useUserManager } from '../hooks/useUserManager';
import { Plus, Power, UserX, Trash2, Eye, RefreshCw, XCircle, Mail } from 'lucide-react';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
import { usePermission } from '../../../providers/PermissionProvider';
import { ConfirmationModal } from "@repo/ui";

export const UserDirectoryPage = () => {
  const navigate = useNavigate();
  const { users, meta, loading, isFetching, params, setParams, actions } = useUserManager();
  
  const { can, canManageUser, resourcesConfig, isLoading: isPermsLoading } = usePermission();

  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {},
  });

  const openConfirm = (title, message, action, variant = 'danger') => {
    setModalConfig({
      isOpen: true, title, message, variant,
      onConfirm: async () => {
        await action();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const activeUsers = useMemo(() => users.filter(u => u.status !== 'pending'), [users]);
  const pendingUsers = useMemo(() => users.filter(u => u.status === 'pending'), [users]);


  if (isPermsLoading) {
    return (
      <PageContainer title="User Directory" breadcrumbs={['System', 'Users']}>
        <div className="flex justify-center p-10">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </PageContainer>
    );
  }

  const USERS_RES = resourcesConfig?.USERS || 'users'; 

  const activeColumns = [
    {
      key: 'name', label: 'User', sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar user={user} size="w-10 h-10" />
          <div>
            <div className="font-bold">{user.firstName} {user.lastName}</div>
            <div className="text-xs opacity-60">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (user) => (
        <span className={`badge badge-xs ${user.isActive ? 'badge-success' : 'badge-error'}`}>
          {user.isActive ? 'Active' : 'Disabled'}
        </span>
      )
    },
    { key: 'activity', label: 'Activity', sortable: true, render: (user) => <LiveStatusBadge user={user} variant="text" /> },
    {
      key: 'roles', label: 'Role(s)',
      render: (user) => (
        <div className="flex gap-1">
          {user.roles?.map(r => <span key={r} className="badge badge-ghost badge-sm uppercase text-[10px]">{r}</span>)}
        </div>
      )
    }
  ];

  const pendingColumns = [
    {
      key: 'email', label: 'Invited Email',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center">
            <Mail size={16} className="opacity-50"/>
          </div>
          <div>
            <div className="font-bold">{user.email}</div>
            <div className="text-xs opacity-60">Invited as {user.firstName} {user.lastName}</div>
          </div>
        </div>
      )
    },
    {
      key: 'roles', label: 'Role Assigned',
      render: (user) => (
        <div className="flex gap-1">
          {user.roles?.map(r => <span key={r} className="badge badge-warning badge-outline badge-sm uppercase text-[10px]">{r}</span>)}
        </div>
      )
    },
    { key: 'createdAt', label: 'Sent Date', render: (user) => <span className="text-xs opacity-60">{new Date(user.createdAt).toLocaleDateString()}</span> }
  ];

  const activeActions = (user) => {
    const isManageable = canManageUser(user);

    return (
      <>
        <button onClick={() => navigate(`/users/${user.id}`)} className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2">
          <Eye size={14}/> View Details
        </button>
        
        {isManageable && (
          <>
            <div className="divider my-0"></div>
            
            {can('updateAny', USERS_RES).granted && (
              <button 
                onClick={() => openConfirm(
                  user.isActive ? "Disable Account?" : "Enable Account?",
                  `Are you sure you want to ${user.isActive ? 'disable' : 'enable'} access for ${user.firstName}?`,
                  () => actions.disableUser(user),
                  user.isActive ? 'warning' : 'info'
                )} 
                className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2 text-warning"
              >
                <UserX size={14}/> {user.isActive ? 'Disable' : 'Enable'}
              </button>
            )}
            
            {user.isOnline && (
              <button 
                onClick={() => openConfirm(
                  "Force Logout?",
                  "This will immediately terminate the user's active session.",
                  () => actions.forceDisconnect(user.id),
                  "danger"
                )}
                className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2 text-warning"
              >
                <Power size={14}/> Force Logout
              </button>
            )}
            
            {can('deleteAny', USERS_RES).granted && (
              <button 
                onClick={() => openConfirm(
                  "Move to Recycle Bin?",
                  "This user will be soft-deleted.",
                  () => actions.softDeleteUser(user.id),
                  "danger"
                )}
                className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2 text-error"
              >
                <Trash2 size={14}/> Soft Delete
              </button>
            )}
          </>
        )}
      </>
    );
  };

  const pendingActions = (user) => (
    <>
      <button 
        onClick={() => openConfirm("Resend Invitation?", `Resend to ${user.email}?`, () => actions.resendInvite(user.id), "info")}
        className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2 text-primary"
      >
        <RefreshCw size={14}/> Resend / Extend
      </button>
      <button 
        onClick={() => openConfirm("Revoke Invitation?", "This link will become invalid.", () => actions.revokeInvite(user.id), "danger")}
        className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2 text-error"
      >
        <XCircle size={14}/> Revoke Invite
      </button>
    </>
  );

  return (
    <PageContainer
      title="User Directory"
      breadcrumbs={['System', 'Users']}
      actions={
        can('createAny', USERS_RES).granted && (
          <button onClick={() => navigate('/users/invite')} className="btn btn-primary btn-sm gap-2">
            <Plus size={16}/> Invite User
          </button>
        )
      }
    >
      <div className="space-y-8   ">
        {pendingUsers.length > 0 && (
          <div className="card bg-base-100 border border-warning/20 shadow-sm">
            <div className="card-body p-4">
              <h3 className="text-sm font-bold uppercase opacity-60 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning"></span> Pending Invitations ({pendingUsers.length})
              </h3>
              <DataTable columns={pendingColumns} data={pendingUsers} params={params} hideControls={true} isLoading={loading} actions={pendingActions}/>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold uppercase opacity-60 mb-4 px-1 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-success"></span> Active Members
          </h3>
          <DataTable 
            columns={activeColumns}
            data={activeUsers}
            totalCount={meta.totalItems - pendingUsers.length} 
            totalPages={meta.totalPages}
            isLoading={loading}
            isFetching={isFetching}
            params={params}
            onParamsChange={(p) => setParams(prev => ({...prev, ...p}))}
            actions={activeActions}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        confirmText="Confirm"
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
      />
    </PageContainer>
  );
};

export default UserDirectoryPage;
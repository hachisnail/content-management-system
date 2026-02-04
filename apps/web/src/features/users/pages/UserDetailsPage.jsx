import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Avatar } from '../../../components/common';
import { useUserForm } from '../hooks/useUserManager';
import { RoleSelector } from '../components/RoleSelector';
import { LiveStatusBadge } from '../components/LiveStatusBadge';
// [FIX] Added 'Copy' icon to imports
import { ArrowLeft, Save, UserX, Trash2, Power, Copy } from 'lucide-react';
import { userApi } from '../api/users.api';
import { useAuth } from '../../auth/hooks/useAuth';
import { usePermission } from '../../../providers/PermissionProvider'; 
import { ConfirmationModal } from "@repo/ui"; 

export const UserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null); 
  const [modalConfig, setModalConfig] = useState({ isOpen: false, onConfirm: () => {} });

  const { formData, handleChange, actions, loading } = useUserForm();
  
  const { can, canManageUser, rolesConfig, resourcesConfig, isLoading: isPermsLoading } = usePermission();

  useEffect(() => {
    actions.fetchUser(id).then(data => setUser(data));
  }, [id]);

  const openConfirm = (title, message, action, variant = 'info') => {
    setModalConfig({
      isOpen: true, title, message, variant,
      onConfirm: async () => {
        await action();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSave = () => {
    openConfirm("Save Changes?", "Update profile?", async () => {
      const success = await actions.update(id);
      if (success) {
        setIsEditing(false);
        actions.fetchUser(id).then(data => setUser(data));
      }
    }, "primary");
  };

  const handleAction = async (type) => {
    const actionMap = {
      disconnect: { title: "Force Logout?", msg: "Terminate user session?", fn: () => userApi.forceDisconnect(id), variant: 'danger' },
      disable: { title: "Disable User?", msg: "Block login?", fn: () => userApi.disable(id, !user.isActive), variant: 'warning' },
      enable: { title: "Enable User?", msg: "Restore access?", fn: () => userApi.disable(id, !user.isActive), variant: 'info' },
      delete: { title: "Soft Delete?", msg: "Move to Recycle Bin?", fn: () => userApi.delete(id), variant: 'danger' }
    };

    const cfg = type === 'disable' && !user.isActive ? actionMap.enable : actionMap[type];

    openConfirm(cfg.title, cfg.msg, async () => {
      try {
        await cfg.fn();
        if (type === 'delete') navigate('/system/users');
        else actions.fetchUser(id).then(data => setUser(data));
      } catch(e) { alert(e.message); }
    }, cfg.variant);
  };

  if (loading || !user || isPermsLoading) return <div className="p-10 text-center"><span className="loading loading-spinner loading-lg"></span></div>;

  const isManageable = canManageUser(user);
  const isSuperAdmin = currentUser?.roles?.includes(rolesConfig?.SUPERADMIN);
  const USERS_RES = resourcesConfig.USERS;

  return (
    <PageContainer 
      title={isEditing ? "Edit User" : "User Profile"}
      breadcrumbs={['System', 'Users', user.email]}
      actions={
        <div className="flex gap-2">
          <button onClick={() => navigate('/users')} className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft size={16}/> Back
          </button>
          {!isEditing ? (
            isManageable && can('updateAny', USERS_RES).granted && (
                <button onClick={() => setIsEditing(true)} className="btn btn-primary btn-sm">Edit Profile</button>
            )
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setIsEditing(false); actions.fetchUser(id); }} className="btn btn-ghost btn-sm">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary btn-sm gap-2"><Save size={16}/> Save Changes</button>
            </div>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="card bg-base-100 border border-base-200 shadow-sm sticky top-6">
            <div className="card-body items-center text-center">
              <Avatar user={user} size="w-32 h-32" textSize="text-4xl" className="mb-4 shadow-xl"/>
              <h2 className="card-title">{user.firstName} {user.lastName}</h2>
              <p className="text-base-content/60">{user.email}</p>
              <div className="mt-4"><LiveStatusBadge user={user} variant="badge" /></div>

              {isManageable && (
                <>
                  <div className="divider">Actions</div>
                  <div className="flex flex-col gap-2 w-full">
                    {can('updateAny', USERS_RES).granted && (
                        <button onClick={() => handleAction('disable')} className={`btn btn-outline btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}>
                        <UserX size={16}/> {user.isActive ? 'Disable Account' : 'Enable Account'}
                        </button>
                    )}
                    {user.isOnline && (
                      <button onClick={() => handleAction('disconnect')} className="btn btn-outline btn-warning btn-sm">
                        <Power size={16}/> Force Disconnect
                      </button>
                    )}
                    {can('deleteAny', USERS_RES).granted && (
                        <button onClick={() => handleAction('delete')} className="btn btn-outline btn-error btn-sm">
                        <Trash2 size={16}/> Soft Delete
                        </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="card bg-base-100 border border-base-200 shadow-sm h-full">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-4 opacity-70">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control"><label className="label"><span className="label-text">First Name</span></label><input type="text" className="input input-bordered" disabled={!isEditing} value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} /></div>
                <div className="form-control"><label className="label"><span className="label-text">Last Name</span></label><input type="text" className="input input-bordered" disabled={!isEditing} value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} /></div>
                <div className="form-control"><label className="label"><span className="label-text">Contact Number</span></label><input type="text" className="input input-bordered" disabled={!isEditing} value={formData.contactNumber} onChange={e => handleChange('contactNumber', e.target.value)} /></div>
                <div className="form-control"><label className="label"><span className="label-text">Date of Birth</span></label><input type="date" className="input input-bordered" disabled={!isEditing} value={formData.birthDate} onChange={e => handleChange('birthDate', e.target.value)} /></div>
                
                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text">Email</span></label>
                  <div className="indicator w-full">
                    <input type="text" disabled={!isEditing || !isSuperAdmin} value={formData.email} onChange={e => handleChange('email', e.target.value)} className="input input-bordered w-full" />
                    {!isSuperAdmin && isEditing && <span className="indicator-item badge badge-ghost text-[10px]">Locked</span>}
                  </div>
                </div>

                <div className="form-control md:col-span-2">
                  <RoleSelector selectedRoles={formData.roles} onChange={(roles) => handleChange('roles', roles)} disabled={!isEditing || !isManageable} />
                </div>

                {/* [NEW] User ID (ULID) Display */}
                <div className="form-control md:col-span-2 mt-4">
                  <label className="label"><span className="label-text">User ID</span></label>
                  <div className="join w-full">
                    <input 
                      type="text" 
                      className="input input-bordered join-item w-full font-mono text-sm opacity-70" 
                      disabled 
                      value={user.id} 
                    />
                    <button 
                      className="btn btn-bordered join-item" 
                      onClick={() => navigator.clipboard.writeText(user.id)}
                      title="Copy ID"
                    >
                      <Copy size={16}/>
                    </button>
                  </div>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text mr-2">Member Since</span></label>
                  <input type="text" className="input input-bordered" disabled value={new Date(user.createdAt).toLocaleString()} />
                </div>
              </div>
            </div>
          </div>
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

export default UserDetailsPage;
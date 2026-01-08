import { useState } from 'react';
import socket from '../../../../socket';
import api from '../../../../api'; // Ensure this has deleteUser
import { useAuth } from '../../../../context/AuthContext';
import { useConfig } from '../../../../context/ConfigContext';

export const useUserManagement = (users = []) => {
  const { user: currentUser } = useAuth();
  const { hasPermission, PERMISSIONS } = useConfig();
  
  // --- STATE ---
  // Active User Actions
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [disableTarget, setDisableTarget] = useState(null);
  const [enableTarget, setEnableTarget] = useState(null);
  
  // Invite Actions (NEW)
  const [revokeTarget, setRevokeTarget] = useState(null);

  // Bulk Actions
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Feedback
  const [statusMsg, setStatusMsg] = useState(null);

  // --- ACTIONS ---

  // 1. Force Disconnect (Active Users)
  const confirmDisconnect = () => {
    if (disconnectTarget) {
      socket.emit('force_disconnect_user', { userId: disconnectTarget });
      setDisconnectTarget(null);
      setStatusMsg({ type: 'success', text: 'User disconnected successfully.' });
    }
  };

  // 2. Disable Account (Active Users)
  const confirmDisable = async () => {
    if (disableTarget) {
      try {
        socket.emit('force_disconnect_user', { userId: disableTarget });
        await api.updateUser(disableTarget, { status: 'disabled' });
        setStatusMsg({ type: 'success', text: 'Account disabled and session terminated.' });
      } catch (err) {
        setStatusMsg({ type: 'error', text: 'Failed to disable account.' });
      } finally {
        setDisableTarget(null);
      }
    }
  };

  // 3. Enable Account (Disabled Users)
  const confirmEnable = async () => {
    if (enableTarget) {
      try {
        await api.updateUser(enableTarget, { status: 'active' });
        setStatusMsg({ type: 'success', text: 'Account re-enabled successfully.' });
      } catch (err) {
        setStatusMsg({ type: 'error', text: 'Failed to enable account.' });
      } finally {
        setEnableTarget(null);
      }
    }
  };

  // 4. Revoke Invitation (Pending Users) - NEW
  const confirmRevoke = async () => {
    if (revokeTarget) {
      try {
        // PERMANENTLY DELETE the user record (invitation)
        await api.deleteUser(revokeTarget);
        setStatusMsg({ type: 'success', text: 'Invitation revoked and user record removed.' });
      } catch (err) {
        setStatusMsg({ type: 'error', text: err.message || 'Failed to revoke invitation.' });
      } finally {
        setRevokeTarget(null);
      }
    }
  };

  // 5. Bulk Disconnect
  const confirmBulkDisconnect = () => {
    const isSuperAdmin = currentUser?.role?.includes('super_admin');
    
    const eligibleIds = selectedUsers.filter(userId => {
      const u = users.find(user => user.id === userId);
      if (!u) return false;
      const targetIsSuperAdmin = u.role?.includes('super_admin');
      if (!isSuperAdmin && targetIsSuperAdmin) return false;
      return u.isOnline && u.id !== currentUser.id;
    });
    
    if (eligibleIds.length === 0) {
        setStatusMsg({ type: 'error', text: 'No eligible users selected.' });
    } else {
        eligibleIds.forEach(userId => socket.emit('force_disconnect_user', { userId }));
        setStatusMsg({ type: 'success', text: `Disconnected ${eligibleIds.length} users.` });
    }

    setShowBulkConfirm(false);
    setSelectedUsers([]);
  };

  return {
    // State
    selectedUsers, setSelectedUsers,
    disconnectTarget, setDisconnectTarget,
    disableTarget, setDisableTarget,
    enableTarget, setEnableTarget,
    revokeTarget, setRevokeTarget, // Exported for UI
    showBulkConfirm, setShowBulkConfirm,
    statusMsg, setStatusMsg,
    
    // Handlers
    confirmDisconnect,
    confirmDisable,
    confirmEnable,
    confirmRevoke, // Exported for UI
    confirmBulkDisconnect,

    // Context
    currentUser,
    hasPermission,
    PERMISSIONS
  };
};
import { useState, useCallback } from 'react';
import { useResource } from '../../../hooks/useResource';
import { userApi } from '../../../api/users.api';
import { resendInvite as apiResendInvite, inviteUser as apiInviteUser } from '../../auth/api/auth.api';

// --- Hook for List Management (Directory) ---
export const useUserManager = () => {
  const [params, setParams] = useState({
    page: 1, limit: 10, search: '', sort_by: 'createdAt', sort_dir: 'DESC'
  });

  const { items, meta, loading, isFetching, refresh, remove } = useResource('users', params);

const actions = {
    forceDisconnect: async (id) => {
      // Removed confirm() - Handled by UI
      try { await userApi.forceDisconnect(id); refresh(); } catch(e) { alert(e.message); }
    },
    disableUser: async (user) => {
      // Removed confirm() - Handled by UI
      try { await userApi.disable(user.id, !user.isActive); refresh(); } catch(e) { alert(e.message); }
    },
    softDeleteUser: async (id) => {
      // Removed confirm() - Handled by UI
      try { await remove(id); } catch(e) { alert(e.message); }
    },
    resendInvite: async (id) => {
      // Removed confirm() - Handled by UI
      try { await apiResendInvite(id); alert("Invitation resent."); } catch(e) { alert(e.message); }
    },
    revokeInvite: async (id) => {
      // Removed confirm() - Handled by UI
      try { await remove(id); } catch(e) { alert(e.message); }
    },
    refresh
  };

  return { users: items || [], meta: meta || {}, loading, isFetching, params, setParams, actions };
};
// --- Hook for Single User Forms (Invite / Edit) ---
export const useUserForm = (existingUser = null) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', roles: ['guest'], contactNumber: '', birthDate: '',
    ...existingUser // Merge if editing
  });

  // Re-hydrate form if existingUser loads late
  const setInitialData = useCallback((data) => {
    setFormData(prev => ({
      ...prev,
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : ''
    }));
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const invite = async (navigate) => {
    setLoading(true);
    try {
      await apiInviteUser(formData);
      navigate('/system/users');
      return true;
    } catch (err) {
      alert(err.response?.data?.error || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id, onSuccess) => {
    setLoading(true);
    try {
      await userApi.update(id, formData);
      if (onSuccess) onSuccess();
      return true;
    } catch (err) {
      alert(err.response?.data?.error || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async (id) => {
    setLoading(true);
    try {
      const data = await userApi.get(id);
      setInitialData(data);
      return data;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    handleChange,
    setInitialData,
    actions: { invite, update, fetchUser },
    loading
  };
};
import { useState, useCallback } from 'react';
import { useResource } from '../../../hooks/useResource'; 
import { userApi } from '../api/users.api'; 
import { resendInvite as apiResendInvite, inviteUser as apiInviteUser } from '../../auth/api/auth.api'; 

export const useUserManager = () => {
  const [params, setParams] = useState({
    page: 1, limit: 10, search: '', sort_by: 'createdAt', sort_dir: 'DESC'
  });

  // [FIX] Map UI sort keys to actual API fields
  // 'name' column -> sorts by 'firstName'
  // 'activity' column -> sorts by 'lastActiveAt'
  const apiParams = { ...params };
  if (apiParams.sort_by === 'name') apiParams.sort_by = 'firstName';
  if (apiParams.sort_by === 'activity') apiParams.sort_by = 'lastActiveAt';

  const { items, meta, loading, isFetching, refresh, remove } = useResource('users', apiParams);

  const actions = {
    forceDisconnect: async (id) => {
      try { await userApi.forceDisconnect(id); refresh(); } catch(e) { alert(e.message); }
    },
    disableUser: async (user) => {
      try { await userApi.disable(user.id, !user.isActive); refresh(); } catch(e) { alert(e.message); }
    },
    softDeleteUser: async (id) => {
      try { await remove(id); } catch(e) { alert(e.message); }
    },
    resendInvite: async (id) => {
      try { await apiResendInvite(id); alert("Invitation resent."); } catch(e) { alert(e.message); }
    },
    revokeInvite: async (id) => {
      try { await remove(id); } catch(e) { alert(e.message); }
    },
    // [FIX] Expose invite here if you want to use useUserManager, OR rely on useUserForm
    invite: async (data, navigate) => {
        try {
            await apiInviteUser(data);
            navigate('/users');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Failed to send invite");
        }
    },
    refresh
  };

  return { users: items || [], meta: meta || {}, loading, isFetching, params, setParams, actions };
};

export const useUserForm = (existingUser = null) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', roles: ['guest'], contactNumber: '', birthDate: '',
    ...existingUser 
  });

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

  // Keep this for form-heavy logic
  const invite = async (data, navigate) => {
    setLoading(true);
    try {
      await apiInviteUser(data); 
      navigate('/users');
    } catch (err) {
       alert(err.response?.data?.error || err.message);
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
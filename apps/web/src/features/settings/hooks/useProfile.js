import { useState, useEffect } from 'react';
import { profileApi } from '../api/profile.api';
import { useAuth } from '../../auth/hooks/useAuth';
import { updateProfileSchema } from '@repo/validation/src/user';

export const useProfile = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', contactNumber: '', birthDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        contactNumber: user.contactNumber || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on input
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    setErrors({});

    // 1. Yup Validation
    try {
        await updateProfileSchema.validate(formData, { abortEarly: false });
    } catch (err) {
        const fieldErrors = {};
        if (err.inner) {
            err.inner.forEach(error => {
                fieldErrors[error.path] = error.message;
            });
        }
        setErrors(fieldErrors);
        setLoading(false);
        return;
    }

    // 2. API Call
    try {
      await profileApi.update(formData);
      await refreshUser();
      setStatus({ type: 'success', message: "Profile updated successfully." });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, updateProfile, loading, status, errors };
};
import { useState } from 'react';
import { profileApi } from '../api/profile.api';
import { changePasswordSchema } from '@repo/validation'; 

export const useSecurity = () => {
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setPassData({ ...passData, [e.target.name]: e.target.value });
    // Clear specific error on change
    if (errors[e.target.name]) {
        setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    setErrors({});

    // 1. Yup Validation
    try {
        await changePasswordSchema.validate(passData, { abortEarly: false });
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
      await profileApi.changePassword({ 
        currentPassword: passData.currentPassword, 
        newPassword: passData.newPassword 
      });
      setStatus({ type: 'success', message: "Password changed successfully." });
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || "Failed to change password." });
    } finally {
      setLoading(false);
    }
  };

  return { passData, handleChange, updatePassword, loading, status, errors };
};
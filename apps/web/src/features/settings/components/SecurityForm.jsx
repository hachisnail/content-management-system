import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { changePasswordSchema } from '@repo/validation'; 
import { Key, Lock, AlertTriangle } from 'lucide-react';
import { profileApi } from '../api/profile.api';

export const SecurityForm = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await profileApi.changePassword(data);
      setStatus({ type: 'success', message: 'Password updated successfully' });
      reset(); 
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to update password';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200 h-fit">
      <div className="card-body">
        <h2 className="card-title text-lg mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-warning" /> Security
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Current Password</span></label>
            <input 
              type="password" 
              className={`input input-bordered w-full ${errors.currentPassword ? 'input-error' : ''}`}
              {...register("currentPassword")}
            />
            {errors.currentPassword && <span className="text-error text-xs mt-1">{errors.currentPassword.message}</span>}
          </div>

          <div className="divider my-2"></div>

          <div className="form-control">
            <label className="label"><span className="label-text">New Password</span></label>
            <input 
              type="password" 
              className={`input input-bordered w-full ${errors.newPassword ? 'input-error' : ''}`}
              {...register("newPassword")}
            />
            {errors.newPassword && <span className="text-error text-xs mt-1">{errors.newPassword.message}</span>}
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Confirm New Password</span></label>
            <input 
              type="password" 
              className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && <span className="text-error text-xs mt-1">{errors.confirmPassword.message}</span>}
          </div>

          {status.message && (
            <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'} text-sm py-2`}>
              {status.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              {status.message}
            </div>
          )}

          <button type="submit" className="btn btn-neutral w-full mt-4" disabled={loading}>
            {loading ? <span className="loading loading-spinner"></span> : <Key className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};
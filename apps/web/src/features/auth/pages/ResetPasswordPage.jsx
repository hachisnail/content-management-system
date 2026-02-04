import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { resetPasswordSchema } from '@repo/validation';
import { resetPassword } from '../api/auth.api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [globalError, setGlobalError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { token: token || '' }
  });

  useEffect(() => {
    if (token) setValue('token', token);
  }, [token, setValue]);

  const onSubmit = async (data) => {
    setGlobalError('');
    try {
      await resetPassword(data);
      navigate('/login', { 
        state: { message: 'Password reset successfully. Please login.', type: 'success' } 
      });
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  if (!token) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-base-200">
        <h2 className="text-xl font-bold text-error">Invalid or Missing Token</h2>
        <Link to="/login" className="btn btn-primary">Go to Login</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title justify-center">Set New Password</h2>
          
          {globalError && <div className="alert alert-error text-sm mt-2">{globalError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <input type="hidden" {...register('token')} />

            <div className="form-control">
              <label className="label"><span className="label-text">New Password</span></label>
              <input 
                type="password" 
                className={`input input-bordered ${errors.password ? 'input-error' : ''}`} 
                {...register('password')}
              />
              {errors.password && <span className="text-error text-xs">{errors.password.message}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Confirm Password</span></label>
              <input 
                type="password" 
                className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`} 
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <span className="text-error text-xs">{errors.confirmPassword.message}</span>}
            </div>

            <button className="btn btn-primary w-full mt-4" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
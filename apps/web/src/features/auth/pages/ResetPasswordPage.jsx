import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { resetPasswordSchema } from '@repo/validation';
import { resetPassword, validateResetToken } from '../api/auth.api'; // [UPDATED]
import { AlertCircle, CheckCircle } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  // States
  const [status, setStatus] = useState('checking'); // 'checking' | 'valid' | 'invalid'
  const [globalError, setGlobalError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { token: token || '' }
  });

  // [ADDED] Validate Token on Mount
  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setGlobalError('Missing access token.');
      return;
    }

    const checkToken = async () => {
      try {
        const data = await validateResetToken(token);
        if (data.valid) {
          setStatus('valid');
        } else {
          setStatus('invalid');
          setGlobalError(data.message || 'This link has expired.');
        }
      } catch (err) {
        setStatus('invalid');
        setGlobalError('Unable to verify link.');
      }
    };
    checkToken();
  }, [token]);

  const onSubmit = async (data) => {
    setGlobalError('');
    try {
      await resetPassword({ ...data, token });
      navigate('/login', { 
        state: { message: 'Password reset successfully. Please login.', type: 'success' } 
      });
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  // 1. Loading State
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-sm text-base-content/60">Verifying security token...</p>
      </div>
    );
  }

  // 2. Invalid State
  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
        <div className="card w-full max-w-sm shadow-xl bg-base-100 border border-error/20">
          <div className="card-body text-center items-center">
            <div className="bg-error/10 p-3 rounded-full mb-2">
               <AlertCircle size={32} className="text-error" />
            </div>
            <h2 className="card-title text-error">Invalid Link</h2>
            <p className="text-sm opacity-70 mb-4">{globalError}</p>
            <Link to="/forgot-password" class="btn btn-outline btn-sm w-full">Request New Link</Link>
            <Link to="/login" className="btn btn-ghost btn-xs mt-2">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Valid Form State
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <div className="card-body">
          <div className="flex flex-col items-center mb-4">
             <div className="bg-success/10 p-2 rounded-full mb-2">
               <CheckCircle size={24} className="text-success" />
             </div>
             <h2 className="card-title">Set New Password</h2>
          </div>
          
          {globalError && <div className="alert alert-error text-sm">{globalError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" value={token} {...register('token')} />

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
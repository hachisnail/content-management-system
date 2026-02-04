import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { forgotPasswordSchema } from '@repo/validation';
import { forgotPassword } from '../api/auth.api';

export const ForgotPasswordPage = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data) => {
    setGlobalError('');
    setSuccessMessage('');
    try {
      await forgotPassword(data.email);
      setSuccessMessage('If an account exists for this email, you will receive a reset link shortly.');
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center">Reset Password</h2>
          <p className="text-center text-sm text-base-content/70">Enter your email to receive a reset link.</p>

          {successMessage ? (
            <div className="alert alert-success mt-4 text-sm">
              <span>{successMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              {globalError && <div className="alert alert-error text-sm">{globalError}</div>}
              
              <div className="form-control">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                  {...register('email')}
                />
                {errors.email && <span className="text-error text-xs mt-1">{errors.email.message}</span>}
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={isSubmitting}
              >
                {isSubmitting && <span className="loading loading-spinner"></span>}
                Send Reset Link
              </button>
            </form>
          )}
          
          <div className="divider">OR</div>
          <Link to="/login" className="btn btn-outline btn-sm w-full">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
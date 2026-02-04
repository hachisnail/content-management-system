import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { completeRegistrationSchema } from '@repo/validation';
import { completeRegistration } from '../api/auth.api';

export const CompleteRegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [globalError, setGlobalError] = useState('');

  // Setup Form with Validation
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(completeRegistrationSchema),
    defaultValues: { token: token || '' } // Pre-fill token for validation
  });

  useEffect(() => {
    if (!token) {
      setGlobalError('Missing registration token.');
    } else {
      setValue('token', token);
    }
  }, [token, setValue]);

  const onSubmit = async (data) => {
    setGlobalError('');
    try {
      await completeRegistration(data);
      navigate('/dashboard', { 
        state: { message: 'Registration complete! Welcome aboard.', type: 'success' } 
      });
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Registration failed');
    }
  };

  if (!token) return <div className="p-10 text-center text-error font-bold">Invalid or Missing Invitation Token</div>;

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold">Complete Registration</h2>
          <p className="text-sm text-base-content/70">Set up your account details.</p>

          {globalError && <div className="alert alert-error text-sm mt-2">{globalError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4">
             {/* Hidden Token Field */}
             <input type="hidden" {...register('token')} />

             <div className="grid grid-cols-2 gap-2">
                <div className="form-control">
                  <label className="label"><span className="label-text">Birth Date</span></label>
                  <input type="date" className={`input input-bordered w-full ${errors.birthDate ? 'input-error' : ''}`} {...register('birthDate')} />
                  {errors.birthDate && <span className="text-error text-xs">{errors.birthDate.message}</span>}
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Contact #</span></label>
                  <input type="tel" placeholder="+123..." className={`input input-bordered w-full ${errors.contactNumber ? 'input-error' : ''}`} {...register('contactNumber')} />
                  {errors.contactNumber && <span className="text-error text-xs">{errors.contactNumber.message}</span>}
                </div>
             </div>

             <div className="form-control">
               <label className="label"><span className="label-text">New Password</span></label>
               <input type="password" className={`input input-bordered ${errors.password ? 'input-error' : ''}`} {...register('password')} />
               {errors.password && <span className="text-error text-xs">{errors.password.message}</span>}
             </div>

             <div className="form-control">
               <label className="label"><span className="label-text">Confirm Password</span></label>
               <input type="password" className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`} {...register('confirmPassword')} />
               {errors.confirmPassword && <span className="text-error text-xs">{errors.confirmPassword.message}</span>}
             </div>

             <div className="form-control mt-6">
               <button className="btn btn-primary" disabled={isSubmitting}>
                 {isSubmitting && <span className="loading loading-spinner"></span>}
                 Finalize Account
               </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteRegistrationPage;
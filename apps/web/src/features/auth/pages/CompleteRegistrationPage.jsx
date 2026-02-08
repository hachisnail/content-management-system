import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { completeRegistrationSchema } from '@repo/validation';
import { completeRegistration, validateInvitationToken } from '../api/auth.api'; // [UPDATED]
import { UserCheck, AlertCircle } from 'lucide-react';

export const CompleteRegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('checking'); 
  const [globalError, setGlobalError] = useState('');
  const [inviteDetails, setInviteDetails] = useState(null); // Store email/name to greet user

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(completeRegistrationSchema),
    defaultValues: { token: token || '' }
  });

  // [ADDED] Validate Invitation
  useEffect(() => {
    if (!token) {
        setStatus('invalid');
        setGlobalError('Missing invitation token.');
        return;
    }

    const checkInvite = async () => {
        try {
            const data = await validateInvitationToken(token);
            if (data.valid) {
                setInviteDetails(data);
                setStatus('valid');
            } else {
                setStatus('invalid');
                setGlobalError(data.message || 'Invitation expired.');
            }
        } catch (e) {
            setStatus('invalid');
            setGlobalError('Unable to verify invitation.');
        }
    };
    checkInvite();
  }, [token]);

  const onSubmit = async (data) => {
    setGlobalError('');
    try {
      await completeRegistration({ ...data, token });
      navigate('/dashboard', { 
        state: { message: 'Registration complete! Welcome aboard.', type: 'success' } 
      });
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Registration failed');
    }
  };

  if (status === 'checking') return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-sm opacity-60">Checking invitation...</p>
    </div>
  );

  if (status === 'invalid') return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-md shadow-xl bg-base-100 border border-error/20">
            <div className="card-body text-center items-center">
                <AlertCircle size={48} className="text-error mb-2"/>
                <h2 className="card-title text-error">Invitation Invalid</h2>
                <p className="mb-4">{globalError}</p>
                <Link to="/login" className="btn btn-primary btn-sm">Return to Login</Link>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100 animate-fade-in">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-2">
             <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <UserCheck size={24} />
             </div>
             <div>
                <h2 className="card-title text-xl">Welcome, {inviteDetails?.name}!</h2>
                <p className="text-xs opacity-60">Complete your account setup</p>
             </div>
          </div>

          {globalError && <div className="alert alert-error text-sm mt-2">{globalError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4">
             <input type="hidden" value={token} {...register('token')} />

             {/* Read-Only Email Field for UX */}
             <div className="form-control">
                <label className="label"><span className="label-text">Email</span></label>
                <input type="text" value={inviteDetails?.email || ''} disabled className="input input-bordered w-full opacity-60 cursor-not-allowed" />
             </div>

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
               <label className="label"><span className="label-text">Create Password</span></label>
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
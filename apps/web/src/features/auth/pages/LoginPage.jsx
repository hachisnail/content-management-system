import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as yup from 'yup';
import { loginSchema } from '@repo/validation'; 
import { useAuth } from '../hooks/useAuth';
import { checkOnboarding } from '../api/auth.api';

// Local schema for Onboarding since it's specific to this initialization step
const onboardingSchema = yup.object({
  firstName: yup.string().required('First Name is required'),
  lastName: yup.string().required('Last Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  contactNumber: yup.string().required('Contact Number is required'),
  birthDate: yup.string().required('Birth Date is required'), // HTML date input returns string
  password: yup.string()
    .min(8, 'Password must be 8+ chars')
    .matches(/[A-Z]/, 'Must contain an Uppercase letter')
    .matches(/[0-9]/, 'Must contain a number')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

export default function LoginPage() {
  const { login, onboard, logoutMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [isOnboardingNeeded, setIsOnboardingNeeded] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forms
  const loginForm = useForm({ resolver: yupResolver(loginSchema) });
  const onboardForm = useForm({ resolver: yupResolver(onboardingSchema) });

  // 1. Check Onboarding Status on Mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const data = await checkOnboarding();
        setIsOnboardingNeeded(data.onboardingNeeded);
      } catch (err) {
        console.error("Failed to check onboarding status:", err);
        // Default to login if check fails for safety
        setIsOnboardingNeeded(false);
      } finally {
        setCheckingStatus(false);
      }
    }
    checkStatus();
  }, []);

  // 2. Handle Global Errors (Redirects/Socket)
  useEffect(() => {
    if (logoutMessage) {
      setGlobalError(logoutMessage);
    } else if (location.state?.error) {
      setGlobalError(location.state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location, logoutMessage]);

  // 3. Handlers
  const onLoginSubmit = async (data) => {
    setIsLoading(true);
    setGlobalError('');
    try {
      await login(data);
      navigate('/dashboard'); 
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onOnboardSubmit = async (data) => {
    setIsLoading(true);
    setGlobalError('');
    try {
      await onboard(data);
      navigate('/dashboard', { 
        state: { message: 'System Initialized! Welcome, Superadmin.', type: 'success' } 
      });
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-12">
      <div className={`card w-full ${isOnboardingNeeded ? 'max-w-2xl' : 'max-w-sm'} shrink-0 bg-base-100 shadow-2xl transition-all duration-300`}>
        <div className="card-body">
          
          {/* Header */}
          <div className="text-center mb-6">
            <img className="mx-auto h-16 w-auto mb-4" src="/LOGO.png" alt="Logo" />
            <h2 className="card-title justify-center text-2xl font-bold">
              {isOnboardingNeeded ? 'Initialize System' : 'Sign in'}
            </h2>
            {isOnboardingNeeded && (
              <p className="text-sm text-base-content/70 mt-2">
                Welcome! No users detected. Please create the <strong>Superadmin</strong> account to begin.
              </p>
            )}
          </div>

          {/* Global Alert */}
          {globalError && (
            <div role="alert" className="alert alert-error mb-4 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{globalError}</span>
            </div>
          )}

          {/* --- LOGIN FORM --- */}
          {!isOnboardingNeeded && (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="form-control">
                <label className="label" htmlFor="email">
                  <span className="label-text">Email</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className={`input input-bordered w-full ${loginForm.formState.errors.email ? 'input-error' : ''}`}
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <span className="label-text-alt text-error mt-1">{loginForm.formState.errors.email.message}</span>
                )}
              </div>

              <div className="form-control">
                <label className="label" htmlFor="password">
                  <span className="label-text">Password</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    className={`input input-bordered w-full pr-12 ${loginForm.formState.errors.password ? 'input-error' : ''}`}
                    {...loginForm.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                     {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="label justify-between">
                   {loginForm.formState.errors.password && <span className="label-text-alt text-error">{loginForm.formState.errors.password.message}</span>}
                  <Link to="/auth/forgot-password" className="label-text-alt link link-hover ml-auto">Forgot password?</Link>
                </div>
              </div>

              <div className="form-control mt-6">
                <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                  {isLoading && <span className="loading loading-spinner"></span>}
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* --- ONBOARDING FORM --- */}
          {isOnboardingNeeded && (
            <form onSubmit={onboardForm.handleSubmit(onOnboardSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">First Name</span></label>
                  <input type="text" className="input input-bordered w-full" {...onboardForm.register("firstName")} />
                  {onboardForm.formState.errors.firstName && <span className="text-error text-xs mt-1">{onboardForm.formState.errors.firstName.message}</span>}
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Last Name</span></label>
                  <input type="text" className="input input-bordered w-full" {...onboardForm.register("lastName")} />
                  {onboardForm.formState.errors.lastName && <span className="text-error text-xs mt-1">{onboardForm.formState.errors.lastName.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="form-control">
                    <label className="label"><span className="label-text">Birth Date</span></label>
                    <input type="date" className="input input-bordered w-full" {...onboardForm.register("birthDate")} />
                    {onboardForm.formState.errors.birthDate && <span className="text-error text-xs mt-1">{onboardForm.formState.errors.birthDate.message}</span>}
                 </div>
                 <div className="form-control">
                    <label className="label"><span className="label-text">Contact #</span></label>
                    <input type="tel" className="input input-bordered w-full" placeholder="+123..." {...onboardForm.register("contactNumber")} />
                    {onboardForm.formState.errors.contactNumber && <span className="text-error text-xs mt-1">{onboardForm.formState.errors.contactNumber.message}</span>}
                 </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Email</span></label>
                <input type="email" className="input input-bordered w-full" {...onboardForm.register("email")} />
                {onboardForm.formState.errors.email && <span className="text-error text-xs mt-1">{onboardForm.formState.errors.email.message}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Password</span></label>
                  <input type="password" className="input input-bordered w-full" {...onboardForm.register("password")} />
                  {onboardForm.formState.errors.password && <span className="text-error text-xs mt-1">{onboardForm.formState.errors.password.message}</span>}
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Confirm Password</span></label>
                  <input type="password" className="input input-bordered w-full" {...onboardForm.register("confirmPassword")} />
                  {onboardForm.formState.errors.confirmPassword && <span className="text-error text-xs mt-1">{onboardForm.formState.errors.confirmPassword.message}</span>}
                </div>
              </div>

              <div className="form-control mt-6">
                <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                  {isLoading && <span className="loading loading-spinner"></span>}
                  Create Superadmin & Login
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
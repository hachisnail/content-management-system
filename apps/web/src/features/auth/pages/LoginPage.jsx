import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { checkOnboarding } from '../api/auth.api';
import { LoginForm } from '../components/LoginForm';
import { OnboardingForm } from '../components/OnboardingForm';

export default function LoginPage() {
  const { login, onboard, logoutMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isOnboardingNeeded, setIsOnboardingNeeded] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const data = await checkOnboarding();
        setIsOnboardingNeeded(data.onboardingNeeded);
      } catch (err) {
        console.error("Failed to check onboarding status:", err);
        setIsOnboardingNeeded(false);
      } finally {
        setCheckingStatus(false);
      }
    }
    checkStatus();
  }, []);

  useEffect(() => {
    if (logoutMessage) {
      setGlobalError(logoutMessage);
    } else if (location.state?.error) {
      setGlobalError(location.state.error);
      window.history.replaceState({}, document.title);
    }
  }, [location, logoutMessage]);

  const handleLogin = async (data) => {
    setIsLoading(true);
    setGlobalError('');
    try {
      await login(data);
      navigate('/dashboard'); 
    } catch (err) {
      setGlobalError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboard = async (data) => {
    setIsLoading(true);
    setGlobalError('');
    try {
      await onboard(data);
      navigate('/dashboard', { 
        state: { message: 'System Initialized! Welcome, Superadmin.', type: 'success' } 
      });
    } catch (err) {
      setGlobalError(err.message || 'Onboarding failed');
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

          {globalError && (
            <div role="alert" className="alert alert-error mb-4 text-sm">
              <span>{globalError}</span>
            </div>
          )}

          {isOnboardingNeeded ? (
            <OnboardingForm onSubmit={handleOnboard} isLoading={isLoading} />
          ) : (
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
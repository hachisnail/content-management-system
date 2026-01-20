import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Button, 
  Input, 
  Alert 
} from '../components/UI';
import { LockKeyhole, Mail, LogIn } from 'lucide-react';

const LoginTest = () => {
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localMessage, setLocalMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // --- 1. HANDLE SESSION LOGOUT REASONS ---
  useEffect(() => {
    // If we are navigating from a manual logout, don't show any session messages.
    if (location.state?.manualLogout) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const sessionExpired = params.get('session_expired');
    const reason = params.get('reason');

    if (sessionExpired === 'true') {
      setLocalMessage({ type: 'error', text: 'Your session has expired. Please log in again.' });
    } else if (reason === 'force_logout') {
      setLocalMessage({ type: 'error', text: 'You have been logged out because of a multi-device login or admin disconnection.' });
    } else if (reason === 'invalidated') {
      setLocalMessage({ type: 'error', text: 'Your session was invalidated by the server.' });
    }
  }, [location.search, location.state]);

  // --- 2. AUTH REDIRECT ---
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const response = await api.login(email, password);
      
      if (response.user) {
        login(response.user); 
        setLocalMessage({ type: 'success', text: 'Authentication successful! Redirecting...' });
      } else {
        throw new Error("Invalid server response format");
      }
    } catch (error) {
      setLocalMessage({ type: 'error', text: error.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50/50 animate-in fade-in duration-700">
      
      {/* Brand/Logo Area */}
      <div className="mb-8 text-center">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
          <LockKeyhole className="text-white" size={24} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Sign in to Dashboard</h2>
        <p className="text-zinc-500 text-sm mt-1">Enter your credentials to access the secure area.</p>
      </div>

      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-xl shadow-zinc-200/50 overflow-hidden">
        
        {/* Progress bar for loading state */}
        {loading && <div className="h-1 w-full bg-indigo-600 animate-pulse" />}

        <div className="p-8 space-y-6">
          {localMessage.text && (
            <Alert 
              type={localMessage.type} 
              message={localMessage.text} 
              onClose={() => setLocalMessage({ type: '', text: '' })} 
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              icon={Mail}
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={LockKeyhole}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={loading}
                className="w-full"
                icon={LogIn}
                variant="primary"
                size="lg"
              >
                Sign In
              </Button>
            </div>
          </form>
        </div>

        <div className="px-8 py-4 bg-zinc-50 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-400">
            Secure Session Monitoring Enabled
          </p>
        </div>
      </div>

      <div className="mt-8 text-zinc-400 text-xs flex gap-4">
        <a href="#" className="hover:text-zinc-600 transition-colors">Privacy Policy</a>
        <span>•</span>
        <a href="#" className="hover:text-zinc-600 transition-colors">Technical Support</a>
      </div>
    </div>
  );
};

export default LoginTest;
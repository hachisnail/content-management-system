import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Alert, Card } from '@/components/UI';
import { Mail, Lock, LogIn } from 'lucide-react';

// --- SUB-COMPONENTS ---

const BrandHeader = () => (
  <div className="flex flex-col items-center mb-8">
    <div className="h-12 w-12 flex items-center justify-center mb-4 bg-white rounded-xl border border-zinc-200 shadow-sm p-2">
      <img src="/LOGO.png" alt="Logo" className="w-full h-full object-contain" />
    </div>
    
    <div className="text-center">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        MASCD<span className="font-light text-zinc-500">MIS</span>
      </h1>
      <p className="text-sm text-zinc-500 mt-2">
        Sign in to access your dashboard
      </p>
    </div>
  </div>
);

const LoginForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={(e) => onSubmit(e, formData)} className="space-y-5">
      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="user@mascd.org"
        icon={Mail}
        required
        autoFocus
        disabled={loading}
      />

      <div className="space-y-1">
        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          icon={Lock}
          required
          disabled={loading}
        />
        <div className="flex justify-end">
          <Link 
            to="/auth/forgot-password" 
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          isLoading={loading}
          disabled={loading}
          className="w-full justify-center"
          icon={LogIn}
          variant="primary"
          size="lg"
        >
          Sign In
        </Button>
      </div>
    </form>
  );
};

const SessionAlert = ({ feedback, onClose }) => {
  const isVisible = !!feedback.text;

  return (
    <div 
      className={`
        grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out
        ${isVisible ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0 mb-0'}
      `}
    >
      <div className="overflow-hidden">
        {feedback.text && (
          <Alert 
            type={feedback.type} 
            message={feedback.text} 
            onClose={onClose} 
          />
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, text: '' });

  // 1. Check for Redirect/Session Messages
  useEffect(() => {
    if (location.state?.manualLogout) return;

    const params = new URLSearchParams(location.search);
    const reason = params.get('reason');
    const expired = params.get('session_expired');

    if (expired === 'true') {
      setFeedback({ type: 'warning', text: 'Session expired. Please log in again.' });
    } else if (reason === 'force_logout') {
      setFeedback({ type: 'error', text: 'Your session was terminated by an administrator.' });
    } else if (reason === 'invalidated') {
      setFeedback({ type: 'error', text: 'Security token invalidated.' });
    }
  }, [location.search, location.state]);

  // 2. Redirect if Authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // 3. Handle Submit
  const handleLogin = async (e, { email, password }) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);

    try {
      const response = await api.login(email, password);
      if (response.user) {
        login(response.user);
        setFeedback({ type: 'success', text: 'Success. Redirecting...' });
      } else {
        throw new Error('Invalid response from server.');
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Authentication failed.' });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-100 font-sans animate-in fade-in duration-500">
      <div className="w-full max-w-[420px] space-y-6">
        <BrandHeader />
        
        <Card className="shadow-sm border-zinc-200">
          <SessionAlert 
            feedback={feedback} 
            onClose={() => setFeedback({ type: null, text: '' })} 
          />
          <LoginForm onSubmit={handleLogin} loading={loading} />
        </Card>

        <div className="text-center">
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} MASCD Management Information System
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
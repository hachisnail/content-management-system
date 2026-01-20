import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button, Input, Alert } from '@/components/UI';
import { 
  Lock, 
  Phone, 
  Calendar, 
  AtSign, 
  ArrowRight,
  AlertTriangle 
} from 'lucide-react';

function CompleteRegistrationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    birthDay: '',
  });

  const [status, setStatus] = useState({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    let tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      if (tokenFromUrl.endsWith('\\')) {
        tokenFromUrl = tokenFromUrl.slice(0, -1);
      }
      setToken(tokenFromUrl);
    } else {
      setStatus({ type: 'error', message: 'Invalid or missing registration token.' });
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);

    try {
      await api.post(`/users/complete-registration?token=${token}`, {
        username: formData.username,
        password: formData.password,
        contactNumber: formData.contactNumber,
        birthDay: formData.birthDay,
      });

      setStatus({ type: 'success', message: 'Registration successful! Redirecting to login...' });
      
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Registration failed. Please try again.' });
      setLoading(false);
    }
  };

  // --- ERROR VIEW ---
  if (!token && status.type === 'error') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Access Denied</h2>
          <Alert type="error" message={status.message} />
          <Button variant="ghost" onClick={() => navigate('/auth/login')}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  // --- NORMAL VIEW ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-4 text-white font-bold text-xl">
          M
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">Welcome Aboard</h2>
        <p className="mt-2 text-sm text-gray-600">
          Complete your profile to access the MIS Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-200">
          
          {status.message && (
            <div className="mb-6">
              <Alert 
                type={status.type} 
                message={status.message} 
                onClose={() => setStatus({ type: null, message: '' })} 
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500 font-medium">Account Identity</span>
                </div>
              </div>
              
              <Input
                label="Create Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="jdoe"
                icon={AtSign}
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  icon={Lock}
                  required
                />
                <Input
                  label="Confirm"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  icon={Lock}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500 font-medium">Personal Details</span>
                </div>
              </div>
              
              <Input
                label="Contact Number"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="+63 900 000 0000"
                icon={Phone}
              />
              
              <Input
                label="Birth Date"
                name="birthDay"
                type="date"
                value={formData.birthDay}
                onChange={handleChange}
                icon={Calendar}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full flex justify-center"
                size="lg"
                isLoading={loading}
                icon={loading ? null : ArrowRight}
              >
                {loading ? 'Finalizing Setup...' : 'Complete Registration'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CompleteRegistrationPage;
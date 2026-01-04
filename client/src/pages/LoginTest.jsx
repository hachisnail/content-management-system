// client/src/pages/LoginTest.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext'; // 1. Import Auth Context

const LoginTest = () => { // 2. Remove props
  const { login, isAuthenticated } = useAuth(); // 3. Get login function from Context
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localMessage, setLocalMessage] = useState('');
  const [messageType, setMessageType] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check for URL Query Params (Logout Reasons)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionExpired = params.get('session_expired');
    const reason = params.get('reason');

    if (sessionExpired === 'true') {
      setLocalMessage('Your session has expired. Please log in again.');
      setMessageType('error');
    } else if (reason === 'force_logout') {
      setLocalMessage('You have been logged out because you logged in from another device or were disconnected by an admin.');
      setMessageType('error');
    } else if (reason === 'invalidated') {
      setLocalMessage('Your session was invalidated by the server.');
      setMessageType('error');
    }
  }, [location.search]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalMessage('');
    setMessageType('');
    setLoading(true);

    try {
      const response = await api.login(email, password);
      
      // 4. Update Global Auth State
      // The API returns { success: true, message: '...', user: {...} }
      // We pass the user object to the context
      if (response.user) {
        login(response.user); 
        setLocalMessage('Login successful! Redirecting...');
        setMessageType('success');
      } else {
        throw new Error("Invalid server response");
      }

    } catch (error) {
      setLocalMessage(error.message || 'Login failed');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, don't show the form (useEffect will redirect)
  if (isAuthenticated) return null;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Login Test</h2>
      
      {localMessage && (
        <div className={`mb-4 p-3 text-sm rounded border ${
          messageType === 'error' 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {localMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
            ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginTest;
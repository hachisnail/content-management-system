// client/src/pages/public/CompleteRegistration.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api';

function CompleteRegistration() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      // Remove trailing backslash if it exists
      if (tokenFromUrl.endsWith('\\')) {
        tokenFromUrl = tokenFromUrl.slice(0, -1);
      }
      setToken(tokenFromUrl);
    } else {
      setError('Registration token not found in URL.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/users/complete-registration?token=${token}`, {
        password,
        username,
        contactNumber,
        birthDay,
      });
      setMessage(response.message);
      setTimeout(() => {
        navigate('/login-test');
      }, 3000); // Redirect to login after 3 seconds
    } catch (err) {
      setError(err.message || 'An error occurred.');
    }
  };

  if (!token && !error) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Complete Your Registration</h2>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      {!message && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Birth Day</label>
            <input
              type="date"
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Complete Registration
          </button>
        </form>
      )}
    </div>
  );
}

export default CompleteRegistration;

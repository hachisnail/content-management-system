// client/src/pages/private/AdminTest.jsx
import React, { useState } from 'react';
import api from '../../api';

function AdminTest() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [role, setRole] = useState('viewer');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // The new api.js returns response.data directly
      const response = await api.post('/users', { 
        email, 
        firstName, 
        lastName, 
        middleName, 
        role 
      });

      // So we access properties directly on 'response'
      setMessage(`User invited successfully. Registration token: ${response.registrationToken}`);
      
      // Optional: Clear form
      setEmail('');
      setFirstName('');
      setLastName('');
      setMiddleName('');
    } catch (err) {
      console.error('Invite error:', err);
      // The new api.js throws an object with { message, status, data }
      setError(err.message || 'An error occurred during invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Admin User Invite</h2>
      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Middle Name</label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
            <option value="inventory_manager">Inventory Manager</option>
            <option value="acquisitions_manager">Acquisitions Manager</option>
            <option value="articles_manager">Articles Manager</option>
            <option value="appointments_manager">Appointments Manager</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
            ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {loading ? 'Sending Invite...' : 'Invite User'}
        </button>
      </form>
      {message && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded border border-green-200">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

export default AdminTest;
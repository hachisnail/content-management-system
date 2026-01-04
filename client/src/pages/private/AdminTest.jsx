import React, { useState } from 'react';
import api from '../../api';
import { useConfig } from '../../context/ConfigContext';

function AdminTest() {
  const { ROLES } = useConfig();
  
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  
  // Default to Viewer, fallback to empty
  const [selectedRoles, setSelectedRoles] = useState(ROLES.VIEWER ? [ROLES.VIEWER] : []);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (roleValue) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleValue)) {
        return prev.filter(r => r !== roleValue);
      } else {
        return [...prev, roleValue];
      }
    });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // API now expects 'roles' array
      await api.post('/users', { 
        email, firstName, lastName, middleName, 
        roles: selectedRoles 
      });
      setMessage(`User invited successfully.`);
      setEmail('');
      setFirstName('');
      setLastName('');
      setMiddleName('');
      setSelectedRoles(ROLES.VIEWER ? [ROLES.VIEWER] : []);
    } catch (err) {
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
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">First Name</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Last Name</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700">Middle Name</label><input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div>
        </div>

        {/* DYNAMIC MULTI-ROLE SELECTOR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assign Roles</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 p-3 rounded border">
            {Object.values(ROLES).map((role) => (
              <label key={role} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                <input
                  type="checkbox"
                  value={role}
                  checked={selectedRoles.includes(role)}
                  onChange={() => handleRoleChange(role)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300"
                />
                <span className="text-sm text-gray-700 capitalize">{role.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {loading ? 'Sending Invite...' : 'Invite User'}
        </button>
      </form>
      {message && <div className="mt-4 p-3 bg-green-50 text-green-700 rounded border border-green-200">{message}</div>}
      {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>}
    </div>
  );
}

export default AdminTest;
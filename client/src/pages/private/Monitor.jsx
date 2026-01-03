// client/src/pages/private/Monitor.jsx
import React, { useState, useEffect } from 'react';
import { formatTimeAgo } from '../../utils/time';
import useRealtimeResource from '../../hooks/useRealtimeResource';
import socket from '../../socket';

function Monitor({ user: currentUser }) {
  // 1. Use the robust hook with default empty array and error handling
  const { data: users = [], loading, error } = useRealtimeResource('users');
  
  // Force re-render periodically to update "Time Ago" timestamps
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 60000); // Update every minute is usually sufficient for "time ago"

    return () => clearInterval(interval);
  }, []);

  const handleForceDisconnect = (userId) => {
    if (window.confirm('Are you sure you want to force disconnect this user?')) {
      // Emit event. The server should process this and emit a 'users_updated' 
      // event, which our hook will automatically catch to update the UI.
      socket.emit('force_disconnect_user', { userId });
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white shadow-md rounded-lg">
        <p className="text-gray-500 animate-pulse">Loading active users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white shadow-md rounded-lg border-l-4 border-red-500">
        <h3 className="text-red-500 font-bold">Error Loading Monitor</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">User Activity Monitor</h2>
        <span className="text-sm text-gray-500">
            Live Users: {users.filter(u => u.isOnline).length} / {users.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              {currentUser?.role === 'super_admin' && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
                <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500 text-sm">
                        No users found.
                    </td>
                </tr>
            ) : (
                users.map((user) => (
                <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    {user.isOnline ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Online
                        </span>
                    ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Offline
                        </span>
                    )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                        {user.last_active ? formatTimeAgo(user.last_active) : 'Never'}
                    </div>
                    </td>
                    {currentUser?.role === 'super_admin' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                        <button
                        onClick={() => handleForceDisconnect(user.id)}
                        disabled={!user.isOnline || user.id === currentUser.id}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-md hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                        Force Disconnect
                        </button>
                    </td>
                    )}
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Monitor;
import React, { useState, useEffect } from 'react';
import { formatTimeAgo } from '../../utils/time';
import useRealtimeResource from '../../hooks/useRealtimeResource';
import socket from '../../socket';
import { LoadingSpinner, ErrorAlert } from '../../components/StateComponents';
import { useAuth } from '../../context/AuthContext';

// CHANGED: Import the Hook, not the static file
import { useConfig } from '../../context/ConfigContext';

const INACTIVE_THRESHOLD_MS = 1 * 60 * 1000; 
const UI_REFRESH_INTERVAL_MS = 1000;

function Monitor() {
  const { data: users = [], loading: usersLoading, error: usersError } = useRealtimeResource('users');
  const { user: currentUser } = useAuth(); 

  // CHANGED: Get permissions from the dynamic config context
  const { hasPermission, PERMISSIONS } = useConfig();

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, UI_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleForceDisconnect = (userId) => {
    if (window.confirm('Are you sure you want to force disconnect this user?')) {
      socket.emit('force_disconnect_user', { userId });
    }
  };

  const getUserStatus = (user) => {
    if (!user.isOnline) return { type: 'offline', label: 'Offline', badgeClass: 'bg-gray-100 text-gray-800' };
    
    // If last_active is null/undefined but online, treat as just connected (Online)
    if (!user.last_active) return { type: 'online', label: 'Online', badgeClass: 'bg-green-100 text-green-800' };
    
    const lastActiveTime = new Date(user.last_active).getTime();
    if (isNaN(lastActiveTime)) return { type: 'online', label: 'Online', badgeClass: 'bg-green-100 text-green-800' };
    
    const diff = now - lastActiveTime;
    const safeDiff = Math.max(0, diff);

    if (safeDiff > INACTIVE_THRESHOLD_MS) {
      return { type: 'inactive', label: 'Inactive', badgeClass: 'bg-yellow-100 text-yellow-800' };
    }
    return { type: 'online', label: 'Online', badgeClass: 'bg-green-100 text-green-800' };
  };

  if (usersLoading) return <div className="bg-white shadow-md rounded-lg min-h-[500px]"><LoadingSpinner message="Syncing users..." /></div>;
  if (usersError) return <div className="bg-white shadow-md rounded-lg"><ErrorAlert message={usersError} /></div>;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">User Activity Monitor</h2>
        <span className="text-sm text-gray-500">
          Live Connections: {users.filter(u => u.isOnline).length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Activity</th>
              
              {/* DYNAMIC CHECK: Only show Action Header if server allows it */}
              {hasPermission(currentUser, PERMISSIONS.DISCONNECT_USERS) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">No users found.</td></tr>
            ) : (
                users.map((user) => {
                  const { label, badgeClass } = getUserStatus(user);
                  return (
                    <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col items-start">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mb-1 ${badgeClass}`}>
                                    {label}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {user.last_active ? `Active ${formatTimeAgo(user.last_active)}` : 'Never active'}
                                </span>
                            </div>
                        </td>

                        {/* DYNAMIC CHECK: Only show Button if server allows it */}
                        {hasPermission(currentUser, PERMISSIONS.DISCONNECT_USERS) && (
                          <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                  onClick={() => handleForceDisconnect(user.id)}
                                  disabled={!user.isOnline || user.id === currentUser.id}
                                  className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                  Force Disconnect
                              </button>
                          </td>
                        )}
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Monitor;
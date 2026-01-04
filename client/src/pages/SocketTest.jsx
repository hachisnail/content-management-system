import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import useRealtimeResource from '../hooks/useRealtimeResource';

// CHANGED: Import the Hook, not the static file
import { useConfig } from '../context/ConfigContext';

const SocketTest = () => {
  const { user } = useAuth();
  
  // CHANGED: Get permissions from the dynamic config context
  const { hasPermission, PERMISSIONS } = useConfig();

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Features
  const { data: donations } = useRealtimeResource('donations');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [targetUserId, setTargetUserId] = useState('');
  const [subscriptions, setSubscriptions] = useState({
    server_logs: false,
    audit_logs: false,
    users: false,
    donations: true,
  });

  // --- LISTENERS ---
  useEffect(() => {
    const addLog = (type, msg) => {
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, { time, type, msg }]);
    };

    function onConnect() { setIsConnected(true); addLog('system', 'Socket Connected: ' + socket.id); }
    function onDisconnect() { setIsConnected(false); addLog('error', 'Socket Disconnected'); }
    function onLog(data) { const msg = typeof data === 'object' ? data.message : data; addLog('personal', `[Personal] ${msg}`); }
    function onServerLog(data) { addLog('server', `[Server] ${data.message}`); }
    function onError(err) { addLog('error', `[Error] ${err.message || err}`); }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('log', onLog);
    socket.on('server_log', onServerLog);
    socket.on('connect_error', onError);

    // Initial check
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('log', onLog);
      socket.off('server_log', onServerLog);
      socket.off('connect_error', onError);
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // --- HANDLERS ---
  const handleSubscription = (resource) => {
    const isSubscribed = subscriptions[resource];
    if (isSubscribed) {
      socket.emit('unsubscribe_resource', resource);
      setSubscriptions(prev => ({ ...prev, [resource]: false }));
    } else {
      socket.emit('subscribe_resource', resource);
      setSubscriptions(prev => ({ ...prev, [resource]: true }));
    }
  };

  const handleCreateDonation = (e) => {
    e.preventDefault();
    if (!itemDescription || quantity < 1) return;
    socket.emit('create_donation', { itemDescription, quantity });
    setItemDescription('');
    setQuantity(1);
  };

  const handleKickUser = (e) => {
    e.preventDefault();
    if (!targetUserId) return;
    if (confirm(`Force disconnect user ID ${targetUserId}?`)) {
      socket.emit('force_disconnect_user', { userId: targetUserId });
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type: 'admin', msg: `Sent kick command for User ${targetUserId}` }]);
    }
  };

  const handleClearLogs = () => setLogs([]);

  // --- RENDER ---
  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* LEFT COLUMN: Controls */}
      <div className="space-y-6">
        
        {/* A. Status Card */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
          <h2 className="text-xl font-bold text-gray-800">Connection Status</h2>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center">
              <span className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="font-mono text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Logged in as:</p>
              <p className="font-bold text-sm text-indigo-600">{user?.email || 'Guest'}</p>
              {/* Display roles correctly whether array or string */}
              <p className="text-xs text-gray-400 capitalize">
                {Array.isArray(user?.role) ? user?.role.join(', ') : user?.role || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* B. Subscription Tester */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-700 mb-3 border-b pb-2">Resource Channels (ACL Test)</h3>
          <p className="text-xs text-gray-500 mb-4">
            Click to toggle. If your role is unauthorized, check the logs for "Access Denied".
          </p>
          <div className="grid grid-cols-2 gap-3">
            {['server_logs', 'audit_logs', 'users', 'donations'].map(resource => (
              <button
                key={resource}
                onClick={() => handleSubscription(resource)}
                className={`px-3 py-2 rounded text-sm font-medium border transition-colors flex justify-between items-center
                  ${subscriptions[resource] 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <span>{resource}</span>
                <span className={`h-2 w-2 rounded-full ${subscriptions[resource] ? 'bg-indigo-500' : 'bg-gray-300'}`}></span>
              </button>
            ))}
          </div>
        </div>

        {/* C. Admin Actions */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-400">
          <h3 className="font-bold text-gray-700 mb-3">Admin Zone</h3>
          <form onSubmit={handleKickUser} className="flex gap-2">
            <input 
              type="text" 
              placeholder="User ID" 
              className="flex-1 px-3 py-2 border rounded text-sm"
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!targetUserId || !hasPermission(user, PERMISSIONS.DISCONNECT_USERS)}
              className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded text-sm hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kick User
            </button>
          </form>
          {!hasPermission(user, PERMISSIONS.DISCONNECT_USERS) && (
            <p className="text-xs text-red-400 mt-2">Requires permission: 'disconnect_users'.</p>
          )}
        </div>

        {/* D. Public Action: Donation */}
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="font-bold text-gray-700 mb-3">Public Action: Donation</h3>
          <form onSubmit={handleCreateDonation} className="space-y-3">
            <input 
              type="text" 
              placeholder="Item Name (e.g. Rice)" 
              className="w-full px-3 py-2 border rounded text-sm"
              value={itemDescription}
              onChange={e => setItemDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <input 
                type="number" 
                min="1" 
                className="w-20 px-3 py-2 border rounded text-sm"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
              <button 
                type="submit"
                className="flex-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Send Event
              </button>
            </div>
          </form>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Live Feed Preview</p>
            <div className="h-24 overflow-y-auto bg-gray-50 p-2 rounded border text-xs space-y-1">
              {donations.length === 0 ? <span className="text-gray-400 italic">No donations yet...</span> : 
                donations.map(d => (
                  <div key={d.id} className="flex justify-between">
                    <span className="font-medium text-gray-700">{d.itemDescription}</span>
                    <span className="text-gray-500">x{d.quantity}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Terminal */}
      <div className="flex flex-col h-[600px] bg-gray-900 rounded-lg shadow-2xl overflow-hidden font-mono text-sm">
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
          <span className="text-gray-300 font-bold">Event Stream</span>
          <button onClick={handleClearLogs} className="text-xs text-gray-500 hover:text-white">Clear</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {logs.length === 0 && (
            <div className="text-gray-600 italic text-center mt-10">
              Waiting for socket events...
            </div>
          )}
          {logs.map((log, i) => {
            let color = 'text-gray-300';
            let bg = 'bg-transparent';
            if (log.type === 'error') { color = 'text-red-400'; bg = 'bg-red-900/20'; }
            if (log.type === 'system') { color = 'text-blue-400'; }
            if (log.type === 'server') { color = 'text-green-400'; bg = 'bg-green-900/10'; }
            if (log.type === 'admin') { color = 'text-yellow-400'; }
            return (
              <div key={i} className={`${color} ${bg} px-2 py-1 rounded break-all`}>
                <span className="opacity-50 text-xs mr-2">[{log.time}]</span>
                {log.msg}
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default SocketTest;
// client/src/pages/SocketTest.jsx
import { useState, useEffect, useCallback } from 'react';
import socket from '../socket';
import useRealtimeResource from '../hooks/useRealtimeResource';

// Simple Debounce Utility
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const SocketTest = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  
  // Hook handles connection and listening
  const { data: donations = [] } = useRealtimeResource('donations');
  
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [emitStatus, setEmitStatus] = useState(null);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setLogs(prev => [...prev, 'Connected to server']);
    }

    function onDisconnect() {
      setIsConnected(false);
      setUser(null);
      setLogs(prev => [...prev, 'Disconnected from server']);
    }

    function onLog(value) {
      const time = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, `[${time}] LOG: ${value.message}`]);
      if (value.user) {
        setUser(value.user);
      }
    }

    function onError(err) {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${time}] ERROR: ${err.message}`]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('log', onLog);
    // Listen for rate limit errors
    socket.on('connect_error', onError); 

    socket.on('reconnect_attempt', () => {
      setLogs(prev => [...prev, 'Attempting to reconnect...']);
    });

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('log', onLog);
      socket.off('connect_error', onError);
      socket.off('reconnect_attempt');
    };
  }, []);

  // --- DEBOUNCED EMIT ---
  // We use useCallback to keep the debounce timer stable across renders
  const debouncedCreate = useCallback(debounce((data) => {
    if (!socket.connected) {
        alert("Socket is not connected.");
        return;
    }
    socket.emit('create_donation', data);
    setEmitStatus('success');
    setTimeout(() => setEmitStatus(null), 3000);
  }, 500), []); // 500ms delay

  const handleCreateDonation = (e) => {
    e.preventDefault();
    setEmitStatus(null);

    if (!itemDescription || quantity <= 0) {
      alert('Please provide a valid item description and quantity.');
      return;
    }

    // Trigger the debounced function
    debouncedCreate({ itemDescription, quantity });
    
    // Clear UI immediately for responsiveness
    setItemDescription('');
    setQuantity(1);
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Socket.IO Test</h1>
      
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold">Connection</h2>
          <div className="mt-2 flex items-center">
            <span className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <strong>Status:</strong> 
            <span className="ml-1">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border rounded-lg border-indigo-100 bg-indigo-50">
            <h2 className="text-xl font-semibold text-indigo-800">Authenticated User</h2>
            <pre className="p-2 mt-2 bg-white rounded text-sm text-gray-700 overflow-auto border">
                {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        {/* Form */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold">Real-time Donations</h2>
          <form onSubmit={handleCreateDonation} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Description:</label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g. Canned Goods"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 sm:text-sm"
                min="1"
              />
            </div>
            <div className="flex items-center space-x-3">
                <button 
                    type="submit" 
                    disabled={!isConnected} 
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    Create Donation
                </button>
                {emitStatus === 'success' && (
                    <span className="text-sm text-green-600 font-medium animate-pulse">
                        ✓ Sending...
                    </span>
                )}
            </div>
          </form>

          {/* List */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold border-b pb-2">Live Feed</h3>
            {donations.length === 0 ? (
                <p className="text-gray-500 text-sm mt-2 italic">No donations yet...</p>
            ) : (
                <ul className="mt-2 space-y-2">
                {donations.map((donation) => (
                    <li key={donation.id} className="p-2 bg-gray-50 rounded border flex justify-between items-center">
                    <span>
                        <span className="font-bold">{donation.itemDescription}</span> 
                        <span className="text-gray-600 text-sm ml-2">(Qty: {donation.quantity})</span>
                    </span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                        by {donation.donorName || 'Anonymous'}
                    </span>
                    </li>
                ))}
                </ul>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="p-4 border rounded-lg bg-gray-900 text-green-400 font-mono text-sm h-48 overflow-y-auto">
          <h2 className="text-base font-semibold text-white mb-2 sticky top-0 bg-gray-900">System Logs</h2>
          <ul className="space-y-1">
            {logs.map((log, i) => (
              <li key={i}>{log}</li>
            ))}
            {logs.length === 0 && <li className="text-gray-600">Waiting for events...</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SocketTest;
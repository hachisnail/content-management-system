import React, { useState, useEffect, useRef } from 'react';
import socket from '../../socket';

function TestDashboard() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      addLog('Connected to dashboard.');
      // Re-subscribe if we reconnect
      socket.emit('subscribe_resource', 'server_logs');
    }

    function onDisconnect() {
      setIsConnected(false);
      addLog('Disconnected from server.');
    }

    // Handle personal unicast logs (Welcome, Error)
    function onLog(value) {
      const message = typeof value === 'object' ? value.message : value;
      addLog(`[PERSONAL] ${message}`);
    }

    // Handle broadcast server logs
    function onServerLog(data) {
      addLog(`[SERVER] ${data.message}`);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('log', onLog);
    socket.on('server_log', onServerLog);

    // Initial Setup
    setIsConnected(socket.connected);
    if (socket.connected) {
      socket.emit('subscribe_resource', 'server_logs');
    }

    return () => {
      // Cleanup
      socket.emit('unsubscribe_resource', 'server_logs');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('log', onLog);
      socket.off('server_log', onServerLog);
    };
  }, []);

  const addLog = (log) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, `[${time}] ${log}`]);
  }

  const handleClearLogs = () => {
      setLogs([]);
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Live Server Monitor</h2>
        <div className="flex items-center space-x-2">
            <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm font-medium text-gray-700">
                {isConnected ? 'Live Stream Active' : 'Stream Disconnected'}
            </span>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-gray-900 shadow-inner">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-mono text-sm text-gray-300">console.log output stream</h3>
            <button 
                onClick={handleClearLogs}
                className="text-xs text-gray-400 hover:text-white underline"
            >
                Clear Terminal
            </button>
        </div>
        
        <div className="p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
                <p className="text-gray-600 italic">Waiting for server events...</p>
            ) : (
                logs.map((log, index) => (
                    <div key={index} className="mb-1 text-green-400 break-words border-l-2 border-transparent hover:border-green-600 pl-2">
                        {log}
                    </div>
                ))
            )}
            <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}

export default TestDashboard;
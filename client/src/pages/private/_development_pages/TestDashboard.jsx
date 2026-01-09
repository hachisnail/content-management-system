import React, { useState, useEffect, useRef } from 'react';
import socket  from '../../../socket'

function TestDashboard() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    // 1. Define resources to monitor
    const RESOURCES = ['server_logs', 'users', 'audit_logs', 'donations'];

    const addLog = (log) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prevLogs => [...prevLogs, `[${time}] ${log}`]);
    };

    function onConnect() {
      setIsConnected(true);
      addLog('Connected to Socket Server.');
      // 2. Subscribe to ALL resources on connect
      RESOURCES.forEach(resource => {
        socket.emit('subscribe_resource', resource);
        addLog(`Subscribed to channel: ${resource}`);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      addLog('Disconnected from server.');
    }

    // --- GENERIC EVENT HANDLER ---
    const handleEvent = (resource, action, data) => {
        const id = data?.id || data?.entityId || '?';
        const user = data?.email || data?.initiator || 'System';
        addLog(`[${resource.toUpperCase()}] ${action} | ID: ${id} | By: ${user}`);
    };

    // --- BIND LISTENERS ---
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Legacy Listeners
    socket.on('log', (msg) => addLog(`[PERSONAL] ${typeof msg === 'object' ? msg.message : msg}`));
    socket.on('server_log', (data) => addLog(`[SERVER] ${data.message}`));

    // Dynamic Listeners for CRUD events
    // We bind to specific event names matching the server format: "resource_action"
    const eventBindings = [];
    RESOURCES.forEach(res => {
        ['created', 'updated', 'deleted'].forEach(action => {
            const eventName = `${res}_${action}`;
            const handler = (data) => handleEvent(res, action.toUpperCase(), data);
            
            socket.on(eventName, handler);
            eventBindings.push({ event: eventName, fn: handler });
        });
    });

    // Initial Connection Check
    if (socket.connected) {
        onConnect();
    }

    // Cleanup
    return () => {
      RESOURCES.forEach(resource => socket.emit('unsubscribe_resource', resource));
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('log');
      socket.off('server_log');
      
      // Cleanup dynamic listeners
      eventBindings.forEach(({ event, fn }) => socket.off(event, fn));
    };
  }, []);

  const handleClearLogs = () => setLogs([]);

  return (
    <div className="p-6 bg-white shadow-md rounded-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-2xl font-bold">Live Server Monitor</h2>
        <div className="flex items-center space-x-2">
            <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm font-medium text-gray-700">
                {isConnected ? 'Monitoring Active' : 'Stream Disconnected'}
            </span>
        </div>
      </div>
      
      <div className="flex-1 border rounded-lg overflow-hidden bg-gray-900 shadow-inner flex flex-col min-h-[500px]">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center shrink-0">
            <h3 className="font-mono text-sm text-gray-300">socket.io event stream</h3>
            <button 
                onClick={handleClearLogs}
                className="text-xs text-gray-400 hover:text-white underline"
            >
                Clear Terminal
            </button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1">
            {logs.length === 0 ? (
                <p className="text-gray-600 italic">Waiting for broadcast events...</p>
            ) : (
                logs.map((log, index) => {
                    // Color coding based on log content
                    let color = "text-zinc-300";
                    if (log.includes("[USERS]")) color = "text-blue-400";
                    if (log.includes("[AUDIT_LOGS]")) color = "text-amber-400";
                    if (log.includes("Disconnected")) color = "text-red-400";
                    if (log.includes("Connected")) color = "text-green-400";

                    return (
                        <div key={index} className={`${color} break-all hover:bg-white/5 px-1 rounded`}>
                            {log}
                        </div>
                    );
                })
            )}
            <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}

export default TestDashboard;
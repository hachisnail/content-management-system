import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import useRealtimeResource from '../hooks/useRealtimeResource';
import { useConfig } from '../context/ConfigContext';

import { 
  Button, 
  Input, 
  Badge, 
  Alert, 
  Card, // Assuming a basic Card wrapper exists or using div equivalent
} from '../components/UI';
import { 
  Terminal, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  Send, 
  UserMinus, 
  Layers, 
  Trash2,
  Activity
} from 'lucide-react';

const SocketTest = () => {
  const { user } = useAuth();
  const { hasPermission, PERMISSIONS } = useConfig();

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

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

    const onConnect = () => { setIsConnected(true); addLog('system', `Connected: ${socket.id}`); };
    const onDisconnect = () => { setIsConnected(false); addLog('error', 'Socket Disconnected'); };
    const onLog = (data) => addLog('personal', `[Personal] ${typeof data === 'object' ? data.message : data}`);
    const onServerLog = (data) => addLog('server', `[Server] ${data.message}`);
    const onError = (err) => addLog('error', `[Error] ${err.message || err}`);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('log', onLog);
    socket.on('server_log', onServerLog);
    socket.on('connect_error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('log', onLog);
      socket.off('server_log', onServerLog);
      socket.off('connect_error', onError);
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // --- HANDLERS ---
  const handleSubscription = (resource) => {
    const isSubscribed = subscriptions[resource];
    socket.emit(isSubscribed ? 'unsubscribe_resource' : 'subscribe_resource', resource);
    setSubscriptions(prev => ({ ...prev, [resource]: !isSubscribed }));
  };

  const handleCreateDonation = (e) => {
    e.preventDefault();
    if (!itemDescription) return;
    socket.emit('create_donation', { itemDescription, quantity });
    setItemDescription('');
    setQuantity(1);
  };

  const handleKickUser = (e) => {
    e.preventDefault();
    if (!targetUserId) return;
    socket.emit('force_disconnect_user', { userId: targetUserId });
    setTargetUserId('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
      
      {/* LEFT COLUMN: Controls */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Connection Status */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Connectivity</h2>
              <div className="flex items-center gap-2">
                {isConnected ? <Wifi size={18} className="text-green-500" /> : <WifiOff size={18} className="text-red-500" />}
                <span className="font-bold text-zinc-900">{isConnected ? 'Link Active' : 'Link Offline'}</span>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="neutral">{user?.email}</Badge>
              <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase">
                {Array.isArray(user?.role) ? user?.role.join(' • ') : user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription ACL Test */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Layers size={16} className="text-indigo-500" />
            <h3 className="font-bold text-zinc-800">Resource Channels</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['server_logs', 'audit_logs', 'users', 'donations'].map(res => (
              <button
                key={res}
                onClick={() => handleSubscription(res)}
                className={`px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-tight border transition-all flex justify-between items-center ${
                  subscriptions[res] 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                {res.replace('_', ' ')}
                <div className={`h-1.5 w-1.5 rounded-full ${subscriptions[res] ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-300'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Admin Section */}
        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert size={16} />
            <h3 className="font-bold">Privileged Actions</h3>
          </div>
          <form onSubmit={handleKickUser} className="flex gap-2">
            <Input 
              placeholder="Target User ID" 
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="danger" 
              type="submit"
              disabled={!targetUserId || !hasPermission(user, PERMISSIONS.DISCONNECT_USERS)}
              icon={UserMinus}
            >
              Kick
            </Button>
          </form>
          {!hasPermission(user, PERMISSIONS.DISCONNECT_USERS) && (
            <p className="text-[10px] text-red-400 italic">Access restricted: disconnect_users permission missing.</p>
          )}
        </div>

        {/* Public Event Tester */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="font-bold text-zinc-800">Mock Data Generator</h3>
          <form onSubmit={handleCreateDonation} className="space-y-3">
            <Input 
              placeholder="Item Name" 
              value={itemDescription}
              onChange={e => setItemDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-24"
              />
              <Button variant="primary" type="submit" className="flex-1" icon={Send}>
                Emit Donation
              </Button>
            </div>
          </form>
          
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Live Storefront Cache</p>
            <div className="h-32 overflow-y-auto bg-zinc-50/50 p-3 rounded-lg border border-zinc-100 space-y-2 scrollbar-hide">
              {donations.length === 0 ? <span className="text-zinc-400 text-xs italic">No server-side broadcast received...</span> : 
                donations.map(d => (
                  <div key={d.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-zinc-100 shadow-sm">
                    <span className="font-bold text-zinc-700">{d.itemDescription}</span>
                    <Badge variant="neutral">qty: {d.quantity}</Badge>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Terminal Stream */}
      <div className="lg:col-span-7 flex flex-col h-[750px] bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800">
        <div className="bg-zinc-900 px-4 py-3 flex justify-between items-center border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-zinc-500" />
            <span className="text-zinc-300 font-mono text-xs font-bold uppercase tracking-wider">WebSocket Traffic Monitor</span>
          </div>
          <Button variant="secondary" size="xs" onClick={() => setLogs([])} icon={Trash2}>
            Purge
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] leading-relaxed scrollbar-hide">
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-700">
              <Activity className="mb-2 opacity-20" size={48} />
              <p className="animate-pulse">Listening for incoming frames...</p>
            </div>
          )}
          {logs.map((log, i) => {
            const styles = {
              error: 'text-red-400 bg-red-950/20 border-red-900/30',
              system: 'text-blue-400 bg-blue-950/10 border-blue-900/20',
              server: 'text-emerald-400 bg-emerald-950/10 border-emerald-900/20',
              personal: 'text-indigo-400 bg-indigo-950/10 border-indigo-900/20',
              admin: 'text-amber-400 bg-amber-950/10 border-amber-900/20'
            };
            return (
              <div key={i} className={`${styles[log.type] || 'text-zinc-400'} px-3 py-1.5 rounded border border-transparent transition-all hover:border-current/20`}>
                <span className="opacity-40 mr-3">[{log.time}]</span>
                <span className="font-bold mr-2">[{log.type.toUpperCase()}]</span>
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
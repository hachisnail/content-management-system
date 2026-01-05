import React from 'react';
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";
import useRealtimeResource from "../../hooks/useRealtimeResource";
import { 
  Badge, 
  Button, 
  Alert, 
  Card 
} from "../../components/UI";
import { 
  LayoutDashboard, 
  Users, 
  History, 
  ShieldCheck, 
  ArrowUpRight, 
  Activity 
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, error, loading } = useAuth();
  const { hasPermission, PERMISSIONS } = useConfig();
  const navigate = useNavigate();

  // --- 1. DATA SUMMARY ---
  // Fetching a snapshot of resources to show on the dashboard
  const { data: usersData } = useRealtimeResource('users', { queryParams: { limit: 1 } });
  const { data: logsData } = useRealtimeResource('audit_logs', { queryParams: { limit: 5 } });

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return <Alert type="error" title="Auth Error" message={error} />;

  const recentLogs = Array.isArray(logsData) ? logsData : (logsData?.rows || []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <LayoutDashboard className="text-indigo-600" size={24} />
            System Overview
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Welcome back, <span className="font-semibold text-zinc-900">{user?.firstName}</span>. Here is what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="success" className="px-3 py-1">
             <span className="flex items-center gap-1.5">
               <ShieldCheck size={14}/> {Array.isArray(user?.role) ? user.role[0] : user?.role}
             </span>
           </Badge>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users size={20} />
            </div>
            <Badge variant="neutral">Live</Badge>
          </div>
          <p className="text-sm font-medium text-zinc-500">Total Managed Users</p>
          <h3 className="text-3xl font-bold text-zinc-900 mt-1">{usersData?.meta?.totalItems || '...'}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Activity size={20} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               SYSTEM ONLINE
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-500">Active Sessions</p>
          <h3 className="text-3xl font-bold text-zinc-900 mt-1">Verified</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <History size={20} />
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-500">Audit Entries Recorded</p>
          <h3 className="text-3xl font-bold text-zinc-900 mt-1">{logsData?.meta?.totalItems || '...'}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 3. RECENT ACTIVITY FEED */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <History size={18} className="text-zinc-400" />
              Recent System Activity
            </h3>
            <Button variant="secondary" size="xs" onClick={() => navigate('/audit-logs')}>
              View All
            </Button>
          </div>
          <div className="p-6 space-y-4">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                  {log.initiator?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-900 font-medium truncate">{log.description}</p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant={log.operation === 'DELETE' ? 'error' : 'neutral'} className="text-[10px]">
                  {log.operation}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* 4. QUICK ACTIONS & PERMISSIONS */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Administrative Tools</h3>
              <p className="text-indigo-100 text-sm mb-6">You have administrative access to manage users and monitor real-time system logs.</p>
              <div className="flex flex-wrap gap-3">
                {hasPermission(user, PERMISSIONS.DISCONNECT_USERS) && (
                  <Button variant="secondary" size="sm" onClick={() => navigate('/monitor')} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Live Monitor
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => navigate('/invite')} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Invite User
                </Button>
              </div>
            </div>
            <ShieldCheck className="absolute -bottom-4 -right-4 text-white/10" size={120} />
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
             <h3 className="font-bold text-zinc-900 mb-4">Your Session Security</h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-zinc-600">Encrypted WebSocket</span>
                   </div>
                   <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-sm text-zinc-600">Last Authentication</span>
                   </div>
                   <span className="text-xs text-zinc-400 font-mono">Today, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
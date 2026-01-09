import React, { useState, useEffect } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { useConfig } from "../../../context/ConfigContext";
import { useRealtimeResource } from "../../../hooks/useRealtimeResource";
import api from "../../../api"; 
import socket from "../../../socket"; 
import ComponentErrorBoundary from "../../../components/ComponentErrorBoundary";
import { Alert } from "../../../components/UI";

// Sub-components
import { DashboardHeader } from './components/DashboardHeader';
import { StatsGrid } from './components/StatsGrid';
import { ActivityFeed } from './components/ActivityFeed';
import { QuickActions } from './components/QuickActions';

const Dashboard = () => {
  const { user, error, loading } = useAuth();
  const { hasPermission, PERMISSIONS } = useConfig();
  const [debugLoading, setDebugLoading] = useState(false);

  // --- DATA ---
  const { data: usersData } = useRealtimeResource('users', { queryParams: { limit: 1 } });
  const { data: logsData } = useRealtimeResource('audit_logs', { queryParams: { limit: 5 } });
  
  const recentLogs = Array.isArray(logsData) ? logsData : (logsData?.rows || []);

  // --- DEBUG VERIFICATION ---
  useEffect(() => {
    const handleUpdate = (data) => {
        console.log("%c[Socket] Broadcast Received: users_updated", "color: #00ff00; background: #000; padding: 2px 5px;", data);
    };
    
    socket.on('users_updated', handleUpdate);
    return () => socket.off('users_updated', handleUpdate);
  }, []);

  // --- TRIGGER ---
  const handleDebugEmit = async () => {
    if (!user) return;
    setDebugLoading(true);
    try {
      console.log("1. Sending HTTP Request...");
      await api.updateUser(user.id, {
        middleName: user.middleName === '.' ? '' : '.' 
      });
      console.log("2. HTTP Request Success. Waiting for Socket Broadcast...");
    } catch (err) {
      console.error("Debug Trigger Failed:", err);
      alert("Failed to send signal: " + err.message);
    } finally {
      setDebugLoading(false);
    }
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return <Alert type="error" title="Auth Error" message={error} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <DashboardHeader 
        user={user} 
        onDebug={handleDebugEmit} 
        isDebugLoading={debugLoading} 
        hasDebugPermission={hasPermission(user, PERMISSIONS.VIEW_SOCKET_TEST)}
      />

      {/* STATS */}
      <ComponentErrorBoundary title="Statistics Failed">
        <StatsGrid 
          usersCount={usersData?.meta?.totalItems} 
          logsCount={logsData?.meta?.totalItems} 
        />
      </ComponentErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* RECENT ACTIVITY */}
        <ComponentErrorBoundary title="Activity Feed Failed">
          <ActivityFeed 
            logs={recentLogs} 
            canViewAll={hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS)} 
          />
        </ComponentErrorBoundary>

        {/* ACTIONS */}
        <QuickActions 
          user={user} 
          hasPermission={hasPermission} 
          PERMISSIONS={PERMISSIONS} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
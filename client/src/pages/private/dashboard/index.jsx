import React, { useState, useEffect } from 'react';
import { useAuth } from "../../../context/AuthContext";
import { useConfig } from "../../../context/ConfigContext";
import { useRealtimeResource } from "../../../hooks/useRealtimeResource";
import api from "../../../api"; 
import socket from "../../../socket"; 
import ComponentErrorBoundary from "../../../components/ComponentErrorBoundary";
import { Alert } from "../../../components/UI";
import { Bug } from "lucide-react"; // Import Bug icon

// Sub-components
import { DashboardHeader } from './components/DashboardHeader';
import { StatsGrid } from './components/StatsGrid';
import { ActivityFeed } from './components/ActivityFeed';
import { QuickActions } from './components/QuickActions';

// --- QA COMPONENT: Intentionally crashes ---
const BuggyComponent = () => {
  throw new Error("Simulation: The Activity Feed encountered a critical render error.");
};

const Dashboard = () => {
  const { user, error, loading } = useAuth();
  const { hasPermission, PERMISSIONS } = useConfig();
  const [debugLoading, setDebugLoading] = useState(false);
  
  // --- QA STATE ---
  const [simulatedCrash, setSimulatedCrash] = useState(false);

// --- DATA ---
const { data: usersData } = useRealtimeResource('users');
const { data: logsData } = useRealtimeResource('audit_logs', { queryParams: { limit: 5 } });

// Normalize shapes (arrays only)
const users = Array.isArray(usersData) ? usersData : [];
const logs = Array.isArray(logsData) ? logsData : [];

// Stats
const totalUsers = users.length;
const activeSessions = users.filter(u => u.isOnline).length;
const totalLogs = logs.length;

// Recent activity feed
const recentLogs = logs;



  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return <Alert type="error" title="Auth Error" message={error} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      

      {/* HEADER */}
      <DashboardHeader 
        user={user} 
        setSimulatedCrash={setSimulatedCrash}

      />

      {/* STATS */}
    <ComponentErrorBoundary
      key={simulatedCrash ? 'crashed' : 'healthy'}
      title="Activity Feed Failed"
      onRetry={() => setSimulatedCrash(false)}
    >

    <StatsGrid
      usersCount={totalUsers}
      activeSessions={activeSessions}
      logsCount={totalLogs}
    />

      </ComponentErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* RECENT ACTIVITY (With Crash Simulation) */}
        <ComponentErrorBoundary 
          title="Activity Feed Failed"
          onRetry={() => setSimulatedCrash(false)} // Resets state when "Reload Section" is clicked
        >
          {simulatedCrash ? (
            <BuggyComponent />
          ) : (
            <ActivityFeed 
              logs={recentLogs} 
              canViewAll={hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS)} 
            />
          )}
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
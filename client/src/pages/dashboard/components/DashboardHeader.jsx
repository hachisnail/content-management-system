import React from 'react';
import { LayoutDashboard, Zap, ShieldCheck, Bug } from 'lucide-react';
import { Button, Badge  } from '../../../components/UI';

export const DashboardHeader = ({ user, setSimulatedCrash }) => {
  return (
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
          <button 
            onClick={() => setSimulatedCrash(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors shadow-sm border border-red-200"
            title="Test Error Boundary"
          >
            <Bug size={14} />
            <span>Crash Feed</span>
          </button>


         <Badge variant="success" className="px-3 py-1">
           <span className="flex items-center gap-1.5">
             <ShieldCheck size={14}/> {Array.isArray(user?.role) ? user.role[0] : user?.role}
           </span>
         </Badge>
      </div>
    </div>
  );
};
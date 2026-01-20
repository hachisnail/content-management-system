import React from 'react';
import { Users, Activity, History } from 'lucide-react';
import { Badge } from '../../../components/UI';

export const StatsGrid = ({ usersCount, activeSessions, logsCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* USERS */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users size={20} />
          </div>
          <Badge variant="neutral">Live</Badge>
        </div>
        <p className="text-sm font-medium text-zinc-500">Total Managed Users</p>
        <h3 className="text-3xl font-bold text-zinc-900 mt-1">
          {usersCount || 0}
        </h3>
      </div>

      {/* ACTIVE SESSIONS */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Activity size={20} />
          </div>

          {activeSessions > 0 && (
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ONLINE
            </div>
          )}
        </div>

        <p className="text-sm font-medium text-zinc-500">Active Sessions</p>
        <h3 className="text-3xl font-bold text-zinc-900 mt-1">
          {activeSessions}
        </h3>
      </div>

      {/* AUDIT LOGS */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <History size={20} />
          </div>
        </div>
        <p className="text-sm font-medium text-zinc-500">Audit Entries Recorded</p>
        <h3 className="text-3xl font-bold text-zinc-900 mt-1">
          {logsCount || 0}
        </h3>
      </div>

    </div>
  );
};

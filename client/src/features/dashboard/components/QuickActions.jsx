import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/UI';

export const QuickActions = ({ hasPermission, PERMISSIONS, user }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-2">Administrative Tools</h3>
          <p className="text-indigo-100 text-sm mb-6">You have administrative access to manage users and monitor real-time system logs.</p>
          <div className="flex flex-wrap gap-3">
            {hasPermission(user, PERMISSIONS.VIEW_MONITOR) && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/monitor')} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Live Monitor
              </Button>
            )}
            {hasPermission(user, PERMISSIONS.CREATE_USERS) && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/users/invite')} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Invite User
              </Button>
            )}
          </div>
        </div>
        <ShieldCheck className="absolute -bottom-4 -right-4 text-white/10" size={120} />
      </div>
    </div>
  );
};
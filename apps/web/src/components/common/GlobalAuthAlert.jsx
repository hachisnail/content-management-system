import React, { useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { AlertCircle, X } from 'lucide-react';

export const GlobalAuthAlert = () => {
  const { logoutMessage, dismissLogoutMessage } = useAuth();

  // Auto-dismiss after 10 seconds (optional, good UX)
  useEffect(() => {
    if (logoutMessage) {
      const timer = setTimeout(() => dismissLogoutMessage(), 10000);
      return () => clearTimeout(timer);
    }
  }, [logoutMessage, dismissLogoutMessage]);

  if (!logoutMessage) return null;

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-300">
      <div role="alert" className="alert alert-error shadow-lg border border-error/20">
        <AlertCircle className="stroke-current shrink-0 h-6 w-6" />
        <div>
          <h3 className="font-bold">Session Terminated</h3>
          <div className="text-xs">{logoutMessage}</div>
        </div>
        <button 
          onClick={dismissLogoutMessage} 
          className="btn btn-sm btn-ghost btn-circle"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
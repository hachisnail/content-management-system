import React, { useState, useEffect } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';

export const LiveStatusBadge = ({ user, variant = 'badge' }) => {
  const [display, setDisplay] = useState({ state: 'offline', text: 'Offline' });

  useEffect(() => {
    const update = () => {
      // 1. Master Switch: If backend says offline, they are offline.
      if (!user?.isOnline) {
        setDisplay({ 
          state: 'offline', 
          text: user?.lastActiveAt ? `Last seen ${formatDistanceToNowStrict(new Date(user.lastActiveAt))} ago` : 'Offline' 
        });
        return;
      }

      // 2. Timer Logic
      const lastActive = new Date(user.lastActiveAt || 0);
      const diffSeconds = Math.max(0, (new Date() - lastActive) / 1000);

      // < 1 Minute: Show Seconds
      if (diffSeconds < 60) {
        setDisplay({ 
          state: 'online', 
          text: diffSeconds < 10 ? 'Active now' : `Active ${Math.floor(diffSeconds)}s ago` 
        });
      } 
      // 1 Minute - 3 Minutes: Show Minutes (Still Green)
      else if (diffSeconds < 180) {
        setDisplay({ 
          state: 'online', 
          text: `Active ${Math.floor(diffSeconds / 60)}m ago` 
        });
      }
      // > 3 Minutes: Idle (Orange)
      else {
        setDisplay({ 
          state: 'idle', 
          text: `Idle ${Math.floor(diffSeconds / 60)}m ago` 
        });
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Render Variants
  if (variant === 'text') {
    const color = display.state === 'online' ? 'text-success' : display.state === 'idle' ? 'text-warning' : 'text-base-content/50';
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex h-2.5 w-2.5">
          {display.state === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${display.state === 'online' ? 'bg-success' : display.state === 'idle' ? 'bg-warning' : 'bg-base-300'}`}></span>
        </div>
        <div className="flex flex-col">
          <span className={`text-xs font-bold leading-none capitalize ${color}`}>{display.state}</span>
          <span className="text-[10px] opacity-70 whitespace-nowrap font-mono">{display.text}</span>
        </div>
      </div>
    );
  }

  // Default Badge Variant
  const badgeStyle = 
    display.state === 'online' ? 'bg-success/10 text-success border-success/20' : 
    display.state === 'idle' ? 'bg-warning/10 text-warning border-warning/20' : 
    'bg-base-200 text-base-content/60 border-base-300';
    
  const dotStyle = 
    display.state === 'online' ? 'bg-success animate-ping' : 
    display.state === 'idle' ? 'bg-warning' : 
    'bg-base-content/40';

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}>
      <span className={`w-2 h-2 rounded-full ${dotStyle}`}></span>
      {display.text}
    </div>
  );
};
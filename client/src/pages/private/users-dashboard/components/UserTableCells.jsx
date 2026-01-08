import React from 'react';
import { Badge, Avatar } from '../../../../components/UI';
import { Activity, Shield } from 'lucide-react';
import { formatTimeAgo } from '../../../../utils/time';

export const UserIdentity = ({ user }) => (
  <div className="flex items-center gap-3">
    <Avatar user={user} size="md" />
    <div className="min-w-0">
      <div className="font-semibold text-zinc-900 leading-tight truncate">
        {user.firstName} {user.lastName}
      </div>
      <div className="text-[11px] text-zinc-400 font-mono truncate">
        {user.email}
      </div>
    </div>
  </div>
);

export const UserRole = ({ user }) => (
  <Badge variant={user.role?.includes('admin') ? 'dark' : 'neutral'}>
    <Shield size={10} className="mr-1" />
    {Array.isArray(user.role) ? user.role[0] : user.role}
  </Badge>
);

export const UserStatus = ({ user, now }) => {
  // FIX: Increased threshold to 5 minutes to account for server/client clock skew
  const INACTIVE_THRESHOLD_MS = 5 * 60 * 1000; 
  
  let label = 'Online';
  let variant = 'success';

  if (user.status === 'disabled') {
    label = 'Disabled';
    variant = 'error';
  } else if (!user.isOnline) {
    label = 'Offline';
    variant = 'neutral';
  } else if (user.last_active) {
    const lastActive = new Date(user.last_active).getTime();
    const diff = now - lastActive;

    // Only show Idle if the user has genuinely been inactive for > 5 mins
    // We check (diff > 0) to ensure we don't punish 'future' timestamps (negative diffs)
    if (diff > INACTIVE_THRESHOLD_MS) {
      label = 'Idle';
      variant = 'warning';
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={variant} className="shadow-sm border-0 ring-1 ring-inset ring-black/5">
        {label}
      </Badge>
      <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
        <Activity size={10} />
        {/* Force re-render of text by using 'now' dependency implicitly if needed, 
            but formatTimeAgo handles the logic fine. */}
        {user.last_active ? formatTimeAgo(user.last_active) : 'Seen just now'}
      </span>
    </div>
  );
};
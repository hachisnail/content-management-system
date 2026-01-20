import { Badge, Avatar } from '@/components/UI';
import { Clock } from 'lucide-react';

export const LogInitiator = ({ log }) => {
  const displayEmail = log.user?.email || log.initiator;
  const fullName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System Event';
  
  return (
    <div className="flex items-center gap-3">
      <Avatar user={log.user} size="md" />
      <div className="min-w-0">
        <div className="font-semibold text-zinc-900 leading-tight truncate" title={fullName}>
          {fullName}
        </div>
        <div className="text-[10px] text-zinc-400 font-mono truncate" title={displayEmail}>
          {displayEmail}
        </div>
      </div>
    </div>
  );
};

export const LogOperation = ({ log }) => (
  <div className="flex flex-col items-start gap-1">
    <Badge variant={log.operation === 'DELETE' ? 'error' : 'neutral'}>
      {log.operation}
    </Badge>
    <div className="text-[11px] text-zinc-500 line-clamp-1 max-w-[250px]" title={log.description}>
      {log.description}
    </div>
  </div>
);

export const LogTimestamp = ({ date }) => (
  <div className="flex flex-col text-zinc-400 font-mono text-[11px]">
    <div className="flex items-center gap-1 text-zinc-900 font-semibold">
      <Clock size={12} className="text-zinc-400" />
      {new Date(date).toLocaleDateString()}
    </div>
    <div className="ml-4 opacity-70">
      {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
  </div>
);
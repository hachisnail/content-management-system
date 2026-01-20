import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { Button, Badge } from '../../../components/UI';

export const ActivityFeed = ({ logs, canViewAll }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
          <History size={18} className="text-zinc-400" />
          Recent System Activity
        </h3>
        {canViewAll && (
          <Button variant="secondary" size="xs" onClick={() => navigate('/audit-logs')}>
            View All
          </Button>
        )}
      </div>
      <div className="p-6 space-y-4">
        {logs.length === 0 && <p className="text-zinc-400 text-sm text-center italic">No events yet.</p>}
        {logs.map((log) => (
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
  );
};
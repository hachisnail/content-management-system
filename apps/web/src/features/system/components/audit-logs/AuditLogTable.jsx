import React from 'react';
import { DataTable } from '../../../../components/common/DataTable';
import { Avatar } from '../../../../components/common';
import { useNavigate } from 'react-router-dom';

export const AuditLogTable = ({ logs, meta, loading, isFetching, params, onParamsChange }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'user',
      label: 'User',
      sortable: false, // Sort by user requires joins usually, simpler to disable or enable if backend supports
      render: (log) => (
        <div className="flex items-center gap-3">
          <Avatar user={log.user} size="w-8 h-8" textSize="text-xs" />
          <div>
            <div className="font-bold text-xs">
              {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
            </div>
            <div className="text-[10px] opacity-60">{log.user?.email || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (log) => (
        <span className={`badge badge-sm font-mono font-bold ${getActionColor(log.action)}`}>
          {log.action}
        </span>
      )
    },
    {
      key: 'resource',
      label: 'Resource',
      sortable: true,
      render: (log) => <span className="font-mono text-xs opacity-70">{log.resource}</span>
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (log) => <span className="text-xs opacity-60">{new Date(log.createdAt).toLocaleString()}</span>
    }
  ];

  const actions = (log) => (
    <button 
      onClick={() => navigate(`/audit/${log.id}`)}
      className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 rounded flex items-center gap-2"
    >
      View Details
    </button>
  );

  return (
    <DataTable 
      title="System Audit Logs"
      columns={columns}
      data={logs}
      totalCount={meta.totalItems}
      totalPages={meta.totalPages}
      isLoading={loading}
      isFetching={isFetching}
      params={params}
      onParamsChange={onParamsChange}
      actions={actions}
    />
  );
};

// Helper for badges
const getActionColor = (action) => {
  if (action.includes('CREATE')) return 'badge-success badge-outline';
  if (action.includes('UPDATE')) return 'badge-info badge-outline';
  if (action.includes('DELETE')) return 'badge-error badge-outline';
  if (action.includes('LOGIN')) return 'badge-primary badge-outline';
  return 'badge-ghost';
};
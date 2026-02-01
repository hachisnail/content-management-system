import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../components/common/DataTable';
import { useAuditLogs } from '../hooks/useAuditLogs'; // [FIX] Import the hook
import { format } from 'date-fns';
import { Avatar } from '../../../components/common';

const AuditLogPage = () => {
  const navigate = useNavigate();

  // [FIX] Use the custom hook for logic/state
  const { 
    logs, 
    meta, 
    loading, 
    isFetching, 
    params, 
    updateParams 
  } = useAuditLogs();

  const columns = [
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs opacity-80">
          {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm:ss')}
        </span>
      )
    },
    {
      key: 'user',
      label: 'User',
      render: (item) => {
        const user = item.user;
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar className='w-8' user={user}/>
            <span className="font-medium">{user.firstName} {user.lastName}</span>
          </div>
        ) : (
          <span className="italic text-base-content/40">System</span>
        );
      }
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (item) => {
        const colors = {
          CREATE: 'badge-success',
          UPDATE: 'badge-warning',
          DELETE: 'badge-error',
          LOGIN: 'badge-info',
          LOGOUT: 'badge-neutral',
        };
        return (
          <div className={`badge badge-sm gap-2 ${colors[item.action] || 'badge-ghost'} bg-opacity-20 border-opacity-20 text-xs font-bold`}>
            {item.action}
          </div>
        );
      }
    },
    {
      key: 'resource',
      label: 'Resource',
      sortable: true,
      render: (item) => <span className="capitalize">{item.resource}</span>
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (item) => <span className="font-mono text-xs opacity-60">{item.ipAddress || 'N/A'}</span>
    },
  ];

  const actions = (item) => (
    <button
      onClick={() => navigate(`/audit/${item.id}`)}
      className="flex items-center w-full text-left text-sm" 
    >
      View Details
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 w-full h-[calc(100vh-4rem)] flex flex-col">
      
      <DataTable
        title="Audit Logs"
        columns={columns}
        actions={actions}
        data={logs} 
        totalCount={meta?.totalItems || 0}
        totalPages={meta?.totalPages || 1}
        isLoading={loading}
        isFetching={isFetching}
        params={params}
        onParamsChange={updateParams} 
      />
    </div>
  );
};

export default AuditLogPage;
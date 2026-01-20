import { useNavigate } from 'react-router-dom';
import { useRealtimeResource } from '@/hooks/useRealtimeResource';
import { useTableControls } from '@/hooks/useTableControls';
import { encodeId } from '@/utils/idEncoder';
import ComponentErrorBoundary from '@/components/common/ComponentErrorBoundary'; 
import { 
  DataTable, 
  Button, 
  Alert, 
  Dropdown 
} from '@/components/UI';
import { LogInitiator, LogOperation, LogTimestamp } from '@/features/system-tools/audit-logs/components/LogTableCells';
import { Activity, Filter, Check, Eye } from 'lucide-react';

function AuditLogListPage() {
  const navigate = useNavigate();

  // --- CONTROLS ---
  const { 
    page, setPage, 
    limit, 
    search, setSearch, 
    filters, handleFilterChange, 
    queryParams, 
    handleSortChange 
  } = useTableControls({ defaultLimit: 10, initialSort: { key: 'createdAt', direction: 'desc' }});

  // --- DATA ---
  const { data, meta, loading, error } = useRealtimeResource('audit_logs', { 
    queryParams,
    updateStrategy: 'manual' 
  });

  const logs = data || [];
  const totalCount = meta?.totalItems || 0;

  // --- COLUMNS ---
  const columns = [
    { 
      header: "Event Origin", 
      accessor: "initiator",
      sortable: true,
      render: (log) => <LogInitiator log={log} />
    },
    { 
      header: "Action & Context", 
      accessor: "operation",
      sortable: true,
      render: (log) => <LogOperation log={log} />
    },
    { 
      header: "Timestamp", 
      accessor: "createdAt",
      sortable: true,
      render: (log) => <LogTimestamp date={log.createdAt} />
    },
    { 
      header: "", 
      accessor: "id",
      render: (log) => (
        <div className="flex justify-end pr-2">
          <Button 
            variant="secondary" 
            size="icon" 
            icon={Eye} 
            onClick={() => navigate(`/audit-logs/${encodeId(log.id)}`)}
            className="rounded-full shadow-sm border-zinc-200 hover:scale-110 hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200"
          />
        </div>
      )
    }
  ];

  if (error) return <Alert type="error" title="Sync Error" message={error} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 font-sans">Audit Trail</h1>
          <p className="text-zinc-500 text-sm mt-1">Immutable ledger of system mutations and events.</p>
        </div>
        <div className="px-3 py-1 bg-white border border-zinc-200 rounded-full text-[10px] font-bold text-zinc-600 shadow-sm flex items-center gap-2 font-mono uppercase tracking-widest">
           <Activity size={12} className="text-indigo-500"/>
           {totalCount} Entries Recorded
        </div>
      </div>

      {/* TABLE SECTION */}
      <ComponentErrorBoundary title="Log Table Failed">
        <DataTable 
          columns={columns} 
          data={logs} 
          isLoading={loading}
          onSearch={setSearch}
          onSort={handleSortChange}
          searchPlaceholder="Find events by initiator or description..."
          serverSidePagination={{
            totalItems: totalCount,
            currentPage: page,
            itemsPerPage: limit,
            onPageChange: setPage
          }}
          filterSlot={
            <Dropdown 
              trigger={
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 shadow-sm transition-all">
                  <Filter size={16} className="text-zinc-400" />
                  <span>Type: <span className="text-black font-semibold capitalize">{filters.operation || 'All'}</span></span>
                </button>
              }
            >
              <div className="w-48 font-sans">
                {['All', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'].map((op) => (
                  <button
                    key={op}
                    onClick={() => handleFilterChange('operation', op === 'All' ? undefined : op)}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center justify-between transition-colors"
                  >
                    <span className="capitalize">{op.toLowerCase()}</span>
                    {(filters.operation === op || (!filters.operation && op === 'All')) && <Check size={14} className="text-black" />}
                  </button>
                ))}
              </div>
            </Dropdown>
          }
        />
      </ComponentErrorBoundary>
    </div>
  );
}

export default AuditLogListPage;
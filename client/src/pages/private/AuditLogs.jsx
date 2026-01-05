import React, { useState } from 'react';
import useRealtimeResource from '../../hooks/useRealtimeResource';
import { useTableControls } from '../../hooks/useTableControls';
import { 
  DataTable, 
  Badge, 
  Button, 
  Modal, 
  Alert, 
  Dropdown 
} from '../../components/UI';
import { Eye, Clock, Activity, Filter, Check, ArrowRight } from 'lucide-react';

// --- SUB-COMPONENT: SIMPLIFIED STATE VIEW ---
const StateDisplay = ({ label, data, colorClass }) => (
  <div className="space-y-2">
    <div className={`text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
      {label}
    </div>
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 font-mono text-[11px] overflow-auto max-h-64 scrollbar-hide">
      {data ? (
        <pre className="text-zinc-700 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <span className="text-zinc-400 italic">No data available</span>
      )}
    </div>
  </div>
);

const LogDetailsModal = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <Modal 
      isOpen={!!log} 
      onClose={onClose} 
      title="Event Details" 
      size="lg"
      footer={<Button onClick={onClose} variant="secondary">Close</Button>}
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center font-bold text-sm text-zinc-500 shadow-sm">
              {log.initiator?.charAt(0).toUpperCase() || "S"}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 leading-tight">{log.initiator}</p>
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-tighter">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <Badge variant={log.operation === 'DELETE' ? 'error' : 'neutral'}>{log.operation}</Badge>
        </div>

        {/* Simplified Comparison View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start relative">
          <StateDisplay label="Previous State" data={log.beforeState} colorClass="text-red-500" />
          
          {/* Middle Icon for visual flow */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-zinc-200 rounded-full items-center justify-center shadow-sm z-10">
            <ArrowRight size={14} className="text-zinc-400" />
          </div>

          <StateDisplay label="Updated State" data={log.afterState} colorClass="text-green-600" />
        </div>
      </div>
    </Modal>
  );
};

function AuditLogs() {
  const [selectedLog, setSelectedLog] = useState(null);

  // --- 1. TABLE CONTROLS & DATA ---
  const { 
    page, setPage, 
    limit, 
    search, setSearch, 
    filters, handleFilterChange, 
    queryParams, 
    handleSortChange 
  } = useTableControls({ defaultLimit: 10, initialSort: { key: 'createdAt', direction: 'desc' }});

  const { data, meta, loading, error } = useRealtimeResource('audit_logs', { 
    queryParams,
    updateStrategy: 'manual' // Use 'manual' for smoother prepending of new logs on page 1
  });

  // --- 2. DERIVED STATE ---
  const logs = data || [];
  const totalCount = meta?.totalItems || 0;

  // --- 3. UI CONFIGURATION ---
  const columns = [
    { 
      header: "Event Origin", 
      accessor: "initiator",
      sortable: true,
      render: (log) => {
        const displayEmail = log.user?.email || log.initiator;
        const fullName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System Event';
        
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center font-bold text-sm text-zinc-500 shadow-sm shrink-0">
              {displayEmail?.charAt(0).toUpperCase() || "?"}
            </div>
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
      }
    },
    { 
      header: "Action & Context", 
      accessor: "operation",
      sortable: true,
      render: (log) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={log.operation === 'DELETE' ? 'error' : 'neutral'}>
            {log.operation}
          </Badge>
          <div className="text-[11px] text-zinc-500 line-clamp-1 max-w-[250px]" title={log.description}>
            {log.description}
          </div>
        </div>
      )
    },
    { 
      header: "Timestamp", 
      accessor: "createdAt",
      sortable: true,
      render: (log) => (
        <div className="flex flex-col text-zinc-400 font-mono text-[11px]">
          <div className="flex items-center gap-1 text-zinc-900 font-semibold">
            <Clock size={12} className="text-zinc-400" />
            {new Date(log.createdAt).toLocaleDateString()}
          </div>
          <div className="ml-4 opacity-70">
            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
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
            onClick={() => setSelectedLog(log)}
            className="rounded-full shadow-sm border-zinc-200"
          />
        </div>
      )
    }
  ];

  if (error) return <Alert type="error" title="Sync Error" message={error} />;

  // --- 4. RENDER ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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

      <DataTable 
        columns={columns} 
        data={logs} 
        isLoading={loading && page === 1} // Only show full loader on initial load
        onSearch={setSearch}
        onSort={handleSortChange}
        searchPlaceholder="Find events..."
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

      {selectedLog && <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}

export default AuditLogs;
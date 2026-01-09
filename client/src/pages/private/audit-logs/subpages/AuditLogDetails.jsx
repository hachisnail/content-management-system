import React, { useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useRealtimeResource } from '../../../../hooks/useRealtimeResource';
import { decodeId } from '../../../../utils/idEncoder';
import ComponentErrorBoundary from '../../../../components/ComponentErrorBoundary';
import { 
  Button, 
  Card, 
  Alert, 
  Badge, 
  Avatar 
} from '../../../../components/UI';
import { 
  ArrowLeft, 
  Clock, 
  FileJson,
  CheckCircle2, 
  XCircle,
  ChevronRight,
  Server
} from 'lucide-react';

// --- HELPER: Value Formatter ---
const formatValue = (val) => {
  if (val === null || val === undefined) {
    return <span className="text-zinc-300 italic text-xs">empty</span>;
  }
  if (typeof val === 'boolean') {
    return val ? (
      <span className="inline-flex items-center gap-1 text-green-700 font-bold text-xs bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
        <CheckCircle2 size={12} /> True
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-red-700 font-bold text-xs bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
        <XCircle size={12} /> False
      </span>
    );
  }
  // Detect ISO Date strings
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
      return <span className="font-mono text-zinc-600">{new Date(val).toLocaleString()}</span>;
  }
  if (typeof val === 'object') {
    return (
      <pre className="text-[10px] bg-zinc-50 p-1.5 rounded border border-zinc-100 max-w-[200px] overflow-hidden truncate font-mono text-zinc-600">
        {JSON.stringify(val)}
      </pre>
    );
  }
  return <span className="text-zinc-700 font-medium">{String(val)}</span>;
};

// --- HELPER: Safe JSON Parser ---
const safeParse = (data) => {
  if (!data) return {};
  if (typeof data === 'object') return data; 
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse log state:", e);
    return { error: "Raw data could not be parsed", raw: data };
  }
};

// --- COMPONENT: Diff Table (For Updates) ---
const DiffTable = ({ before, after }) => {
  const beforeObj = safeParse(before);
  const afterObj = safeParse(after);

  const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));
  const cleanKeys = allKeys.filter(k => !['updatedAt', 'createdAt', 'deletedAt'].includes(k));

  if (cleanKeys.length === 0) {
    return <div className="p-8 text-center text-zinc-400 italic text-sm">No visible property changes recorded.</div>;
  }

  return (
    <div className="overflow-hidden border border-zinc-200 rounded-lg shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-zinc-50/80 text-zinc-500 font-semibold text-xs uppercase tracking-wider border-b border-zinc-200">
          <tr>
            <th className="px-4 py-3 w-1/4">Field Name</th>
            <th className="px-4 py-3 w-1/3 border-l border-zinc-200/60">Original Value</th>
            <th className="px-4 py-3 w-1/3 border-l border-zinc-200/60">New Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {cleanKeys.map(key => {
            const valBefore = beforeObj[key];
            const valAfter = afterObj[key];
            const isChanged = JSON.stringify(valBefore) !== JSON.stringify(valAfter);
            
            return (
              <tr key={key} className={isChanged ? "bg-amber-50/30 transition-colors hover:bg-amber-50/50" : "hover:bg-zinc-50/50"}>
                <td className="px-4 py-3 font-medium text-zinc-700 flex items-center gap-2">
                  {key}
                  {isChanged && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Modified"></div>}
                </td>
                <td className={`px-4 py-3 border-l border-zinc-100 font-mono text-xs ${isChanged ? 'text-red-700/60 line-through decoration-red-200' : 'text-zinc-500'}`}>
                  {formatValue(valBefore)}
                </td>
                <td className={`px-4 py-3 border-l border-zinc-100 font-mono text-xs ${isChanged ? 'text-zinc-900 font-bold' : 'text-zinc-500'}`}>
                  {formatValue(valAfter)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// --- COMPONENT: Single State View (For Create/Delete) ---
const SingleStateView = ({ data, variant = 'neutral' }) => {
  const parsedData = safeParse(data);
  const keys = Object.keys(parsedData).filter(k => !['updatedAt', 'createdAt', 'deletedAt'].includes(k));
  
  const styles = {
    green: "bg-green-50/30 border-green-100",
    red: "bg-red-50/30 border-red-100",
    neutral: "bg-zinc-50/50 border-zinc-100"
  };

  return (
    <div className={`rounded-lg border ${styles[variant]} overflow-hidden`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6 p-5">
        {keys.map(key => (
          <div key={key} className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">{key}</span>
            <div className="text-sm break-all pl-1 border-l-2 border-black/5">
              {formatValue(parsedData[key])}
            </div>
          </div>
        ))}
        {keys.length === 0 && <div className="col-span-full text-center text-zinc-400 italic text-sm">No data properties available.</div>}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
function AuditLogDetails() {
  const { id: encodedId } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumbLabel } = useOutletContext() || {};
  
  const logId = decodeId(encodedId);

  const { data: log, loading, error } = useRealtimeResource('audit_logs', { id: logId });

  useEffect(() => {
    if (log && setBreadcrumbLabel) {
      setBreadcrumbLabel(`Event #${log.id}`);
    }
    return () => setBreadcrumbLabel && setBreadcrumbLabel(null);
  }, [log, setBreadcrumbLabel]);

  if (!logId) return <Alert type="error" title="Invalid Link" message="Malformed Log ID." />;
  if (loading) return <div className="p-12 text-center text-zinc-400 animate-pulse font-medium">Loading event details...</div>;
  if (error || !log) return <Alert type="error" title="Not Found" message={error || "Log entry not found."} />;

  // Determine Layout based on Operation
  const isUpdate = log.operation === 'UPDATE';
  const isCreate = log.operation === 'CREATE' || log.operation === 'LOGIN'; 
  const isDelete = log.operation === 'DELETE' || log.operation === 'LOGOUT'; 

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/audit-logs')} 
          className="pl-0 hover:bg-transparent hover:text-indigo-600 group"
        >
          <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" /> Back to Log Stream
        </Button>
        <span className="text-xs font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded">ID: {log.id}</span>
      </div>

      {/* Main Info Card */}
      <ComponentErrorBoundary title="Event Metadata Failed">
        <Card className="p-0 overflow-hidden border-zinc-200 shadow-sm">
          <div className="p-6 bg-white">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              
              {/* Left: Initiator */}
              <div className="flex items-start gap-4">
                <Avatar user={log.user} size="lg" className="mt-1 ring-4 ring-zinc-50" />
                <div>
                  <h1 className="text-lg font-bold text-zinc-900 leading-tight">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System / Deleted User'}
                  </h1>
                  <p className="text-zinc-500 text-sm font-mono mt-0.5">{log.initiator}</p>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant={isDelete ? 'error' : isUpdate ? 'warning' : 'success'} className="px-2.5 py-0.5">
                      {log.operation}
                    </Badge>
                    <span className="text-xs text-zinc-400 font-medium">on</span>
                    <Badge variant="neutral" className="font-mono flex items-center gap-1.5 px-2.5">
                      <Server size={10} className="text-zinc-400" />
                      {log.affectedResource}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Right: Timestamp */}
              <div className="flex flex-col items-end text-right bg-zinc-50/50 p-3 rounded-lg border border-zinc-100">
                <div className="text-zinc-900 font-semibold text-sm flex items-center gap-2">
                  <Clock size={14} className="text-indigo-500" />
                  {new Date(log.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
                <div className="text-zinc-500 font-mono text-xs mt-1">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-zinc-50/30 border-t border-zinc-100">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Description</h3>
            <p className="text-zinc-700 font-medium text-sm leading-relaxed">
              {log.description}
            </p>
          </div>
        </Card>
      </ComponentErrorBoundary>

      {/* Changes Section */}
      <ComponentErrorBoundary title="Change View Failed">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <FileJson size={20} className="text-indigo-600" />
            {isUpdate ? "Property Modifications" : isCreate ? "New Record Snapshot" : "Removed Record Snapshot"}
          </h2>

          <Card className="p-0 border-zinc-200 overflow-hidden shadow-sm">
            {isUpdate ? (
              <DiffTable before={log.beforeState} after={log.afterState} />
            ) : (
              <div className="p-1.5">
                <SingleStateView 
                  data={isCreate ? log.afterState : log.beforeState} 
                  variant={isCreate ? 'green' : 'red'} 
                />
              </div>
            )}
          </Card>
        </div>
      </ComponentErrorBoundary>

      {/* Raw JSON Toggle */}
      <div className="pt-8 border-t border-zinc-100">
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-colors list-none select-none">
            <div className="w-5 h-5 border border-zinc-200 bg-white rounded flex items-center justify-center text-zinc-400 group-hover:border-zinc-300 group-hover:text-zinc-600 transition-all shadow-sm">
              <ChevronRight size={14} className="group-open:rotate-90 transition-transform duration-200" />
            </div>
            Developer: View Raw Payload
          </summary>
          <div className="mt-4 p-4 bg-zinc-900 rounded-lg overflow-x-auto shadow-inner border border-zinc-800">
            <pre className="text-[10px] font-mono text-green-400 leading-relaxed">
              {JSON.stringify(log, null, 2)}
            </pre>
          </div>
        </details>
      </div>

    </div>
  );
}

export default AuditLogDetails;
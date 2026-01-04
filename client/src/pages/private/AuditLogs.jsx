import { useState } from 'react';
import useRealtimeResource from '../../hooks/useRealtimeResource';
import { LoadingSpinner, ErrorAlert } from '../../components/StateComponents';

// Simple Modal Component for viewing details
const DetailsModal = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-bold text-gray-800">
            Log Details #{log.id}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-bold">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto font-mono text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before State */}
            <div className="border rounded p-3 bg-red-50">
              <h4 className="font-bold text-red-700 mb-2 border-b border-red-200 pb-1">Before State</h4>
              {log.beforeState ? (
                <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(log.beforeState, null, 2)}</pre>
              ) : (
                <span className="text-gray-400 italic">No previous state (Creation or Login)</span>
              )}
            </div>

            {/* After State */}
            <div className="border rounded p-3 bg-green-50">
              <h4 className="font-bold text-green-700 mb-2 border-b border-green-200 pb-1">After State</h4>
              {log.afterState ? (
                <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(log.afterState, null, 2)}</pre>
              ) : (
                <span className="text-gray-400 italic">No new state (Deletion)</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 text-right rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

function AuditLogs() {
  // 1. Fetch Data using your hook
  const { data: logs = [], loading, error } = useRealtimeResource('audit_logs');
  
  // 2. State for the selected log (for the modal)
  const [selectedLog, setSelectedLog] = useState(null);

  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  // 3. Helper to determine badge color based on operation
  const getBadgeColor = (op) => {
    switch (op?.toUpperCase()) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      // Added Login and Logout cases
      case 'LOGIN':  return 'bg-purple-100 text-purple-800';
      case 'LOGOUT': return 'bg-orange-100 text-orange-800'; 
      default: return 'bg-gray-100 text-gray-800';
    }
  };

if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg min-h-[500px]">
        <LoadingSpinner message="Syncing audit logs..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg">
        <ErrorAlert message={error} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">System Audit Logs</h2>
          <p className="text-sm text-gray-500">Track all system changes and security events.</p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
          {sortedLogs.length} Events Recorded
        </span>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Initiator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="font-medium text-gray-900">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-medium text-gray-900">{log.initiator}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(log.operation)}`}>
                    {log.operation}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {log.affectedResource}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={log.description}>
                  {log.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button 
                    onClick={() => setSelectedLog(log)}
                    className="text-indigo-600 hover:text-indigo-900 hover:underline"
                  >
                    View Changes
                  </button>
                </td>
              </tr>
            ))}
            {sortedLogs.length === 0 && (
                <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500 italic">
                        No audit logs found.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Render Modal */}
      {selectedLog && (
        <DetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

export default AuditLogs;
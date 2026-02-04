import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { ArrowLeft, User, Clock, Shield, Activity, Globe, Monitor, FileText } from 'lucide-react';
import { auditApi } from '../api/audit.api';
import { Avatar } from '../../../components/common';

export const AuditLogDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const data = await auditApi.getAuditLog(id);
        setLog(data);
      } catch (error) {
        console.error("Failed to load log details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-96">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </PageContainer>
    );
  }

  if (!log) {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold opacity-50">Audit Log Not Found</h2>
          <button onClick={() => navigate('/audit')} className="btn btn-primary mt-4">Back to Logs</button>
        </div>
      </PageContainer>
    );
  }

  // Parse details safely
  let detailsObj = log.details;
  if (typeof detailsObj === 'string') {
    try { detailsObj = JSON.parse(detailsObj); } catch (e) { /* ignore */ }
  }

  // Extract description to show separately
  const description = detailsObj?.description || 'No detailed description available.';
  
  // Create a clean version of data for the JSON view (optional: remove description to avoid redundancy)
  const { description: _, ...cleanData } = detailsObj || {};

  return (
    <PageContainer
      title="Audit Log Details"
      breadcrumbs={['System', 'Audit Logs', log.id]}
      actions={
        <button onClick={() => navigate('/audit')} className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft size={16}/> Back
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Meta Info */}
        <div className="space-y-6">
          {/* User Card */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-5">
              <h3 className="text-xs font-bold uppercase opacity-50 mb-3 flex items-center gap-2">
                <User size={14}/> Actor
              </h3>
              <div className="flex items-center gap-4">
                <Avatar user={log.user} size="w-12 h-12" />
                <div>
                  <div className="font-bold">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</div>
                  <div className="text-xs opacity-60">{log.user?.email || 'N/A'}</div>
                  <div className="mt-1">
                    {log.user?.roles?.map(r => (
                      <span key={r} className="badge badge-xs badge-ghost mr-1 uppercase">{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Context Info */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase opacity-50 mb-1 flex items-center gap-2">
                <Activity size={14}/> Context
              </h3>
              
              <div>
                <div className="text-xs opacity-50 mb-1 flex items-center gap-1"><Clock size={12}/> Timestamp</div>
                <div className="font-mono text-sm">{new Date(log.createdAt).toLocaleString()}</div>
              </div>

              <div>
                <div className="text-xs opacity-50 mb-1 flex items-center gap-1"><Globe size={12}/> IP Address</div>
                <div className="font-mono text-sm">{log.ipAddress || 'Unknown'}</div>
              </div>

              <div>
                <div className="text-xs opacity-50 mb-1 flex items-center gap-1"><Monitor size={12}/> User Agent</div>
                <div className="text-xs opacity-70 break-all">{log.userAgent || 'Unknown'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Action & Changes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-6">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className={`badge badge-lg font-bold ${log.action.includes('DELETE') ? 'badge-error' : 'badge-primary'}`}>
                  {log.action}
                </div>
                <span className="text-xl opacity-30">/</span>
                <span className="font-mono font-bold text-lg opacity-70">{log.resource}</span>
              </div>
              
              {/* [NEW] Readable Description */}
              <div className="flex gap-3">
                 <div className="mt-1"><FileText className="text-primary opacity-50" size={24} /></div>
                 <div>
                    <h2 className="text-xl font-bold text-base-content">{description}</h2>
                    <p className="text-sm opacity-60 mt-1">
                        Recorded action details. See raw data below for specific field changes.
                    </p>
                 </div>
              </div>

            </div>
          </div>

          {/* Details / Diff */}
          <div className="card bg-base-100 border border-base-200 shadow-sm flex-1">
            <div className="card-body p-0 flex flex-col">
              <div className="p-4 border-b border-base-200 bg-base-200/30">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Shield size={16}/> Activity Data (Raw)
                </h3>
              </div>
              <div className="p-4 overflow-x-auto">
                {Object.keys(cleanData).length > 0 ? (
                    <pre className="font-mono text-xs bg-black/5 p-4 rounded-lg overflow-auto max-h-[500px]">
                    {JSON.stringify(cleanData, null, 2)}
                    </pre>
                ) : (
                    <div className="text-center py-8 opacity-50 italic text-sm">
                        No additional data parameters recorded for this action.
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};

export default AuditLogDetailsPage;
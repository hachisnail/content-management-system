import React, { useState } from 'react';
import { DataTable } from '../../../components/common/DataTable';
import { AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react';

const MOCK_JOBS = [
  { id: 'CON-24-001', artifact: 'Vintage Abaca Loom', issue: 'Mold growth', status: 'In Treatment', priority: 'High' },
  { id: 'CON-24-002', artifact: 'Ceremonial Sword', issue: 'Rust', status: 'Assessment', priority: 'Medium' },
];

export const ConservationTab = () => {
  const [jobs] = useState(MOCK_JOBS);

  const columns = [
    { key: 'artifact', label: 'Artifact', render: (row) => <div className="font-bold">{row.artifact}</div> },
    { key: 'issue', label: 'Issue' },
    { key: 'status', label: 'Stage', render: (row) => <span className="badge badge-warning">{row.status}</span> },
    { key: 'priority', label: 'Priority', render: (row) => <div className="text-error font-bold flex gap-1"><AlertTriangle size={14}/> {row.priority}</div> }
  ];

  return (
    <div className="card bg-base-100 border border-base-200 shadow-sm">
      <DataTable 
        title="Active Treatments" 
        columns={columns} 
        data={jobs} 
        hideControls={true} // Cleaner look inside a tab
      />
    </div>
  );
};
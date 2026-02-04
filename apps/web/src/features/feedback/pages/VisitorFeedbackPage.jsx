import React, { useState, useMemo } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/common/DataTable';
import { ConfirmationModal } from "@repo/ui";
import { 
  MessageCircle, Star, ThumbsUp, ThumbsDown, 
  Mail, Archive, Trash2, CheckCircle, Eye 
} from 'lucide-react';

// Mock Data (Replace with API call later)
const MOCK_DATA = [
  { id: 1, visitorName: "John Doe", type: "General", rating: 5, comment: "Beautiful collection of gold artifacts.", email: "john@example.com", status: "new", createdAt: "2023-10-05" },
  { id: 2, visitorName: "Anonymous", type: "Complaint", rating: 2, comment: "It was very hot in the main gallery.", email: null, status: "new", createdAt: "2023-10-04" },
  { id: 3, visitorName: "Maria Clara", type: "Suggestion", rating: 4, comment: "Please add more translations for the manuscripts.", email: "maria@test.com", status: "read", createdAt: "2023-10-01" },
];

const VisitorFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState(MOCK_DATA);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'new', 'archived'

  // --- Statistics ---
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const avg = (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / (total || 1)).toFixed(1);
    const sentiment = avg >= 4 ? "Positive" : avg >= 2.5 ? "Neutral" : "Negative";
    return { total, avg, sentiment };
  }, [feedbacks]);

  // --- Table Columns ---
  const columns = [
    {
      key: 'visitorName', label: 'Visitor',
      render: (row) => (
        <div>
          <div className="font-bold text-sm">{row.visitorName}</div>
          <div className="text-xs opacity-50">{row.email || 'No email provided'}</div>
        </div>
      )
    },
    {
      key: 'type', label: 'Type',
      render: (row) => (
        <span className={`badge badge-sm ${
          row.type === 'Complaint' ? 'badge-error badge-outline' : 
          row.type === 'Suggestion' ? 'badge-info badge-outline' : 'badge-ghost'
        }`}>
          {row.type}
        </span>
      )
    },
    {
      key: 'rating', label: 'Rating',
      render: (row) => (
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className={i < row.rating ? "fill-warning text-warning" : "text-base-300"} />
          ))}
        </div>
      )
    },
    {
      key: 'comment', label: 'Comment',
      render: (row) => <div className="truncate max-w-xs text-sm" title={row.comment}>{row.comment}</div>
    },
    {
      key: 'createdAt', label: 'Date',
      render: (row) => <span className="text-xs opacity-60">{row.createdAt}</span>
    }
  ];

  // --- Actions ---
  const handleAction = (action, item) => {
    if (action === 'archive') {
      setModalConfig({
        isOpen: true,
        title: "Archive Feedback?",
        message: "This will move the feedback to the archive.",
        variant: "info",
        confirmText: "Archive",
        onConfirm: () => {
          setFeedbacks(prev => prev.map(f => f.id === item.id ? { ...f, status: 'archived' } : f));
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else if (action === 'delete') {
      setModalConfig({
        isOpen: true,
        title: "Delete Record?",
        message: "This action cannot be undone.",
        variant: "danger",
        confirmText: "Delete",
        onConfirm: () => {
          setFeedbacks(prev => prev.filter(f => f.id !== item.id));
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    }
  };

  const rowActions = (item) => (
    <>
      <button className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2">
        <Eye size={14} /> View Details
      </button>
      {item.email && (
        <button className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2">
          <Mail size={14} /> Reply via Email
        </button>
      )}
      <div className="divider my-0"></div>
      <button onClick={() => handleAction('archive', item)} className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2 text-warning">
        <Archive size={14} /> Archive
      </button>
      <button onClick={() => handleAction('delete', item)} className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2 text-error">
        <Trash2 size={14} /> Delete
      </button>
    </>
  );

  const filteredData = feedbacks.filter(f => filterStatus === 'all' ? f.status !== 'archived' : f.status === filterStatus);

  return (
    <PageContainer title="Visitor Feedback">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stats shadow-sm border border-base-200">
          <div className="stat">
            <div className="stat-figure text-warning"><Star size={24} fill="currentColor" /></div>
            <div className="stat-title">Avg Rating</div>
            <div className="stat-value text-2xl">{stats.avg}</div>
            <div className="stat-desc">From {stats.total} reviews</div>
          </div>
        </div>
        <div className="stats shadow-sm border border-base-200">
          <div className="stat">
            <div className="stat-figure text-primary"><MessageCircle size={24} /></div>
            <div className="stat-title">Total Feedback</div>
            <div className="stat-value text-2xl">{stats.total}</div>
            <div className="stat-desc">All time volume</div>
          </div>
        </div>
        <div className="stats shadow-sm border border-base-200">
          <div className="stat">
            <div className="stat-figure text-secondary">
              {stats.sentiment === "Positive" ? <ThumbsUp size={24} /> : <ThumbsDown size={24} />}
            </div>
            <div className="stat-title">Sentiment</div>
            <div className="stat-value text-2xl">{stats.sentiment}</div>
            <div className="stat-desc">Based on ratings</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="border-b border-base-200 p-4">
            <div className="tabs tabs-boxed bg-base-100 p-0 gap-2">
                <a className={`tab tab-sm ${filterStatus === 'all' ? 'tab-active' : ''}`} onClick={() => setFilterStatus('all')}>Active</a>
                <a className={`tab tab-sm ${filterStatus === 'archived' ? 'tab-active' : ''}`} onClick={() => setFilterStatus('archived')}>Archived</a>
            </div>
        </div>
        
        <DataTable 
          columns={columns}
          data={filteredData}
          actions={rowActions}
          hideControls={false}
          hidePagination={false}
        />
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        confirmText={modalConfig.confirmText}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
      />
    </PageContainer>
  );
};

export default VisitorFeedbackPage;
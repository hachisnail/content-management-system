import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRealtimeResource } from "@/hooks/useRealtimeResource";
import { useTableControls } from "@/hooks/useTableControls";
import {
  Button,
  Card,
  DataTable,
  Badge,
  ConfirmationModal,
  PageHeader,
  Dropdown,
} from "@/components/UI";
import {
  Trash2,
  RotateCcw,
  RefreshCw,
  MoreVertical,
  Eye,
  FileText,
  User,
  Box,
  HardDrive,
  HeartHandshake,
  Layers
} from "lucide-react";
import api from "@/lib/api";

// --- HELPERS ---
const getIconForType = (type) => {
  switch (type) {
    case 'users': return <User size={18} className="text-blue-500" />;
    case 'files': return <FileText size={18} className="text-amber-500" />;
    case 'test_items': return <Box size={18} className="text-indigo-500" />;
    case 'donations': return <HeartHandshake size={18} className="text-pink-500" />;
    default: return <Layers size={18} className="text-zinc-400" />;
  }
};

// --- GENERIC METADATA RENDERER ---
// This ensures scalability. Whatever data the backend captures, we display intelligently.
const getMetadataString = (row) => {
  let d = row.data;
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch (e) { d = {}; }
  } else if (!d) {
    d = {};
  }

  // 1. Files Special Case (Standard formatting)
  if (row.resourceType === 'files' && d.size) {
    return `${d.mimeType || 'File'} • ${(d.size / 1024).toFixed(1)} KB`;
  }

  // 2. Generic Field Priority List
  // We check for these keys in order. If found, we display them.
  const priorityFields = [
    'email', 
    'description', 
    'summary', 
    'quantity', 
    'amount', 
    'donor', 
    'status'
  ];

  const foundDetails = [];

  // Special Handling: Combine Quantity + Donor for donations
  if (d.quantity && d.donor) return `Qty: ${d.quantity} • Donor: ${d.donor}`;

  // Loop through priority fields
  priorityFields.forEach(field => {
    if (d[field]) {
      // Truncate long text
      let val = String(d[field]);
      if (val.length > 40) val = val.substring(0, 40) + '...';
      foundDetails.push(val);
    }
  });

  if (foundDetails.length > 0) {
    return foundDetails.join(' • ');
  }

  // 3. Fallback
  return row.id ? `ID: ${row.id.substring(0, 8)}...` : 'No details';
};

const TrashListPage = () => {
  const navigate = useNavigate();
  const { page, setPage, limit, search, setSearch, queryParams: baseQueryParams } = useTableControls();

  const [refreshKey, setRefreshKey] = useState(0);
  
  const queryParams = useMemo(() => ({
    ...baseQueryParams,
    _r: refreshKey 
  }), [baseQueryParams, refreshKey]);

  const { data, meta, loading } = useRealtimeResource("admin/trash", {
    queryParams
  });

  const trashItems = data || [];
  const totalItems = meta?.totalItems || 0;

  const [confirmState, setConfirmState] = useState(null);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleAction = async () => {
    if (!confirmState) return;
    const { action, item } = confirmState;
    try {
      if (action === "restore") {
        await api.post(`admin/trash/${item.resourceType}/${item.id}/restore`);
      } else if (action === "purge") {
        await api.delete(`admin/trash/${item.resourceType}/${item.id}`);
      }
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.message || err.message));
    } finally {
      setConfirmState(null);
    }
  };

  const columns = [
    {
      header: "Asset Identity",
      accessor: "label",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center shadow-sm">
            {getIconForType(row.resourceType)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-900 text-sm truncate max-w-[200px]" title={row.label}>
              {row.label || "Unknown Item"}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono tracking-tight uppercase">
              {row.resourceType}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Details",
      accessor: "resourceType",
      render: (row) => (
        <span className="text-xs font-medium text-zinc-600 line-clamp-1 max-w-[250px]" title={getMetadataString(row)}>
          {getMetadataString(row)}
        </span>
      ),
    },
    {
      header: "Deletion Date",
      accessor: "deletedAt",
      render: (row) => (
        <div className="flex flex-col">
          <Badge variant="error" className="w-fit mb-1 text-[10px] px-1.5 py-0">Deleted</Badge>
          <span className="text-xs text-zinc-500">{new Date(row.deletedAt).toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: "",
      accessor: "actions",
      render: (row) => (
        <div className="flex justify-end items-center gap-2">
          {/* Quick Restore Button */}
          <Button 
            variant="secondary" 
            size="icon" 
            className="w-8 h-8 rounded-full border border-indigo-100 text-indigo-600 hover:bg-indigo-50 shadow-sm"
            title="Restore Item"
            onClick={() => setConfirmState({ action: "restore", item: row, title: "Restore Item?", msg: "This item will be moved back to the active list." })}
          >
            <RotateCcw size={14} />
          </Button>

          <Dropdown align="right" trigger={<Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-zinc-100"><MoreVertical size={16} className="text-zinc-400" /></Button>}>
            {({ close }) => (
              <div className="w-48 font-sans">
                <button
                  onClick={() => { navigate(`/trash/${row.id}`); close(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                >
                  <Eye size={14} /> View Details
                </button>
                <button
                  onClick={() => { setConfirmState({ action: "restore", item: row, title: "Restore?", msg: "Item will reappear in active lists." }); close(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                >
                  <RotateCcw size={14} /> Restore
                </button>
                <div className="h-px bg-zinc-100 my-1" />
                <button
                  onClick={() => { setConfirmState({ action: "purge", item: row, title: "Delete Forever?", msg: "Cannot be undone.", isDangerous: true }); close(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete Forever
                </button>
              </div>
            )}
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Recycle Bin" 
        description="Recover deleted items from across the system." 
        icon={Trash2} 
        actions={
          <Button 
            variant="secondary" 
            size="sm" 
            icon={RefreshCw} 
            onClick={handleRefresh} 
            isLoading={loading}
          >
            Refresh
          </Button>
        }
      />

      <Card className="overflow-hidden border-red-100 bg-white shadow-sm">
        <DataTable
          columns={columns}
          data={trashItems}
          isLoading={loading}
          onSearch={setSearch}
          searchPlaceholder="Search deleted items..."
          emptyMessage="No items in trash."
          serverSidePagination={{ 
            totalItems, 
            currentPage: page, 
            itemsPerPage: limit, 
            onPageChange: setPage 
          }}
        />
      </Card>

      <ConfirmationModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={handleAction}
        title={confirmState?.title}
        message={confirmState?.msg}
        isDangerous={confirmState?.isDangerous}
      />
    </div>
  );
};

export default TrashListPage;
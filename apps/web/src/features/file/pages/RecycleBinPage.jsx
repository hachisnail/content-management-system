import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import apiClient from "../../../api/client";
import { usePermission } from "../../../providers/PermissionProvider";
import { FileListView } from "../components/FileListView";
import { FileCard } from "../components/FileCard";
import { FileToolbar } from "../components/FileToolbar";
import { FileContextMenu } from "../components/FileContextMenu";
import { ConfirmationModal } from "@repo/ui"; 

export default function RecycleBinPage() {
  // -- State --
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  
  // [NEW] Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "info",
    onConfirm: () => {},
  });
  
  const { can } = usePermission();

  // -- Data Fetching --
  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/recycle-bin");
      
      const mapped = (res.data.data || []).map(entry => {
        let meta = entry.metadata;
        if (typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
        }

        return {
            id: entry.id, 
            originalName: entry.name || "Unknown File", 
            name: entry.name || "Unknown File",
            size: meta?.size || 0,
            mimetype: meta?.mimeType || meta?.mimetype || "application/octet-stream",
            deletedAt: entry.createdAt,
            createdAt: entry.createdAt,
            deleter: entry.deleter,
            isRecycleBin: true,
            resourceType: entry.resourceType,
            metadata: meta
        };
      });

      setItems(mapped);
    } catch (err) {
      console.error("Failed to load recycle bin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeleted(); }, []);

  // -- Filtering --
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(lower));
  }, [items, searchTerm]);

  // -- Handlers --
  const handleSelection = (id, multi) => {
    const newSet = new Set(multi ? selectedIds : []);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedIds.has(item.id)) {
      handleSelection(item.id, false);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const executeAction = async (action, ids) => {
    try {
      if (action === 'restore') {
        await Promise.all(ids.map(id => apiClient.post(`/recycle-bin/${id}/restore`)));
      } else if (action === 'forceDelete') {
        await Promise.all(ids.map(id => apiClient.delete(`/recycle-bin/${id}`)));
      }
      
      setSelectedIds(new Set());
      setContextMenu(null);
      setModalConfig(prev => ({ ...prev, isOpen: false }));
      fetchDeleted();
    } catch (err) {
      alert("Operation failed: " + (err.response?.data?.message || err.message));
    }
  };

  const confirmAction = (action, specificId = null) => {
    const ids = specificId ? [specificId] : Array.from(selectedIds);
    if (ids.length === 0) return;

    const count = ids.length;
    const isRestore = action === 'restore';

    setModalConfig({
      isOpen: true,
      title: isRestore ? "Restore Items?" : "Delete Permanently?",
      message: isRestore 
        ? `Are you sure you want to restore ${count} item(s)? They will return to their original locations.`
        : `Are you sure you want to delete ${count} item(s) permanently? This action cannot be undone.`,
      variant: isRestore ? "info" : "danger",
      confirmText: isRestore ? "Restore" : "Delete Forever",
      onConfirm: () => executeAction(action, ids)
    });
  };

  // -- Toolbar State Adapter --
  const toolbarState = {
    viewMode,
    groupBy: 'none',
    searchTerm,
    selectedIds,
    section: 'recycle', 
    loading
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200 h-[calc(100vh-6rem)] flex flex-col relative select-none" onClick={() => { setContextMenu(null); setSelectedIds(new Set()); }}>
      
      {/* 1. Header / Toolbar */}
      <div className="flex flex-col border-b border-base-200 bg-base-100 rounded-t-xl overflow-hidden shrink-0">
         <div className="p-3 flex items-center gap-3 bg-error/5 border-b border-base-200/50">
            <Link to="/files" className="btn btn-circle btn-sm btn-ghost"><ArrowLeft size={18}/></Link>
            <div className="flex items-center gap-2 text-error font-bold">
                <Trash2 size={20}/> Recycle Bin
            </div>
            <div className="text-xs opacity-50 font-normal">
                ({filteredItems.length} items)
            </div>
         </div>

         <div onClick={(e) => e.stopPropagation()}>
            <FileToolbar 
                state={toolbarState}
                onSearch={setSearchTerm}
                onViewChange={setViewMode}
                onGroupChange={() => {}} 
                onClearSelection={() => setSelectedIds(new Set())}
                onBulkAction={(action) => {
                    if (action === 'restore') confirmAction('restore');
                    if (action === 'delete') confirmAction('forceDelete');
                }}
            />
         </div>
      </div>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-base-50/50">
        {loading ? (
             <div className="flex justify-center items-center h-full"><span className="loading loading-spinner text-error"></span></div>
        ) : filteredItems.length === 0 ? (
            <div className="text-center opacity-50 mt-20 flex flex-col items-center">
                <Trash2 size={48} className="mb-4 opacity-20"/>
                {searchTerm ? "No results found" : "Recycle bin is empty"}
            </div>
        ) : (
            <>
                {viewMode === 'list' ? (
                  <FileListView 
                    items={filteredItems}
                    selectedIds={selectedIds}
                    onSelect={handleSelection}
                    onContextMenu={handleContextMenu}
                    onDoubleClick={() => {}} 
                    isRecycleBin={true}
                    onRestore={(item) => confirmAction('restore', item.id)}
                    onDelete={(item) => confirmAction('forceDelete', item.id)}
                  />
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
                    {filteredItems.map(item => (
                      <FileCard 
                        key={item.id}
                        item={item}
                        isRecycleBin={true}
                        selected={selectedIds.has(item.id)}
                        onSelect={(multi) => handleSelection(item.id, multi)}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        onDoubleClick={() => {}}
                      />
                    ))}
                  </div>
                )}
            </>
        )}
      </div>

      {/* 3. Context Menu */}
      <FileContextMenu 
        contextMenu={contextMenu} 
        onClose={() => setContextMenu(null)}
        onAction={(action, payload) => confirmAction(action, payload?.id || payload?.item?.id)}
        section="recycle"
      />

      {/* 4. Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        confirmText={modalConfig.confirmText}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
}
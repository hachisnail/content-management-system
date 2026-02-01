import { useState } from "react";
import { FileToolbar } from "../components/file-manager/FileToolbar";
import { FileContextMenu } from "../components/file-manager/FileContextMenu";
import { FilePreviewModal } from "../components/file-manager/FilePreviewModal";
import { FileAccessModal } from "../components/file-manager/FileAccessModal"; // [NEW]
import { FileCard } from "../components/file-manager/FileCard";
import { Folder, Trash2, LayoutGrid, Globe, Lock, Layers, Shield } from "lucide-react";
import { fileApi } from "../../../api/file.api";
import ErrorBoundary from "../../../components/common/ErrorBoundary";
import { useFileManager } from '../hooks/useFileManager';
import { FileListView } from "../components/file-manager/FileListView";
import { PromptModal } from "@repo/ui";

export default function FileManager() {
  const fm = useFileManager();
  const [contextMenu, setContextMenu] = useState(null);
  const [renameItem, setRenameItem] = useState(null);
  const [accessItem, setAccessItem] = useState(null); // [NEW]

  // --- Event Handlers ---

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!fm.selectedIds.has(item.id)) {
      fm.handleSelect(item.id, false, false);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      setContextMenu(null);
      fm.clearSelection();
    } else {
      setContextMenu(null);
    }
  };

  const handleBulkWrapper = (action, val) => {
    if (confirm("Are you sure?")) {
      fm.executeAction(action, { ids: fm.selectedIds, visibility: val });
    }
  };

  const handleMenuAction = async (action, payload) => {
    setContextMenu(null); 

    switch (action) {
      case 'preview':
        fm.setPreviewItem(payload); 
        break;
      case 'details':
        fm.setActiveItem(payload);
        break;
      case 'rename':
        setRenameItem(payload);
        break;
      case 'access': // [NEW] Open Access Modal
        setAccessItem(payload);
        break;
      case 'visibility':
        fm.executeAction('visibility', { ids: new Set([payload.item.id]), visibility: payload.val });
        break;
      case 'delete':
        if(confirm("Delete item?")) fm.executeAction('delete', { ids: new Set([payload.id]) });
        break;
      case 'restore':
        fm.executeAction('restore', { ids: new Set([payload.id]) });
        break;
      case 'forceDelete':
        if(confirm("Permanently delete?")) fm.executeAction('forceDelete', { ids: new Set([payload.id]) });
        break;
    }
  };
  
  const handleRename = (newName) => {
    fm.executeAction('rename', { id: renameItem.id, newName: newName });
    setRenameItem(null);
  };
  
  // [NEW] Handle Access Update
  const handleAccessUpdate = (id, newRoles) => {
    fm.executeAction('access', { id, allowedRoles: newRoles });
  };

  const handleDoubleClick = (item) => {
    fm.setPreviewItem(item);
  };

  return (
    <div className="card bg-base-100 shadow-xl border border-base-200 h-[calc(100vh-6rem)] flex flex-row overflow-hidden relative select-none">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 border-r border-base-200 bg-base-200/30 hidden md:flex flex-col shrink-0">
        <div className="p-4 font-bold text-lg flex items-center gap-2 text-primary">
          <Folder className="w-5 h-5" /> File Manager
        </div>
        <ul className="menu w-full p-2 gap-1 overflow-y-auto flex-1">
          <li>
            <button onClick={() => fm.setSection("library")} className={fm.section === "library" ? "active" : ""}>
              <LayoutGrid size={16}/> Library
            </button>
          </li>
          
          {fm.section === "library" && (
            <>
              <div className="divider my-1 text-xs opacity-50 font-bold">FILTERS</div>
              <li><button onClick={() => fm.setFilters({ visibility: "public" })}><Globe size={16} /> Public</button></li>
              <li><button onClick={() => fm.setFilters({ visibility: "private" })}><Lock size={16} /> Private</button></li>
            </>
          )}

          <div className="mt-auto">
            <div className="divider my-1"></div>
            <li>
              <button onClick={() => fm.setSection("recycle")} className={`text-error ${fm.section === "recycle" ? "active bg-error/10 text-error" : ""}`}>
                <Trash2 size={16}/> Recycle Bin
              </button>
            </li>
          </div>
        </ul>
      </aside>

      {/* 2. MAIN CONTENT */}
      <ErrorBoundary message="The file manager has encountered a problem. Please refresh the page.">
      <main 
        className="flex-1 flex flex-col min-w-0 bg-base-100 relative" 
        onClick={handleBackgroundClick}
      >
        <FileToolbar 
          state={fm}
          onSearch={fm.setSearchTerm}
          onViewChange={fm.setViewMode}
          onGroupChange={fm.setGroupBy}
          onClearSelection={fm.clearSelection}
          onBulkAction={handleBulkWrapper}
        />

        <div 
          className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-base-50/50"
          onClick={handleBackgroundClick}
        >
          {fm.loading ? (
             <div className="flex justify-center items-center h-full"><span className="loading loading-spinner loading-lg text-primary"></span></div>
          ) : (
            Object.entries(fm.groupedItems).map(([groupName, items]) => (
              <div key={groupName} className="mb-8 animate-in fade-in duration-300">
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="badge badge-neutral badge-sm font-bold rounded-md">{items.length}</div>
                  <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                    {groupName === "Uncategorized" ? <Folder size={14}/> : <Layers size={14}/>}
                    {groupName}
                  </h3>
                  <div className="h-px bg-base-300 flex-1 ml-2"></div>
                </div>

                {/* CONDITIONAL RENDER: LIST vs GRID */}
                {fm.viewMode === 'list' ? (
                  <FileListView 
                    items={items}
                    selectedIds={fm.selectedIds}
                    onSelect={(id, multi) => fm.handleSelect(id, multi, true)}
                    onContextMenu={handleContextMenu}
                    onDoubleClick={handleDoubleClick} 
                    isRecycleBin={fm.section === 'recycle'}
                    onRestore={(item) => fm.executeAction('restore', { ids: new Set([item.id]) })}
                    onDelete={(item) => fm.executeAction('forceDelete', { ids: new Set([item.id]) })}
                  />
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
                    {items.map(item => (
                      <FileCard 
                        key={item.id}
                        item={item}
                        isRecycleBin={fm.section === 'recycle'}
                        selected={fm.selectedIds.has(item.id)}
                        onSelect={(multi) => fm.handleSelect(item.id, multi, true)}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        onDoubleClick={() => handleDoubleClick(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
      </ErrorBoundary>

      {/* 3. DETAILS SIDEBAR (Enhanced) */}
      {fm.activeItem && fm.section === 'library' && (
         <div className="w-80 border-l border-base-200 bg-base-100 p-6 shadow-xl z-20 flex flex-col h-full animate-in slide-in-from-right duration-200 shrink-0">
            <h3 className="font-bold text-lg mb-4 flex justify-between items-center">
              Details
              <button onClick={() => fm.setActiveItem(null)} className="btn btn-sm btn-circle btn-ghost"><Layers size={14}/></button>
            </h3>
            
            <div className="flex-1 space-y-4 overflow-y-auto">
               {/* Preview */}
               {fm.activeItem.mimetype?.startsWith('image/') && (
                 <div className="rounded-lg overflow-hidden border border-base-200 bg-base-200/50 aspect-video flex items-center justify-center relative group cursor-pointer"
                      onClick={() => fm.setPreviewItem(fm.activeItem)}>
                    <img src={fileApi.getUrl(fm.activeItem.id, fm.activeItem.visibility === 'private')} className="w-full h-full object-contain" />
                 </div>
               )}

               {/* Access Badge */}
               <div className="p-3 bg-base-200 rounded-lg flex items-center gap-3">
                   {fm.activeItem.visibility === 'public' ? <Globe className="text-info" size={20}/> : 
                    (fm.activeItem.allowedRoles?.length > 0 ? <Shield className="text-primary" size={20}/> : <Lock className="text-warning" size={20}/>)
                   }
                   <div>
                       <div className="text-xs font-bold opacity-50 uppercase">Access Level</div>
                       <div className="font-bold text-sm">
                          {fm.activeItem.visibility === 'public' ? 'Public' : 
                           (fm.activeItem.allowedRoles?.length > 0 ? 'Restricted to Role' : 'Private (Owner Only)')}
                       </div>
                   </div>
               </div>

               <div className="text-sm space-y-3">
                  <div><div className="text-xs opacity-50 uppercase font-bold">Name</div>{fm.activeItem.originalName}</div>
                  <div className="grid grid-cols-2 gap-2">
                     <div><div className="text-xs opacity-50 uppercase font-bold">Size</div>{(fm.activeItem.size/1024).toFixed(1)} KB</div>
                     <div><div className="text-xs opacity-50 uppercase font-bold">Type</div>{fm.activeItem.mimetype}</div>
                  </div>
               </div>
               
               <button onClick={() => setAccessItem(fm.activeItem)} className="btn btn-sm btn-outline btn-primary w-full">
                  <Shield size={14}/> Manage Access
               </button>
            </div>
         </div>
      )}

      {/* 4. MODALS */}
      <FileContextMenu 
        contextMenu={contextMenu} 
        onClose={() => setContextMenu(null)}
        onAction={handleMenuAction}
        section={fm.section}
      />
      <FilePreviewModal 
        file={fm.previewItem} 
        isOpen={!!fm.previewItem} 
        onClose={() => fm.setPreviewItem(null)} 
      />
      <PromptModal
        isOpen={!!renameItem}
        onClose={() => setRenameItem(null)}
        onSubmit={handleRename}
        title="Rename File"
        label="Enter the new file name"
        initialValue={renameItem?.originalName || ''}
        submitText="Rename"
      />
      <FileAccessModal
        isOpen={!!accessItem}
        onClose={() => setAccessItem(null)}
        file={accessItem}
        onSave={handleAccessUpdate}
      />
    </div>
  );
}
import React from 'react';
import { LayoutGrid, List, Search, Layers, X, Globe, Lock, Trash2, RefreshCw } from 'lucide-react';

export const FileToolbar = ({ 
  state, 
  onSearch, 
  onViewChange, 
  onGroupChange,
  onClearSelection,
  onBulkAction 
}) => {
  const { selectedIds = new Set(), searchTerm, section, viewMode, groupBy } = state || {};
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="navbar min-h-[3.5rem] border-b border-base-200 px-4 gap-2 bg-base-100">
      {hasSelection ? (
        <div className="flex-1 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
             <button onClick={onClearSelection} className="btn btn-sm btn-circle btn-ghost"><X size={18}/></button>
             <span className="font-bold">{selectedIds.size} Selected</span>
          </div>
          <div className="flex items-center gap-2">
            {section === 'library' ? (
              <>
                <button onClick={() => onBulkAction('visibility', 'public')} className="btn btn-sm" title="Public"><Globe size={16}/></button>
                <button onClick={() => onBulkAction('visibility', 'private')} className="btn btn-sm" title="Private"><Lock size={16}/></button>
                <button onClick={() => onBulkAction('delete')} className="btn btn-sm text-error"><Trash2 size={16}/></button>
              </>
            ) : (
              <>
                <button onClick={() => onBulkAction('restore')} className="btn btn-sm btn-success text-white">Restore</button>
                <button onClick={() => onBulkAction('forceDelete')} className="btn btn-sm btn-error text-white">Delete Forever</button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-3 items-center">
           {/* View Toggles */}
           <div className="join border border-base-300">
              <button onClick={() => onViewChange("grid")} className={`join-item btn btn-sm btn-ghost ${viewMode === 'grid' ? 'bg-base-200' : ''}`}><LayoutGrid size={16}/></button>
              <button onClick={() => onViewChange("list")} className={`join-item btn btn-sm btn-ghost ${viewMode === 'list' ? 'bg-base-200' : ''}`}><List size={16}/></button>
           </div>

           {/* Grouping Toggle */}
           <div className="join border border-base-300">
              <button 
                onClick={() => onGroupChange(groupBy === 'none' ? 'type' : 'none')} 
                className={`join-item btn btn-sm btn-ghost gap-2 ${groupBy !== 'none' ? 'bg-primary/10 text-primary' : ''}`}
                title="Group items"
              >
                <Layers size={16}/> 
                <span className="hidden sm:inline">Group</span>
              </button>
           </div>

           <input 
             type="text" 
             placeholder="Search..." 
             value={searchTerm} 
             onChange={(e) => onSearch(e.target.value)} 
             className="input input-sm input-bordered w-full max-w-xs ml-auto" 
           />
        </div>
      )}
    </div>
  );
};
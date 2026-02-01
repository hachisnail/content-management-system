import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, 
  ArrowUp, ArrowDown, Filter, X 
} from 'lucide-react';
import { TableContextMenu } from './TableContextMenu';

export const DataTable = ({ 
  columns, 
  title,
  actions,
  data = [],
  totalCount = 0,
  totalPages = 1,
  isLoading = false,
  isFetching = false,
  params = {}, 
  onParamsChange,
  filterSlot = null,
  hideControls = false, 
  hidePagination = false,
  renderMobileItem 
}) => {
  const [searchTerm, setSearchTerm] = useState(params.search || '');

  useEffect(() => {
    setSearchTerm(params.search || '');
  }, [params.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onParamsChange && searchTerm !== (params.search || '')) {
        onParamsChange({ ...params, search: searchTerm, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, params, onParamsChange]);

  const handleSort = (field) => {
    if (!onParamsChange) return;
    const isAsc = params.sort_by === field && params.sort_dir === 'ASC';
    onParamsChange({ 
      ...params,
      sort_by: field, 
      sort_dir: isAsc ? 'DESC' : 'ASC' 
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (onParamsChange) onParamsChange({ ...params, search: '', page: 1 });
  };

  const renderSortIcon = (field) => {
    if (params.sort_by !== field) return <div className="w-4 h-4" />;
    return params.sort_dir === 'ASC' 
      ? <ArrowUp size={14} className="text-primary" /> 
      : <ArrowDown size={14} className="text-primary" />;
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* --- Toolbar --- */}
      {!hideControls && (
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
             {title && <h2 className="text-2xl font-bold text-base-content tracking-tight">{title}</h2>}
             <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-100' : 'opacity-0'}`}>
               <span className="loading loading-spinner loading-xs text-primary"></span>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {filterSlot}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm w-full pl-9 focus:input-primary transition-all"
              />
              {searchTerm && (
                <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle text-base-content/40">
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Limit Selector - Hidden on very small screens to save space */}
            <select 
              className="select select-bordered select-sm bg-base-100 hidden sm:block" 
              value={params.limit || 10} 
              onChange={(e) => onParamsChange && onParamsChange({ ...params, limit: Number(e.target.value), page: 1 })}
            >
              {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v} / page</option>)}
            </select>
          </div>
        </div>
      )}

      {/* --- Content Area --- */}
      <div className={`bg-base-100 rounded-xl border border-base-300 shadow-sm flex-1 flex flex-col ${hideControls ? 'border-t-0 rounded-t-none' : ''}`}>
        
        {/* DESKTOP VIEW (Table) - Automatically hidden on mobile via CSS */}
        <div className="hidden md:block overflow-x-visible flex-1 min-h-[300px]">
          <table className="table table-lg table-pin-rows table-zebra">
            <thead>
              <tr className="bg-base-200/50 text-base-content font-bold z-10">
                {columns.map((col) => (
                  <th 
                    key={col.key} 
                    className={`
                      ${col.sortable && !hideControls ? 'cursor-pointer hover:text-primary transition-colors select-none' : ''} 
                      font-bold text-xs uppercase tracking-wider
                    `}
                    onClick={() => col.sortable && !hideControls && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.sortable && !hideControls && renderSortIcon(col.key)}
                    </div>
                  </th>
                ))}
                {actions && <th className="w-16 text-right"></th>}
              </tr>
            </thead>
            
            <tbody className={`transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        {columns.map((_, idx) => <td key={idx}><div className="h-4 bg-base-300 rounded w-3/4 opacity-50"></div></td>)}
                        {actions && <td></td>}
                    </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-base-content/40">
                    <div className="flex flex-col items-center gap-2">
                      <Filter size={32} className="opacity-20" />
                      <span>No records found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:!bg-primary/5 transition-colors border-base-200 group">
                    {columns.map((col) => (
                      <td key={`${item.id}-${col.key}`} className="text-sm font-medium">
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                    {actions && (
                      <td className="text-right">
                        <TableContextMenu item={item} actions={actions} />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW (Cards) - Automatically shown on mobile via CSS */}
        <div className="md:hidden flex-1 p-4 space-y-3">
          {isLoading ? (
             [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-base-200 animate-pulse rounded-lg"></div>)
          ) : data.length === 0 ? (
             <div className="text-center py-10 opacity-50">No records found</div>
          ) : (
             data.map((item) => (
                <div key={item.id} className="bg-base-100 border border-base-200 rounded-lg p-4 shadow-sm relative">
                   {/* Render custom mobile view if provided, otherwise fallback to rough key-value dump */}
                   {renderMobileItem ? renderMobileItem(item) : (
                      <div className="space-y-2">
                         {columns.slice(0, 2).map(col => (
                            <div key={col.key} className="flex justify-between">
                               <span className="font-bold text-xs opacity-50 uppercase">{col.label}</span>
                               <span>{col.render ? col.render(item) : item[col.key]}</span>
                            </div>
                         ))}
                      </div>
                   )}
                   {actions && (
                      <div className="absolute top-2 right-2">
                         <TableContextMenu item={item} actions={actions} />
                      </div>
                   )}
                </div>
             ))
          )}
        </div>
        
        {/* Pagination Footer */}
        {!hideControls && !hidePagination && !isLoading && data.length > 0 && (
          <div className="flex items-center justify-between p-3 border-t border-base-300 bg-base-200/50 text-sm">
            <span className="text-base-content/70 font-medium">
              Page {params.page || 1} of {totalPages}
            </span>
            <div className="join shadow-sm">
              <button 
                className="join-item btn btn-sm btn-outline bg-base-100" 
                disabled={params.page === 1}
                onClick={() => onParamsChange && onParamsChange({ ...params, page: (params.page || 1) - 1 })}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="join-item btn btn-sm btn-outline bg-base-100" 
                disabled={params.page === totalPages}
                onClick={() => onParamsChange && onParamsChange({ ...params, page: (params.page || 1) + 1 })}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
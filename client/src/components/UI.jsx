import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Check, AlertCircle, Info, AlertTriangle, 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Search, Filter, Loader2, ArrowUpDown
} from 'lucide-react';

// --- 1. DROPDOWN (New Component for Native Filters) ---
export const Dropdown = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  
  // Generate a unique ID for this specific dropdown instance
  // We use a ref so the ID persists across renders
  const dropdownId = useRef(Math.random().toString(36).substr(2, 9)).current;

  const toggleOpen = (e) => {
    e.stopPropagation(); // Stop click from bubbling to table rows
    
    if (!isOpen) {
      // LOGIC: Dispatch a custom event telling all other dropdowns to close
      document.dispatchEvent(new CustomEvent('ui:dropdown:open', { detail: dropdownId }));

      // Calculate position dynamically
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 4,
          left: align === 'right' ? rect.right : rect.left,
        });
      }
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    // 1. Close when clicking anywhere else
    const handleGlobalClick = () => setIsOpen(false);
    
    // 2. LOGIC: Close this dropdown if we hear another one opening
    const handleOtherOpen = (e) => {
      if (e.detail !== dropdownId) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      window.addEventListener('click', handleGlobalClick);
      // Close on scroll to prevent menu from detaching from button
      window.addEventListener('scroll', handleGlobalClick, true); 
      window.addEventListener('resize', handleGlobalClick);
      // Listen for the exclusive open event
      document.addEventListener('ui:dropdown:open', handleOtherOpen);
    }

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', handleGlobalClick, true);
      window.removeEventListener('resize', handleGlobalClick);
      document.removeEventListener('ui:dropdown:open', handleOtherOpen);
    };
  }, [isOpen, dropdownId]);

  return (
    <>
      <div ref={triggerRef} onClick={toggleOpen} className="inline-block cursor-pointer">
        {trigger}
      </div>
      
      {/* PORTAL: Renders the menu attached to the <body>, not the table */}
      {/* This ensures it floats on top of everything and never gets cut off */}
      {isOpen && createPortal(
        <div 
          className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-zinc-100 animate-in fade-in zoom-in-95 duration-100 min-w-[160px]"
          style={{ 
            top: coords.top, 
            left: coords.left,
            transform: align === 'right' ? 'translateX(-100%)' : 'none'
          }}
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="py-1">
            {children}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const Checkbox = ({ checked, onChange, disabled }) => (
  <input 
    type="checkbox" 
    checked={checked} 
    onChange={onChange} 
    disabled={disabled}
    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black transition-colors cursor-pointer disabled:opacity-50" 
  />
);


export const DataTable = ({ 
  columns, 
  data = [], 
  onSearch, 
  onSort,
  filterSlot, 
  isLoading, 
  searchPlaceholder = "Search...",
  enableMultiSelect = false,
  onSelectionChange, 
  bulkActionSlot,
  serverSidePagination 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [localPage, setLocalPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // NEW: State to keep the search text in the input persistent while typing
  const [searchValue, setSearchValue] = useState("");
  

  // 1. Determine active pagination source
  const itemsPerPage = serverSidePagination?.itemsPerPage || 10;
  const currentPage = serverSidePagination ? serverSidePagination.currentPage : localPage;
  const onPageChange = serverSidePagination ? serverSidePagination.onPageChange : setLocalPage;
  
  // 2. Determine true total items
  const totalItems = serverSidePagination ? serverSidePagination.totalItems : data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    useEffect(() => {
    if (serverSidePagination?.search !== undefined) {
      setSearchValue(serverSidePagination.search);
    }
  }, [serverSidePagination?.search]);

  // 3. Process Data
const paginatedData = useMemo(() => {
    // If server-side is active, skip local manipulation entirely
    if (serverSidePagination) return data;

    let items = [...data];
    if (sortConfig.key) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [data, sortConfig, serverSidePagination, currentPage, itemsPerPage]);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value); // Update UI immediately (no flash)
    onSearch(value);      // Send to parent hook (debounced)
  };

  const handleClearSearch = () => {
    setSearchValue("");
    onSearch("");
  };

const requestSort = (key) => {
    let direction = 'asc';
    let newConfig = { key, direction };
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
        newConfig = { key, direction };
      } else if (sortConfig.direction === 'desc') {
        newConfig = { key: null, direction: 'asc' }; // Reset state
      }
    }
    
    setSortConfig(newConfig);

    // FIX: Trigger the server-side update
    if (onSort) {
      onSort(newConfig.key, newConfig.direction);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(paginatedData.map(row => row.id));
      setSelectedIds(allIds);
      onSelectionChange && onSelectionChange(Array.from(allIds));
    } else {
      setSelectedIds(new Set());
      onSelectionChange && onSelectionChange([]);
    }
  };

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
    onSelectionChange && onSelectionChange(Array.from(newSelected));
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white border border-zinc-200 rounded-lg">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin w-8 h-8 text-zinc-300" />
          <span className="text-sm font-medium">Loading data...</span>
        </div>
      </div>
    );
  }

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(row => selectedIds.has(row.id));

  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden flex flex-col relative">
      
      {/* BULK ACTION BAR */}
      {selectedIds.size > 0 && bulkActionSlot && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-zinc-900 text-white p-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-4 px-2">
            <span className="font-bold text-sm bg-zinc-800 px-2 py-0.5 rounded text-zinc-200">{selectedIds.size} Selected</span>
            <span className="text-xs text-zinc-400 border-l border-zinc-700 pl-4">Select items to perform actions</span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActionSlot}
            <button onClick={() => { setSelectedIds(new Set()); onSelectionChange([]); }} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="p-3 border-b border-zinc-200 flex flex-col sm:flex-row gap-3 justify-between bg-zinc-50/50 items-center">
        <div className="relative w-full sm:w-72">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            <Search size={16} />
          </div>
          
          <input 
            className="w-full pl-9 pr-10 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all placeholder:text-zinc-400"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
          />

          {/* NEW: Clear button that appears only when there is text */}
          {searchValue && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
           {filterSlot}
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
              <span className="text-xs font-medium text-zinc-500 tracking-wide uppercase">Syncing...</span>
            </div>
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs uppercase tracking-wider text-zinc-500 font-semibold backdrop-blur-sm">
              {enableMultiSelect && (
                <th className="p-4 w-[40px] text-center">
                  <Checkbox checked={isAllSelected} onChange={handleSelectAll} />
                </th>
              )}
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`p-4 select-none whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-zinc-100 hover:text-black transition-colors group' : ''}`}
                  onClick={() => col.sortable && requestSort(col.accessor)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <span className={`transition-opacity ${sortConfig.key === col.accessor ? 'opacity-100 text-black' : 'opacity-30 group-hover:opacity-60'}`}>
                        {sortConfig.key === col.accessor ? (
                           sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                           <ArrowUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-zinc-100 bg-white">
            {paginatedData.length > 0 ? paginatedData.map((row, rIdx) => {
              const isSelected = selectedIds.has(row.id);
              return (
                <tr key={row.id || rIdx} className={`group transition-colors ${isSelected ? 'bg-zinc-50' : 'hover:bg-zinc-50'}`}>
                  {enableMultiSelect && (
                    <td className="p-4 w-[40px] text-center">
                      <Checkbox checked={isSelected} onChange={() => handleSelectRow(row.id)} />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="p-4 text-zinc-700 font-medium align-middle">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={columns.length + (enableMultiSelect ? 1 : 0)} className="p-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={32} className="opacity-20" />
                    <p>No records found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      <div className="p-3 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500 bg-white">
         <span className="hidden sm:inline">
           Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
         </span>
         <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button 
              className="px-3 py-1.5 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              disabled={!canGoPrev} 
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <div className="flex items-center px-2 font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <button 
              className="px-3 py-1.5 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              disabled={!canGoNext} 
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
         </div>
      </div>
    </div>
  );
};

// --- 1. CARDS & CONTAINERS ---
export const Card = ({ children, className = "", title, action, footer }) => (
  <div className={`bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col ${className}`}>
    {(title || action) && (
      <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center shrink-0">
        {title && <h3 className="font-semibold text-zinc-900">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6 flex-1">{children}</div>
    {footer && (
      <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 rounded-b-lg shrink-0">
        {footer}
      </div>
    )}
  </div>
);

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon: Icon,
  ...props 
}) => {
  const base = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm border border-transparent",
    secondary: "bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500 border border-gray-300 shadow-sm",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500 border border-red-200",
    ghost: "bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100",
    link: "text-indigo-600 hover:text-indigo-900 hover:underline p-0",
  };

  const sizes = {
    xs: "px-2 py-1 text-xs rounded",
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-md",
    icon: "p-2 rounded-full",
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};

/**
 * Reusable 3-Dots Action Menu
 * Handles opening/closing logic automatically.
 */
export const ActionMenu = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (actions.length === 0) return null;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 focus:outline-none animate-in fade-in zoom-in duration-75">
          <div className="py-1">
            {actions.map((action, index) => {
              // Skip if hidden
              if (action.show === false) return null;
              
              return (
                <button
                  key={index}
                  onClick={(e) => {
                     e.stopPropagation();
                     setIsOpen(false); // CRITICAL: Close menu immediately before action
                     action.onClick();
                  }}
                  disabled={action.disabled}
                  className={`
                    group flex w-full items-center px-4 py-2 text-sm text-left
                    ${action.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {action.icon && <span className="mr-3 opacity-70 group-hover:opacity-100">{action.icon}</span>}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
// --- 3. INPUTS & SELECTS ---
export const Input = ({ label, icon: Icon, error, className = "", ...props }) => (
  <div className={`w-full ${className}`}>
    {label && <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-1.5">{label}</label>}
    <div className={`relative group transition-all duration-200 rounded-lg border ${error ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50 focus-within:bg-white focus-within:border-zinc-400 focus-within:shadow-sm"}`}>
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-800 pointer-events-none">
          <Icon size={16} />
        </div>
      )}
      <input 
        className={`w-full bg-transparent border-none p-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-0 ${Icon ? "pl-10" : ""}`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
  </div>
);

export const Select = ({ label, options = [], error, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-1.5">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full appearance-none bg-zinc-50 border ${error ? "border-red-300" : "border-zinc-200"} text-zinc-900 text-sm rounded-lg focus:ring-zinc-500 focus:border-zinc-500 block p-2.5 pr-8`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-zinc-500">
        <ChevronDown size={16} />
      </div>
    </div>
  </div>
);

// --- 4. BADGES ---
export const Badge = ({ children, variant = 'neutral', className = "" }) => {
  const styles = {
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dark: "bg-black text-white border-black"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// --- 5. ALERTS ---
export const Alert = ({ type = 'info', title, message, onClose, className = "" }) => {
  const styles = {
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: Check },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: AlertCircle },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: AlertTriangle },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: Info }
  };
  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`flex items-start p-4 rounded-lg border ${style.bg} ${style.border} ${className}`}>
      <Icon className={`w-5 h-5 ${style.text} mt-0.5 shrink-0`} />
      <div className={`ml-3 flex-1 ${style.text}`}>
        {title && <h3 className="text-sm font-semibold">{title}</h3>}
        {message && <div className="text-sm mt-1 opacity-90">{message}</div>}
      </div>
      {onClose && (
        <button onClick={onClose} className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-md hover:bg-black/5 ${style.text}`}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};


// --- 7. MODALS (Generic & Specific) ---
export const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  // Size configurations
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] h-[90vh]"
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${sizes[size]} flex flex-col max-h-[90vh] overflow-hidden border border-zinc-200 animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 shrink-0">
           <h3 className="font-bold text-lg text-zinc-900">{title}</h3>
           <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors">
             <X size={20} />
           </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
        {footer && (
          <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-100 flex justify-end gap-3 shrink-0">
             {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// A Pre-built Confirmation Modal
export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirm", isDangerous = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col items-center text-center p-2">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDangerous ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-600"}`}>
        <AlertTriangle size={24} />
      </div>
      <p className="text-zinc-600 mb-6">{message}</p>
      <div className="flex gap-3 w-full">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant={isDangerous ? "danger" : "primary"} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  </Modal>
);
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  AlertCircle,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  ArrowUpDown,
  MoreVertical,
  // --- NEW ICONS FOR FILE SYSTEM ---
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Paperclip,
  UploadCloud,
  File,
  ExternalLink
} from "lucide-react";
import api from "../api";
import { useFileUpload } from "../hooks/useFileUpload"; // Ensure this path matches your structure
import { useConfig } from "../context/ConfigContext";

export const ResourceIcon = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case 'users': return <User className={className} />;
    case 'files': return <FileText className={className} />;
    case 'test_items': return <Box className={className} />;
    default: return <Box className={className} />;
  }
};

export const PageHeader = ({ title, description, icon: Icon, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
          {Icon && <Icon className="text-indigo-600" size={24} />}
          {title}
        </h1>
        {description && (
          <p className="text-zinc-500 text-sm mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

// --- 1. DROPDOWN (Existing) ---
export const Dropdown = ({
  trigger,
  children,
  align = "right",
  matchWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({});
  const [placement, setPlacement] = useState("bottom");
  const triggerRef = useRef(null);

  const dropdownId = useRef(Math.random().toString(36).substr(2, 9)).current;

  const toggleOpen = (e) => {
    e.stopPropagation();

    if (!isOpen) {
      document.dispatchEvent(
        new CustomEvent("ui:dropdown:open", { detail: dropdownId })
      );

      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const menuHeightEstimate = 220;

        const shouldOpenUp =
          align === "top" ||
          (spaceBelow < menuHeightEstimate && rect.top > spaceBelow);

        const newCoords = {
          left: rect.left,
          width: matchWidth ? rect.width : "auto",
        };

        let transform = "none";
        if (align === "right") {
          newCoords.left = rect.right;
          transform = "translateX(-100%)";
        }

        newCoords.transform = transform;

        if (shouldOpenUp) {
          newCoords.bottom = viewportHeight - rect.top + 6;
          setPlacement("top");
        } else {
          newCoords.top = rect.bottom + 6;
          setPlacement("bottom");
        }

        setCoords(newCoords);
      }
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleGlobalClick = () => setIsOpen(false);
    const handleOtherOpen = (e) => {
      if (e.detail !== dropdownId) setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener("click", handleGlobalClick);
      window.addEventListener("scroll", handleGlobalClick, true);
      window.addEventListener("resize", handleGlobalClick);
      document.addEventListener("ui:dropdown:open", handleOtherOpen);
    }

    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("scroll", handleGlobalClick, true);
      window.removeEventListener("resize", handleGlobalClick);
      document.removeEventListener("ui:dropdown:open", handleOtherOpen);
    };
  }, [isOpen, dropdownId]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleOpen}
        className="block w-full cursor-pointer relative"
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            className={`fixed z-[9999] bg-white rounded-xl shadow-xl border border-zinc-100 min-w-[160px] 
              ${
                placement === "top"
                  ? "origin-bottom animate-in slide-in-from-bottom-2"
                  : "origin-top animate-in slide-in-from-top-2"
              } 
              fade-in zoom-in-95 duration-100`}
            style={{
              top: coords.top,
              bottom: coords.bottom,
              left: coords.left,
              width: coords.width,
              transform: coords.transform,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {typeof children === "function"
                ? children({ close: () => setIsOpen(false) })
                : children}
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
  serverSidePagination,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [localPage, setLocalPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchValue, setSearchValue] = useState("");

  const [cachedData, setCachedData] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      setCachedData(data);
    }
  }, [data]);

  const activeData = useMemo(() => {
    if (data && data.length > 0) return data;
    if (isLoading && cachedData.length > 0) return cachedData;
    return [];
  }, [data, isLoading, cachedData]);

  const itemsPerPage = serverSidePagination?.itemsPerPage || 10;
  const currentPage = serverSidePagination
    ? serverSidePagination.currentPage
    : localPage;
  const onPageChange = serverSidePagination
    ? serverSidePagination.onPageChange
    : setLocalPage;

  const totalItems = serverSidePagination
    ? serverSidePagination.totalItems
    : activeData.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const [isJumping, setIsJumping] = useState(false);
  const [jumpValue, setJumpValue] = useState("");

  useEffect(() => {
    if (serverSidePagination?.search !== undefined) {
      setSearchValue(serverSidePagination.search);
    }
  }, [serverSidePagination?.search]);

  const paginatedData = useMemo(() => {
    if (serverSidePagination) return activeData;

    let items = [...activeData];
    if (sortConfig.key) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [activeData, sortConfig, serverSidePagination, currentPage, itemsPerPage]);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    onSearch("");
  };

  const requestSort = (key) => {
    let direction = "asc";
    let newConfig = { key, direction };

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
        newConfig = { key, direction };
      } else if (sortConfig.direction === "desc") {
        newConfig = { key: null, direction: "asc" };
      }
    }

    setSortConfig(newConfig);
    if (onSort) {
      onSort(newConfig.key, newConfig.direction);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(paginatedData.map((row) => row.id));
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

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const targetPage = parseInt(jumpValue);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      onPageChange(targetPage);
    }
    setIsJumping(false);
    setJumpValue("");
  };

  const isOnlyOnePage = totalPages <= 1;

  const showFullLoader = isLoading && (!activeData || activeData.length === 0);

  if (showFullLoader) {
    return (
      <div className="min-h-100 flex items-center justify-center bg-white border border-zinc-200 rounded-lg">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin w-8 h-8 text-zinc-300" />
          <span className="text-sm font-medium">Loading data...</span>
        </div>
      </div>
    );
  }

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.has(row.id));

  return (
    <div
      className={`bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden flex flex-col relative transition-opacity duration-300 ${
        isLoading ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {selectedIds.size > 0 && bulkActionSlot && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-zinc-900 text-white p-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-4 px-2">
            <span className="font-bold text-sm bg-zinc-800 px-2 py-0.5 rounded text-zinc-200">
              {selectedIds.size} Selected
            </span>
            <span className="text-xs text-zinc-400 border-l border-zinc-700 pl-4">
              Select items to perform actions
            </span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActionSlot}
            <button
              onClick={() => {
                setSelectedIds(new Set());
                onSelectionChange([]);
              }}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
            >
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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs uppercase tracking-wider text-zinc-500 font-semibold backdrop-blur-sm">
              {enableMultiSelect && (
                <th className="p-4 w-[40px] text-center">
                  <Checkbox
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`p-4 select-none whitespace-nowrap transition-all duration-200 ${
                    col.sortable
                      ? "cursor-pointer hover:bg-zinc-100 hover:text-indigo-600 group"
                      : ""
                  }`}
                  onClick={() => col.sortable && requestSort(col.accessor)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <span
                        className={`transition-all duration-300 transform ${
                          sortConfig.key === col.accessor
                            ? "opacity-100 text-indigo-600 scale-110"
                            : "opacity-30 group-hover:opacity-100 group-hover:scale-105"
                        }`}
                      >
                        {sortConfig.key === col.accessor ? (
                          sortConfig.direction === "asc" ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
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
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => {
                const isSelected = selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id || rIdx}
                    className={`group transition-all duration-200 ease-in-out border-l-2 ${
                      isSelected
                        ? "bg-indigo-50/30 border-indigo-500"
                        : "hover:bg-zinc-50/80 border-transparent hover:border-zinc-300"
                    }`}
                  >
                    {enableMultiSelect && (
                      <td className="p-4 w-[40px] text-center">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectRow(row.id)}
                        />
                      </td>
                    )}
                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className="p-4 text-zinc-700 font-medium align-middle"
                      >
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (enableMultiSelect ? 1 : 0)}
                  className="p-12 text-center text-zinc-400"
                >
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

      <div className="p-3 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500 bg-white">
        <span className="hidden sm:inline">
          Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}{" "}
          - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </span>

        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end items-center">
          <button
            className="px-3 py-1.5 select-none border border-zinc-200 rounded-md hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent flex items-center gap-1 transition-all active:scale-95"
            disabled={!canGoPrev || isOnlyOnePage}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft size={14} /> Prev
          </button>

          <div className="relative flex items-center justify-center min-w-[110px] h-8">
            {!isJumping ? (
              <button
                onClick={() => {
                  if (isOnlyOnePage) return;
                  setJumpValue(currentPage.toString());
                  setIsJumping(true);
                }}
                className={`px-3 py-1 font-medium rounded-md border border-transparent transition-all whitespace-nowrap ${
                  isOnlyOnePage
                    ? "text-zinc-300 cursor-not-allowed"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-200"
                }`}
                title={isOnlyOnePage ? "" : "Click to jump to page"}
                disabled={isOnlyOnePage}
              >
                Page {currentPage} of {totalPages}
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10 px-1">
                <form onSubmit={handleJumpSubmit} className="w-full">
                  <input
                    autoFocus
                    type="number"
                    className="w-full h-7 px-2 border border-indigo-500 rounded text-center text-zinc-900 focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm"
                    value={jumpValue}
                    onChange={(e) => setJumpValue(e.target.value)}
                    onBlur={() => setIsJumping(false)}
                    onKeyDown={(e) => e.key === "Escape" && setIsJumping(false)}
                    placeholder="#"
                  />
                </form>
              </div>
            )}
          </div>

          <button
            className="px-3 py-1.5 border select-none border-zinc-200 rounded-md hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent flex items-center gap-1 transition-all active:scale-95"
            disabled={!canGoNext || isOnlyOnePage}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- CARDS & BUTTONS ---
export const Card = ({ children, className = "", title, action, footer }) => (
  <div
    className={`bg-white border border-zinc-200 rounded-lg shadow-sm flex flex-col ${className}`}
  >
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
  variant = "primary",
  size = "md",
  className = "",
  icon: Icon,
  isLoading,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200/50 focus:ring-indigo-500 border border-transparent",
    secondary:
      "bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-400 focus:ring-indigo-500 border border-zinc-300 shadow-sm",
    danger:
      "bg-red-50 text-red-700 hover:bg-red-600 hover:text-white focus:ring-red-500 border border-red-200 hover:shadow-lg hover:shadow-red-200/50",
    ghost:
      "bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent",
    link: "text-indigo-600 hover:text-indigo-800 hover:underline p-0 underline-offset-4",
  };

  const sizes = {
    xs: "px-2 py-1 text-xs rounded",
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-md",
    lg: "px-6 py-3 text-base rounded-lg",
    icon: "p-2 rounded-full",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
      ) : (
        Icon && (
          <Icon
            className={`${
              children ? "mr-2" : ""
            } h-4 w-4 transition-transform group-hover:scale-110`}
          />
        )
      )}
      {children}
    </button>
  );
};

export const Input = ({
  label,
  icon: Icon,
  error,
  className = "",
  ...props
}) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-1.5 ml-1">
        {label}
      </label>
    )}
    <div
      className={`relative group transition-all duration-300 rounded-lg border ${
        error
          ? "border-red-300 bg-red-50"
          : "border-zinc-200 bg-zinc-50 focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:shadow-sm"
      }`}
    >
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
          <Icon size={16} />
        </div>
      )}
      <input
        className={`w-full bg-transparent border-none p-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:ring-0 ${
          Icon ? "pl-10" : ""
        }`}
        {...props}
      />
    </div>
  </div>
);

export const ActionMenu = ({ actions = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
              if (action.show === false) return null;

              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    action.onClick();
                  }}
                  disabled={action.disabled}
                  className={`
                    group flex w-full items-center px-4 py-2 text-sm text-left
                    ${
                      action.variant === "danger"
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {action.icon && (
                    <span className="mr-3 opacity-70 group-hover:opacity-100">
                      {action.icon}
                    </span>
                  )}
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

export const Select = ({ label, options = [], error, ...props }) => (
  <div className="w-full">
    {label && (
      <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        className={`w-full appearance-none bg-zinc-50 border ${
          error ? "border-red-300" : "border-zinc-200"
        } text-zinc-900 text-sm rounded-lg focus:ring-zinc-500 focus:border-zinc-500 block p-2.5 pr-8`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-zinc-500">
        <ChevronDown size={16} />
      </div>
    </div>
  </div>
);

export const Badge = ({ children, variant = "neutral", className = "" }) => {
  const styles = {
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dark: "bg-black text-white border-black",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const Alert = ({
  type = "info",
  title,
  message,
  onClose,
  className = "",
}) => {
  const styles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: Check,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: AlertCircle,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: Info,
    },
  };
  const style = styles[type];
  const Icon = style.icon;

  return (
    <div
      className={`flex items-start p-4 rounded-lg border ${style.bg} ${style.border} ${className}`}
    >
      <Icon className={`w-5 h-5 ${style.text} mt-0.5 shrink-0`} />
      <div className={`ml-3 flex-1 ${style.text}`}>
        {title && <h3 className="text-sm font-semibold">{title}</h3>}
        {message && <div className="text-sm mt-1 opacity-90">{message}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-md hover:bg-black/5 ${style.text}`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] h-[90vh]",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full ${sizes[size]} flex flex-col max-h-[90vh] overflow-hidden border border-zinc-200 animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 shrink-0">
          <h3 className="font-bold text-lg text-zinc-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-100 flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  isDangerous = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col items-center text-center p-2">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          isDangerous ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-600"
        }`}
      >
        <AlertTriangle size={24} />
      </div>
      <p className="text-zinc-600 mb-6">{message}</p>
      <div className="flex gap-3 w-full">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={isDangerous ? "danger" : "primary"}
          className="flex-1"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);

export const Avatar = ({ user, size = "md", className = "" }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-32 h-32 text-4xl",
  };

  const imageUrl = user?.profilePicture?.id
    ? api.getFileUrl(user.profilePicture.id)
    : null;

  const getInitials = () => {
    if (!user) return "?";

    if (user.firstName) {
      return `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase();
    }

    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return "?";
  };

  return (
    <div
      className={`relative inline-block rounded-full overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center font-bold text-zinc-500 bg-zinc-100 select-none">
          {getInitials()}
        </div>
      )}
    </div>
  );
};

// --- NEW COMPONENTS FOR FILE SYSTEM ---

export const FileCard = ({ file, onDelete }) => {
  const isImage = file.mimeType?.startsWith("image/");
  // Assuming your API is at /api, adjust if needed
  const fileUrl = `/api/files/${file.id}`; 

  return (
    <div className="group relative bg-white border border-zinc-200 rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-zinc-300">
      <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden flex items-center justify-center">
        {isImage ? (
          <img
            src={fileUrl}
            alt={file.originalName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="text-zinc-400">
            <FileText size={48} strokeWidth={1} />
          </div>
        )}

        {/* ACTIONS OVERLAY */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white rounded-full text-zinc-900 hover:bg-zinc-100 transition-colors shadow-lg"
            title="Download / View"
          >
            {isImage ? <ExternalLink size={16} /> : <Download size={16} />}
          </a>
          
          {onDelete && (
            <button
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                onDelete(file); 
              }}
              className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-lg"
              title="Remove File"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate" title={file.originalName}>
              {file.originalName}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {(file.size / 1024).toFixed(0)} KB • {new Date(file.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CategorizedFileViewer = ({ files = [], className = "", onDelete }) => {
  if (!files || (Array.isArray(files) && files.length === 0)) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
        <p className="text-zinc-400 text-sm">No files attached yet.</p>
      </div>
    );
  }

  // Handle both array input and pre-grouped object input
  let grouped = {};
  if (Array.isArray(files)) {
    grouped = { general: files };
  } else {
    grouped = files;
  }

  const categories = Object.keys(grouped).filter(cat => grouped[cat] && grouped[cat].length > 0);

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
        <p className="text-zinc-400 text-sm">No files attached yet.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {categories.map((cat) => (
        <div key={cat}>
          <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 pl-1">
            {cat.replace(/_/g, " ")} <span className="text-zinc-300 font-normal ml-1">({grouped[cat].length})</span>
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {grouped[cat].map((file) => (
              <FileCard 
                key={file.id} 
                file={file} 
                onDelete={onDelete} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const FileUploadWidget = ({
  relatedType,
  relatedId,
  onSuccess,
  className = "",
}) => {
  const { upload, uploading, error } = useFileUpload();
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState("general");

  // 1. Get Limits
  const { FILE_LIMITS } = useConfig();

  // 2. Determine Max Size based on the 'relatedType' of this widget instance
  const maxSize = useMemo(() => {
    if (!FILE_LIMITS) return 25 * 1024 * 1024; // Safe default 25MB

    // Specific Limit? (e.g. 'audit_logs')
    if (FILE_LIMITS[relatedType]) return FILE_LIMITS[relatedType];

    // Default Document Limit
    return FILE_LIMITS.DOCUMENTS || 20 * 1024 * 1024;
  }, [FILE_LIMITS, relatedType]);

  const CATEGORIES = [
    { value: "general", label: "General" },
    { value: "contracts", label: "Contracts & Legal" },
    { value: "invoices", label: "Invoices & Receipts" },
    { value: "gallery", label: "Gallery Images" },
    { value: "reports", label: "Reports" },
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await upload(
        selectedFile,
        {
          relatedType,
          relatedId,
          category,
        },
        {
          maxSize: maxSize, // <--- Pass the calculated limit
        }
      );

      setSelectedFile(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      // Error handled by hook
    }
  };

  // Helper text for the UI
  const limitLabel = (maxSize / (1024 * 1024)).toFixed(0);

  return (
    <div
      className={`bg-zinc-50 border border-zinc-200 rounded-lg p-4 ${className}`}
    >
      <h4 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
        <UploadCloud size={16} /> Upload Attachment
      </h4>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => {}}
          className="mb-3"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
            File{" "}
            <span className="text-zinc-400 font-normal normal-case">
              (Max {limitLabel}MB)
            </span>
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            label="Category"
            options={CATEGORIES}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          isLoading={uploading}
        >
          Upload
        </Button>
      </div>
    </div>
  );
};

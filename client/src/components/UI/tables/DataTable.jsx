import { useState, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight, X, Search } from "lucide-react";
import { Loader2 } from "lucide-react"; 
import Checkbox from "../forms/Checkbox";

const DataTable = ({
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

export default DataTable;
import { useState, useEffect, useMemo } from 'react';

// src/hooks/useTableControls.jsx
export const useTableControls = ({ defaultLimit = 10 } = {}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({});
  
  // NEW: Manage sort state locally in the hook
const [sort, setSort] = useState({ sortBy: 'createdAt', sortDir: 'DESC' });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); 
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // NEW: Handler to be called by the DataTable header clicks
  const handleSortChange = (key, direction) => {
    setSort({ sortBy: key, sortDir: direction });
    setPage(1); // Reset to page 1 to see the new top results
  };

  const queryParams = useMemo(() => ({
    page,
    limit,
    search: debouncedSearch,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
    ...filters
  }), [page, limit, debouncedSearch, filters, sort]);

  return {
    page, setPage,
    limit, setLimit,
    search, setSearch,
    filters, handleFilterChange,
    handleSortChange, // Return this for the UI
    queryParams,
  };
};
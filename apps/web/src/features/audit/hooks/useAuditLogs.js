import { useState, useMemo } from 'react';
import { useResource } from '../../../hooks/useResource';

export const useAuditLogs = () => {
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    sort_by: 'createdAt',
    sort_dir: 'DESC',
    action: '',
    resource: ''
  });

  // [FIX] Filter out empty strings/nulls so we don't send ?action=&resource= to API
  const activeParams = useMemo(() => {
    return Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '' && value !== null)
    );
  }, [params]);

  // Use activeParams for the API call
  const { 
    items, 
    meta, 
    loading, 
    isFetching, 
    refresh 
  } = useResource('audit-logs', activeParams,  { socketResource: 'audit_logs' });



  const updateParams = (newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  return {
    logs: items || [],
    meta: meta || { totalItems: 0, totalPages: 1 },
    loading,
    isFetching,
    params,
    updateParams,
    refresh
  };
};
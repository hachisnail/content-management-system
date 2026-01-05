import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import socket from '../socket';

/**
 * A flexible, real-time hook for fetching and subscribing to resources.
 * Supports server-side pagination, filtering, and multiple update strategies.
 */
function useRealtimeResource(resourceName, { 
  id = null, 
  isEnabled = true, 
  queryParams = {},
  filterFn = null,
  updateStrategy = 'refetch',
  onUpdate = null,
} = {}) {
  
  const [data, setData] = useState(id ? null : []);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const queryString = JSON.stringify(queryParams);

  const propsRef = useRef({ filterFn, queryParams, onUpdate, id, updateStrategy });
  useEffect(() => {
    propsRef.current = { filterFn, queryParams, onUpdate, id, updateStrategy };
  });

  const fetchData = useCallback(async (isMountedRef) => {
    if (!isEnabled) {
      if (isMountedRef.current) setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const endpoint = id ? `/${resourceName}/${id}` : `/${resourceName}`;
      const response = await api.get(endpoint, { params: queryParams });
      
      if (isMountedRef.current) {
        const payload = response;
        if (id) {
          setData(payload); 
          setMeta(null);
        } else {
          if (payload && payload.data && Array.isArray(payload.data)) {
             setData(payload.data);
             setMeta(payload.meta || null);
          } else if (payload && payload.rows) {
             setData(payload.rows);
             setMeta(prev => ({ ...prev, totalItems: payload.count }));
          } else if (Array.isArray(payload)) {
             setData(payload);
             setMeta(null);
          } else {
             setData([]); 
             setMeta(null);
          }
        }
      }
    } catch (err) {
      if (isMountedRef.current) setError(err.message || 'Failed to load data');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [resourceName, id, isEnabled, queryString]);

  const handleCreated = useCallback((newItem) => {
    const { filterFn, queryParams, updateStrategy } = propsRef.current;
    if (filterFn && !filterFn(newItem)) return;

    if (updateStrategy === 'manual' && (queryParams.page === 1 || !queryParams.page)) {
      setData(prev => [newItem, ...prev.filter(item => item.id !== newItem.id)]);
      setMeta(prev => prev ? { ...prev, totalItems: prev.totalItems + 1 } : prev);
    } else {
      fetchData({ current: true });
    }
  }, [fetchData]);

  const handleUpdated = useCallback((updatedItem) => {
    const { filterFn, onUpdate, updateStrategy, id } = propsRef.current;
    
    if (updateStrategy === 'refetch') {
      fetchData({ current: true });
      return;
    }
    
    // Manual strategy
    const passesFilter = !filterFn || filterFn(updatedItem);

    if (id) { // Singleton mode
      if (String(id) === String(updatedItem.id)) {
        setData(prev => ({ ...prev, ...updatedItem }));
      }
    } else { // List mode
      let shouldRefetch = false;
      setData(prevData => {
        const itemIndex = prevData.findIndex(item => item.id === updatedItem.id);

        if (itemIndex !== -1 && passesFilter) {
          const newData = [...prevData];
          newData[itemIndex] = { ...newData[itemIndex], ...updatedItem };
          return newData;
        } 
        else if (itemIndex !== -1 && !passesFilter) {
          setMeta(prev => prev ? { ...prev, totalItems: Math.max(0, prev.totalItems - 1) } : prev);
          return prevData.filter(item => item.id !== updatedItem.id);
        }
        else if (itemIndex === -1 && passesFilter) {
          shouldRefetch = true;
          return prevData;
        }
        return prevData;
      });

      if (shouldRefetch) {
        fetchData({ current: true });
      }
    }
    onUpdate?.(updatedItem);
  }, [fetchData]);

  const handleDeleted = useCallback((deletedItemOrId) => {
    const { updateStrategy } = propsRef.current;
    const idToDelete = deletedItemOrId.id || deletedItemOrId;
    
    if (updateStrategy === 'manual') {
      setData(prev => prev.filter(item => item.id !== idToDelete));
      setMeta(prev => prev ? { ...prev, totalItems: Math.max(0, prev.totalItems - 1) } : prev);
    } else {
      fetchData({ current: true });
    }
  }, [fetchData]);

  useEffect(() => {
    const isMounted = { current: true };
    fetchData(isMounted);

    const handleSubscribe = () => socket.emit('subscribe_resource', resourceName);

    socket.on('connect', handleSubscribe);
    if (socket.connected) handleSubscribe();
    
    socket.on(`${resourceName}_created`, handleCreated);
    socket.on(`${resourceName}_updated`, handleUpdated);
    socket.on(`${resourceName}_deleted`, handleDeleted);

    return () => {
      isMounted.current = false;
      socket.emit('unsubscribe_resource', resourceName);
      socket.off('connect', handleSubscribe);
      socket.off(`${resourceName}_created`, handleCreated);
      socket.off(`${resourceName}_updated`, handleUpdated);
      socket.off(`${resourceName}_deleted`, handleDeleted);
    };
  }, [resourceName, fetchData, handleCreated, handleUpdated, handleDeleted]);

  return { data, meta, loading, error };
}

export default useRealtimeResource;
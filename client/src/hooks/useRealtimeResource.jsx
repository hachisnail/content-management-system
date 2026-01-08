import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import socket from '../socket';

// --- GLOBAL SUBSCRIPTION MANAGER ---
// Prevents connection flickering/loss during React re-renders (Strict Mode)
const subscriptionManager = {
  counts: new Map(),
  timers: new Map(),

  subscribe(resource) {
    // Cancel pending unsubscribe
    if (this.timers.has(resource)) {
      clearTimeout(this.timers.get(resource));
      this.timers.delete(resource);
    }

    const current = this.counts.get(resource) || 0;
    this.counts.set(resource, current + 1);

    // Only emit JOIN if this is the first listener
    if (current === 0) {
      if (socket.connected) {
        console.log(`[Realtime] Subscribing to: ${resource}`);
        socket.emit('subscribe_resource', resource);
      }
    }
  },

  unsubscribe(resource) {
    const current = this.counts.get(resource) || 0;
    if (current === 0) return;

    const next = current - 1;
    this.counts.set(resource, next);

    // Debounce the LEAVE command (500ms grace period)
    if (next === 0) {
      const timeoutId = setTimeout(() => {
        if (this.counts.get(resource) === 0) {
          console.log(`[Realtime] Unsubscribing from: ${resource}`);
          if (socket.connected) {
            socket.emit('unsubscribe_resource', resource);
          }
        }
        this.timers.delete(resource);
      }, 500); 
      
      this.timers.set(resource, timeoutId);
    }
  },
  
  reconnectAll() {
    this.counts.forEach((count, resource) => {
      if (count > 0) {
        console.log(`[Realtime] 🔄 Re-subscribing: ${resource}`);
        socket.emit('subscribe_resource', resource);
      }
    });
  }
};

// Ensure we re-subscribe if the socket connection drops and restores
socket.on('connect', () => subscriptionManager.reconnectAll());

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

  // --- DATA FETCHING ---
  const fetchData = useCallback(async (isMountedRef) => {
    if (!isEnabled) {
      if (isMountedRef?.current) setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = id ? `/${resourceName}/${id}` : `/${resourceName}`;
      const response = await api.get(endpoint, { params: queryParams });
      
      if (isMountedRef?.current) {
        const payload = response;
        if (id) {
          setData(payload); 
          setMeta(null);
        } else {
          if (payload?.data && Array.isArray(payload.data)) {
             setData(payload.data);
             setMeta(payload.meta || null);
          } else if (payload?.rows) {
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
      if (isMountedRef?.current) setError(err.message || 'Failed to load data');
    } finally {
      if (isMountedRef?.current) setLoading(false);
    }
  }, [resourceName, id, isEnabled, queryString]);

  // --- SOCKET HANDLERS ---

  const handleCreated = useCallback((newItem) => {
    const { filterFn, queryParams, updateStrategy } = propsRef.current;
    
    // 1. Check if item belongs in this list
    if (filterFn && !filterFn(newItem)) return;

    // 2. Handle List Update
    if (updateStrategy === 'manual' && (queryParams.page === 1 || !queryParams.page)) {
      setData(prev => {
         const list = Array.isArray(prev) ? prev : [];
         // Prevent duplicates
         if (list.some(i => String(i.id) === String(newItem.id))) return list;
         // Prepend new item
         return [newItem, ...list];
      });
      setMeta(prev => prev ? { ...prev, totalItems: (prev.totalItems || 0) + 1 } : prev);
    } else {
      // For 'refetch' strategy, just reload from server
      fetchData({ current: true });
    }
  }, [fetchData]);

  const handleUpdated = useCallback((updatedItem) => {
    const { filterFn, onUpdate, updateStrategy, id } = propsRef.current;
    
    if (updateStrategy === 'refetch') {
      fetchData({ current: true });
      return;
    }
    
    // Singleton Mode
    if (id) { 
      if (String(id) === String(updatedItem.id)) {
        setData(prev => ({ ...prev, ...updatedItem }));
      }
      return;
    }

    // List Mode
    setData(prevData => {
      const list = Array.isArray(prevData) ? prevData : [];
      const itemIndex = list.findIndex(item => String(item.id) === String(updatedItem.id));

      // 1. Item NOT found locally
      if (itemIndex === -1) {
        // If matches filter (e.g. status changed from 'disabled' to 'active')
        if (!filterFn || filterFn(updatedItem)) {
           fetchData({ current: true }); // Refetch to place it correctly sorted
        }
        return list;
      }

      // 2. Item FOUND locally -> Merge
      const mergedItem = { ...list[itemIndex], ...updatedItem };
      const passesFilter = !filterFn || filterFn(mergedItem);

      if (passesFilter) {
        const newData = [...list];
        newData[itemIndex] = mergedItem;
        return newData;
      } else {
        // Item no longer matches filter (e.g. status changed to 'archived')
        setMeta(prev => prev ? { ...prev, totalItems: Math.max(0, prev.totalItems - 1) } : prev);
        return list.filter(item => String(item.id) !== String(updatedItem.id));
      }
    });

    onUpdate?.(updatedItem);
  }, [fetchData]);

  const handleDeleted = useCallback((deletedItemOrId) => {
    const { updateStrategy } = propsRef.current;
    const idToDelete = deletedItemOrId.id || deletedItemOrId;
    
    if (updateStrategy === 'manual') {
      setData(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.filter(item => String(item.id) !== String(idToDelete));
      });
      setMeta(prev => prev ? { ...prev, totalItems: Math.max(0, prev.totalItems - 1) } : prev);
    } else {
      fetchData({ current: true });
    }
  }, [fetchData]);

  // --- LIFECYCLE ---
  useEffect(() => {
    const isMounted = { current: true };
    
    fetchData(isMounted);

    if (isEnabled) {
      subscriptionManager.subscribe(resourceName);
    }

    // Bind Listeners
    socket.on(`${resourceName}_created`, handleCreated);
    socket.on(`${resourceName}_updated`, handleUpdated);
    socket.on(`${resourceName}_deleted`, handleDeleted);

    return () => {
      isMounted.current = false;
      
      if (isEnabled) {
        subscriptionManager.unsubscribe(resourceName);
      }
      
      socket.off(`${resourceName}_created`, handleCreated);
      socket.off(`${resourceName}_updated`, handleUpdated);
      socket.off(`${resourceName}_deleted`, handleDeleted);
    };
  }, [resourceName, fetchData, handleCreated, handleUpdated, handleDeleted, isEnabled]);

  return { data, meta, loading, error };
}

export default useRealtimeResource;
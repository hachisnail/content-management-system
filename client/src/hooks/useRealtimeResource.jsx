import { useState, useEffect } from 'react';
import api from '../api';
import socket from '../socket';

/**
 * Flexible Real-time Hook
 * * @param {string} resourceName - The resource key (e.g., 'users', 'donations')
 * @param {Object} options - Configuration options
 * @param {string|number} [options.id] - If present, fetches a SINGLE item. If null, fetches a LIST.
 * @param {boolean} [options.prepend] - If true, new items are added to the TOP of the list (useful for logs).
 * @param {boolean} [options.isEnabled] - If false, the hook pauses and does nothing (useful for waiting on auth).
 */
function useRealtimeResource(resourceName, { id = null, prepend = false, isEnabled = true } = {}) {
  // 1. Initialize State
  // Default to null for Singleton, [] for List
  const [data, setData] = useState(id ? null : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Safety Check: If disabled (e.g. no user logged in yet), stop here.
    if (!isEnabled) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    // ============================================================
    // 2. Initial Snapshot (REST API)
    // ============================================================
    const fetchData = async () => {
      try {
        // Dynamic Endpoint: Get All vs Get One
        const endpoint = id ? `/${resourceName}/${id}` : `/${resourceName}`;
        
        const response = await api.get(endpoint);
        
        if (isMounted) {
          // Normalize data (handle wrappers like { data: ... } if your API uses them)
          const payload = response.data || response;

          if (id) {
            // SINGLETON MODE
            setData(payload); 
          } else {
            // LIST MODE
            if (Array.isArray(payload)) {
              setData(payload);
            } else {
              console.warn(`[useRealtimeResource] Expected array for ${resourceName}, got:`, payload);
              setData([]); 
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Error fetching ${resourceName}:`, err);
          setError(err.message || 'Failed to load data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // ============================================================
    // 3. Real-time Subscription
    // ============================================================
    const handleSubscribe = () => {
      socket.emit('subscribe_resource', resourceName);
    };

    if (socket.connected) {
      handleSubscribe();
    } else {
      socket.on('connect', handleSubscribe);
    }

    // ============================================================
    // 4. Event Handlers
    // ============================================================
    
    // A. Handle Create
    const handleCreated = (newItem) => {
      // In Singleton mode, we usually ignore 'created' events unless logic dictates otherwise
      if (id) return; 

      setData((prevData) => {
        if (!Array.isArray(prevData)) return prevData;
        // Avoid duplicates
        if (prevData.find(item => item.id === newItem.id)) return prevData;
        
        // Prepend (Newest Top) or Append (Oldest Top)
        return prepend ? [newItem, ...prevData] : [...prevData, newItem];
      });
    };

    // B. Handle Update
    const handleUpdated = (updatedItem) => {
      if (id) {
        // Singleton: Update only if IDs match
        setData((prevItem) => {
          if (!prevItem || String(prevItem.id) !== String(updatedItem.id)) return prevItem;
          return { ...prevItem, ...updatedItem };
        });
      } else {
        // List: Find and replace
        setData((prevData) => {
          if (!Array.isArray(prevData)) return prevData;
          return prevData.map((item) =>
            item.id === updatedItem.id ? { ...item, ...updatedItem } : item
          );
        });
      }
    };

    // C. Handle Delete
    const handleDeleted = (deletedItemOrId) => {
      // Some APIs send the whole object, some just the ID
      const idToDelete = deletedItemOrId.id || deletedItemOrId;

      if (id) {
        // Singleton: If our item is deleted, clear it
        setData((prevItem) => {
          if (prevItem && String(prevItem.id) === String(idToDelete)) {
            return null; 
          }
          return prevItem;
        });
      } else {
        // List: Filter it out
        setData((prevData) => {
          if (!Array.isArray(prevData)) return prevData;
          return prevData.filter((item) => item.id !== idToDelete);
        });
      }
    };

    // Attach Listeners
    socket.on(`${resourceName}_created`, handleCreated);
    socket.on(`${resourceName}_updated`, handleUpdated);
    socket.on(`${resourceName}_deleted`, handleDeleted);

    // 5. Cleanup
    return () => {
      isMounted = false;
      
      socket.emit('unsubscribe_resource', resourceName);
      
      socket.off(`${resourceName}_created`, handleCreated);
      socket.off(`${resourceName}_updated`, handleUpdated);
      socket.off(`${resourceName}_deleted`, handleDeleted);
      socket.off('connect', handleSubscribe); 
    };
  }, [resourceName, id, prepend, isEnabled]); 

  return { data, loading, error };
}

export default useRealtimeResource; 
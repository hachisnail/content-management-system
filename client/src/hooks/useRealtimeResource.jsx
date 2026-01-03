import { useState, useEffect } from 'react';
import api from '../api';
import socket from '../socket';

function useRealtimeResource(resourceName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // 1. Initial Snapshot (GET Request)
    const fetchData = async () => {
      try {
        const response = await api.get(`/${resourceName}`);
        
        if (isMounted) {
          if (Array.isArray(response)) {
             setData(response);
          } else if (response && Array.isArray(response.data)) {
             setData(response.data);
          } else {
             console.warn(`[useRealtimeResource] Expected array for ${resourceName}, got:`, response);
             setData([]); 
          }
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Error fetching ${resourceName}:`, err);
          setError(err.message || 'Failed to load data');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // ============================================================
    // 2. SECURITY UPGRADE: Subscribe to the Room
    // ============================================================
    
    // Define the handler specifically so we can remove ONLY this one later
    const handleSubscribe = () => {
      socket.emit('subscribe_resource', resourceName);
    };

    if (socket.connected) {
      handleSubscribe();
    } else {
      socket.on('connect', handleSubscribe);
    }

    // 3. Define Handlers
    const handleCreated = (newItem) => {
      setData((prevData) => {
        if (prevData.find(item => item.id === newItem.id)) return prevData;
        return [...prevData, newItem];
      });
    };

    const handleUpdated = (updatedItem) => {
      setData((prevData) =>
        prevData.map((item) =>
          item.id === updatedItem.id ? { ...item, ...updatedItem } : item
        )
      );
    };

    const handleDeleted = (deletedItemOrId) => {
      const idToDelete = deletedItemOrId.id || deletedItemOrId;
      setData((prevData) =>
        prevData.filter((item) => item.id !== idToDelete)
      );
    };

    // 4. Attach Listeners
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
      
      // FIXED: Remove ONLY our specific subscribe handler
      socket.off('connect', handleSubscribe); 
    };
  }, [resourceName]);

  return { data, loading, error };
}

export default useRealtimeResource;
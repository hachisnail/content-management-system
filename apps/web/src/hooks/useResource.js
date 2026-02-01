import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../providers/SocketProvider";
import apiClient from "../api/client"; 

export const useResource = (resourceName, options = null, extraConfig = {}) => {
  // CONFIGURATION
  let socketResource = resourceName;
  let endpoint = `/${resourceName}`;
  let params = {};

  if (typeof options === 'string') {
    // Usage: useResource('users', '/custom/url', { page: 1 })
    endpoint = options;
    params = extraConfig;
  } else if (typeof options === 'object' && options !== null) {
    // Usage: useResource('users', { page: 1 }, { socketResource: 'users_table' })
    params = options;
    
    // [FIX] Check the 3rd argument (extraConfig) for the socket override
    if (extraConfig && extraConfig.socketResource) {
        socketResource = extraConfig.socketResource;
    }
    // Backward compatibility: check if it was mixed into the params object
    else if (options.socketResource) {
        socketResource = options.socketResource;
    }
  }

  const [data, setData] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const paramsRef = useRef(params);
  // Deep compare to avoid infinite loops if params object is recreated
  if (JSON.stringify(paramsRef.current) !== JSON.stringify(params)) {
    paramsRef.current = params;
  }

  const fetchAll = useCallback(async () => {
    setIsFetching(true);
    if (!data) setIsLoading(true);

    try {
      const response = await apiClient.get(endpoint, { params: paramsRef.current });
      setData(response.data); 
      setError(null);
    } catch (err) {
      console.error(`Failed to fetch ${resourceName}`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [resourceName, endpoint, paramsRef.current]);

  // --- REAL-TIME SYNC ---
  useEffect(() => {
    if (!socket) return;

    // Subscribe using the specific socketResource (e.g. 'audit_logs')
    socket.emit("subscribe", socketResource);

    const handleDbEvent = ({ type, data: payload, resource }) => {
      // Strict check against the subscribed resource
      if (resource !== socketResource) return;

      setData((prevData) => {
        if (!prevData) return prevData;

        const isPaged = !Array.isArray(prevData) && Array.isArray(prevData.data);
        const list = isPaged ? prevData.data : (Array.isArray(prevData) ? prevData : []);
        let newList = [...list];

        switch (type) {
          case "CREATE":
            if (!newList.find((i) => i.id === payload.id)) {
                newList = [payload, ...newList]; 
            }
            break;
          case "UPDATE":
            newList = newList.map((item) => (item.id === payload.id ? payload : item));
            break;
          case "DELETE":
            newList = newList.filter((item) => item.id !== payload.id);
            break;
          default: return prevData;
        }

        if (isPaged) return { ...prevData, data: newList };
        return newList;
      });
    };

    socket.on("db_event", handleDbEvent);
    return () => {
      socket.emit("unsubscribe", socketResource);
      socket.off("db_event", handleDbEvent);
    };
  }, [socket, socketResource]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const create = async (payload) => { await apiClient.post(endpoint, payload); };
  const update = async (id, payload) => { await apiClient.put(`${endpoint}/${id}`, payload); };
  const remove = async (id) => { await apiClient.delete(`${endpoint}/${id}`); };

  return {
    data,
    items: data?.data || (Array.isArray(data) ? data : []), 
    meta: data?.meta,
    loading: isLoading,
    isFetching,
    error,
    create, update, remove, refresh: fetchAll,
  };
};
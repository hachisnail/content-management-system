import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { socket } from '../lib/socket'; // Your socket.io-client instance

/**
 * useRealTimeResource
 * @param {string} resourceName - The table name (e.g., 'users', 'audit_logs')
 * @param {function} fetchFn - The API function to fetch the initial list
 */
export const useRealTimeResource = (resourceName, fetchFn) => {
  const queryClient = useQueryClient();
  const queryKey = [resourceName];

  // 1. Initial Data Fetch via React Query
  const query = useQuery({
    queryKey,
    queryFn: fetchFn,
    // Robustness: keep data fresh if tab is refocused
    refetchOnWindowFocus: true, 
  });

  useEffect(() => {
    if (!socket) return;

    // 2. Join the Resource Room
    // The server expects a 'subscribe' event with the resource name
    socket.emit('subscribe', resourceName);

    // 3. Listen for Real-Time DB Events
    // The server emits 'db_event' containing { type, model, resource, data }
    const handleDbEvent = (payload) => {
      // Ensure the event belongs to this resource context
      if (payload.resource !== resourceName) return;

      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;

        switch (payload.type) {
          case 'CREATE':
            // Append new item to the local state
            // Prevents duplicates if the socket and API fetch race
            if (oldData.some(item => item.id === payload.data.id)) return oldData;
            return [payload.data, ...oldData];

          case 'UPDATE':
            // Replace the updated item in the local state
            return oldData.map((item) =>
              item.id === payload.data.id ? payload.data : item
            );

          case 'DELETE':
            // Remove the deleted item from the local state
            return oldData.filter((item) => item.id !== payload.data.id);

          default:
            return oldData;
        }
      });
    };

    socket.on('db_event', handleDbEvent);

    // 4. Robust Fallback Logic
    // If the socket reconnects after a drop, we re-subscribe and 
    // invalidate the query to ensure we didn't miss updates during downtime.
    const handleReconnect = () => {
      socket.emit('subscribe', resourceName);
      queryClient.invalidateQueries({ queryKey });
    };

    socket.on('connect', handleReconnect);

    // 5. Cleanup on Unmount
    return () => {
      socket.off('db_event', handleDbEvent);
      socket.off('connect', handleReconnect);
      // Notify server to leave the room
      socket.emit('unsubscribe', resourceName);
    };
  }, [resourceName, queryClient, queryKey]);

  return query;
};
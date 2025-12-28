import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Connect to backend
const socket = io('http://localhost:3000', {
  withCredentials: true, // IMPORTANT: Sends the session cookie
  autoConnect: false // We connect manually inside the component
});

export const useRealtimeResource = (resourceId, onUpdate) => {
  useEffect(() => {
    // 1. Connect
    socket.connect();

    // 2. Join the Room for this specific resource
    socket.emit('join_resource', resourceId);

    // 3. Listen for updates
    const handleUpdate = (eventData) => {
      console.log('Realtime update received:', eventData);
      // Trigger the callback (e.g., React Query refetch)
      if (onUpdate) onUpdate();
    };

    socket.on('resource_updated', handleUpdate);

    // 4. Cleanup
    return () => {
      socket.emit('leave_resource', resourceId);
      socket.off('resource_updated', handleUpdate);
      socket.disconnect();
    };
  }, [resourceId, onUpdate]);
};
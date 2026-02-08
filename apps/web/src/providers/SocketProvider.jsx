import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL;
    
    // 2. Initialize with autoConnect: FALSE
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      autoConnect: false, // Critical for controlling the timing
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('forced_logout', ({ message }) => {
      const reason = message || 'You have been logged out from another device.';
      logout(false, reason); 
      navigate('/login');
      newSocket.disconnect();
    });

    setSocket(newSocket);

    // 3. Debounce the Connection (The Fix)
    // We wait 50ms. If React Strict Mode unmounts the component immediately,
    // the cleanup function runs, clears this timeout, and .connect() never happens.
    const connectionTimeout = setTimeout(() => {
      newSocket.connect();
    }, 50);

    return () => {
      // Cancel the connection attempt if we unmounted immediately
      clearTimeout(connectionTimeout);
      
      // Clean up listeners
      newSocket.offAny();
      
      // Only disconnect if we actually proceeded to connect
      if (newSocket.connected) {
         newSocket.disconnect();
      } else {
         // If we are strictly in 'connecting' state, closing can trigger the warning,
         // but the timeout above usually prevents us from ever reaching this state 
         // in the "ghost" mount.
         newSocket.close();
      }
    };
  }, [user]); 

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
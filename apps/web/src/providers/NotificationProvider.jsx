import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketProvider';
import apiClient from '../api/client';
// You can use a toast library here like react-hot-toast or sonner
// import { toast } from 'sonner'; 

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch initial state
  const fetchNotifications = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        apiClient.get('/notifications?limit=10'),
        apiClient.get('/notifications/unread-count')
      ]);
      setNotifications(listRes.data.rows);
      setUnreadCount(countRes.data.count);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  }, []);

  // Listen for Socket Events
  useEffect(() => {
    fetchNotifications();

    if (!socket) return;

    const handleNewNotification = (notification) => {
      // 1. Play sound (optional)
      // new Audio('/sounds/ping.mp3').play();

      // 2. Show Toast (optional)
      // toast(notification.title, { description: notification.message });

      // 3. Update State
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification:new', handleNewNotification);
    
    // Sync read status from other tabs/devices
    socket.on('notification:read_all', () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    });

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read_all');
    };
  }, [socket, fetchNotifications]);

  const markAsRead = async (id) => {
    // Optimistic Update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    await apiClient.patch('/notifications/read', { ids: [id] });
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await apiClient.patch('/notifications/read-all');
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      fetchNotifications,
      isOpen, 
      setIsOpen
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
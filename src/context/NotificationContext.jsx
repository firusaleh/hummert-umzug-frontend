// src/context/NotificationContext.jsx
import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from './AuthContext';

// Create Context
export const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  preferences: {},
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  deleteAllRead: async () => {},
  updatePreferences: async () => {},
  subscribeToPush: async () => {},
  unsubscribeFromPush: async () => {},
  refreshNotifications: async () => {},
  clearError: () => {}
});

// Custom Hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    email: true,
    push: false,
    types: {
      umzug: true,
      aufgabe: true,
      rechnung: true,
      system: true
    }
  });

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.gelesen).length;
    setUnreadCount(count);
  }, [notifications]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getAll(params);
      setNotifications(response.data.notifications);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Laden der Benachrichtigungen';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (id, read = true) => {
    try {
      await notificationService.markAsRead(id, read);
      
      setNotifications(prev => prev.map(n => 
        n._id === id ? { ...n, gelesen: read } : n
      ));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Markieren der Benachrichtigung';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev => prev.map(n => ({ ...n, gelesen: true })));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Markieren aller Benachrichtigungen';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationService.delete(id);
      
      setNotifications(prev => prev.filter(n => n._id !== id));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete notification:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Löschen der Benachrichtigung';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Delete all read notifications
  const deleteAllRead = useCallback(async () => {
    try {
      await notificationService.deleteAllRead();
      
      setNotifications(prev => prev.filter(n => !n.gelesen));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete all read notifications:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Löschen der gelesenen Benachrichtigungen';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      const response = await notificationService.updatePreferences(newPreferences);
      setPreferences(response.data.preferences);
      return { success: true, data: response.data.preferences };
    } catch (error) {
      console.error('Failed to update preferences:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Aktualisieren der Einstellungen';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Push notifications
  const subscribeToPush = useCallback(async () => {
    try {
      // Check if browser supports push notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push-Benachrichtigungen werden nicht unterstützt');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Push-Benachrichtigungen wurden abgelehnt');
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
      });

      // Send subscription to server
      await notificationService.subscribeToPush(subscription);
      
      // Update preferences
      setPreferences(prev => ({ ...prev, push: true }));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      const errorMessage = error.message || 'Push-Benachrichtigungen konnten nicht aktiviert werden';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get subscription
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();
        
        // Notify server
        await notificationService.unsubscribeFromPush();
      }
      
      // Update preferences
      setPreferences(prev => ({ ...prev, push: false }));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      const errorMessage = error.message || 'Push-Benachrichtigungen konnten nicht deaktiviert werden';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    return await fetchNotifications();
  }, [fetchNotifications]);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;
      
      try {
        const response = await notificationService.getPreferences();
        setPreferences(response.data.preferences);
      } catch (error) {
        console.error('Failed to fetch preferences:', error);
      }
    };
    
    fetchPreferences();
  }, [user]);

  // Set up periodic refresh
  useEffect(() => {
    if (!user) return;
    
    // Fetch notifications initially
    fetchNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // Context value
  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    updatePreferences,
    subscribeToPush,
    unsubscribeFromPush,
    refreshNotifications,
    clearError
  }), [
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    updatePreferences,
    subscribeToPush,
    unsubscribeFromPush,
    refreshNotifications,
    clearError
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
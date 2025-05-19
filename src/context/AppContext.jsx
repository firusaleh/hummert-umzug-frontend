// src/context/AppContext.jsx
import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

// Create Context
export const AppContext = createContext({
  theme: 'light',
  sidebarOpen: true,
  notifications: [],
  loading: false,
  error: null,
  toggleTheme: () => {},
  toggleSidebar: () => {},
  addNotification: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},
  setLoading: () => {},
  setError: () => {},
  clearError: () => {}
});

// Custom Hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // State
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('app_theme');
    return savedTheme || 'light';
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebar_open');
    return savedState ? JSON.parse(savedState) : true;
  });
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Theme management
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('app_theme', newTheme);
      
      // Apply theme to document
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
      
      return newTheme;
    });
  }, []);

  // Sidebar management
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prevState => {
      const newState = !prevState;
      localStorage.setItem('sidebar_open', JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Notification management
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      createdAt: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after duration (default 5 seconds)
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Error management
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = useMemo(() => ({
    theme,
    sidebarOpen,
    notifications,
    loading,
    error,
    toggleTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
    clearNotifications,
    setLoading,
    setError,
    clearError
  }), [
    theme,
    sidebarOpen,
    notifications,
    loading,
    error,
    toggleTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
    clearNotifications,
    clearError
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
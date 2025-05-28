// src/context/DataSyncContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import dataSyncService from '../services/dataSyncService';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

// Create Context
export const DataSyncContext = createContext({
  connected: false,
  syncing: false,
  lastSync: null,
  syncErrors: [],
  subscribe: () => {},
  unsubscribe: () => {},
  syncEntity: async () => {},
  syncAll: async () => {},
  clearSyncErrors: () => {},
  getCachedData: () => {},
  updateCache: () => {}
});

// Custom Hook
export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};

export const DataSyncProvider = ({ children }) => {
  const { token, user } = useAuth();
  const { addNotification } = useApp();
  
  // State
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncErrors, setSyncErrors] = useState([]);
  const [subscriptions, setSubscriptions] = useState(new Map());

  // Initialize data sync service
  useEffect(() => {
    if (token && user) {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      dataSyncService.initialize(apiUrl, token);

      // Setup event listeners
      const handleConnected = () => {
        setConnected(true);
        addNotification({
          type: 'success',
          message: 'Echtzeit-Synchronisation verbunden',
          duration: 3000
        });
      };

      const handleDisconnected = (reason) => {
        setConnected(false);
        if (reason !== 'io client disconnect') {
          addNotification({
            type: 'warning',
            message: 'Echtzeit-Synchronisation getrennt',
            duration: 5000
          });
        }
      };

      const handleError = (error) => {
        console.error('DataSync error:', error);
        setSyncErrors(prev => [...prev, {
          timestamp: new Date().toISOString(),
          error: error.message || 'Synchronisationsfehler'
        }]);
      };

      dataSyncService.on('connected', handleConnected);
      dataSyncService.on('disconnected', handleDisconnected);
      dataSyncService.on('error', handleError);

      return () => {
        dataSyncService.off('connected', handleConnected);
        dataSyncService.off('disconnected', handleDisconnected);
        dataSyncService.off('error', handleError);
        dataSyncService.disconnect();
      };
    }
  }, [token, user, addNotification]);

  // Subscribe to entity updates
  const subscribe = useCallback((entityType, callback, options = {}) => {
    const unsubscribe = dataSyncService.subscribe(entityType, callback, options);
    
    // Track subscription
    setSubscriptions(prev => {
      const updated = new Map(prev);
      const entitySubs = updated.get(entityType) || [];
      updated.set(entityType, [...entitySubs, { callback, options, unsubscribe }]);
      return updated;
    });

    return unsubscribe;
  }, []);

  // Unsubscribe from entity updates
  const unsubscribe = useCallback((entityType, callback) => {
    setSubscriptions(prev => {
      const updated = new Map(prev);
      const entitySubs = updated.get(entityType) || [];
      const filtered = entitySubs.filter(sub => sub.callback !== callback);
      
      if (filtered.length === 0) {
        updated.delete(entityType);
      } else {
        updated.set(entityType, filtered);
      }
      
      return updated;
    });
  }, []);

  // Sync specific entity type
  const syncEntity = useCallback(async (entityType, options = {}) => {
    if (!connected) {
      addNotification({
        type: 'warning',
        message: 'Keine Verbindung zur Echtzeit-Synchronisation'
      });
      return { success: false, error: 'Not connected' };
    }

    setSyncing(true);
    try {
      const result = await dataSyncService.requestSync(entityType, options);
      setLastSync(new Date().toISOString());
      return { success: true, data: result };
    } catch (error) {
      console.error('Sync error:', error);
      setSyncErrors(prev => [...prev, {
        timestamp: new Date().toISOString(),
        entityType,
        error: error.message
      }]);
      addNotification({
        type: 'error',
        message: `Synchronisation fehlgeschlagen: ${error.message}`
      });
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  }, [connected, addNotification]);

  // Sync all subscribed entities
  const syncAll = useCallback(async () => {
    if (!connected) {
      addNotification({
        type: 'warning',
        message: 'Keine Verbindung zur Echtzeit-Synchronisation'
      });
      return { success: false, error: 'Not connected' };
    }

    setSyncing(true);
    const results = [];
    
    try {
      for (const entityType of subscriptions.keys()) {
        const result = await dataSyncService.requestSync(entityType);
        results.push({ entityType, success: true, data: result });
      }
      
      setLastSync(new Date().toISOString());
      addNotification({
        type: 'success',
        message: 'Alle Daten synchronisiert',
        duration: 3000
      });
      
      return { success: true, results };
    } catch (error) {
      console.error('Sync all error:', error);
      setSyncErrors(prev => [...prev, {
        timestamp: new Date().toISOString(),
        error: error.message
      }]);
      addNotification({
        type: 'error',
        message: `Synchronisation fehlgeschlagen: ${error.message}`
      });
      return { success: false, error: error.message, results };
    } finally {
      setSyncing(false);
    }
  }, [connected, subscriptions, addNotification]);

  // Clear sync errors
  const clearSyncErrors = useCallback(() => {
    setSyncErrors([]);
  }, []);

  // Get cached data
  const getCachedData = useCallback((entityType, entityId) => {
    if (entityId) {
      return dataSyncService.getCached(entityType, entityId);
    }
    return dataSyncService.getCachedByType(entityType);
  }, []);

  // Update cache manually
  const updateCache = useCallback((entityType, entityId, data) => {
    const cacheKey = `${entityType}:${entityId}`;
    dataSyncService.dataCache.set(cacheKey, {
      ...data,
      _lastUpdated: new Date().toISOString()
    });
  }, []);

  // Context value
  const value = useMemo(() => ({
    connected,
    syncing,
    lastSync,
    syncErrors,
    subscribe,
    unsubscribe,
    syncEntity,
    syncAll,
    clearSyncErrors,
    getCachedData,
    updateCache
  }), [
    connected,
    syncing,
    lastSync,
    syncErrors,
    subscribe,
    unsubscribe,
    syncEntity,
    syncAll,
    clearSyncErrors,
    getCachedData,
    updateCache
  ]);

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};

// Higher-order component for data synchronization
export const withDataSync = (Component, entityType, options = {}) => {
  return function DataSyncWrapper(props) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { subscribe, syncEntity, getCachedData } = useDataSync();

    useEffect(() => {
      // Load cached data immediately
      const cached = getCachedData(entityType);
      if (cached.length > 0) {
        setData(cached);
        setLoading(false);
      }

      // Subscribe to updates
      const unsubscribe = subscribe(entityType, (eventType, eventData) => {
        switch (eventType) {
          case 'sync':
            setData(eventData.entities);
            setLoading(false);
            break;
          case 'create':
            setData(prev => [eventData.entity, ...prev]);
            break;
          case 'update':
            setData(prev => prev.map(item => 
              item._id === eventData.entityId 
                ? { ...item, ...eventData.updates }
                : item
            ));
            break;
          case 'delete':
            setData(prev => prev.filter(item => item._id !== eventData.entityId));
            break;
        }
      }, options);

      // Initial sync
      syncEntity(entityType, options).then(() => {
        setLoading(false);
      });

      return unsubscribe;
    }, [entityType, JSON.stringify(options)]);

    return <Component {...props} syncData={data} syncLoading={loading} />;
  };
};

export default DataSyncContext;
// Custom hook for synchronized data management
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { useApp } from '../context/AppContext';

export const useSyncedData = (entityType, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localChanges, setLocalChanges] = useState(new Map());
  const subscriptionRef = useRef(null);
  
  const { subscribe, syncEntity, getCachedData, updateCache, connected } = useDataSync();
  const { addNotification } = useApp();

  // Load initial data from cache
  useEffect(() => {
    const cached = getCachedData(entityType);
    if (cached && cached.length > 0) {
      setData(cached);
      setLoading(false);
    }
  }, [entityType, getCachedData]);

  // Subscribe to real-time updates
  useEffect(() => {
    const handleUpdate = (eventType, eventData) => {
      switch (eventType) {
        case 'sync':
          setData(eventData.entities);
          setLoading(false);
          setError(null);
          // Clear local changes that have been synced
          setLocalChanges(new Map());
          break;
          
        case 'create':
          setData(prev => {
            // Check if already exists (prevent duplicates)
            if (prev.find(item => item._id === eventData.entity._id)) {
              return prev;
            }
            return [eventData.entity, ...prev];
          });
          if (options.showNotifications) {
            addNotification({
              type: 'info',
              message: options.createMessage || `Neuer ${entityType} erstellt`,
              duration: 3000
            });
          }
          break;
          
        case 'update':
          setData(prev => prev.map(item => 
            item._id === eventData.entityId 
              ? { ...item, ...eventData.updates, _lastUpdated: eventData.timestamp }
              : item
          ));
          // Remove from local changes if this was a sync confirmation
          setLocalChanges(prev => {
            const updated = new Map(prev);
            updated.delete(eventData.entityId);
            return updated;
          });
          break;
          
        case 'delete':
          setData(prev => prev.filter(item => item._id !== eventData.entityId));
          setLocalChanges(prev => {
            const updated = new Map(prev);
            updated.delete(eventData.entityId);
            return updated;
          });
          if (options.showNotifications) {
            addNotification({
              type: 'warning',
              message: options.deleteMessage || `${entityType} gelöscht`,
              duration: 3000
            });
          }
          break;
      }
    };

    // Subscribe with options
    subscriptionRef.current = subscribe(entityType, handleUpdate, {
      filter: options.filter,
      ...options.subscriptionOptions
    });

    // Initial sync
    const performInitialSync = async () => {
      try {
        await syncEntity(entityType, options.syncOptions);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    performInitialSync();

    // Cleanup subscription
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, [entityType, JSON.stringify(options)]);

  // Create entity with optimistic update
  const create = useCallback(async (entityData) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticEntity = {
      ...entityData,
      _id: tempId,
      _isOptimistic: true,
      _createdAt: new Date().toISOString()
    };

    // Optimistic update
    setData(prev => [optimisticEntity, ...prev]);
    setLocalChanges(prev => new Map(prev).set(tempId, 'create'));

    try {
      const response = await options.createFn(entityData);
      
      // Replace optimistic entity with real one
      setData(prev => prev.map(item => 
        item._id === tempId ? response.data : item
      ));
      setLocalChanges(prev => {
        const updated = new Map(prev);
        updated.delete(tempId);
        return updated;
      });

      if (options.onCreateSuccess) {
        options.onCreateSuccess(response.data);
      }

      return { success: true, data: response.data };
    } catch (error) {
      // Revert optimistic update
      setData(prev => prev.filter(item => item._id !== tempId));
      setLocalChanges(prev => {
        const updated = new Map(prev);
        updated.delete(tempId);
        return updated;
      });

      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Fehler beim Erstellen',
        duration: 5000
      });

      return { success: false, error: error.message };
    }
  }, [options, addNotification]);

  // Update entity with optimistic update
  const update = useCallback(async (id, updates) => {
    // Store original data for rollback
    const originalData = data.find(item => item._id === id);
    if (!originalData) return { success: false, error: 'Entity not found' };

    // Optimistic update
    setData(prev => prev.map(item => 
      item._id === id 
        ? { ...item, ...updates, _isOptimistic: true }
        : item
    ));
    setLocalChanges(prev => new Map(prev).set(id, 'update'));

    try {
      const response = await options.updateFn(id, updates);
      
      // Update with server response
      setData(prev => prev.map(item => 
        item._id === id 
          ? { ...response.data, _isOptimistic: false }
          : item
      ));
      
      // Update cache
      updateCache(entityType, id, response.data);

      if (options.onUpdateSuccess) {
        options.onUpdateSuccess(response.data);
      }

      return { success: true, data: response.data };
    } catch (error) {
      // Rollback optimistic update
      setData(prev => prev.map(item => 
        item._id === id ? originalData : item
      ));
      setLocalChanges(prev => {
        const updated = new Map(prev);
        updated.delete(id);
        return updated;
      });

      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Fehler beim Aktualisieren',
        duration: 5000
      });

      return { success: false, error: error.message };
    }
  }, [data, entityType, options, updateCache, addNotification]);

  // Delete entity with optimistic update
  const remove = useCallback(async (id) => {
    // Store original data for rollback
    const originalData = data.find(item => item._id === id);
    if (!originalData) return { success: false, error: 'Entity not found' };

    // Optimistic delete
    setData(prev => prev.filter(item => item._id !== id));
    setLocalChanges(prev => new Map(prev).set(id, 'delete'));

    try {
      await options.deleteFn(id);

      if (options.onDeleteSuccess) {
        options.onDeleteSuccess(id);
      }

      return { success: true };
    } catch (error) {
      // Rollback delete
      setData(prev => {
        const index = prev.findIndex(item => 
          new Date(item._createdAt) > new Date(originalData._createdAt)
        );
        if (index === -1) {
          return [...prev, originalData];
        }
        return [...prev.slice(0, index), originalData, ...prev.slice(index)];
      });
      setLocalChanges(prev => {
        const updated = new Map(prev);
        updated.delete(id);
        return updated;
      });

      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Fehler beim Löschen',
        duration: 5000
      });

      return { success: false, error: error.message };
    }
  }, [data, options, addNotification]);

  // Refresh data
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await syncEntity(entityType, options.syncOptions);
      addNotification({
        type: 'success',
        message: 'Daten aktualisiert',
        duration: 2000
      });
    } catch (err) {
      setError(err.message);
      addNotification({
        type: 'error',
        message: 'Fehler beim Aktualisieren',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [entityType, options.syncOptions, syncEntity, addNotification]);

  // Get single entity by ID
  const getById = useCallback((id) => {
    return data.find(item => item._id === id);
  }, [data]);

  // Filter data
  const filter = useCallback((filterFn) => {
    return data.filter(filterFn);
  }, [data]);

  // Sort data
  const sort = useCallback((sortFn) => {
    return [...data].sort(sortFn);
  }, [data]);

  return {
    data,
    loading,
    error,
    connected,
    localChanges: Array.from(localChanges.entries()),
    hasLocalChanges: localChanges.size > 0,
    create,
    update,
    remove,
    refresh,
    getById,
    filter,
    sort
  };
};

// Specialized hooks for different entity types
export const useSyncedUmzuege = (options = {}) => {
  return useSyncedData('umzug', {
    showNotifications: true,
    createMessage: 'Neuer Umzug erstellt',
    deleteMessage: 'Umzug gelöscht',
    ...options
  });
};

export const useSyncedMitarbeiter = (options = {}) => {
  return useSyncedData('mitarbeiter', {
    showNotifications: true,
    createMessage: 'Neuer Mitarbeiter hinzugefügt',
    deleteMessage: 'Mitarbeiter entfernt',
    ...options
  });
};

export const useSyncedFahrzeuge = (options = {}) => {
  return useSyncedData('fahrzeug', {
    showNotifications: true,
    createMessage: 'Neues Fahrzeug hinzugefügt',
    deleteMessage: 'Fahrzeug entfernt',
    ...options
  });
};

export const useSyncedBenachrichtigungen = (options = {}) => {
  return useSyncedData('benachrichtigung', {
    showNotifications: false, // Don't show notifications for notifications
    ...options
  });
};
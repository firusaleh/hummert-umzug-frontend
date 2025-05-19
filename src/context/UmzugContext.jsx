// src/context/UmzugContext.jsx
import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { umzugService } from '../services/api';
import { useApp } from './AppContext';

// Create Context
export const UmzugContext = createContext({
  umzuege: [],
  currentUmzug: null,
  loading: false,
  error: null,
  filters: {},
  pagination: { page: 1, limit: 10, total: 0 },
  fetchUmzuege: async () => {},
  fetchUmzugById: async () => {},
  createUmzug: async () => {},
  updateUmzug: async () => {},
  deleteUmzug: async () => {},
  setCurrentUmzug: () => {},
  setFilters: () => {},
  setPagination: () => {},
  refreshUmzuege: async () => {},
  clearError: () => {}
});

// Custom Hook
export const useUmzug = () => {
  const context = useContext(UmzugContext);
  if (!context) {
    throw new Error('useUmzug must be used within an UmzugProvider');
  }
  return context;
};

export const UmzugProvider = ({ children }) => {
  const { addNotification } = useApp();
  
  // State
  const [umzuege, setUmzuege] = useState([]);
  const [currentUmzug, setCurrentUmzug] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all moves
  const fetchUmzuege = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params
      };
      
      const response = await umzugService.getAll(queryParams);
      
      setUmzuege(response.data.umzuege);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        pages: response.data.pages
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to fetch Umzüge:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Laden der Umzüge';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, addNotification]);

  // Fetch single move
  const fetchUmzugById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await umzugService.getById(id);
      const umzug = response.data;
      
      setCurrentUmzug(umzug);
      return { success: true, data: umzug };
    } catch (error) {
      console.error('Failed to fetch Umzug:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Laden des Umzugs';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Create new move
  const createUmzug = useCallback(async (umzugData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await umzugService.create(umzugData);
      const newUmzug = response.data;
      
      // Add to list
      setUmzuege(prev => [newUmzug, ...prev]);
      setCurrentUmzug(newUmzug);
      
      addNotification({
        type: 'success',
        message: 'Umzug erfolgreich erstellt'
      });
      
      return { success: true, data: newUmzug };
    } catch (error) {
      console.error('Failed to create Umzug:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Erstellen des Umzugs';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Update move
  const updateUmzug = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await umzugService.update(id, updates);
      const updatedUmzug = response.data;
      
      // Update in list
      setUmzuege(prev => prev.map(u => u._id === id ? updatedUmzug : u));
      
      // Update current if same
      if (currentUmzug?._id === id) {
        setCurrentUmzug(updatedUmzug);
      }
      
      addNotification({
        type: 'success',
        message: 'Umzug erfolgreich aktualisiert'
      });
      
      return { success: true, data: updatedUmzug };
    } catch (error) {
      console.error('Failed to update Umzug:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Aktualisieren des Umzugs';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentUmzug, addNotification]);

  // Delete move
  const deleteUmzug = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await umzugService.delete(id);
      
      // Remove from list
      setUmzuege(prev => prev.filter(u => u._id !== id));
      
      // Clear current if same
      if (currentUmzug?._id === id) {
        setCurrentUmzug(null);
      }
      
      addNotification({
        type: 'success',
        message: 'Umzug erfolgreich gelöscht'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete Umzug:', error);
      const errorMessage = error.response?.data?.message || 'Fehler beim Löschen des Umzugs';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [currentUmzug, addNotification]);

  // Refresh moves
  const refreshUmzuege = useCallback(async () => {
    return await fetchUmzuege();
  }, [fetchUmzuege]);

  // Context value
  const value = useMemo(() => ({
    umzuege,
    currentUmzug,
    loading,
    error,
    filters,
    pagination,
    fetchUmzuege,
    fetchUmzugById,
    createUmzug,
    updateUmzug,
    deleteUmzug,
    setCurrentUmzug,
    setFilters,
    setPagination,
    refreshUmzuege,
    clearError
  }), [
    umzuege,
    currentUmzug,
    loading,
    error,
    filters,
    pagination,
    fetchUmzuege,
    fetchUmzugById,
    createUmzug,
    updateUmzug,
    deleteUmzug,
    refreshUmzuege,
    clearError
  ]);

  return (
    <UmzugContext.Provider value={value}>
      {children}
    </UmzugContext.Provider>
  );
};

export default UmzugContext;
// MitarbeiterContext.jsx - Employee state management with real data
import React, { createContext, useState, useContext, useCallback, useMemo, useEffect } from 'react';
import mitarbeiterService from '../services/mitarbeiterService';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

// Create Context
export const MitarbeiterContext = createContext({
  mitarbeiter: [],
  currentMitarbeiter: null,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, pages: 1 },
  filters: {},
  searchResults: [],
  verfuegbareMitarbeiter: [],
  fetchMitarbeiter: async () => {},
  fetchMitarbeiterById: async () => {},
  createMitarbeiter: async () => {},
  updateMitarbeiter: async () => {},
  deleteMitarbeiter: async () => {},
  searchMitarbeiter: async () => {},
  getVerfuegbareMitarbeiter: async () => {},
  setCurrentMitarbeiter: () => {},
  setFilters: () => {},
  setPagination: () => {},
  refreshMitarbeiter: async () => {},
  clearError: () => {}
});

// Custom Hook
export const useMitarbeiter = () => {
  const context = useContext(MitarbeiterContext);
  if (!context) {
    throw new Error('useMitarbeiter must be used within a MitarbeiterProvider');
  }
  return context;
};

export const MitarbeiterProvider = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useApp();
  
  // State
  const [mitarbeiter, setMitarbeiter] = useState([]);
  const [currentMitarbeiter, setCurrentMitarbeiter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [verfuegbareMitarbeiter, setVerfuegbareMitarbeiter] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    verfuegbar: null,
    position: '',
    qualifikationen: []
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all employees
  const fetchMitarbeiter = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params
      };
      
      const result = await mitarbeiterService.getAll(queryParams);
      
      setMitarbeiter(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.pagination.total,
        pages: result.pagination.pages
      }));
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Fehler beim Laden der Mitarbeiter';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, addNotification]);

  // Fetch single employee
  const fetchMitarbeiterById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mitarbeiterService.getById(id);
      setCurrentMitarbeiter(result.data);
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Fehler beim Laden des Mitarbeiters';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Create new employee
  const createMitarbeiter = useCallback(async (mitarbeiterData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mitarbeiterService.create(mitarbeiterData);
      
      // Add to list
      setMitarbeiter(prev => [result.data, ...prev]);
      setCurrentMitarbeiter(result.data);
      
      addNotification({
        type: 'success',
        message: result.message || 'Mitarbeiter erfolgreich erstellt'
      });
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Fehler beim Erstellen des Mitarbeiters';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Update employee
  const updateMitarbeiter = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mitarbeiterService.update(id, updates);
      
      // Update in list
      setMitarbeiter(prev => prev.map(m => m._id === id ? result.data : m));
      
      // Update current if same
      if (currentMitarbeiter?._id === id) {
        setCurrentMitarbeiter(result.data);
      }
      
      addNotification({
        type: 'success',
        message: result.message || 'Mitarbeiter erfolgreich aktualisiert'
      });
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Fehler beim Aktualisieren des Mitarbeiters';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentMitarbeiter, addNotification]);

  // Delete employee
  const deleteMitarbeiter = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mitarbeiterService.delete(id);
      
      // Remove from list
      setMitarbeiter(prev => prev.filter(m => m._id !== id));
      
      // Clear current if same
      if (currentMitarbeiter?._id === id) {
        setCurrentMitarbeiter(null);
      }
      
      addNotification({
        type: 'success',
        message: result.message || 'Mitarbeiter erfolgreich gelöscht'
      });
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Fehler beim Löschen des Mitarbeiters';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentMitarbeiter, addNotification]);

  // Search employees
  const searchMitarbeiter = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const result = await mitarbeiterService.search(query);
      setSearchResults(result.data);
      return result;
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, []);

  // Get available employees for date
  const getVerfuegbareMitarbeiter = useCallback(async (datum) => {
    try {
      const result = await mitarbeiterService.getVerfuegbare(datum);
      setVerfuegbareMitarbeiter(result.data);
      return result;
    } catch (error) {
      console.error('Error fetching verfügbare Mitarbeiter:', error);
      setVerfuegbareMitarbeiter([]);
      throw error;
    }
  }, []);

  // Refresh employees
  const refreshMitarbeiter = useCallback(async () => {
    return await fetchMitarbeiter();
  }, [fetchMitarbeiter]);

  // Auto-fetch on mount if user is authenticated
  useEffect(() => {
    if (user) {
      fetchMitarbeiter();
    }
  }, [user]);

  // Apply filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user && (filters.search || filters.verfuegbar !== null || filters.position)) {
        fetchMitarbeiter({ page: 1 });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.search, filters.verfuegbar, filters.position]);

  // Context value
  const value = useMemo(() => ({
    mitarbeiter,
    currentMitarbeiter,
    loading,
    error,
    pagination,
    filters,
    searchResults,
    verfuegbareMitarbeiter,
    fetchMitarbeiter,
    fetchMitarbeiterById,
    createMitarbeiter,
    updateMitarbeiter,
    deleteMitarbeiter,
    searchMitarbeiter,
    getVerfuegbareMitarbeiter,
    setCurrentMitarbeiter,
    setFilters,
    setPagination,
    refreshMitarbeiter,
    clearError
  }), [
    mitarbeiter,
    currentMitarbeiter,
    loading,
    error,
    pagination,
    filters,
    searchResults,
    verfuegbareMitarbeiter,
    fetchMitarbeiter,
    fetchMitarbeiterById,
    createMitarbeiter,
    updateMitarbeiter,
    deleteMitarbeiter,
    searchMitarbeiter,
    getVerfuegbareMitarbeiter,
    refreshMitarbeiter,
    clearError
  ]);

  return (
    <MitarbeiterContext.Provider value={value}>
      {children}
    </MitarbeiterContext.Provider>
  );
};

export default MitarbeiterContext;
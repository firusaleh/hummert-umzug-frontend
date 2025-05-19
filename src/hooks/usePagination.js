// hooks/usePagination.js - Custom hook for pagination
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const usePagination = (initialLimit = 20) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial values from URL params
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit')) || initialLimit);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt:desc');
  const [filters, setFilters] = useState(() => {
    const filterObj = {};
    for (const [key, value] of searchParams.entries()) {
      if (!['page', 'limit', 'sortBy'].includes(key)) {
        filterObj[key] = value;
      }
    }
    return filterObj;
  });
  
  // Pagination state
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  
  // Update URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    if (sortBy) {
      params.set('sortBy', sortBy);
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    setSearchParams(params);
  }, [page, limit, sortBy, filters, setSearchParams]);
  
  // Build query string for API calls
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    if (sortBy) {
      params.set('sortBy', sortBy);
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    
    return params.toString();
  }, [page, limit, sortBy, filters]);
  
  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);
  
  // Handle limit change
  const handleLimitChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when limit changes
  }, []);
  
  // Handle sort change
  const handleSortChange = useCallback((field, order = 'asc') => {
    setSortBy(`${field}:${order}`);
    setPage(1); // Reset to first page when sort changes
  }, []);
  
  // Handle filter change
  const handleFilterChange = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value || undefined
    }));
    setPage(1); // Reset to first page when filters change
  }, []);
  
  // Handle multiple filters at once
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);
  
  // Clear specific filter
  const clearFilter = useCallback((filterKey) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
    setPage(1);
  }, []);
  
  // Update pagination info from API response
  const updatePaginationInfo = useCallback((paginationData) => {
    if (paginationData) {
      setTotalPages(paginationData.totalPages || 0);
      setTotalCount(paginationData.totalCount || 0);
      setHasNextPage(paginationData.hasNextPage || false);
      setHasPrevPage(paginationData.hasPrevPage || false);
    }
  }, []);
  
  // Get current sort field and order
  const getCurrentSort = useCallback(() => {
    if (!sortBy) return { field: null, order: null };
    const [field, order] = sortBy.split(':');
    return { field, order: order || 'asc' };
  }, [sortBy]);
  
  // Check if specific filter is active
  const isFilterActive = useCallback((filterKey) => {
    return !!filters[filterKey];
  }, [filters]);
  
  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  
  return {
    // Pagination state
    page,
    limit,
    sortBy,
    filters,
    totalPages,
    totalCount,
    hasNextPage,
    hasPrevPage,
    
    // Derived values
    queryString: buildQueryString(),
    currentSort: getCurrentSort(),
    activeFilterCount,
    
    // Handlers
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    handleFilterChange,
    handleFiltersChange,
    clearFilters,
    clearFilter,
    updatePaginationInfo,
    
    // Utilities
    isFilterActive,
    
    // Direct setters (use sparingly)
    setPage,
    setLimit,
    setSortBy,
    setFilters
  };
};

export default usePagination;
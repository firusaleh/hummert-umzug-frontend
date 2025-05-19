// hooks/useCursorPagination.js
import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const useCursorPagination = (endpoint, options = {}) => {
  const {
    initialPageSize = 10,
    initialFilters = {},
    autoLoad = true
  } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchData = useCallback(async (cursor = null, append = false) => {
    if (loading || (!hasMore && append)) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        pageSize: initialPageSize,
        ...filters
      });

      if (cursor) {
        queryParams.append('cursor', cursor);
      }

      const response = await api.get(`${endpoint}?${queryParams}`);
      const { data, pagination } = response.data;

      if (append) {
        setItems(prev => [...prev, ...data]);
      } else {
        setItems(data);
      }

      setHasMore(pagination.hasNextPage);
      setNextCursor(pagination.nextCursor);
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  }, [endpoint, initialPageSize, filters, loading, hasMore]);

  useEffect(() => {
    if (autoLoad) {
      fetchData();
    }
  }, []);

  const loadMore = useCallback(() => {
    if (nextCursor && hasMore && !loading) {
      return fetchData(nextCursor, true);
    }
    return Promise.resolve();
  }, [nextCursor, hasMore, loading, fetchData]);

  const refresh = useCallback(() => {
    setItems([]);
    setHasMore(true);
    setNextCursor(null);
    return fetchData();
  }, [fetchData]);

  const changeFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setItems([]);
    setHasMore(true);
    setNextCursor(null);
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    changeFilters
  };
};

export default useCursorPagination;
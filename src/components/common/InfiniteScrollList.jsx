// components/common/InfiniteScrollList.jsx - Infinite scroll container
import React, { useRef, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const InfiniteScrollList = ({
  items,
  renderItem,
  loading,
  hasMore,
  error,
  onLoadMore,
  threshold = 0.8, // Trigger when 80% scrolled
  emptyMessage = 'Keine Daten vorhanden',
  errorMessage = 'Fehler beim Laden der Daten',
  className = '',
  listClassName = '',
  itemClassName = '',
  showRefreshButton = false,
  onRefresh = null,
  gap = 4
}) => {
  const containerRef = useRef(null);
  const loadMoreRef = useRef(null);
  
  // Handle scroll to check if we need to load more
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return;
    
    const container = containerRef.current;
    const scrollPercentage = (container.scrollTop + container.clientHeight) / container.scrollHeight;
    
    if (scrollPercentage > threshold) {
      onLoadMore();
    }
  }, [loading, hasMore, onLoadMore, threshold]);
  
  // Set up intersection observer for load more trigger
  useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: '50px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    }, options);
    
    const currentLoadMoreRef = loadMoreRef.current;
    
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }
    
    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [hasMore, loading, onLoadMore]);
  
  // Add scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  // Refresh handler
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };
  
  if (error && items.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <p className="text-red-600 mb-4">{errorMessage}</p>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Erneut versuchen
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Refresh button */}
      {showRefreshButton && onRefresh && (
        <button
          onClick={handleRefresh}
          className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          title="Aktualisieren"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      )}
      
      {/* List container */}
      <div className={`${listClassName} space-y-${gap}`}>
        {items.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          items.map((item, index) => (
            <div key={item.id || index} className={itemClassName}>
              {renderItem(item, index)}
            </div>
          ))
        )}
        
        {/* Load more trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="h-1" />
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* End of list indicator */}
        {!hasMore && items.length > 0 && (
          <div className="text-center py-4 text-gray-500">
            Keine weiteren Einträge
          </div>
        )}
        
        {/* Error message for load more */}
        {error && items.length > 0 && (
          <div className="text-center py-4">
            <p className="text-red-600 mb-2">Fehler beim Laden weiterer Einträge</p>
            <button
              onClick={onLoadMore}
              className="text-blue-500 hover:text-blue-600"
            >
              Erneut versuchen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfiniteScrollList;
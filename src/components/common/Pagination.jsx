// src/components/common/Pagination.fixed.jsx
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import PropTypes from 'prop-types';

const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  totalCount = 0, 
  limit = 10, 
  onPageChange, 
  onLimitChange,
  showSizeChanger = true,
  showQuickJumper = true,
  pageSizeOptions = [10, 20, 50, 100],
  disabled = false,
  className = ''
}) => {
  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];
    let l;

    // Always show first page, last page, and pages around current page
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    // Add dots between gaps
    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }, [currentPage, totalPages]);

  // Calculate range display
  const startItem = Math.min((currentPage - 1) * limit + 1, totalCount);
  const endItem = Math.min(currentPage * limit, totalCount);

  // Handlers
  const handlePageChange = (page) => {
    if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleLimitChange = (newLimit) => {
    if (!disabled && newLimit !== limit) {
      onLimitChange(newLimit);
      // Reset to first page to avoid issues
      onPageChange(1);
    }
  };

  const handleQuickJump = (e) => {
    if (e.key === 'Enter' && !disabled) {
      const page = parseInt(e.target.value, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        handlePageChange(page);
        e.target.value = page; // Update input value
      } else {
        e.target.value = currentPage; // Reset to current page
      }
    }
  };

  // Don't render if no data
  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 ${className}`}>
      {/* Page size selector */}
      {showSizeChanger && (
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-gray-700">Anzeigen:</label>
          <select
            id="page-size"
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            disabled={disabled}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size} pro Seite</option>
            ))}
          </select>
        </div>
      )}

      {/* Page info */}
      <div className="text-sm text-gray-700">
        Zeige <span className="font-medium">{startItem}</span> bis{' '}
        <span className="font-medium">{endItem}</span> von{' '}
        <span className="font-medium">{totalCount}</span> Einträgen
      </div>

      {/* Page navigation */}
      <nav aria-label="Pagination Navigation" className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={disabled || currentPage === 1}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Erste Seite"
          title="Erste Seite"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Vorherige Seite"
          title="Vorherige Seite"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1" role="group" aria-label="Seitenzahlen">
          {pageNumbers.map((number, index) => (
            <React.Fragment key={index}>
              {number === '...' ? (
                <span className="px-3 py-1 text-gray-500" aria-hidden="true">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(number)}
                  disabled={disabled}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    number === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100'
                  } disabled:cursor-not-allowed`}
                  aria-label={`Gehe zu Seite ${number}`}
                  aria-current={number === currentPage ? 'page' : undefined}
                >
                  {number}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next page */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Nächste Seite"
          title="Nächste Seite"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={disabled || currentPage === totalPages}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Letzte Seite"
          title="Letzte Seite"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </nav>

      {/* Quick jumper */}
      {showQuickJumper && totalPages > 10 && (
        <div className="flex items-center gap-2">
          <label htmlFor="page-jumper" className="text-sm text-gray-700">Gehe zu:</label>
          <input
            id="page-jumper"
            type="number"
            min="1"
            max={totalPages}
            defaultValue={currentPage}
            disabled={disabled}
            onKeyPress={handleQuickJump}
            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Seitenzahl eingeben"
          />
        </div>
      )}
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  totalCount: PropTypes.number,
  limit: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  onLimitChange: PropTypes.func,
  showSizeChanger: PropTypes.bool,
  showQuickJumper: PropTypes.bool,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default Pagination;
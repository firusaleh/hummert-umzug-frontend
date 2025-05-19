// components/common/PaginatedTable.jsx - Table with built-in pagination
import React from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import Pagination from './Pagination';

const PaginatedTable = ({
  columns,
  data,
  loading,
  error,
  pagination,
  onPageChange,
  onLimitChange,
  onSortChange,
  currentSort = { field: null, order: null },
  actions = null,
  emptyMessage = 'Keine Daten vorhanden',
  className = '',
  tableClassName = '',
  striped = true,
  hoverable = true,
  compact = false
}) => {
  // Handle column sort
  const handleColumnSort = (column) => {
    if (!column.sortable || !onSortChange) return;
    
    const currentField = currentSort.field;
    const currentOrder = currentSort.order;
    
    let newOrder = 'asc';
    if (currentField === column.key) {
      // Toggle between asc, desc, and no sort
      if (currentOrder === 'asc') {
        newOrder = 'desc';
      } else if (currentOrder === 'desc') {
        onSortChange(null); // Clear sort
        return;
      }
    }
    
    onSortChange(column.key, newOrder);
  };
  
  // Get sort icon for column
  const getSortIcon = (column) => {
    if (!column.sortable) return null;
    
    const isActive = currentSort.field === column.key;
    const order = currentSort.order;
    
    if (!isActive) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    
    return order === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-500" />
      : <ChevronDown className="h-4 w-4 text-blue-500" />;
  };
  
  // Table row classes
  const getRowClasses = (index) => {
    const classes = [];
    
    if (striped && index % 2 === 1) {
      classes.push('bg-gray-50');
    }
    
    if (hoverable) {
      classes.push('hover:bg-gray-100');
    }
    
    return classes.join(' ');
  };
  
  // Cell classes
  const getCellClasses = () => {
    const classes = ['px-6', 'py-4', 'whitespace-nowrap', 'text-sm'];
    
    if (compact) {
      classes[1] = 'py-2'; // Reduce padding for compact mode
    }
    
    return classes.join(' ');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Fehler: {error}</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${tableClassName}`}>
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer select-none' : ''
                  }`}
                  onClick={() => handleColumnSort(column)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
              {actions && (
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Aktionen</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.id || index} className={getRowClasses(index)}>
                  {columns.map((column) => (
                    <td key={column.key} className={getCellClasses()}>
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                  {actions && (
                    <td className={`${getCellClasses()} text-right`}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          limit={pagination.limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
};

export default PaginatedTable;
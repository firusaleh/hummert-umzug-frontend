// pages/umzuege/UmzuegeList.paginated.jsx - Umzuege list with pagination
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Calendar } from 'lucide-react';
import PaginatedTable from '../../components/common/PaginatedTable';
import usePagination from '../../hooks/usePagination';
import { umzuegeService } from '../../services/api';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const UmzuegeList = () => {
  const navigate = useNavigate();
  const [umzuege, setUmzuege] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize pagination hook
  const {
    page,
    limit,
    sortBy,
    filters,
    queryString,
    currentSort,
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    handleFilterChange,
    updatePaginationInfo
  } = usePagination(20);
  
  // Column definitions
  const columns = [
    {
      key: 'referenzNummer',
      label: 'Referenz',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{value || '-'}</span>
      )
    },
    {
      key: 'termin',
      label: 'Termin',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          {format(new Date(value), 'dd.MM.yyyy', { locale: de })}
        </div>
      )
    },
    {
      key: 'kunde',
      label: 'Kunde',
      sortable: false,
      render: (value) => (
        <div>
          <div className="font-medium">{value.name}</div>
          {value.firma && (
            <div className="text-sm text-gray-500">{value.firma}</div>
          )}
        </div>
      )
    },
    {
      key: 'vonAdresse',
      label: 'Von',
      sortable: false,
      render: (value) => (
        <div className="text-sm">
          <div>{value.strasse} {value.hausnummer}</div>
          <div>{value.plz} {value.ort}</div>
        </div>
      )
    },
    {
      key: 'nachAdresse',
      label: 'Nach',
      sortable: false,
      render: (value) => (
        <div className="text-sm">
          <div>{value.strasse} {value.hausnummer}</div>
          <div>{value.plz} {value.ort}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors = {
          'Anfrage': 'bg-gray-100 text-gray-800',
          'Bestätigt': 'bg-blue-100 text-blue-800',
          'In Bearbeitung': 'bg-yellow-100 text-yellow-800',
          'Abgeschlossen': 'bg-green-100 text-green-800',
          'Storniert': 'bg-red-100 text-red-800'
        };
        
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value] || ''}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'kosten',
      label: 'Gesamt',
      sortable: true,
      render: (value) => {
        if (!value || !value.gesamtBrutto) return '-';
        return (
          <span className="font-medium">
            €{value.gesamtBrutto.toFixed(2)}
          </span>
        );
      }
    }
  ];
  
  // Fetch data
  useEffect(() => {
    fetchUmzuege();
  }, [queryString]);
  
  const fetchUmzuege = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await umzuegeService.getAll(`?${queryString}`);
      
      if (response.data.success) {
        setUmzuege(response.data.data);
        updatePaginationInfo(response.data.pagination);
      } else {
        setError(response.data.message || 'Fehler beim Laden der Umzüge');
      }
    } catch (err) {
      setError('Fehler beim Laden der Umzüge');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Status filter options
  const statusOptions = [
    { value: '', label: 'Alle Status' },
    { value: 'Anfrage', label: 'Anfrage' },
    { value: 'Bestätigt', label: 'Bestätigt' },
    { value: 'In Bearbeitung', label: 'In Bearbeitung' },
    { value: 'Abgeschlossen', label: 'Abgeschlossen' },
    { value: 'Storniert', label: 'Storniert' }
  ];
  
  // Actions column
  const actions = (row) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(`/umzuege/${row._id}`)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Details anzeigen"
      >
        <Eye className="h-4 w-4 text-gray-600" />
      </button>
      <button
        onClick={() => navigate(`/umzuege/${row._id}/bearbeiten`)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Bearbeiten"
      >
        <Edit2 className="h-4 w-4 text-blue-600" />
      </button>
      <button
        onClick={() => handleDelete(row._id)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Löschen"
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </button>
    </div>
  );
  
  const handleDelete = async (id) => {
    if (!window.confirm('Möchten Sie diesen Umzug wirklich löschen?')) {
      return;
    }
    
    try {
      await umzuegeService.delete(id);
      fetchUmzuege();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Umzüge</h1>
        <button
          onClick={() => navigate('/umzuege/neu')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Neuer Umzug
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suche
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Name, Firma, Referenz..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Von Datum
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bis Datum
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Table */}
      <PaginatedTable
        columns={columns}
        data={umzuege}
        loading={loading}
        error={error}
        pagination={{
          currentPage: page,
          totalPages: 0, // Will be updated by updatePaginationInfo
          totalCount: 0, // Will be updated by updatePaginationInfo
          limit: limit
        }}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSortChange={handleSortChange}
        currentSort={currentSort}
        actions={actions}
        emptyMessage="Keine Umzüge gefunden"
      />
    </div>
  );
};

export default UmzuegeList;
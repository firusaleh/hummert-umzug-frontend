// src/pages/umzuege/UmzuegeList.fixed.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Plus, 
  Download,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Truck
} from 'lucide-react';
import api from '../../services/api.fixed';
import { useApp } from '../../context/AppContext';
import { useNotification } from '../../context/NotificationContext';
import Pagination from '../../components/common/Pagination.fixed';
import { dateUtils, stringUtils } from '../../services/utils';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    geplant: { bgColor: 'bg-blue-100', textColor: 'text-blue-800', label: 'Geplant' },
    in_bearbeitung: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', label: 'In Bearbeitung' },
    abgeschlossen: { bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Abgeschlossen' },
    storniert: { bgColor: 'bg-red-100', textColor: 'text-red-800', label: 'Storniert' },
    angefragt: { bgColor: 'bg-purple-100', textColor: 'text-purple-800', label: 'Angefragt' }
  };
  
  const config = statusConfig[status] || { 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-800', 
    label: status || 'Unbekannt' 
  };
  
  return (
    <span 
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bgColor} ${config.textColor}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  );
};

// Type Badge Component
const TypeBadge = ({ type }) => {
  const typeConfig = {
    Privat: { bgColor: 'bg-green-100', textColor: 'text-green-800' },
    Gewerbe: { bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    Senioren: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    International: { bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    Spezialtransport: { bgColor: 'bg-orange-100', textColor: 'text-orange-800' }
  };
  
  const config = typeConfig[type] || { 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-800' 
  };
  
  return (
    <span 
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bgColor} ${config.textColor}`}
      role="status"
      aria-label={`Typ: ${type}`}
    >
      {type || 'Standard'}
    </span>
  );
};

const UmzuegeList = () => {
  const navigate = useNavigate();
  const { setLoading, setError } = useApp();
  const { addNotification } = useNotification();
  
  // State
  const [umzuege, setUmzuege] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sort, setSort] = useState({
    field: 'startDatum',
    order: 'desc'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState(null);

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return 'Keine Adresse';
    
    if (typeof address === 'string') return address;
    
    if (typeof address === 'object') {
      const parts = [
        address.strasse && address.hausnummer ? `${address.strasse} ${address.hausnummer}` : address.strasse,
        address.plz,
        address.ort,
        address.land
      ].filter(Boolean);
      
      return parts.join(', ') || 'Keine Adresse';
    }
    
    return 'Ungültiges Adressformat';
  };

  // Get customer name
  const getKundenname = (umzug) => {
    if (!umzug) return 'Unbekannt';
    
    return umzug.kunde || 
           umzug.auftraggeber?.name || 
           (umzug.kundennummer ? `Kunde #${umzug.kundennummer}` : null) ||
           'Unbekannt';
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: `${sort.order === 'desc' ? '-' : ''}${sort.field}`,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await api.umzug.getAll(params);
      
      if (response.success) {
        setUmzuege(response.data.items || []);
        setPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        });
      } else {
        throw new Error(response.error?.message || 'Fehler beim Laden der Daten');
      }
    } catch (error) {
      console.error('Error fetching umzuege:', error);
      setErrorState(error.message || 'Fehler beim Laden der Umzüge');
      addNotification({
        type: 'error',
        title: 'Fehler',
        message: 'Die Umzüge konnten nicht geladen werden.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, sort, filters, addNotification]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle pagination change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle page size change
  const handlePageSizeChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle sort change
  const handleSortChange = (field) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await api.umzug.export(filters);
      
      if (response.success) {
        // Create download link
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `umzuege_export_${dateUtils.formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        addNotification({
          type: 'success',
          title: 'Export erfolgreich',
          message: 'Die Umzüge wurden erfolgreich exportiert.'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      addNotification({
        type: 'error',
        title: 'Export fehlgeschlagen',
        message: 'Die Umzüge konnten nicht exportiert werden.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    fetchData();
  };

  // Render error state
  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Umzüge</h1>
          <Link 
            to="/umzuege/neu" 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center transition-colors"
          >
            <Plus size={16} className="mr-2" /> Neuer Umzug
          </Link>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Fehler beim Laden der Daten</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Erneut versuchen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Umzüge</h1>
        <Link 
          to="/umzuege/neu" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center transition-colors"
        >
          <Plus size={16} className="mr-2" /> Neuer Umzug
        </Link>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Suche nach Kunde, Adresse..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <select
              className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Alle Status</option>
              <option value="geplant">Geplant</option>
              <option value="in_bearbeitung">In Bearbeitung</option>
              <option value="abgeschlossen">Abgeschlossen</option>
              <option value="angefragt">Angefragt</option>
              <option value="storniert">Storniert</option>
            </select>
            <Filter size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Type Filter */}
          <div className="relative">
            <select
              className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">Alle Typen</option>
              <option value="Privat">Privat</option>
              <option value="Gewerbe">Gewerbe</option>
              <option value="Senioren">Senioren</option>
              <option value="International">International</option>
              <option value="Spezialtransport">Spezialtransport</option>
            </select>
            <Filter size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Export Button */}
          <button 
            onClick={handleExport}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
          >
            <Download size={18} className="mr-2" /> Export
          </button>
        </div>
        
        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Von Datum</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bis Datum</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange('kunde')}
                >
                  <div className="flex items-center">
                    Kunde
                    {sort.field === 'kunde' && (
                      <span className="ml-1">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange('typ')}
                >
                  <div className="flex items-center">
                    Typ
                    {sort.field === 'typ' && (
                      <span className="ml-1">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sort.field === 'status' && (
                      <span className="ml-1">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSortChange('startDatum')}
                >
                  <div className="flex items-center">
                    Datum
                    {sort.field === 'startDatum' && (
                      <span className="ml-1">{sort.order === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Von → Nach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Lade Umzüge...</span>
                    </div>
                  </td>
                </tr>
              ) : umzuege.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <Truck className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 text-lg font-medium mb-1">Keine Umzüge gefunden</p>
                      <p className="text-gray-400 text-sm">
                        {filters.search || filters.status || filters.type || filters.dateFrom || filters.dateTo
                          ? "Versuchen Sie, Ihre Filterkriterien anzupassen"
                          : "Erstellen Sie Ihren ersten Umzug über den 'Neuer Umzug' Button"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                umzuege.map((umzug) => (
                  <tr 
                    key={umzug._id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/umzuege/${umzug._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getKundenname(umzug)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TypeBadge type={umzug.typ} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={umzug.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        {dateUtils.formatDate(umzug.startDatum)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin size={16} className="mr-1 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]" title={formatAddress(umzug.auszugsadresse)}>
                            {stringUtils.truncate(formatAddress(umzug.auszugsadresse), 30)}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <ChevronRight size={16} className="mr-1 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]" title={formatAddress(umzug.einzugsadresse)}>
                            {stringUtils.truncate(formatAddress(umzug.einzugsadresse), 30)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {umzug.mitarbeiter?.length || 0} MA
                        {umzug.fahrzeuge?.length > 0 && `, ${umzug.fahrzeuge.length} Fahrzeuge`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                        <Link 
                          to={`/umzuege/${umzug._id}`} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Details
                        </Link>
                        <Link 
                          to={`/umzuege/${umzug._id}/bearbeiten`} 
                          className="text-green-600 hover:text-green-900"
                        >
                          Bearbeiten
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {umzuege.length > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
            onLimitChange={handlePageSizeChange}
            disabled={isLoading}
          />
        )}
      </div>
    </div>
  );
};

export default UmzuegeList;
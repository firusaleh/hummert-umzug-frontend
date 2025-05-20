// src/pages/umzuege/UmzuegeList.jsx - Enhanced version with security and error handling
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Plus, 
  Download,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import PaginatedTable from '../../components/common/PaginatedTable';
import usePagination from '../../hooks/usePagination';
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

const UmzuegeList = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: umzuege,
    loading,
    error,
    pagination,
    sort,
    changePage,
    changePageSize,
    changeSort,
    changeFilters,
    changeSearch,
    refresh
  } = usePagination('/umzuege', {
    initialPageSize: 10,
    initialSort: { sortBy: 'startDatum', sortOrder: 'desc' }
  });

  // Columns definition for the table
  const columns = [
    { key: 'kunde', label: 'Kunde', sortable: true },
    { key: 'typ', label: 'Typ', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'startDatum', label: 'Datum', sortable: true },
    { key: 'auszugsadresse', label: 'Start', sortable: false },
    { key: 'einzugsadresse', label: 'Ziel', sortable: false },
    { key: 'team', label: 'Team', sortable: false },
    { key: 'actions', label: 'Aktionen', sortable: false, width: '150px' }
  ];

  // Helper functions with proper error handling
  const formatAddress = useCallback((address) => {
    try {
      if (!address) return 'Keine Adresse';
      
      if (typeof address === 'string') {
        return stringUtils.sanitize(address);
      }
      
      if (typeof address === 'object') {
        const { strasse, hausnummer, plz, ort, land } = address;
        const parts = [
          strasse && hausnummer ? `${strasse} ${hausnummer}` : strasse || '',
          plz || '',
          ort || '',
          land || ''
        ].filter(Boolean);
        return stringUtils.sanitize(parts.join(', '));
      }
      
      return 'Ungültiges Adressformat';
    } catch (err) {
      return 'Adressfehler';
    }
  }, []);

  const getKundenname = useCallback((umzug) => {
    try {
      if (!umzug) return 'Unbekannt';
      
      if (umzug.kunde) return stringUtils.sanitize(umzug.kunde);
      if (umzug.auftraggeber?.name) return stringUtils.sanitize(umzug.auftraggeber.name);
      if (umzug.kundennummer) return `Kunde #${umzug.kundennummer}`;
      
      return 'Unbekannt';
    } catch (err) {
      return 'Unbekannt';
    }
  }, []);

  // Filter handling
  useEffect(() => {
    const filters = {};
    
    if (statusFilter) {
      filters.status = statusFilter;
    }
    
    if (typeFilter) {
      filters.typ = typeFilter;
    }
    
    changeFilters(filters);
  }, [statusFilter, typeFilter, changeFilters]);

  // Search handling with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      changeSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, changeSearch]);

  // Export handler
  const handleExport = async () => {
    try {
      setIsExporting(true);
      // TODO: Implement export functionality
      // await api.export('umzuege', { format: 'csv', filters: activeFilters });
    } catch (err) {
      // Error handling without logging sensitive data
    } finally {
      setIsExporting(false);
    }
  };

  // Row renderer for the table
  const renderRow = (umzug, index) => (
    <tr key={umzug._id || umzug.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{getKundenname(umzug)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{umzug.typ || 'Nicht angegeben'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={umzug.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500 flex items-center">
          <Calendar size={16} className="mr-2 text-gray-400" />
          {umzug.startDatum ? dateUtils.formatDate(umzug.startDatum) : 'Kein Datum'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500 flex items-center">
          <MapPin size={16} className="mr-2 text-gray-400" />
          <div className="truncate max-w-xs">{formatAddress(umzug.auszugsadresse)}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500 flex items-center">
          <MapPin size={16} className="mr-2 text-gray-400" />
          <div className="truncate max-w-xs">{formatAddress(umzug.einzugsadresse)}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {Array.isArray(umzug.mitarbeiter) ? `${umzug.mitarbeiter.length} MA` : '0 MA'}
          {Array.isArray(umzug.fahrzeuge) && `, ${umzug.fahrzeuge.length} Fahrzeuge`}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link 
          to={`/umzuege/${umzug._id || umzug.id}`} 
          className="text-blue-600 hover:text-blue-900 mr-3"
          aria-label={`Details für Umzug ${getKundenname(umzug)}`}
        >
          Details
        </Link>
        <Link 
          to={`/umzuege/${umzug._id || umzug.id}/bearbeiten`} 
          className="text-blue-600 hover:text-blue-900"
          aria-label={`Bearbeiten von Umzug ${getKundenname(umzug)}`}
        >
          Bearbeiten
        </Link>
      </td>
    </tr>
  );

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Umzüge</h1>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Fehler beim Laden der Daten</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Die Umzugsdaten konnten nicht geladen werden. Bitte versuchen Sie es erneut.</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Neu laden
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Umzüge</h1>
        <Link 
          to="/umzuege/neu" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" /> Neuer Umzug
        </Link>
      </div>
      
      {/* Search and filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Suche nach Kunde, Adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Suchfeld"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Status-Filter"
              >
                <option value="">Alle Status</option>
                <option value="geplant">Geplant</option>
                <option value="in_bearbeitung">In Bearbeitung</option>
                <option value="abgeschlossen">Abgeschlossen</option>
                <option value="angefragt">Angefragt</option>
                <option value="storniert">Storniert</option>
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Typ-Filter"
              >
                <option value="">Alle Typen</option>
                <option value="Privat">Privat</option>
                <option value="Gewerbe">Gewerbe</option>
                <option value="Senioren">Senioren</option>
                <option value="International">International</option>
                <option value="Spezialtransport">Spezialtransport</option>
              </select>
            </div>
            
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center disabled:opacity-50"
              aria-label="Daten exportieren"
            >
              <Download size={18} className="mr-2" /> 
              {isExporting ? 'Exportiere...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Paginated table */}
      <PaginatedTable
        columns={columns}
        data={umzuege}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={changePage}
        onPageSizeChange={changePageSize}
        onSortChange={changeSort}
        currentSort={sort}
        renderRow={renderRow}
        emptyMessage={
          searchTerm || statusFilter || typeFilter
            ? "Es wurden keine Umzüge gefunden, die Ihren Filterkriterien entsprechen. Bitte passen Sie Ihre Suche an oder entfernen Sie die Filter."
            : "Es sind noch keine Umzüge im System eingetragen. Erstellen Sie Ihren ersten Umzug über den 'Neuer Umzug' Button."
        }
      />
    </div>
  );
};

export default UmzuegeList;
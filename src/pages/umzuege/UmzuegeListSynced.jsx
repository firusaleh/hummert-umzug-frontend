// Enhanced UmzuegeList with real-time data synchronization
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Plus, 
  Download,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import PaginatedTable from '../../components/common/PaginatedTable';
import { useDataSync } from '../../context/DataSyncContext';
import { useUmzug } from '../../context/UmzugContext';
import { useApp } from '../../context/AppContext';
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

// Sync Status Indicator
const SyncStatus = ({ connected, syncing, lastSync }) => {
  const getStatusColor = () => {
    if (syncing) return 'text-yellow-500';
    if (connected) return 'text-green-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (syncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    return connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (syncing) return 'Synchronisiere...';
    if (connected) return 'Verbunden';
    return 'Offline';
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`flex items-center ${getStatusColor()}`}>
        {getStatusIcon()}
      </span>
      <span className="text-sm text-gray-600">{getStatusText()}</span>
      {lastSync && !syncing && (
        <span className="text-xs text-gray-500">
          (Zuletzt: {new Date(lastSync).toLocaleTimeString('de-DE')})
        </span>
      )}
    </div>
  );
};

const UmzuegeListSynced = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [localChanges, setLocalChanges] = useState(new Set());

  // Context hooks
  const { addNotification } = useApp();
  const { connected, syncing, lastSync, subscribe, syncEntity } = useDataSync();
  const { 
    umzuege, 
    loading, 
    error, 
    pagination, 
    fetchUmzuege, 
    setFilters,
    setPagination 
  } = useUmzug();

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribe('umzug', (eventType, data) => {
      switch (eventType) {
        case 'create':
          addNotification({
            type: 'info',
            message: `Neuer Umzug erstellt: ${data.entity.kundenname}`,
            duration: 4000
          });
          break;
        case 'update':
          // Track if this was a remote update
          if (!localChanges.has(data.entityId)) {
            addNotification({
              type: 'info',
              message: 'Umzugsdaten wurden aktualisiert',
              duration: 3000
            });
          } else {
            // Remove from local changes after successful sync
            setLocalChanges(prev => {
              const updated = new Set(prev);
              updated.delete(data.entityId);
              return updated;
            });
          }
          break;
        case 'delete':
          addNotification({
            type: 'warning',
            message: 'Ein Umzug wurde gelöscht',
            duration: 4000
          });
          break;
      }
    });

    return unsubscribe;
  }, [subscribe, addNotification, localChanges]);

  // Initial data fetch
  useEffect(() => {
    fetchUmzuege();
  }, []);

  // Apply filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters({
        status: statusFilter,
        type: typeFilter,
        search: searchTerm
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [statusFilter, typeFilter, searchTerm, setFilters]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = [...umzuege];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(umzug => 
        umzug.kundenname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        umzug.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        umzug.telefonnummer?.includes(searchTerm) ||
        umzug.adresseAlt?.ort?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        umzug.adresseNeu?.ort?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(umzug => umzug.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(umzug => umzug.type === typeFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.umzugsdatum) - new Date(a.umzugsdatum));

    return filtered;
  }, [umzuege, searchTerm, statusFilter, typeFilter]);

  // Manual sync
  const handleManualSync = async () => {
    try {
      await syncEntity('umzug');
      addNotification({
        type: 'success',
        message: 'Daten wurden erfolgreich synchronisiert',
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Synchronisation fehlgeschlagen',
        duration: 5000
      });
    }
  };

  // Export functionality
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvData = filteredData.map(umzug => ({
        Datum: dateUtils.formatDate(umzug.umzugsdatum),
        Kunde: umzug.kundenname,
        'Von Ort': umzug.adresseAlt?.ort || '',
        'Nach Ort': umzug.adresseNeu?.ort || '',
        Status: umzug.status,
        'Anzahl Mitarbeiter': umzug.mitarbeiter?.length || 0,
        'Anzahl Fahrzeuge': umzug.fahrzeuge?.length || 0
      }));

      // Convert to CSV
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `umzuege_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      addNotification({
        type: 'success',
        message: 'Export erfolgreich',
        duration: 3000
      });
    } catch (error) {
      console.error('Export error:', error);
      addNotification({
        type: 'error',
        message: 'Export fehlgeschlagen',
        duration: 5000
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Table columns configuration
  const columns = [
    {
      header: 'Datum',
      accessor: 'umzugsdatum',
      cell: (value) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span className="font-medium">{dateUtils.formatDate(value)}</span>
        </div>
      )
    },
    {
      header: 'Kunde',
      accessor: 'kundenname',
      cell: (value, row) => (
        <Link 
          to={`/umzuege/${row._id}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {value}
          {row._pending && (
            <span className="ml-2 text-xs text-yellow-600">(Ausstehend)</span>
          )}
        </Link>
      )
    },
    {
      header: 'Route',
      accessor: 'route',
      cell: (value, row) => (
        <div className="flex items-center text-sm">
          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
          <span>{row.adresseAlt?.ort || 'N/A'}</span>
          <span className="mx-2">→</span>
          <span>{row.adresseNeu?.ort || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value) => <StatusBadge status={value} />
    },
    {
      header: 'Team',
      accessor: 'team',
      cell: (value, row) => (
        <div className="text-sm">
          <div>{row.mitarbeiter?.length || 0} Mitarbeiter</div>
          <div className="text-gray-500">{row.fahrzeuge?.length || 0} Fahrzeuge</div>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Fehler beim Laden der Daten</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <button
                  onClick={() => fetchUmzuege()}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
                >
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Umzüge</h1>
              <p className="mt-2 text-sm text-gray-600">
                Verwalten Sie alle Umzugsaufträge und deren Status
              </p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <SyncStatus connected={connected} syncing={syncing} lastSync={lastSync} />
              <Link
                to="/umzuege/neu"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neuer Umzug
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Suchen..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Alle Status</option>
                  <option value="angefragt">Angefragt</option>
                  <option value="geplant">Geplant</option>
                  <option value="in_bearbeitung">In Bearbeitung</option>
                  <option value="abgeschlossen">Abgeschlossen</option>
                  <option value="storniert">Storniert</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Alle Typen</option>
                  <option value="privat">Privat</option>
                  <option value="gewerbe">Gewerbe</option>
                  <option value="buero">Büro</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Sync
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting || loading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          {filteredData.length} von {umzuege.length} Umzügen
          {localChanges.size > 0 && (
            <span className="ml-2 text-yellow-600">
              ({localChanges.size} lokale Änderungen)
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <PaginatedTable
            data={filteredData}
            columns={columns}
            loading={loading}
            pagination={{
              ...pagination,
              page: pagination.page || 1,
              totalPages: Math.ceil(filteredData.length / (pagination.limit || 10))
            }}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            emptyMessage="Keine Umzüge gefunden"
          />
        </div>
      </div>
    </div>
  );
};

export default UmzuegeListSynced;
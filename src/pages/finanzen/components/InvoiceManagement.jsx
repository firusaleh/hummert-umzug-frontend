import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Receipt, Plus, Search, Filter, Download, Edit2, Trash2, 
  Eye, Send, CheckCircle, XCircle, AlertTriangle, Clock,
  FileText, Mail, Euro, Calendar, User, MoreVertical,
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import financeService from '../../../services/financeService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { debounce } from 'lodash';

const STATUS_CONFIG = {
  entwurf: { label: 'Entwurf', color: 'bg-gray-100 text-gray-800', icon: FileText },
  versendet: { label: 'Versendet', color: 'bg-blue-100 text-blue-800', icon: Send },
  bezahlt: { label: 'Bezahlt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  teilweise_bezahlt: { label: 'Teilweise bezahlt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ueberfaellig: { label: 'Überfällig', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  storniert: { label: 'Storniert', color: 'bg-gray-100 text-gray-600', icon: XCircle }
};

export default function InvoiceManagement() {
  const navigate = useNavigate();
  
  // State management
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showActions, setShowActions] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    },
    sortBy: 'rechnungsdatum',
    sortOrder: 'desc'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: `${filters.sortOrder === 'desc' ? '-' : ''}${filters.sortBy}`,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateRange.start && { startDate: filters.dateRange.start }),
        ...(filters.dateRange.end && { endDate: filters.dateRange.end })
      };
      
      const response = await financeService.getInvoices(params);
      
      setInvoices(response.data || response);
      setPagination(prev => ({
        ...prev,
        total: response.total || response.length,
        totalPages: response.totalPages || Math.ceil((response.total || response.length) / prev.limit)
      }));
      
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Fehler beim Laden der Rechnungen');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value) => {
      setFilters(prev => ({ ...prev, search: value }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300),
    []
  );

  // Event handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    financeService.clearCache();
    fetchInvoices();
  };

  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map(inv => inv._id));
    }
  };

  const handleViewInvoice = (invoice) => {
    navigate(`/finanzen/rechnungen/${invoice._id}`);
  };

  const handleEditInvoice = (invoice) => {
    navigate(`/finanzen/rechnungen/${invoice._id}/bearbeiten`);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await financeService.deleteInvoice(invoiceId);
      setShowDeleteConfirm(null);
      fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert('Fehler beim Löschen der Rechnung: ' + err.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedInvoices.length === 0) return;
    
    try {
      switch (action) {
        case 'delete':
          if (confirm(`Möchten Sie ${selectedInvoices.length} Rechnungen wirklich löschen?`)) {
            await financeService.bulkDeleteInvoices(selectedInvoices);
            setSelectedInvoices([]);
            fetchInvoices();
          }
          break;
        case 'markPaid':
          await financeService.bulkUpdateInvoiceStatus(selectedInvoices, 'bezahlt');
          setSelectedInvoices([]);
          fetchInvoices();
          break;
        case 'markSent':
          await financeService.bulkUpdateInvoiceStatus(selectedInvoices, 'versendet');
          setSelectedInvoices([]);
          fetchInvoices();
          break;
        case 'export':
          await financeService.exportData('invoices', 'csv', {
            invoiceIds: selectedInvoices
          });
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      alert('Fehler bei der Aktion: ' + err.message);
    }
  };

  const handleSendInvoice = async (invoice) => {
    try {
      // TODO: Implement email sending
      await financeService.updateInvoiceStatus(invoice._id, 'versendet');
      fetchInvoices();
      alert('Rechnung wurde versendet');
    } catch (err) {
      console.error('Error sending invoice:', err);
      alert('Fehler beim Versenden: ' + err.message);
    }
  };

  const handleMarkAsPaid = async (invoice) => {
    try {
      await financeService.markInvoiceAsPaid(invoice._id);
      fetchInvoices();
    } catch (err) {
      console.error('Error marking as paid:', err);
      alert('Fehler beim Markieren als bezahlt: ' + err.message);
    }
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const stats = {
      total: invoices.length,
      totalAmount: 0,
      paid: 0,
      paidAmount: 0,
      open: 0,
      openAmount: 0,
      overdue: 0,
      overdueAmount: 0
    };
    
    invoices.forEach(invoice => {
      stats.totalAmount += invoice.gesamtbetrag || 0;
      
      if (invoice.status === 'bezahlt') {
        stats.paid++;
        stats.paidAmount += invoice.gesamtbetrag || 0;
      } else if (invoice.status !== 'storniert') {
        stats.open++;
        stats.openAmount += invoice.gesamtbetrag || 0;
        
        if (invoice.status === 'ueberfaellig' || 
            (invoice.faelligkeitsdatum && isAfter(new Date(), parseISO(invoice.faelligkeitsdatum)))) {
          stats.overdue++;
          stats.overdueAmount += invoice.gesamtbetrag || 0;
        }
      }
    });
    
    return stats;
  }, [invoices]);

  if (loading && !isRefreshing) {
    return <LoadingSpinner message="Lade Rechnungen..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Gesamt</p>
            <p className="text-2xl font-bold text-gray-900">
              {summaryStats.totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-xs text-gray-500">{summaryStats.total} Rechnungen</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Bezahlt</p>
            <p className="text-2xl font-bold text-green-600">
              {summaryStats.paidAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-xs text-gray-500">{summaryStats.paid} Rechnungen</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Offen</p>
            <p className="text-2xl font-bold text-yellow-600">
              {summaryStats.openAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-xs text-gray-500">{summaryStats.open} Rechnungen</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Überfällig</p>
            <p className="text-2xl font-bold text-red-600">
              {summaryStats.overdueAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-xs text-gray-500">{summaryStats.overdue} Rechnungen</p>
          </div>
        </div>
      </div>

      {/* Filters and actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-1 items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suchen nach Nummer, Kunde..."
                  onChange={handleSearch}
                  className="pl-10 pr-3 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              {/* Status filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Alle Status</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              
              {/* Refresh */}
              <button
                onClick={handleRefresh}
                className={`p-2 text-gray-400 hover:text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
                disabled={isRefreshing}
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Bulk actions */}
              {selectedInvoices.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedInvoices.length} ausgewählt
                  </span>
                  <button
                    onClick={() => handleBulkAction('markPaid')}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Als bezahlt markieren
                  </button>
                  <button
                    onClick={() => handleBulkAction('export')}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Exportieren
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Löschen
                  </button>
                </div>
              )}
              
              {/* Create new */}
              <button
                onClick={() => navigate('/finanzen/rechnungen/neu')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neue Rechnung
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('rechnungsnummer')}
                >
                  Nummer
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('rechnungsdatum')}
                >
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunde
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('gesamtbetrag')}
                >
                  Betrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('faelligkeitsdatum')}
                >
                  Fälligkeit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const StatusIcon = STATUS_CONFIG[invoice.status]?.icon || FileText;
                const isOverdue = invoice.status !== 'bezahlt' && invoice.status !== 'storniert' &&
                  invoice.faelligkeitsdatum && isAfter(new Date(), parseISO(invoice.faelligkeitsdatum));
                
                return (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice._id)}
                        onChange={() => handleSelectInvoice(invoice._id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        {invoice.rechnungsnummer}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(invoice.rechnungsdatum), 'dd.MM.yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.kunde?.name || invoice.kundeName || 'Unbekannt'}
                      </div>
                      {invoice.projekt && (
                        <div className="text-xs text-gray-500">{invoice.projekt.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.gesamtbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isOverdue ? STATUS_CONFIG.ueberfaellig.color : STATUS_CONFIG[invoice.status]?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {isOverdue ? 'Überfällig' : STATUS_CONFIG[invoice.status]?.label || invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.faelligkeitsdatum 
                        ? format(parseISO(invoice.faelligkeitsdatum), 'dd.MM.yyyy')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === invoice._id ? null : invoice._id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {showActions === invoice._id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleViewInvoice(invoice);
                                  setShowActions(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <Eye className="h-4 w-4 mr-3" />
                                Anzeigen
                              </button>
                              <button
                                onClick={() => {
                                  handleEditInvoice(invoice);
                                  setShowActions(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <Edit2 className="h-4 w-4 mr-3" />
                                Bearbeiten
                              </button>
                              {invoice.status === 'entwurf' && (
                                <button
                                  onClick={() => {
                                    handleSendInvoice(invoice);
                                    setShowActions(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                >
                                  <Send className="h-4 w-4 mr-3" />
                                  Versenden
                                </button>
                              )}
                              {invoice.status !== 'bezahlt' && invoice.status !== 'storniert' && (
                                <button
                                  onClick={() => {
                                    handleMarkAsPaid(invoice);
                                    setShowActions(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                >
                                  <CheckCircle className="h-4 w-4 mr-3" />
                                  Als bezahlt markieren
                                </button>
                              )}
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(invoice._id);
                                  setShowActions(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full"
                              >
                                <Trash2 className="h-4 w-4 mr-3" />
                                Löschen
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {invoices.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Keine Rechnungen gefunden</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Zeige {((pagination.page - 1) * pagination.limit) + 1} bis{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} von{' '}
                {pagination.total} Einträgen
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-3 py-1 text-sm">
                  Seite {pagination.page} von {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Rechnung löschen
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Möchten Sie diese Rechnung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDeleteInvoice(showDeleteConfirm)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside handler for action menu */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(null)}
        />
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
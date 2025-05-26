import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Search, Edit2, Trash2, Eye, Send, 
  CheckCircle, XCircle, AlertTriangle, FileText,
  ChevronLeft, ChevronRight, RefreshCw, Filter, Download,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import PaymentTracking from './PaymentTracking';

const STATUS_CONFIG = {
  entwurf: { label: 'Entwurf', color: 'bg-gray-100 text-gray-800', icon: FileText },
  versendet: { label: 'Versendet', color: 'bg-blue-100 text-blue-800', icon: Send },
  bezahlt: { label: 'Bezahlt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ueberfaellig: { label: 'Überfällig', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  storniert: { label: 'Storniert', color: 'bg-gray-100 text-gray-600', icon: XCircle }
};

export default function InvoiceManagement() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPaymentTracking, setShowPaymentTracking] = useState(null);
  
  const itemsPerPage = 10;
  
  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setError(null);
      const response = await api.get('/finanzen/rechnungen', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          status: statusFilter
        }
      });
      
      const data = response.data?.data || response.data || [];
      const invoicesList = Array.isArray(data) ? data : [];
      
      setInvoices(invoicesList);
      setTotalPages(response.data?.totalPages || Math.ceil(invoicesList.length / itemsPerPage) || 1);
      
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Fehler beim Laden der Rechnungen');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchInvoices();
  }, [currentPage, searchTerm, statusFilter]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };
  
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices(invoices.map(inv => inv._id));
    } else {
      setSelectedInvoices([]);
    }
  };
  
  const handleSelectInvoice = (id) => {
    setSelectedInvoices(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };
  
  const handleDeleteInvoice = async (id) => {
    try {
      await api.delete(`/finanzen/rechnungen/${id}`);
      setDeleteConfirm(null);
      fetchInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert('Fehler beim Löschen der Rechnung');
    }
  };
  
  const handleMarkAsPaid = async (id) => {
    try {
      await api.put(`/finanzen/rechnungen/${id}`, { status: 'bezahlt' });
      fetchInvoices();
    } catch (err) {
      console.error('Error updating invoice:', err);
      alert('Fehler beim Aktualisieren der Rechnung');
    }
  };
  
  const getStatusDisplay = (invoice) => {
    // Check if overdue
    if (invoice.status !== 'bezahlt' && invoice.status !== 'storniert' && invoice.faelligkeitsdatum) {
      try {
        const dueDate = new Date(invoice.faelligkeitsdatum);
        if (dueDate < new Date()) {
          return STATUS_CONFIG.ueberfaellig;
        }
      } catch (e) {
        // Invalid date
      }
    }
    
    return STATUS_CONFIG[invoice.status] || STATUS_CONFIG.entwurf;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Rechnungen</h2>
        <button
          onClick={() => navigate('/finanzen/rechnungen/neu')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neue Rechnung
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Suchen nach Nummer, Kunde..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={handleStatusFilter}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Alle Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Error Alert */}
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
      
      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nummer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Betrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const statusDisplay = getStatusDisplay(invoice);
                const StatusIcon = statusDisplay.icon;
                
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
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.rechnungsnummer}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">
                        {invoice.kunde?.name || invoice.kundeName || 'Unbekannt'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500">
                        {invoice.rechnungsdatum 
                          ? format(new Date(invoice.rechnungsdatum), 'dd.MM.yyyy')
                          : '-'
                        }
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(invoice.gesamtbetrag || 0).toLocaleString('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR' 
                          })}
                        </p>
                        {invoice.bezahltBetrag > 0 && invoice.bezahltBetrag < invoice.gesamtbetrag && (
                          <p className="text-xs text-green-600 mt-1">
                            {invoice.bezahltBetrag.toLocaleString('de-DE', { 
                              style: 'currency', 
                              currency: 'EUR' 
                            })} bezahlt
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusDisplay.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/finanzen/rechnungen/${invoice._id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/finanzen/rechnungen/${invoice._id}/bearbeiten`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {invoice.status !== 'bezahlt' && invoice.status !== 'storniert' && (
                          <button
                            onClick={() => setShowPaymentTracking(invoice)}
                            className="text-green-600 hover:text-green-900"
                            title="Zahlung erfassen"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(invoice._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Seite {currentPage} von {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
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
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDeleteInvoice(deleteConfirm)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Tracking Modal */}
      {showPaymentTracking && (
        <PaymentTracking
          invoice={showPaymentTracking}
          onUpdate={() => {
            setShowPaymentTracking(null);
            fetchInvoices();
          }}
          onClose={() => setShowPaymentTracking(null)}
        />
      )}
    </div>
  );
}
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, Search, Filter, Plus, Edit2, Trash2, Download, 
  Send, CheckCircle, XCircle, Clock, AlertTriangle, Euro,
  Calendar, User, FileText, Mail, Printer
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const STATUS_BADGES = {
  entwurf: { label: 'Entwurf', color: 'bg-gray-100 text-gray-800', icon: FileText },
  versendet: { label: 'Versendet', color: 'bg-blue-100 text-blue-800', icon: Send },
  bezahlt: { label: 'Bezahlt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  teilweise_bezahlt: { label: 'Teilweise bezahlt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ueberfaellig: { label: 'Überfällig', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  storniert: { label: 'Storniert', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

export default function InvoiceManagement() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('rechnungsdatum');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  
  useEffect(() => {
    fetchInvoices();
  }, []);
  
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/finanzen/rechnungen');
      const invoiceData = response.data.data || response.data || [];
      
      // Update overdue status
      const updatedInvoices = invoiceData.map(invoice => {
        if (invoice.status !== 'bezahlt' && invoice.status !== 'storniert') {
          const dueDate = parseISO(invoice.faelligkeitsdatum);
          if (isAfter(new Date(), dueDate)) {
            return { ...invoice, status: 'ueberfaellig' };
          }
        }
        return invoice;
      });
      
      setInvoices(updatedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (invoice) => {
    navigate(`/finanzen/rechnungen/${invoice._id}/bearbeiten`);
  };
  
  const handleDelete = async (invoice) => {
    if (!window.confirm(`Möchten Sie die Rechnung ${invoice.rechnungsnummer} wirklich löschen?`)) {
      return;
    }
    
    try {
      await api.delete(`/finanzen/rechnungen/${invoice._id}`);
      await fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Fehler beim Löschen der Rechnung');
    }
  };
  
  const handleSendInvoice = async (invoice) => {
    try {
      await api.post(`/finanzen/rechnungen/${invoice._id}/versenden`);
      await fetchInvoices();
      alert('Rechnung wurde erfolgreich versendet');
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Fehler beim Versenden der Rechnung');
    }
  };
  
  const handleMarkAsPaid = async (invoice) => {
    const paymentDate = window.prompt('Zahlungsdatum (YYYY-MM-DD):', format(new Date(), 'yyyy-MM-dd'));
    if (!paymentDate) return;
    
    try {
      await api.put(`/finanzen/rechnungen/${invoice._id}`, {
        status: 'bezahlt',
        bezahltAm: paymentDate
      });
      await fetchInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Fehler beim Markieren als bezahlt');
    }
  };
  
  const handleExportPDF = async (invoice) => {
    try {
      const response = await api.get(`/finanzen/rechnungen/${invoice._id}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rechnung_${invoice.rechnungsnummer}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('PDF-Export noch nicht implementiert');
    }
  };
  
  const handleBulkAction = async (action) => {
    if (selectedInvoices.length === 0) {
      alert('Bitte wählen Sie mindestens eine Rechnung aus');
      return;
    }
    
    switch (action) {
      case 'delete':
        if (!window.confirm(`Möchten Sie ${selectedInvoices.length} Rechnungen wirklich löschen?`)) {
          return;
        }
        try {
          await Promise.all(selectedInvoices.map(id => api.delete(`/finanzen/rechnungen/${id}`)));
          setSelectedInvoices([]);
          await fetchInvoices();
        } catch (error) {
          console.error('Error in bulk delete:', error);
        }
        break;
      case 'send':
        try {
          await Promise.all(selectedInvoices.map(id => api.post(`/finanzen/rechnungen/${id}/versenden`)));
          setSelectedInvoices([]);
          await fetchInvoices();
        } catch (error) {
          console.error('Error in bulk send:', error);
        }
        break;
    }
  };
  
  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.rechnungsnummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.kunde?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.projekt?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'gesamtbetrag') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [invoices, searchTerm, statusFilter, sortBy, sortOrder]);
  
  // Calculate summary stats
  const summary = useMemo(() => {
    return {
      total: filteredInvoices.length,
      totalAmount: filteredInvoices.reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0),
      paid: filteredInvoices.filter(inv => inv.status === 'bezahlt').length,
      paidAmount: filteredInvoices
        .filter(inv => inv.status === 'bezahlt')
        .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0),
      overdue: filteredInvoices.filter(inv => inv.status === 'ueberfaellig').length,
      overdueAmount: filteredInvoices
        .filter(inv => inv.status === 'ueberfaellig')
        .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0)
    };
  }, [filteredInvoices]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Rechnungen</h2>
          <p className="text-sm text-gray-500 mt-1">
            {summary.total} Rechnungen im Gesamtwert von {summary.totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/finanzen/rechnungen/neu')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neue Rechnung
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Bezahlt</p>
              <p className="text-2xl font-bold text-green-900">
                {summary.paidAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-green-600">{summary.paid} Rechnungen</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Offen</p>
              <p className="text-2xl font-bold text-yellow-900">
                {(summary.totalAmount - summary.paidAmount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-yellow-600">{summary.total - summary.paid} Rechnungen</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Überfällig</p>
              <p className="text-2xl font-bold text-red-900">
                {summary.overdueAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-red-600">{summary.overdue} Rechnungen</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Suche nach Rechnungsnummer, Kunde..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Alle Status</option>
              {Object.entries(STATUS_BADGES).map(([key, badge]) => (
                <option key={key} value={key}>{badge.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="rechnungsdatum-desc">Neueste zuerst</option>
              <option value="rechnungsdatum-asc">Älteste zuerst</option>
              <option value="gesamtbetrag-desc">Höchster Betrag</option>
              <option value="gesamtbetrag-asc">Niedrigster Betrag</option>
              <option value="faelligkeitsdatum-asc">Fälligkeit (aufsteigend)</option>
            </select>
          </div>
        </div>
        
        {selectedInvoices.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-gray-600">
              {selectedInvoices.length} ausgewählt
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('send')}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Send className="h-4 w-4 mr-1" />
                Versenden
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Löschen
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInvoices(filteredInvoices.map(inv => inv._id));
                    } else {
                      setSelectedInvoices([]);
                    }
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rechnung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kunde / Projekt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Betrag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fälligkeit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => {
              const StatusBadge = STATUS_BADGES[invoice.status];
              const isOverdue = invoice.status === 'ueberfaellig';
              
              return (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices([...selectedInvoices, invoice._id]);
                        } else {
                          setSelectedInvoices(selectedInvoices.filter(id => id !== invoice._id));
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Receipt className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.rechnungsnummer}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(parseISO(invoice.rechnungsdatum), 'dd.MM.yyyy')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {invoice.kunde?.name || 'Unbekannter Kunde'}
                    </div>
                    {invoice.projekt && (
                      <div className="text-sm text-gray-500">
                        {invoice.projekt.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.gesamtbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </div>
                    {invoice.teilzahlungen?.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {invoice.teilzahlungen.reduce((sum, tz) => sum + tz.betrag, 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} bezahlt
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                      <StatusBadge.icon className="h-3 w-3 mr-1" />
                      {StatusBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {format(parseISO(invoice.faelligkeitsdatum), 'dd.MM.yyyy')}
                    </div>
                    {invoice.zahlungserinnerungen?.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {invoice.zahlungserinnerungen.length} Mahnung(en)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleExportPDF(invoice)}
                        className="text-gray-400 hover:text-gray-500"
                        title="PDF exportieren"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {invoice.status === 'entwurf' && (
                        <button
                          onClick={() => handleSendInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Versenden"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {invoice.status !== 'bezahlt' && invoice.status !== 'storniert' && (
                        <button
                          onClick={() => handleMarkAsPaid(invoice)}
                          className="text-green-600 hover:text-green-700"
                          title="Als bezahlt markieren"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="text-indigo-600 hover:text-indigo-700"
                        title="Bearbeiten"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice)}
                        className="text-red-600 hover:text-red-700"
                        title="Löschen"
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
        
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Rechnungen</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter 
                ? 'Keine Rechnungen gefunden, die Ihren Filterkriterien entsprechen.'
                : 'Erstellen Sie Ihre erste Rechnung.'}
            </p>
            {!searchTerm && !statusFilter && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/finanzen/rechnungen/neu')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Rechnung erstellen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
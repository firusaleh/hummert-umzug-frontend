import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Filter, Plus, Edit2, Trash2, Download, 
  Send, CheckCircle, XCircle, Clock, TrendingUp, Calendar,
  User, Copy, ArrowRight
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const STATUS_BADGES = {
  entwurf: { label: 'Entwurf', color: 'bg-gray-100 text-gray-800', icon: FileText },
  versendet: { label: 'Versendet', color: 'bg-blue-100 text-blue-800', icon: Send },
  angenommen: { label: 'Angenommen', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  abgelehnt: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800', icon: XCircle },
  abgelaufen: { label: 'Abgelaufen', color: 'bg-gray-100 text-gray-800', icon: Clock }
};

export default function QuoteManagement() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('angebotsdatum');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  
  useEffect(() => {
    fetchQuotes();
  }, []);
  
  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/finanzen/angebote');
      const quoteData = response.data.data || response.data || [];
      
      // Update expired quotes
      const updatedQuotes = quoteData.map(quote => {
        if (quote.status === 'versendet' && quote.gueltigBis) {
          const validUntil = parseISO(quote.gueltigBis);
          if (new Date() > validUntil) {
            return { ...quote, status: 'abgelaufen' };
          }
        }
        return quote;
      });
      
      setQuotes(updatedQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (quote) => {
    navigate(`/finanzen/angebote/${quote._id}/bearbeiten`);
  };
  
  const handleDelete = async (quote) => {
    if (!window.confirm(`Möchten Sie das Angebot ${quote.angebotsnummer} wirklich löschen?`)) {
      return;
    }
    
    try {
      await api.delete(`/finanzen/angebote/${quote._id}`);
      await fetchQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Fehler beim Löschen des Angebots');
    }
  };
  
  const handleDuplicate = async (quote) => {
    try {
      const response = await api.post(`/finanzen/angebote/${quote._id}/duplizieren`);
      navigate(`/finanzen/angebote/${response.data._id}/bearbeiten`);
    } catch (error) {
      console.error('Error duplicating quote:', error);
      alert('Fehler beim Duplizieren des Angebots');
    }
  };
  
  const handleConvertToInvoice = async (quote) => {
    if (!window.confirm('Möchten Sie dieses Angebot in eine Rechnung umwandeln?')) {
      return;
    }
    
    try {
      const response = await api.post(`/finanzen/angebote/${quote._id}/zu-rechnung`);
      navigate(`/finanzen/rechnungen/${response.data._id}/bearbeiten`);
    } catch (error) {
      console.error('Error converting to invoice:', error);
      alert('Fehler beim Umwandeln in Rechnung');
    }
  };
  
  const handleSendQuote = async (quote) => {
    try {
      await api.post(`/finanzen/angebote/${quote._id}/versenden`);
      await fetchQuotes();
      alert('Angebot wurde erfolgreich versendet');
    } catch (error) {
      console.error('Error sending quote:', error);
      alert('Fehler beim Versenden des Angebots');
    }
  };
  
  const handleUpdateStatus = async (quote, newStatus) => {
    try {
      await api.put(`/finanzen/angebote/${quote._id}`, { status: newStatus });
      await fetchQuotes();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };
  
  // Filter and sort quotes
  const filteredQuotes = useMemo(() => {
    let filtered = [...quotes];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(quote => 
        quote.angebotsnummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.kunde?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.projekt?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(quote => quote.status === statusFilter);
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
  }, [quotes, searchTerm, statusFilter, sortBy, sortOrder]);
  
  // Calculate summary stats
  const summary = useMemo(() => {
    const stats = {
      total: filteredQuotes.length,
      totalValue: filteredQuotes.reduce((sum, quote) => sum + (quote.gesamtbetrag || 0), 0),
      accepted: filteredQuotes.filter(q => q.status === 'angenommen').length,
      acceptedValue: filteredQuotes
        .filter(q => q.status === 'angenommen')
        .reduce((sum, q) => sum + (q.gesamtbetrag || 0), 0),
      pending: filteredQuotes.filter(q => q.status === 'versendet').length,
      conversionRate: 0
    };
    
    if (stats.total > 0) {
      stats.conversionRate = ((stats.accepted / stats.total) * 100).toFixed(1);
    }
    
    return stats;
  }, [filteredQuotes]);
  
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
          <h2 className="text-xl font-semibold text-gray-900">Angebote</h2>
          <p className="text-sm text-gray-500 mt-1">
            {summary.total} Angebote im Gesamtwert von {summary.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/finanzen/angebote/neu')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neues Angebot
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Offen</p>
              <p className="text-2xl font-bold text-blue-900">{summary.pending}</p>
              <p className="text-xs text-blue-600">Angebote</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Angenommen</p>
              <p className="text-2xl font-bold text-green-900">
                {summary.acceptedValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
              <p className="text-xs text-green-600">{summary.accepted} Angebote</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Konversionsrate</p>
              <p className="text-2xl font-bold text-purple-900">{summary.conversionRate}%</p>
              <p className="text-xs text-purple-600">Erfolgsquote</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Durchschnitt</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.total > 0 
                  ? (summary.totalValue / summary.total).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                  : '0 €'}
              </p>
              <p className="text-xs text-gray-600">pro Angebot</p>
            </div>
            <FileText className="h-8 w-8 text-gray-500" />
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
                placeholder="Suche nach Angebotsnummer, Kunde..."
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
              <option value="angebotsdatum-desc">Neueste zuerst</option>
              <option value="angebotsdatum-asc">Älteste zuerst</option>
              <option value="gesamtbetrag-desc">Höchster Betrag</option>
              <option value="gesamtbetrag-asc">Niedrigster Betrag</option>
              <option value="gueltigBis-asc">Ablaufdatum</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Quote Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Angebot
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
                Gültigkeit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredQuotes.map((quote) => {
              const StatusBadge = STATUS_BADGES[quote.status];
              const daysUntilExpiry = quote.gueltigBis 
                ? differenceInDays(parseISO(quote.gueltigBis), new Date())
                : null;
              
              return (
                <tr key={quote._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {quote.angebotsnummer}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(parseISO(quote.angebotsdatum), 'dd.MM.yyyy')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {quote.kunde?.name || 'Unbekannter Kunde'}
                    </div>
                    {quote.projekt && (
                      <div className="text-sm text-gray-500">
                        {quote.projekt.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {quote.gesamtbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </div>
                    {quote.rabatt > 0 && (
                      <div className="text-xs text-gray-500">
                        {quote.rabatt}% Rabatt
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
                    {quote.gueltigBis && (
                      <div className={`text-sm ${daysUntilExpiry < 7 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {format(parseISO(quote.gueltigBis), 'dd.MM.yyyy')}
                        {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
                          <div className="text-xs text-gray-500">
                            noch {daysUntilExpiry} Tage
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/finanzen/angebote/${quote._id}`)}
                        className="text-gray-400 hover:text-gray-500"
                        title="Anzeigen"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {quote.status === 'entwurf' && (
                        <button
                          onClick={() => handleSendQuote(quote)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Versenden"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {quote.status === 'versendet' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(quote, 'angenommen')}
                            className="text-green-600 hover:text-green-700"
                            title="Als angenommen markieren"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(quote, 'abgelehnt')}
                            className="text-red-600 hover:text-red-700"
                            title="Als abgelehnt markieren"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {quote.status === 'angenommen' && (
                        <button
                          onClick={() => handleConvertToInvoice(quote)}
                          className="text-purple-600 hover:text-purple-700"
                          title="In Rechnung umwandeln"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(quote)}
                        className="text-gray-600 hover:text-gray-700"
                        title="Duplizieren"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(quote)}
                        className="text-indigo-600 hover:text-indigo-700"
                        title="Bearbeiten"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(quote)}
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
        
        {filteredQuotes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Angebote</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter 
                ? 'Keine Angebote gefunden, die Ihren Filterkriterien entsprechen.'
                : 'Erstellen Sie Ihr erstes Angebot.'}
            </p>
            {!searchTerm && !statusFilter && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/finanzen/angebote/neu')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neues Angebot erstellen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
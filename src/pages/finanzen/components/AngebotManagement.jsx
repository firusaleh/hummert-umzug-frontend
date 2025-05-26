import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Send, Download, Calendar, Euro, User, FileText, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../../services/api';
import AngebotForm from './AngebotForm';

const AngebotManagement = () => {
  const [angebote, setAngebote] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [showForm, setShowForm] = useState(false);
  const [editingAngebot, setEditingAngebot] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchAngebote();
  }, []);

  const fetchAngebote = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/finanzen/angebote');
      const data = Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
        ? response.data 
        : [];
      setAngebote(data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setError('Fehler beim Laden der Angebote');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/finanzen/angebote/${id}`);
      await fetchAngebote();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Fehler beim Löschen des Angebots');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/finanzen/angebote/${id}`, { status: newStatus });
      await fetchAngebote();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const handleConvertToInvoice = async (angebot) => {
    if (window.confirm('Möchten Sie dieses Angebot in eine Rechnung umwandeln?')) {
      try {
        // Create invoice from quote data
        const invoiceData = {
          rechnungsnummer: `RE-${Date.now()}`,
          kunde: angebot.kunde,
          umzugId: angebot.umzugId,
          datum: new Date(),
          faelligkeitsdatum: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          positionen: angebot.positionen,
          zwischensumme: angebot.zwischensumme,
          mwstSatz: angebot.mwstSatz,
          mwstBetrag: angebot.mwstBetrag,
          gesamtbetrag: angebot.gesamtbetrag,
          status: 'offen',
          zahlungsbedingungen: 'Zahlbar innerhalb 30 Tagen',
          anmerkungen: `Basierend auf Angebot ${angebot.angebotsnummer}`
        };

        await api.post('/finanzen/rechnungen', invoiceData);
        
        // Update quote status
        await handleStatusChange(angebot._id, 'angenommen');
        
        alert('Rechnung wurde erfolgreich erstellt!');
      } catch (error) {
        console.error('Error converting to invoice:', error);
        alert('Fehler beim Erstellen der Rechnung');
      }
    }
  };

  const filteredAngebote = angebote.filter(angebot => {
    const matchesSearch = 
      angebot.angebotsnummer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      angebot.kunde?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      angebot.kunde?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'alle' || angebot.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'entwurf': return 'bg-gray-100 text-gray-800';
      case 'versendet': return 'bg-blue-100 text-blue-800';
      case 'angenommen': return 'bg-green-100 text-green-800';
      case 'abgelehnt': return 'bg-red-100 text-red-800';
      case 'abgelaufen': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'entwurf': return 'Entwurf';
      case 'versendet': return 'Versendet';
      case 'angenommen': return 'Angenommen';
      case 'abgelehnt': return 'Abgelehnt';
      case 'abgelaufen': return 'Abgelaufen';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Angebote</h2>
        <button
          onClick={() => {
            setEditingAngebot(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Neues Angebot
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suche</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Angebotsnummer, Kunde..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="alle">Alle Status</option>
              <option value="entwurf">Entwurf</option>
              <option value="versendet">Versendet</option>
              <option value="angenommen">Angenommen</option>
              <option value="abgelehnt">Abgelehnt</option>
              <option value="abgelaufen">Abgelaufen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Angebotsnummer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gültig bis
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
              {filteredAngebote.map((angebot) => (
                <tr key={angebot._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {angebot.angebotsnummer}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{angebot.kunde?.name}</div>
                    <div className="text-sm text-gray-500">{angebot.kunde?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      {format(new Date(angebot.datum), 'dd.MM.yyyy', { locale: de })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(angebot.gueltigBis), 'dd.MM.yyyy', { locale: de })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <Euro className="h-4 w-4 text-gray-400 mr-1" />
                      {angebot.gesamtbetrag?.toFixed(2) || '0.00'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={angebot.status}
                      onChange={(e) => handleStatusChange(angebot._id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(angebot.status)}`}
                    >
                      <option value="entwurf">Entwurf</option>
                      <option value="versendet">Versendet</option>
                      <option value="angenommen">Angenommen</option>
                      <option value="abgelehnt">Abgelehnt</option>
                      <option value="abgelaufen">Abgelaufen</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {/* View functionality */}}
                        className="text-gray-600 hover:text-gray-900"
                        title="Anzeigen"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingAngebot(angebot);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Bearbeiten"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {/* Send functionality */}}
                        className="text-green-600 hover:text-green-900"
                        title="Versenden"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      {angebot.status === 'angenommen' && (
                        <button
                          onClick={() => handleConvertToInvoice(angebot)}
                          className="text-purple-600 hover:text-purple-900"
                          title="In Rechnung umwandeln"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(angebot._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAngebote.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Angebote</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'alle' 
                ? 'Keine Angebote gefunden. Versuchen Sie andere Filterkriterien.'
                : 'Erstellen Sie Ihr erstes Angebot.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Angebot löschen?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Sind Sie sicher, dass Sie dieses Angebot löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingAngebot ? 'Angebot bearbeiten' : 'Neues Angebot'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <AngebotForm
              angebot={editingAngebot}
              onSave={() => {
                setShowForm(false);
                fetchAngebote();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AngebotManagement;
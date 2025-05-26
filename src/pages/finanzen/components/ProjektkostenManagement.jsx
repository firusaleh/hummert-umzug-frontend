import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Calendar, FileText, Tag, TrendingUp, TrendingDown, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../../services/api';
import ProjektkostenForm from './ProjektkostenForm';

const ProjektkostenManagement = () => {
  const [projektkosten, setProjektkosten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [kategorieFilter, setKategorieFilter] = useState('alle');
  const [showForm, setShowForm] = useState(false);
  const [editingKosten, setEditingKosten] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [umzuege, setUmzuege] = useState([]);

  // Summary statistics
  const [stats, setStats] = useState({
    totalKosten: 0,
    anzahlPosten: 0,
    kategorien: {},
    topKategorie: ''
  });

  useEffect(() => {
    fetchProjektkosten();
    fetchUmzuege();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [projektkosten]);

  const fetchProjektkosten = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/finanzen/projektkosten');
      const data = Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
        ? response.data 
        : [];
      setProjektkosten(data);
    } catch (error) {
      console.error('Error fetching project costs:', error);
      setError('Fehler beim Laden der Projektkosten');
    } finally {
      setLoading(false);
    }
  };

  const fetchUmzuege = async () => {
    try {
      const response = await api.get('/umzuege');
      const data = Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
        ? response.data 
        : [];
      setUmzuege(data);
    } catch (error) {
      console.error('Error fetching moves:', error);
    }
  };

  const calculateStats = () => {
    const totalKosten = projektkosten.reduce((sum, k) => sum + (k.betrag || 0), 0);
    const anzahlPosten = projektkosten.length;
    
    const kategorien = projektkosten.reduce((acc, k) => {
      const kat = k.kategorie || 'Sonstige';
      acc[kat] = (acc[kat] || 0) + k.betrag;
      return acc;
    }, {});

    const topKategorie = Object.entries(kategorien)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    setStats({ totalKosten, anzahlPosten, kategorien, topKategorie });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/finanzen/projektkosten/${id}`);
      await fetchProjektkosten();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting project cost:', error);
      alert('Fehler beim Löschen der Projektkosten');
    }
  };

  const getUmzugInfo = (umzugId) => {
    const umzug = umzuege.find(u => u._id === umzugId);
    return umzug ? `${umzug.umzugsnummer} - ${umzug.kundenname}` : 'Unbekannt';
  };

  const getKategorieColor = (kategorie) => {
    const colors = {
      'Personal': 'bg-blue-100 text-blue-800',
      'Material': 'bg-green-100 text-green-800',
      'Fahrzeug': 'bg-yellow-100 text-yellow-800',
      'Fremdleistungen': 'bg-purple-100 text-purple-800',
      'Sonstige': 'bg-gray-100 text-gray-800',
      'Versicherung': 'bg-red-100 text-red-800',
      'Verwaltung': 'bg-indigo-100 text-indigo-800'
    };
    return colors[kategorie] || 'bg-gray-100 text-gray-800';
  };

  const filteredKosten = projektkosten.filter(kosten => {
    const matchesSearch = 
      kosten.beschreibung?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUmzugInfo(kosten.umzugId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesKategorie = kategorieFilter === 'alle' || kosten.kategorie === kategorieFilter;
    
    return matchesSearch && matchesKategorie;
  });

  // Get unique categories for filter
  const kategorien = [...new Set(projektkosten.map(k => k.kategorie).filter(Boolean))];

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
        <h2 className="text-2xl font-bold text-gray-900">Projektkosten</h2>
        <button
          onClick={() => {
            setEditingKosten(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Neue Kosten
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamtkosten</p>
              <p className="text-2xl font-bold text-gray-900">
                € {stats.totalKosten.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Anzahl Posten</p>
              <p className="text-2xl font-bold text-gray-900">{stats.anzahlPosten}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Kategorie</p>
              <p className="text-lg font-bold text-gray-900">{stats.topKategorie || '-'}</p>
            </div>
            <Tag className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Durchschnitt</p>
              <p className="text-2xl font-bold text-gray-900">
                € {stats.anzahlPosten > 0 ? (stats.totalKosten / stats.anzahlPosten).toFixed(2) : '0.00'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(stats.kategorien).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Kosten nach Kategorie</h3>
          <div className="space-y-2">
            {Object.entries(stats.kategorien)
              .sort(([,a], [,b]) => b - a)
              .map(([kategorie, betrag]) => {
                const percentage = (betrag / stats.totalKosten) * 100;
                return (
                  <div key={kategorie} className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKategorieColor(kategorie)}`}>
                      {kategorie}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-24 text-right">
                      € {betrag.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suche</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Beschreibung, Umzug..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
            <select
              value={kategorieFilter}
              onChange={(e) => setKategorieFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="alle">Alle Kategorien</option>
              {kategorien.map(kat => (
                <option key={kat} value={kat}>{kat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Costs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Umzug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Betrag
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredKosten.map((kosten) => (
                <tr key={kosten._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      {format(new Date(kosten.datum), 'dd.MM.yyyy', { locale: de })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getUmzugInfo(kosten.umzugId)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{kosten.beschreibung}</div>
                    {kosten.notizen && (
                      <div className="text-sm text-gray-500 mt-1">{kosten.notizen}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getKategorieColor(kosten.kategorie)}`}>
                      {kosten.kategorie}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      {kosten.betrag < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      )}
                      € {Math.abs(kosten.betrag).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingKosten(kosten);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Bearbeiten"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(kosten._id)}
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

        {filteredKosten.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Projektkosten</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || kategorieFilter !== 'alle' 
                ? 'Keine Projektkosten gefunden. Versuchen Sie andere Filterkriterien.'
                : 'Erfassen Sie Ihre ersten Projektkosten.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Projektkosten löschen?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Sind Sie sicher, dass Sie diese Projektkosten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingKosten ? 'Projektkosten bearbeiten' : 'Neue Projektkosten'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <ProjektkostenForm
              kosten={editingKosten}
              onSave={() => {
                setShowForm(false);
                fetchProjektkosten();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjektkostenManagement;
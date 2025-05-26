import React, { useState, useEffect } from 'react';
import { Calendar, Euro, Tag, FileText, Package, Truck, Users, Shield, Settings } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../services/api';

const ProjektkostenForm = ({ kosten, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    umzugId: '',
    kategorie: '',
    beschreibung: '',
    betrag: 0,
    datum: format(new Date(), 'yyyy-MM-dd'),
    notizen: ''
  });

  const [umzuege, setUmzuege] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const kategorien = [
    { value: 'Personal', label: 'Personal', icon: Users, color: 'text-blue-600' },
    { value: 'Material', label: 'Material', icon: Package, color: 'text-green-600' },
    { value: 'Fahrzeug', label: 'Fahrzeug', icon: Truck, color: 'text-yellow-600' },
    { value: 'Fremdleistungen', label: 'Fremdleistungen', icon: Users, color: 'text-purple-600' },
    { value: 'Versicherung', label: 'Versicherung', icon: Shield, color: 'text-red-600' },
    { value: 'Verwaltung', label: 'Verwaltung', icon: Settings, color: 'text-indigo-600' },
    { value: 'Sonstige', label: 'Sonstige', icon: Tag, color: 'text-gray-600' }
  ];

  useEffect(() => {
    if (kosten) {
      setFormData({
        umzugId: kosten.umzugId || '',
        kategorie: kosten.kategorie || '',
        beschreibung: kosten.beschreibung || '',
        betrag: kosten.betrag || 0,
        datum: format(new Date(kosten.datum), 'yyyy-MM-dd'),
        notizen: kosten.notizen || ''
      });
    }
    fetchUmzuege();
  }, [kosten]);

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

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.umzugId) {
      newErrors.umzugId = 'Bitte wählen Sie einen Umzug aus';
    }
    
    if (!formData.kategorie) {
      newErrors.kategorie = 'Bitte wählen Sie eine Kategorie aus';
    }
    
    if (!formData.beschreibung) {
      newErrors.beschreibung = 'Beschreibung ist erforderlich';
    }
    
    if (formData.betrag === 0) {
      newErrors.betrag = 'Betrag darf nicht 0 sein';
    }
    
    if (!formData.datum) {
      newErrors.datum = 'Datum ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      if (kosten) {
        await api.put(`/finanzen/projektkosten/${kosten._id}`, formData);
      } else {
        await api.post('/finanzen/projektkosten', formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving project cost:', error);
      alert('Fehler beim Speichern der Projektkosten');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedKategorie = () => {
    return kategorien.find(k => k.value === formData.kategorie);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Move Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Umzug *
        </label>
        <select
          name="umzugId"
          value={formData.umzugId}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.umzugId ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Bitte wählen...</option>
          {umzuege.map(umzug => (
            <option key={umzug._id} value={umzug._id}>
              {umzug.umzugsnummer} - {umzug.kundenname} ({format(new Date(umzug.datum), 'dd.MM.yyyy')})
            </option>
          ))}
        </select>
        {errors.umzugId && (
          <p className="mt-1 text-sm text-red-600">{errors.umzugId}</p>
        )}
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategorie *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {kategorien.map(kategorie => {
            const Icon = kategorie.icon;
            const isSelected = formData.kategorie === kategorie.value;
            return (
              <button
                key={kategorie.value}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, kategorie: kategorie.value }));
                  if (errors.kategorie) {
                    setErrors(prev => ({ ...prev, kategorie: '' }));
                  }
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`h-6 w-6 mx-auto mb-1 ${kategorie.color}`} />
                <span className={`text-xs font-medium ${
                  isSelected ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  {kategorie.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.kategorie && (
          <p className="mt-1 text-sm text-red-600">{errors.kategorie}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Datum *
        </label>
        <div className="relative">
          <input
            type="date"
            name="datum"
            value={formData.datum}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.datum ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.datum && (
          <p className="mt-1 text-sm text-red-600">{errors.datum}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Beschreibung *
        </label>
        <div className="relative">
          <input
            type="text"
            name="beschreibung"
            value={formData.beschreibung}
            onChange={handleInputChange}
            placeholder="z.B. Umzugskartons, Kraftstoff, Mittagessen für Team..."
            className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.beschreibung ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <FileText className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.beschreibung && (
          <p className="mt-1 text-sm text-red-600">{errors.beschreibung}</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Betrag *
        </label>
        <div className="relative">
          <input
            type="number"
            name="betrag"
            value={formData.betrag}
            onChange={handleInputChange}
            step="0.01"
            placeholder="0.00"
            className={`w-full px-3 py-2 pl-10 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.betrag ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <Euro className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <span className="absolute right-3 top-2.5 text-gray-500">EUR</span>
        </div>
        {errors.betrag && (
          <p className="mt-1 text-sm text-red-600">{errors.betrag}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Positive Beträge für Ausgaben, negative für Erstattungen/Gutschriften
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notizen (optional)
        </label>
        <textarea
          name="notizen"
          value={formData.notizen}
          onChange={handleInputChange}
          rows={3}
          placeholder="Zusätzliche Informationen..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Summary */}
      {formData.kategorie && formData.betrag !== 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Zusammenfassung</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              {getSelectedKategorie() && (
                <>
                  {React.createElement(getSelectedKategorie().icon, {
                    className: `h-4 w-4 ${getSelectedKategorie().color}`
                  })}
                  <span>{getSelectedKategorie().label}</span>
                </>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Betrag:</span>
              <span className={`font-medium ${formData.betrag < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formData.betrag < 0 ? '+' : '-'} € {Math.abs(formData.betrag).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Speichern...
            </>
          ) : (
            <>
              <Euro className="h-4 w-4" />
              {kosten ? 'Aktualisieren' : 'Speichern'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProjektkostenForm;
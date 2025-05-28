import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Euro, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../../services/api';

const AngebotForm = ({ angebot, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    angebotNummer: '',
    kunde: '',
    kundeDaten: {
      name: '',
      email: '',
      telefon: '',
      adresse: {
        strasse: '',
        hausnummer: '',
        plz: '',
        ort: ''
      }
    },
    umzug: '',
    erstelltAm: format(new Date(), 'yyyy-MM-dd'),
    gueltigBis: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    positionsliste: [
      {
        bezeichnung: '',
        menge: 1,
        einheit: 'Stück',
        einzelpreis: 0,
        gesamtpreis: 0
      }
    ],
    zwischensumme: 0,
    mehrwertsteuer: 19,
    mwstBetrag: 0,
    gesamtbetrag: 0,
    zahlungsbedingungen: 'Zahlbar innerhalb 30 Tagen nach Rechnungsstellung',
    notizen: '',
    status: 'Entwurf'
  });

  const [umzuege, setUmzuege] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Generate quote number if new
    if (!angebot) {
      generateAngebotsnummer();
    } else {
      setFormData(angebot);
    }
    fetchUmzuege();
  }, [angebot]);

  const generateAngebotsnummer = async () => {
    try {
      const response = await api.get('/finanzen/angebote');
      const angebote = Array.isArray(response.data?.data) ? response.data.data : [];
      const year = new Date().getFullYear();
      const count = angebote.filter(a => a.angebotsnummer?.includes(year)).length + 1;
      const nummer = `ANG-${year}-${String(count).padStart(4, '0')}`;
      setFormData(prev => ({ ...prev, angebotNummer: nummer }));
    } catch (error) {
      console.error('Error generating quote number:', error);
      const fallback = `ANG-${Date.now()}`;
      setFormData(prev => ({ ...prev, angebotNummer: fallback }));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleKundeChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        kunde: {
          ...prev.kunde,
          [parent]: {
            ...prev.kunde[parent],
            [child]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        kunde: {
          ...prev.kunde,
          [field]: value
        }
      }));
    }
  };

  const handlePositionChange = (index, field, value) => {
    const newPositionen = [...formData.positionsliste];
    newPositionen[index][field] = value;

    // Calculate line total
    if (field === 'menge' || field === 'einzelpreis') {
      newPositionen[index].gesamtpreis = 
        parseFloat(newPositionen[index].menge || 0) * 
        parseFloat(newPositionen[index].einzelpreis || 0);
    }

    setFormData(prev => ({ ...prev, positionsliste: newPositionen }));
    calculateTotals(newPositionen);
  };

  const addPosition = () => {
    setFormData(prev => ({
      ...prev,
      positionsliste: [
        ...prev.positionsliste,
        {
          bezeichnung: '',
          menge: 1,
          einheit: 'Stück',
          einzelpreis: 0,
          gesamtpreis: 0
        }
      ]
    }));
  };

  const removePosition = (index) => {
    const newPositionen = formData.positionen.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, positionen: newPositionen }));
    calculateTotals(newPositionen);
  };

  const calculateTotals = (positionen) => {
    const zwischensumme = positionen.reduce((sum, pos) => sum + (pos.gesamtpreis || 0), 0);
    const mwstBetrag = zwischensumme * (formData.mwstSatz / 100);
    const gesamtbetrag = zwischensumme + mwstBetrag;

    setFormData(prev => ({
      ...prev,
      zwischensumme,
      mwstBetrag,
      gesamtbetrag
    }));
  };

  const handleUmzugSelect = async (umzugId) => {
    setFormData(prev => ({ ...prev, umzugId }));
    
    // Load customer data from selected move
    const selectedUmzug = umzuege.find(u => u._id === umzugId);
    if (selectedUmzug) {
      setFormData(prev => ({
        ...prev,
        kunde: {
          name: selectedUmzug.kundenname || '',
          email: selectedUmzug.kundenEmail || '',
          telefon: selectedUmzug.kundenTelefon || '',
          adresse: {
            strasse: selectedUmzug.startAdresse?.strasse || '',
            hausnummer: selectedUmzug.startAdresse?.hausnummer || '',
            plz: selectedUmzug.startAdresse?.plz || '',
            ort: selectedUmzug.startAdresse?.ort || ''
          }
        }
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.kunde.name) {
      newErrors['kunde.name'] = 'Kundenname ist erforderlich';
    }
    
    if (!formData.kunde.email) {
      newErrors['kunde.email'] = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(formData.kunde.email)) {
      newErrors['kunde.email'] = 'Ungültige E-Mail-Adresse';
    }
    
    if (formData.positionen.length === 0) {
      newErrors.positionen = 'Mindestens eine Position ist erforderlich';
    } else {
      formData.positionen.forEach((pos, index) => {
        if (!pos.beschreibung) {
          newErrors[`position.${index}.beschreibung`] = 'Beschreibung ist erforderlich';
        }
      });
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
      if (angebot) {
        await api.put(`/finanzen/angebote/${angebot._id}`, formData);
      } else {
        await api.post('/finanzen/angebote', formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Fehler beim Speichern des Angebots');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Angebotsnummer
          </label>
          <input
            type="text"
            name="angebotsnummer"
            value={formData.angebotsnummer}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datum
          </label>
          <div className="relative">
            <input
              type="date"
              name="datum"
              value={formData.datum}
              onChange={handleInputChange}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gültig bis
          </label>
          <div className="relative">
            <input
              type="date"
              name="gueltigBis"
              value={formData.gueltigBis}
              onChange={handleInputChange}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Move Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Umzug verknüpfen (optional)
        </label>
        <select
          value={formData.umzugId}
          onChange={(e) => handleUmzugSelect(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Kein Umzug verknüpft</option>
          {umzuege.map(umzug => (
            <option key={umzug._id} value={umzug._id}>
              {umzug.umzugsnummer} - {umzug.kundenname} ({format(new Date(umzug.datum), 'dd.MM.yyyy')})
            </option>
          ))}
        </select>
      </div>

      {/* Customer Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Kundeninformationen
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.kunde.name}
              onChange={(e) => handleKundeChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors['kunde.name'] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors['kunde.name'] && (
              <p className="mt-1 text-sm text-red-600">{errors['kunde.name']}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail *
            </label>
            <input
              type="email"
              value={formData.kunde.email}
              onChange={(e) => handleKundeChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors['kunde.email'] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors['kunde.email'] && (
              <p className="mt-1 text-sm text-red-600">{errors['kunde.email']}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.kunde.telefon}
              onChange={(e) => handleKundeChange('telefon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Straße & Hausnummer
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.kunde.adresse.strasse}
                onChange={(e) => handleKundeChange('adresse.strasse', e.target.value)}
                placeholder="Straße"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={formData.kunde.adresse.hausnummer}
                onChange={(e) => handleKundeChange('adresse.hausnummer', e.target.value)}
                placeholder="Nr."
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PLZ & Ort
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.kunde.adresse.plz}
                onChange={(e) => handleKundeChange('adresse.plz', e.target.value)}
                placeholder="PLZ"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={formData.kunde.adresse.ort}
                onChange={(e) => handleKundeChange('adresse.ort', e.target.value)}
                placeholder="Ort"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Positionen</h3>
          <button
            type="button"
            onClick={addPosition}
            className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
          >
            <Plus className="h-4 w-4" />
            Position hinzufügen
          </button>
        </div>
        
        {errors.positionen && (
          <p className="mb-2 text-sm text-red-600">{errors.positionen}</p>
        )}

        <div className="space-y-2">
          {formData.positionen.map((position, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    value={position.beschreibung}
                    onChange={(e) => handlePositionChange(index, 'beschreibung', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`position.${index}.beschreibung`] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors[`position.${index}.beschreibung`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`position.${index}.beschreibung`]}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Menge
                  </label>
                  <input
                    type="number"
                    value={position.menge}
                    onChange={(e) => handlePositionChange(index, 'menge', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Einzelpreis
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={position.einzelpreis}
                      onChange={(e) => handlePositionChange(index, 'einzelpreis', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Euro className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gesamtpreis
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={position.gesamtpreis.toFixed(2)}
                      readOnly
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg bg-gray-100"
                    />
                    <Euro className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              {formData.positionen.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePosition(index)}
                  className="mt-2 text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Entfernen
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Zwischensumme</span>
            <span className="font-medium">€ {formData.zwischensumme.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">MwSt.</span>
              <input
                type="number"
                name="mwstSatz"
                value={formData.mwstSatz}
                onChange={(e) => {
                  handleInputChange(e);
                  calculateTotals(formData.positionen);
                }}
                min="0"
                max="100"
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-gray-600">%</span>
            </div>
            <span className="font-medium">€ {formData.mwstBetrag.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-300">
            <span className="text-lg font-semibold">Gesamtbetrag</span>
            <span className="text-lg font-semibold">€ {formData.gesamtbetrag.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Additional Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zahlungsbedingungen
          </label>
          <textarea
            name="zahlungsbedingungen"
            value={formData.zahlungsbedingungen}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anmerkungen
          </label>
          <textarea
            name="anmerkungen"
            value={formData.anmerkungen}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

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
              <FileText className="h-4 w-4" />
              {angebot ? 'Aktualisieren' : 'Erstellen'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AngebotForm;
// MitarbeiterForm.jsx - Create/Edit employee form with real data
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Award,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import { useMitarbeiter } from '../../context/MitarbeiterContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MitarbeiterForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const {
    currentMitarbeiter,
    loading,
    error,
    fetchMitarbeiterById,
    createMitarbeiter,
    updateMitarbeiter,
    clearError
  } = useMitarbeiter();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefon: '',
    position: 'Umzugshelfer',
    personalNummer: '',
    geburtsdatum: '',
    adresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: ''
    },
    verfuegbar: true,
    arbeitsstunden: 40,
    stundenlohn: 15,
    qualifikationen: [],
    notfallkontakt: {
      name: '',
      telefon: '',
      beziehung: ''
    },
    bankverbindung: {
      iban: '',
      bic: '',
      kontoinhaber: ''
    },
    dokumente: [],
    notizen: ''
  });

  const [newQualifikation, setNewQualifikation] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load employee data if editing
  useEffect(() => {
    if (isEdit && id) {
      fetchMitarbeiterById(id);
    }
  }, [isEdit, id, fetchMitarbeiterById]);

  // Update form when employee data is loaded
  useEffect(() => {
    if (isEdit && currentMitarbeiter) {
      setFormData({
        name: currentMitarbeiter.name || '',
        email: currentMitarbeiter.email || '',
        telefon: currentMitarbeiter.telefon || '',
        position: currentMitarbeiter.position || 'Umzugshelfer',
        personalNummer: currentMitarbeiter.personalNummer || '',
        geburtsdatum: currentMitarbeiter.geburtsdatum 
          ? new Date(currentMitarbeiter.geburtsdatum).toISOString().split('T')[0]
          : '',
        adresse: currentMitarbeiter.adresse || {
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: ''
        },
        verfuegbar: currentMitarbeiter.verfuegbar ?? true,
        arbeitsstunden: currentMitarbeiter.arbeitsstunden || 40,
        stundenlohn: currentMitarbeiter.stundenlohn || 15,
        qualifikationen: currentMitarbeiter.qualifikationen || [],
        notfallkontakt: currentMitarbeiter.notfallkontakt || {
          name: '',
          telefon: '',
          beziehung: ''
        },
        bankverbindung: currentMitarbeiter.bankverbindung || {
          iban: '',
          bic: '',
          kontoinhaber: ''
        },
        dokumente: currentMitarbeiter.dokumente || [],
        notizen: currentMitarbeiter.notizen || ''
      });
    }
  }, [isEdit, currentMitarbeiter]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
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
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Add qualification
  const addQualifikation = () => {
    if (newQualifikation.trim()) {
      setFormData(prev => ({
        ...prev,
        qualifikationen: [...prev.qualifikationen, newQualifikation.trim()]
      }));
      setNewQualifikation('');
    }
  };

  // Remove qualification
  const removeQualifikation = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifikationen: prev.qualifikationen.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name ist erforderlich';
    }

    if (!formData.email.trim()) {
      errors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ungültige E-Mail-Adresse';
    }

    if (!formData.telefon.trim()) {
      errors.telefon = 'Telefonnummer ist erforderlich';
    }

    if (!formData.position) {
      errors.position = 'Position ist erforderlich';
    }

    if (formData.stundenlohn && formData.stundenlohn < 0) {
      errors.stundenlohn = 'Stundenlohn muss positiv sein';
    }

    if (formData.arbeitsstunden && (formData.arbeitsstunden < 0 || formData.arbeitsstunden > 60)) {
      errors.arbeitsstunden = 'Arbeitsstunden müssen zwischen 0 und 60 liegen';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    clearError();

    try {
      if (isEdit) {
        await updateMitarbeiter(id, formData);
      } else {
        await createMitarbeiter(formData);
      }
      navigate('/mitarbeiter');
    } catch (error) {
      // Error is handled in context
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/mitarbeiter')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Zurück zur Übersicht
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit ? 'Bearbeiten Sie die Mitarbeiterdaten' : 'Fügen Sie einen neuen Mitarbeiter hinzu'}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Fehler</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-gray-400" />
            Persönliche Daten
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  validationErrors.name 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="personalNummer" className="block text-sm font-medium text-gray-700">
                Personalnummer
              </label>
              <input
                type="text"
                id="personalNummer"
                name="personalNummer"
                value={formData.personalNummer}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-Mail *
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 block w-full rounded-md shadow-sm ${
                    validationErrors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="telefon" className="block text-sm font-medium text-gray-700">
                Telefon *
              </label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  id="telefon"
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleChange}
                  className={`pl-10 block w-full rounded-md shadow-sm ${
                    validationErrors.telefon 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
              </div>
              {validationErrors.telefon && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.telefon}</p>
              )}
            </div>

            <div>
              <label htmlFor="geburtsdatum" className="block text-sm font-medium text-gray-700">
                Geburtsdatum
              </label>
              <div className="mt-1 relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  id="geburtsdatum"
                  name="geburtsdatum"
                  value={formData.geburtsdatum}
                  onChange={handleChange}
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                Position *
              </label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  validationErrors.position 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              >
                <option value="Umzugshelfer">Umzugshelfer</option>
                <option value="Fahrer">Fahrer</option>
                <option value="Vorarbeiter">Vorarbeiter</option>
                <option value="Bürokraft">Bürokraft</option>
                <option value="Auszubildender">Auszubildender</option>
              </select>
              {validationErrors.position && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.position}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-gray-400" />
            Adresse
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="adresse.strasse" className="block text-sm font-medium text-gray-700">
                Straße und Hausnummer
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  id="adresse.strasse"
                  name="adresse.strasse"
                  value={formData.adresse.strasse}
                  onChange={handleChange}
                  placeholder="Straße"
                  className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  id="adresse.hausnummer"
                  name="adresse.hausnummer"
                  value={formData.adresse.hausnummer}
                  onChange={handleChange}
                  placeholder="Nr."
                  className="w-20 block border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="adresse.plz" className="block text-sm font-medium text-gray-700">
                PLZ
              </label>
              <input
                type="text"
                id="adresse.plz"
                name="adresse.plz"
                value={formData.adresse.plz}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="adresse.ort" className="block text-sm font-medium text-gray-700">
                Ort
              </label>
              <input
                type="text"
                id="adresse.ort"
                name="adresse.ort"
                value={formData.adresse.ort}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Beschäftigungsdetails
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="arbeitsstunden" className="block text-sm font-medium text-gray-700">
                Wochenstunden
              </label>
              <input
                type="number"
                id="arbeitsstunden"
                name="arbeitsstunden"
                value={formData.arbeitsstunden}
                onChange={handleChange}
                min="0"
                max="60"
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  validationErrors.arbeitsstunden 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {validationErrors.arbeitsstunden && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.arbeitsstunden}</p>
              )}
            </div>

            <div>
              <label htmlFor="stundenlohn" className="block text-sm font-medium text-gray-700">
                Stundenlohn (€)
              </label>
              <input
                type="number"
                id="stundenlohn"
                name="stundenlohn"
                value={formData.stundenlohn}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  validationErrors.stundenlohn 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {validationErrors.stundenlohn && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.stundenlohn}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="verfuegbar"
                  checked={formData.verfuegbar}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Verfügbar</span>
              </label>
            </div>
          </div>
        </div>

        {/* Qualifications */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2 text-gray-400" />
            Qualifikationen
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newQualifikation}
                onChange={(e) => setNewQualifikation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualifikation())}
                placeholder="Neue Qualifikation hinzufügen"
                className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addQualifikation}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.qualifikationen.map((qual, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {qual}
                  <button
                    type="button"
                    onClick={() => removeQualifikation(index)}
                    className="ml-2 inline-flex items-center hover:text-blue-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Notfallkontakt
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="notfallkontakt.name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="notfallkontakt.name"
                name="notfallkontakt.name"
                value={formData.notfallkontakt.name}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="notfallkontakt.telefon" className="block text-sm font-medium text-gray-700">
                Telefon
              </label>
              <input
                type="tel"
                id="notfallkontakt.telefon"
                name="notfallkontakt.telefon"
                value={formData.notfallkontakt.telefon}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="notfallkontakt.beziehung" className="block text-sm font-medium text-gray-700">
                Beziehung
              </label>
              <input
                type="text"
                id="notfallkontakt.beziehung"
                name="notfallkontakt.beziehung"
                value={formData.notfallkontakt.beziehung}
                onChange={handleChange}
                placeholder="z.B. Ehepartner, Eltern"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Notizen
          </h2>
          
          <textarea
            id="notizen"
            name="notizen"
            value={formData.notizen}
            onChange={handleChange}
            rows={4}
            placeholder="Zusätzliche Informationen..."
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/mitarbeiter')}
            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <LoadingSpinner size="small" className="mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {isEdit ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MitarbeiterForm;
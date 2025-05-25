import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, X, Plus, Trash2, Receipt, Calendar, User, 
  Euro, FileText, Calculator, Printer, Send
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../services/api';
import { extractArrayData } from '../../../utils/dataUtils';

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    kunde: { name: '', email: '', telefon: '', adresse: '' },
    projekt: '',
    rechnungsdatum: format(new Date(), 'yyyy-MM-dd'),
    faelligkeitsdatum: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    zahlungsbedingungen: 'Zahlbar innerhalb von 14 Tagen ohne Abzug',
    positionen: [
      { beschreibung: '', menge: 1, einzelpreis: 0, einheit: 'Stk' }
    ],
    rabatt: 0,
    notizen: '',
    status: 'entwurf'
  });
  
  // Reference data
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Load invoice if editing
  useEffect(() => {
    if (id) {
      loadInvoice();
    }
    loadReferenceData();
  }, [id]);
  
  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/finanzen/rechnungen/${id}`);
      const invoice = response.data.data || response.data;
      
      setFormData({
        ...invoice,
        rechnungsdatum: format(new Date(invoice.rechnungsdatum), 'yyyy-MM-dd'),
        faelligkeitsdatum: format(new Date(invoice.faelligkeitsdatum), 'yyyy-MM-dd'),
        projekt: invoice.projekt?._id || ''
      });
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('Fehler beim Laden der Rechnung');
      navigate('/finanzen/rechnungen');
    } finally {
      setLoading(false);
    }
  };
  
  const loadReferenceData = async () => {
    try {
      const [customersRes, projectsRes] = await Promise.all([
        api.get('/umzuege'),
        api.get('/umzuege')
      ]);
      
      // Extract unique customers from Umzuege
      const umzuege = extractArrayData(customersRes, ['data', 'umzuege'], []);
      const uniqueCustomers = Array.from(new Map(
        umzuege
          .filter(u => u.auftraggeber?.name)
          .map(u => [u.auftraggeber.name, u.auftraggeber])
      ).values());
      
      setCustomers(uniqueCustomers);
      setProjects(umzuege);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };
  
  const handleCustomerSelect = (customerName) => {
    const customer = customers.find(c => c.name === customerName);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        kunde: {
          name: customer.name || '',
          email: customer.email || '',
          telefon: customer.telefon || '',
          adresse: customer.adresse || ''
        }
      }));
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const handleCustomerChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      kunde: {
        ...prev.kunde,
        [field]: value
      }
    }));
  };
  
  const handlePositionChange = (index, field, value) => {
    const newPositionen = [...formData.positionen];
    
    if (field === 'einzelpreis' || field === 'menge') {
      value = parseFloat(value) || 0;
    }
    
    newPositionen[index] = {
      ...newPositionen[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      positionen: newPositionen
    }));
  };
  
  const addPosition = () => {
    setFormData(prev => ({
      ...prev,
      positionen: [
        ...prev.positionen,
        { beschreibung: '', menge: 1, einzelpreis: 0, einheit: 'Stk' }
      ]
    }));
  };
  
  const removePosition = (index) => {
    if (formData.positionen.length > 1) {
      setFormData(prev => ({
        ...prev,
        positionen: prev.positionen.filter((_, i) => i !== index)
      }));
    }
  };
  
  // Calculate totals
  const calculateTotals = () => {
    const zwischensumme = formData.positionen.reduce((sum, pos) => 
      sum + (pos.menge * pos.einzelpreis), 0
    );
    
    const rabattBetrag = (zwischensumme * formData.rabatt) / 100;
    const nettobetrag = zwischensumme - rabattBetrag;
    const steuerbetrag = nettobetrag * 0.19; // 19% MwSt
    const gesamtbetrag = nettobetrag + steuerbetrag;
    
    return {
      zwischensumme,
      rabattBetrag,
      nettobetrag,
      steuerbetrag,
      gesamtbetrag
    };
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.kunde.name) {
      newErrors['kunde.name'] = 'Kundenname ist erforderlich';
    }
    
    if (!formData.kunde.email) {
      newErrors['kunde.email'] = 'E-Mail-Adresse ist erforderlich';
    }
    
    if (formData.positionen.length === 0) {
      newErrors.positionen = 'Mindestens eine Position ist erforderlich';
    }
    
    formData.positionen.forEach((pos, index) => {
      if (!pos.beschreibung) {
        newErrors[`position_${index}_beschreibung`] = 'Beschreibung ist erforderlich';
      }
      if (pos.einzelpreis <= 0) {
        newErrors[`position_${index}_einzelpreis`] = 'Preis muss größer als 0 sein';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async (sendInvoice = false) => {
    if (!validate()) {
      return;
    }
    
    try {
      setSaving(true);
      
      const totals = calculateTotals();
      const invoiceData = {
        ...formData,
        ...totals,
        status: sendInvoice ? 'versendet' : formData.status
      };
      
      let response;
      if (id) {
        response = await api.put(`/finanzen/rechnungen/${id}`, invoiceData);
      } else {
        response = await api.post('/finanzen/rechnungen', invoiceData);
      }
      
      if (sendInvoice && response.data._id) {
        await api.post(`/finanzen/rechnungen/${response.data._id}/versenden`);
      }
      
      navigate('/finanzen/rechnungen');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Fehler beim Speichern der Rechnung');
    } finally {
      setSaving(false);
    }
  };
  
  const totals = calculateTotals();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border-b mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {id ? 'Rechnung bearbeiten' : 'Neue Rechnung'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {id ? `Bearbeiten Sie die Details der Rechnung` : 'Erstellen Sie eine neue Rechnung'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/finanzen/rechnungen')}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-400" />
              Kundeninformationen
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kunde auswählen
                </label>
                <select
                  value={formData.kunde.name}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Neuer Kunde</option>
                  {customers.map((customer, index) => (
                    <option key={index} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projekt
                </label>
                <select
                  value={formData.projekt}
                  onChange={(e) => handleInputChange('projekt', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Kein Projekt</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.auftraggeber?.name} - {format(new Date(project.startDatum), 'dd.MM.yyyy')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kundenname *
                </label>
                <input
                  type="text"
                  value={formData.kunde.name}
                  onChange={(e) => handleCustomerChange('name', e.target.value)}
                  className={`w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
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
                  onChange={(e) => handleCustomerChange('email', e.target.value)}
                  className={`w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
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
                  onChange={(e) => handleCustomerChange('telefon', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.kunde.adresse}
                  onChange={(e) => handleCustomerChange('adresse', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              Rechnungsdetails
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rechnungsdatum
                </label>
                <input
                  type="date"
                  value={formData.rechnungsdatum}
                  onChange={(e) => handleInputChange('rechnungsdatum', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fälligkeitsdatum
                </label>
                <input
                  type="date"
                  value={formData.faelligkeitsdatum}
                  onChange={(e) => handleInputChange('faelligkeitsdatum', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rabatt (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.rabatt}
                  onChange={(e) => handleInputChange('rabatt', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zahlungsbedingungen
              </label>
              <textarea
                rows={2}
                value={formData.zahlungsbedingungen}
                onChange={(e) => handleInputChange('zahlungsbedingungen', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          {/* Line Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-400" />
                Rechnungspositionen
              </h2>
              <button
                type="button"
                onClick={addPosition}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                <Plus className="h-4 w-4 mr-1" />
                Position hinzufügen
              </button>
            </div>
            
            {errors.positionen && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3">
                <p className="text-sm text-red-700">{errors.positionen}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {formData.positionen.map((position, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beschreibung
                      </label>
                      <input
                        type="text"
                        value={position.beschreibung}
                        onChange={(e) => handlePositionChange(index, 'beschreibung', e.target.value)}
                        className={`w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          errors[`position_${index}_beschreibung`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors[`position_${index}_beschreibung`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`position_${index}_beschreibung`]}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Menge
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={position.menge}
                        onChange={(e) => handlePositionChange(index, 'menge', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Einheit
                      </label>
                      <select
                        value={position.einheit}
                        onChange={(e) => handlePositionChange(index, 'einheit', e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="Stk">Stück</option>
                        <option value="Std">Stunden</option>
                        <option value="kg">Kilogramm</option>
                        <option value="m">Meter</option>
                        <option value="m²">Quadratmeter</option>
                        <option value="m³">Kubikmeter</option>
                        <option value="Pauschale">Pauschale</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Einzelpreis (€)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={position.einzelpreis}
                        onChange={(e) => handlePositionChange(index, 'einzelpreis', e.target.value)}
                        className={`w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          errors[`position_${index}_einzelpreis`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors[`position_${index}_einzelpreis`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`position_${index}_einzelpreis`]}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-1 flex items-end">
                      {formData.positionen.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePosition(index)}
                          className="mb-1 p-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-right">
                    <span className="text-sm text-gray-500">Gesamt: </span>
                    <span className="text-sm font-medium text-gray-900">
                      {(position.menge * position.einzelpreis).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Totals */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-gray-400" />
              Zusammenfassung
            </h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Zwischensumme:</span>
                <span className="font-medium">
                  {totals.zwischensumme.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              
              {formData.rabatt > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rabatt ({formData.rabatt}%):</span>
                  <span className="font-medium text-red-600">
                    -{totals.rabattBetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nettobetrag:</span>
                <span className="font-medium">
                  {totals.nettobetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">MwSt. (19%):</span>
                <span className="font-medium">
                  {totals.steuerbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-lg font-medium text-gray-900">Gesamtbetrag:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {totals.gesamtbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Notizen
            </h2>
            <textarea
              rows={4}
              value={formData.notizen}
              onChange={(e) => handleInputChange('notizen', e.target.value)}
              placeholder="Zusätzliche Informationen oder Hinweise..."
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/finanzen/rechnungen')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Abbrechen
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Als Entwurf speichern
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Versenden...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Speichern & Versenden
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
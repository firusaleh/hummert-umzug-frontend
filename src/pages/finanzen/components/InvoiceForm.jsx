import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, Plus, Trash2, Calendar, 
  FileText, User, Euro, AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../services/api';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [formData, setFormData] = useState({
    rechnungNummer: '',
    kunde: '',
    kundeName: '',
    umzug: '',
    ausstellungsdatum: format(new Date(), 'yyyy-MM-dd'),
    faelligkeitsdatum: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    status: 'Entwurf',
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
    notizen: '',
    zahlungsmethode: 'Überweisung'
  });
  
  // Fetch customers and projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, projectsRes] = await Promise.all([
          api.get('/clients'),
          api.get('/projects')
        ]);
        
        setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
        
        // Fetch Umzüge instead of projects
        const umzuegeRes = await api.get('/umzuege');
        setProjects(Array.isArray(umzuegeRes.data?.data) ? umzuegeRes.data.data : Array.isArray(umzuegeRes.data) ? umzuegeRes.data : []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    
    fetchData();
  }, []);
  
  // Fetch invoice if editing
  useEffect(() => {
    if (isEdit) {
      fetchInvoice();
    }
  }, [id]);
  
  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/finanzen/rechnungen/${id}`);
      const invoice = response.data?.data || response.data;
      
      setFormData({
        ...invoice,
        ausstellungsdatum: invoice.ausstellungsdatum 
          ? format(new Date(invoice.ausstellungsdatum), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
        faelligkeitsdatum: invoice.faelligkeitsdatum
          ? format(new Date(invoice.faelligkeitsdatum), 'yyyy-MM-dd')
          : format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        positionsliste: invoice.positionsliste || [{
          bezeichnung: '',
          menge: 1,
          einheit: 'Stück',
          einzelpreis: 0,
          gesamtpreis: 0
        }]
      });
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Fehler beim Laden der Rechnung');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePositionChange = (index, field, value) => {
    const newPositionen = [...formData.positionsliste];
    newPositionen[index][field] = value;
    
    // Calculate total for this position
    if (field === 'menge' || field === 'einzelpreis') {
      newPositionen[index].gesamtpreis = 
        newPositionen[index].menge * newPositionen[index].einzelpreis;
    }
    
    setFormData(prev => ({
      ...prev,
      positionsliste: newPositionen
    }));
    
    calculateTotals(newPositionen);
  };
  
  const addPosition = () => {
    setFormData(prev => ({
      ...prev,
      positionsliste: [...prev.positionsliste, {
        bezeichnung: '',
        menge: 1,
        einheit: 'Stück',
        einzelpreis: 0,
        gesamtpreis: 0
      }]
    }));
  };
  
  const removePosition = (index) => {
    if (formData.positionsliste.length > 1) {
      const newPositionen = formData.positionsliste.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        positionsliste: newPositionen
      }));
      calculateTotals(newPositionen);
    }
  };
  
  const calculateTotals = (positionen) => {
    const zwischensumme = positionen.reduce((sum, pos) => sum + pos.gesamtpreis, 0);
    const mwstBetrag = zwischensumme * (formData.mehrwertsteuer / 100);
    const gesamtbetrag = zwischensumme + mwstBetrag;
    
    setFormData(prev => ({
      ...prev,
      zwischensumme,
      mwstBetrag,
      gesamtbetrag
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const data = {
        ...formData,
        kunde: formData.kunde || undefined,
        umzug: formData.umzug || undefined
      };
      
      if (isEdit) {
        await api.put(`/finanzen/rechnungen/${id}`, data);
      } else {
        await api.post('/finanzen/rechnungen', data);
      }
      
      navigate('/finanzen');
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError('Fehler beim Speichern der Rechnung');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Lade Rechnung...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEdit ? 'Rechnung bearbeiten' : 'Neue Rechnung'}
        </h2>
        <button
          onClick={() => navigate('/finanzen')}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Grundinformationen</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rechnungsnummer
              </label>
              <input
                type="text"
                name="rechnungNummer"
                value={formData.rechnungNummer}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Entwurf">Entwurf</option>
                <option value="Gesendet">Gesendet</option>
                <option value="Bezahlt">Bezahlt</option>
                <option value="Überfällig">Überfällig</option>
                <option value="Teilbezahlt">Teilbezahlt</option>
                <option value="Storniert">Storniert</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kunde
              </label>
              <select
                name="kunde"
                value={formData.kunde}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Kunde wählen...</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kundenname (falls nicht in Liste)
              </label>
              <input
                type="text"
                name="kundeName"
                value={formData.kundeName}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ausstellungsdatum
              </label>
              <input
                type="date"
                name="ausstellungsdatum"
                value={formData.ausstellungsdatum}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fälligkeitsdatum
              </label>
              <input
                type="date"
                name="faelligkeitsdatum"
                value={formData.faelligkeitsdatum}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
        
        {/* Line Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Positionen</h3>
            <button
              type="button"
              onClick={addPosition}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Position hinzufügen
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.positionsliste.map((position, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-5">
                    <label className="block text-sm font-medium text-gray-700">
                      Bezeichnung
                    </label>
                    <input
                      type="text"
                      value={position.bezeichnung}
                      onChange={(e) => handlePositionChange(index, 'bezeichnung', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Menge
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={position.menge}
                      onChange={(e) => handlePositionChange(index, 'menge', parseFloat(e.target.value) || 0)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Einzelpreis
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={position.einzelpreis}
                      onChange={(e) => handlePositionChange(index, 'einzelpreis', parseFloat(e.target.value) || 0)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Gesamtpreis
                    </label>
                    <input
                      type="text"
                      value={position.gesamtpreis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  
                  <div className="md:col-span-1 flex items-end">
                    {formData.positionsliste.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePosition(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Totals */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-3 max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-gray-600">Zwischensumme</span>
              <span className="font-medium">
                {formData.zwischensumme.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MwSt ({formData.mehrwertsteuer}%)</span>
              <span className="font-medium">
                {formData.mwstBetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-3 border-t">
              <span>Gesamtbetrag</span>
              <span>
                {formData.gesamtbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notizen</h3>
          <textarea
            name="notizen"
            value={formData.notizen}
            onChange={handleChange}
            rows={4}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Zusätzliche Informationen..."
          />
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/finanzen')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
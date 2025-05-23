// src/pages/fahrzeuge/KilometerstandForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Gauge,
  Truck,
  Car
} from 'lucide-react';
import { fahrzeugeService } from '../../services/api';
import { toast } from 'react-toastify';

const KilometerstandForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [fahrzeug, setFahrzeug] = useState(null);
  const [kilometerstand, setKilometerstand] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fahrzeugdaten laden
  useEffect(() => {
    const fetchFahrzeug = async () => {
      setLoading(true);
      try {
        const response = await fahrzeugeService.getById(id);
        if (response && (response.data || response.success)) {
          const fahrzeugData = response.data || response;
          setFahrzeug(fahrzeugData);
          setKilometerstand(fahrzeugData.kilometerstand || '');
        } else {
          throw new Error('Keine Fahrzeugdaten erhalten');
        }
      } catch (err) {
        // Fehler beim Laden des Fahrzeugs
        setError('Das Fahrzeug konnte nicht geladen werden.');
        toast.error('Fahrzeug konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFahrzeug();
    }
  }, [id]);

  // Kilometerstand aktualisieren
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      if (!kilometerstand) {
        throw new Error('Bitte geben Sie einen Kilometerstand ein');
      }
      
      if (fahrzeug.kilometerstand && Number(kilometerstand) < Number(fahrzeug.kilometerstand)) {
        throw new Error('Der neue Kilometerstand muss größer als der aktuelle sein');
      }
      
      const response = await fahrzeugeService.updateKilometerstand(id, Number(kilometerstand));
      
      if (response.success === false) {
        throw new Error(response.message || 'Fehler beim Aktualisieren des Kilometerstands');
      }
      
      toast.success('Kilometerstand wurde erfolgreich aktualisiert');
      navigate('/fahrzeuge');
    } catch (err) {
      // Fehler beim Aktualisieren des Kilometerstands
      setError(err.message || 'Der Kilometerstand konnte nicht aktualisiert werden.');
      toast.error(err.message || 'Fehler beim Aktualisieren des Kilometerstands');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Kopfzeile mit Navigation */}
      <div className="flex items-center mb-6">
        <Link to="/fahrzeuge" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          Kilometerstand aktualisieren
        </h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        {fahrzeug && (
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                {fahrzeug.bild ? (
                  <img 
                    src={fahrzeug.bild} 
                    alt={fahrzeug.bezeichnung} 
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  fahrzeug.typ === 'LKW' ? (
                    <Truck size={24} className="text-gray-500" />
                  ) : (
                    <Car size={24} className="text-gray-500" />
                  )
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{fahrzeug.bezeichnung}</h2>
                <p className="text-sm text-gray-500">{fahrzeug.kennzeichen}</p>
              </div>
            </div>
            
            <div className="flex items-center mb-2">
              <Gauge size={18} className="text-gray-500 mr-2" />
              <span className="text-gray-700">Aktueller Kilometerstand:</span>
              <span className="font-semibold ml-2">
                {fahrzeug.kilometerstand ? 
                  `${fahrzeug.kilometerstand.toLocaleString('de-DE')} km` : 
                  'Keine Angabe'}
              </span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Neuer Kilometerstand (km) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Gauge size={20} className="text-gray-400" />
              </div>
              <input
                type="number"
                value={kilometerstand}
                onChange={(e) => setKilometerstand(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                placeholder="Neuer Kilometerstand"
                min={fahrzeug?.kilometerstand || 0}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500">km</span>
              </div>
            </div>
            {fahrzeug?.kilometerstand && (
              <p className="text-sm text-gray-500 mt-1">
                Der neue Wert muss größer als {fahrzeug.kilometerstand.toLocaleString('de-DE')} km sein.
              </p>
            )}
          </div>
          
          {/* Formular-Buttons */}
          <div className="flex justify-end space-x-3">
            <Link 
              to="/fahrzeuge" 
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <X size={16} className="mr-2" /> Abbrechen
            </Link>
            
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              disabled={saving}
            >
              <Save size={16} className="mr-2" /> 
              {saving ? 'Wird gespeichert...' : 'Aktualisieren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KilometerstandForm;
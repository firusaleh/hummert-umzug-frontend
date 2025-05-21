// src/pages/fahrzeuge/FahrzeugForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Car,
  Truck,
  Calendar, 
  Gauge,
  Ruler,
  Weight,
  Info,
  ImagePlus,
  BadgeEuro
} from 'lucide-react';
import { fahrzeugeService } from '../../services/api';
import { toast } from 'react-toastify';

const FahrzeugForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNeueModus = !id;
  
  // State für Formularfelder
  const [formData, setFormData] = useState({
    kennzeichen: '',
    bezeichnung: '',
    typ: 'Transporter',
    kapazitaet: {
      ladeflaeche: {
        laenge: '',
        breite: '',
        hoehe: ''
      },
      ladegewicht: ''
    },
    baujahr: '',
    anschaffungsdatum: '',
    tuev: '',
    fuehrerscheinklasse: 'B',
    status: 'Verfügbar',
    kilometerstand: '',
    naechsterService: '',
    versicherung: {
      gesellschaft: '',
      vertragsnummer: '',
      ablaufdatum: ''
    },
    notizen: ''
  });
  
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [vehicleImage, setVehicleImage] = useState(null);
  const [vehicleImagePreview, setVehicleImagePreview] = useState('');
  const [error, setError] = useState(null);

  // Daten beim Bearbeiten laden
  useEffect(() => {
    if (id) {
      const fetchFahrzeug = async () => {
        setLoading(true);
        try {
          const response = await fahrzeugeService.getById(id);
          if (response && (response.data || response.success)) {
            // Daten aus der API in das Formular-State übertragen
            const fahrzeug = response.data || response;
            setFormData({
              kennzeichen: fahrzeug.kennzeichen || '',
              bezeichnung: fahrzeug.bezeichnung || '',
              typ: fahrzeug.typ || 'Transporter',
              kapazitaet: {
                ladeflaeche: {
                  laenge: fahrzeug.kapazitaet?.ladeflaeche?.laenge || '',
                  breite: fahrzeug.kapazitaet?.ladeflaeche?.breite || '',
                  hoehe: fahrzeug.kapazitaet?.ladeflaeche?.hoehe || ''
                },
                ladegewicht: fahrzeug.kapazitaet?.ladegewicht || ''
              },
              baujahr: fahrzeug.baujahr || '',
              anschaffungsdatum: fahrzeug.anschaffungsdatum ? new Date(fahrzeug.anschaffungsdatum).toISOString().substr(0, 10) : '',
              tuev: fahrzeug.tuev ? new Date(fahrzeug.tuev).toISOString().substr(0, 10) : '',
              fuehrerscheinklasse: fahrzeug.fuehrerscheinklasse || 'B',
              status: fahrzeug.status || 'Verfügbar',
              kilometerstand: fahrzeug.kilometerstand || '',
              naechsterService: fahrzeug.naechsterService ? new Date(fahrzeug.naechsterService).toISOString().substr(0, 10) : '',
              versicherung: {
                gesellschaft: fahrzeug.versicherung?.gesellschaft || '',
                vertragsnummer: fahrzeug.versicherung?.vertragsnummer || '',
                ablaufdatum: fahrzeug.versicherung?.ablaufdatum ? new Date(fahrzeug.versicherung.ablaufdatum).toISOString().substr(0, 10) : ''
              },
              notizen: fahrzeug.notizen || ''
            });
            
            // Wenn es ein Bild gibt, anzeigen
            if (fahrzeug.bild) {
              setVehicleImagePreview(fahrzeug.bild);
            }
          }
          setLoading(false);
        } catch (err) {
          console.error('Fehler beim Laden des Fahrzeugs:', err);
          setError('Das Fahrzeug konnte nicht geladen werden.');
          toast.error('Fahrzeug konnte nicht geladen werden');
          setLoading(false);
        }
      };

      fetchFahrzeug();
    }
  }, [id]);

  // Behandelt Änderungen in Input-Feldern
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Für verschachtelte Felder (z.B. kapazitaet.ladeflaeche.laenge)
      const parts = name.split('.');
      if (parts.length === 2) {
        setFormData(prev => ({
          ...prev,
          [parts[0]]: {
            ...prev[parts[0]],
            [parts[1]]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (parts.length === 3) {
        setFormData(prev => ({
          ...prev,
          [parts[0]]: {
            ...prev[parts[0]],
            [parts[1]]: {
              ...prev[parts[0]][parts[1]],
              [parts[2]]: type === 'checkbox' ? checked : value
            }
          }
        }));
      }
    } else {
      // Für einfache Felder
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Behandelt Bildupload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehicleImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Formular absenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // API-Daten vorbereiten
      const fahrzeugData = {
        ...formData,
        // Zahlen-Felder konvertieren
        baujahr: formData.baujahr ? Number(formData.baujahr) : undefined,
        kilometerstand: formData.kilometerstand ? Number(formData.kilometerstand) : undefined,
        'kapazitaet.ladeflaeche.laenge': formData.kapazitaet.ladeflaeche.laenge ? Number(formData.kapazitaet.ladeflaeche.laenge) : undefined,
        'kapazitaet.ladeflaeche.breite': formData.kapazitaet.ladeflaeche.breite ? Number(formData.kapazitaet.ladeflaeche.breite) : undefined,
        'kapazitaet.ladeflaeche.hoehe': formData.kapazitaet.ladeflaeche.hoehe ? Number(formData.kapazitaet.ladeflaeche.hoehe) : undefined,
        'kapazitaet.ladegewicht': formData.kapazitaet.ladegewicht ? Number(formData.kapazitaet.ladegewicht) : undefined
      };
      
      let response;
      
      if (isNeueModus) {
        // Neues Fahrzeug erstellen
        response = await fahrzeugeService.create(fahrzeugData);
        
        // Bild hochladen, wenn vorhanden
        if (vehicleImage && response.data && response.data._id) {
          const imageFormData = new FormData();
          imageFormData.append('file', vehicleImage);
          
          await fahrzeugeService.uploadImage(response.data._id, imageFormData);
        }
        
        toast.success('Fahrzeug wurde erfolgreich angelegt!');
      } else {
        // Bestehendes Fahrzeug aktualisieren
        response = await fahrzeugeService.update(id, fahrzeugData);
        
        // Bild hochladen, wenn vorhanden
        if (vehicleImage) {
          const imageFormData = new FormData();
          imageFormData.append('file', vehicleImage);
          
          await fahrzeugeService.uploadImage(id, imageFormData);
        }
        
        toast.success('Fahrzeug wurde erfolgreich aktualisiert!');
      }
      
      // Zurück zur Übersicht navigieren
      navigate('/fahrzeuge');
    } catch (err) {
      console.error('Fehler beim Speichern des Fahrzeugs:', err);
      setError(err.response?.data?.message || 'Das Fahrzeug konnte nicht gespeichert werden.');
      toast.error('Fehler beim Speichern des Fahrzeugs');
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
    <div>
      {/* Kopfzeile mit Navigation */}
      <div className="flex items-center mb-6">
        <Link to="/fahrzeuge" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {isNeueModus ? 'Neues Fahrzeug anlegen' : 'Fahrzeug bearbeiten'}
        </h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bild und Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Bild & Status</h2>
            
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative mb-4">
                <div className={`w-32 h-32 rounded-lg overflow-hidden border-4 border-gray-200 flex items-center justify-center bg-gray-100 ${
                  vehicleImagePreview ? '' : 'border-dashed'
                }`}>
                  {vehicleImagePreview ? (
                    <img 
                      src={vehicleImagePreview} 
                      alt="Fahrzeugvorschau" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      {formData.typ === 'LKW' ? (
                        <Truck size={32} />
                      ) : (
                        <Car size={32} />
                      )}
                      <span className="text-xs mt-2">Kein Bild</span>
                    </div>
                  )}
                </div>
                <label 
                  htmlFor="vehicle-image-upload" 
                  className="absolute -right-2 bottom-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600"
                >
                  <ImagePlus size={16} />
                </label>
                <input 
                  type="file" 
                  id="vehicle-image-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                />
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                JPG, PNG oder GIF, maximal 2MB
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Verfügbar">Verfügbar</option>
                  <option value="Im Einsatz">Im Einsatz</option>
                  <option value="In Wartung">In Wartung</option>
                  <option value="Defekt">Defekt</option>
                  <option value="Außer Dienst">Außer Dienst</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                <select
                  name="typ"
                  value={formData.typ}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LKW">LKW</option>
                  <option value="Transporter">Transporter</option>
                  <option value="PKW">PKW</option>
                  <option value="Anhänger">Anhänger</option>
                  <option value="Sonstige">Sonstige</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Führerscheinklasse</label>
                <select
                  name="fuehrerscheinklasse"
                  value={formData.fuehrerscheinklasse}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="B">B</option>
                  <option value="BE">BE</option>
                  <option value="C1">C1</option>
                  <option value="C1E">C1E</option>
                  <option value="C">C</option>
                  <option value="CE">CE</option>
                  <option value="D1">D1</option>
                  <option value="D1E">D1E</option>
                  <option value="D">D</option>
                  <option value="DE">DE</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Hauptinformationen */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Fahrzeuginformationen</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kennzeichen *</label>
                <input
                  type="text"
                  name="kennzeichen"
                  value={formData.kennzeichen}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. M-AB 1234"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung *</label>
                <input
                  type="text"
                  name="bezeichnung"
                  value={formData.bezeichnung}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. Mercedes Sprinter"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Baujahr</label>
                <input
                  type="number"
                  name="baujahr"
                  value={formData.baujahr}
                  onChange={handleInputChange}
                  min="1950"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anschaffungsdatum</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="anschaffungsdatum"
                    value={formData.anschaffungsdatum}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TÜV bis</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="tuev"
                    value={formData.tuev}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilometer</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Gauge size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="kilometerstand"
                    value={formData.kilometerstand}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nächster Service</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="naechsterService"
                    value={formData.naechsterService}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Kapazität */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Kapazität & Maße</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ladefläche</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Ruler size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="kapazitaet.ladeflaeche.laenge"
                        value={formData.kapazitaet.ladeflaeche.laenge}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Länge"
                      />
                    </div>
                    <span className="text-xs text-gray-500">Länge (cm)</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      name="kapazitaet.ladeflaeche.breite"
                      value={formData.kapazitaet.ladeflaeche.breite}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Breite"
                    />
                    <span className="text-xs text-gray-500">Breite (cm)</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      name="kapazitaet.ladeflaeche.hoehe"
                      value={formData.kapazitaet.ladeflaeche.hoehe}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Höhe"
                    />
                    <span className="text-xs text-gray-500">Höhe (cm)</span>
                  </div>
                </div>
                {formData.kapazitaet.ladeflaeche.laenge && 
                 formData.kapazitaet.ladeflaeche.breite && 
                 formData.kapazitaet.ladeflaeche.hoehe && (
                  <div className="mt-2 text-sm text-gray-500">
                    Volumen: {((formData.kapazitaet.ladeflaeche.laenge * 
                             formData.kapazitaet.ladeflaeche.breite * 
                             formData.kapazitaet.ladeflaeche.hoehe) / 1000000).toFixed(2)} m³
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ladegewicht</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Weight size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="kapazitaet.ladegewicht"
                    value={formData.kapazitaet.ladegewicht}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ladegewicht in kg"
                  />
                </div>
                <span className="text-xs text-gray-500">Maximales Ladegewicht in kg</span>
              </div>
            </div>
          </div>
          
          {/* Versicherung */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Versicherung</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gesellschaft</label>
                <input
                  type="text"
                  name="versicherung.gesellschaft"
                  value={formData.versicherung.gesellschaft}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vertragsnummer</label>
                <input
                  type="text"
                  name="versicherung.vertragsnummer"
                  value={formData.versicherung.vertragsnummer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ablaufdatum</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="versicherung.ablaufdatum"
                    value={formData.versicherung.ablaufdatum}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Notizen */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Notizen</h2>
            
            <div>
              <textarea
                name="notizen"
                value={formData.notizen}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Besonderheiten und Anmerkungen zum Fahrzeug..."
              ></textarea>
            </div>
          </div>
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
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FahrzeugForm;
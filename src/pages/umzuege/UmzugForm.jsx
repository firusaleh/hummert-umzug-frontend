// src/pages/umzuege/UmzugForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  TruckElectric, 
  Users, 
  Save, 
  X, 
  Plus,
  Trash2
} from 'lucide-react';

// Beispieldaten für einen Umzug beim Bearbeiten
const mockUmzug = {
  id: 1,
  kunde: {
    name: 'Familie Becker',
    kontaktperson: 'Thomas Becker',
    telefon: '+49 176 12345678',
    email: 'thomas.becker@example.com'
  },
  typ: 'Privat',
  status: 'Geplant',
  datum: '2025-05-15', // Format für Datumseingabefeld
  uhrzeit_start: '08:00',
  uhrzeit_ende: '16:00',
  startadresse: 'Rosenweg 8, 10115 Berlin',
  zieladresse: 'Tulpenallee 23, 80333 München',
  umzugsvolumen: 70, // Numerischer Wert
  etage_start: '3',
  aufzug_start: true,
  etage_ziel: '2',
  aufzug_ziel: false,
  mitarbeiter: [1, 2, 3, 4], // IDs der ausgewählten Mitarbeiter
  fahrzeuge: [1, 2], // IDs der ausgewählten Fahrzeuge
  notizen: 'Klavier muss transportiert werden. Kunde hat spezielle Verpackungswünsche für die Kunstsammlung.'
};

// Beispieldaten für Mitarbeiter- und Fahrzeugauswahl
const mockMitarbeiter = [
  { id: 1, name: 'Max Mustermann', rolle: 'Teamleiter' },
  { id: 2, name: 'Anna Schmidt', rolle: 'Packer' },
  { id: 3, name: 'Lukas Meyer', rolle: 'Fahrer' },
  { id: 4, name: 'Julia Weber', rolle: 'Packer' },
  { id: 5, name: 'Felix Schulz', rolle: 'Fahrer' },
  { id: 6, name: 'Laura König', rolle: 'Packer' }
];

const mockFahrzeuge = [
  { id: 1, kennzeichen: 'B-HU 1234', typ: '7,5t LKW' },
  { id: 2, kennzeichen: 'B-HU 5678', typ: 'Transporter' },
  { id: 3, kennzeichen: 'B-HU 9012', typ: '12t LKW' },
  { id: 4, kennzeichen: 'B-HU 3456', typ: 'Transporter' }
];

const UmzugForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNeueModus = !id;
  
  // State für Formularfelder
  const [formData, setFormData] = useState({
    kunde: {
      name: '',
      kontaktperson: '',
      telefon: '',
      email: ''
    },
    typ: 'Privat',
    status: 'Geplant',
    datum: '',
    uhrzeit_start: '08:00',
    uhrzeit_ende: '17:00',
    startadresse: '',
    zieladresse: '',
    umzugsvolumen: '',
    etage_start: '',
    aufzug_start: false,
    etage_ziel: '',
    aufzug_ziel: false,
    mitarbeiter: [],
    fahrzeuge: [],
    notizen: ''
  });
  
  const [loading, setLoading] = useState(!!id);
  const [verfuegbareMitarbeiter, setVerfuegbareMitarbeiter] = useState([]);
  const [verfuegbareFahrzeuge, setVerfuegbareFahrzeuge] = useState([]);

  // Simuliere API-Aufruf zum Laden der Daten bei Bearbeitung
  useEffect(() => {
    if (id) {
      const fetchUmzug = () => {
        // In einer echten Anwendung würde hier ein API-Aufruf mit der ID stattfinden
        setFormData(mockUmzug);
        setLoading(false);
      };

      fetchUmzug();
    }
    
    // Mitarbeiter und Fahrzeuge laden
    setVerfuegbareMitarbeiter(mockMitarbeiter);
    setVerfuegbareFahrzeuge(mockFahrzeuge);
  }, [id]);

  // Behandelt Änderungen in Input-Feldern
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Für verschachtelte Objekte wie kunde.name
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Für normale Felder
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Behandelt Auswahl von Mitarbeitern
  const handleMitarbeiterToggle = (mitarbeiterId) => {
    setFormData(prev => {
      const neueMitarbeiter = prev.mitarbeiter.includes(mitarbeiterId)
        ? prev.mitarbeiter.filter(id => id !== mitarbeiterId)
        : [...prev.mitarbeiter, mitarbeiterId];
      
      return {
        ...prev,
        mitarbeiter: neueMitarbeiter
      };
    });
  };

  // Behandelt Auswahl von Fahrzeugen
  const handleFahrzeugToggle = (fahrzeugId) => {
    setFormData(prev => {
      const neueFahrzeuge = prev.fahrzeuge.includes(fahrzeugId)
        ? prev.fahrzeuge.filter(id => id !== fahrzeugId)
        : [...prev.fahrzeuge, fahrzeugId];
      
      return {
        ...prev,
        fahrzeuge: neueFahrzeuge
      };
    });
  };

  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In einer echten Anwendung würde hier ein API-Aufruf zum Speichern stattfinden
    console.log('Formular abgesendet:', formData);
    
    // Zurück zur Übersicht navigieren
    navigate('/umzuege');
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
        <Link to="/umzuege" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {isNeueModus ? 'Neuen Umzug anlegen' : 'Umzug bearbeiten'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Kundeninformationen */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Kundeninformationen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kundenname</label>
              <input
                type="text"
                name="kunde.name"
                value={formData.kunde.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktperson</label>
              <input
                type="text"
                name="kunde.kontaktperson"
                value={formData.kunde.kontaktperson}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input
                type="tel"
                name="kunde.telefon"
                value={formData.kunde.telefon}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input
                type="email"
                name="kunde.email"
                value={formData.kunde.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Umzugsdetails */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Umzugsdetails</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umzugstyp</label>
              <select
                name="typ"
                value={formData.typ}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Privat">Privat</option>
                <option value="Gewerbe">Gewerbe</option>
                <option value="Senioren">Senioren</option>
                <option value="International">International</option>
                <option value="Spezialtransport">Spezialtransport</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Geplant">Geplant</option>
                <option value="In Vorbereitung">In Vorbereitung</option>
                <option value="Abgeschlossen">Abgeschlossen</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umzugsvolumen (m³)</label>
              <input
                type="number"
                name="umzugsvolumen"
                value={formData.umzugsvolumen}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
              <input
                type="date"
                name="datum"
                value={formData.datum}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Startzeit</label>
              <input
                type="time"
                name="uhrzeit_start"
                value={formData.uhrzeit_start}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endzeit</label>
              <input
                type="time"
                name="uhrzeit_ende"
                value={formData.uhrzeit_ende}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Adressen */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Adressen</h2>
          
          <div className="space-y-6">
            {/* Startadresse */}
            <div>
              <h3 className="text-md font-medium mb-3 flex items-center">
                <MapPin size={18} className="mr-2 text-blue-500" /> Startadresse
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Straße, Hausnummer, PLZ, Ort</label>
                  <input
                    type="text"
                    name="startadresse"
                    value={formData.startadresse}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Etage</label>
                    <input
                      type="text"
                      name="etage_start"
                      value={formData.etage_start}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="aufzug_start"
                      name="aufzug_start"
                      checked={formData.aufzug_start}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="aufzug_start" className="ml-2 block text-sm text-gray-700">
                      Aufzug vorhanden
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Zieladresse */}
            <div>
              <h3 className="text-md font-medium mb-3 flex items-center">
                <MapPin size={18} className="mr-2 text-green-500" /> Zieladresse
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Straße, Hausnummer, PLZ, Ort</label>
                  <input
                    type="text"
                    name="zieladresse"
                    value={formData.zieladresse}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Etage</label>
                    <input
                      type="text"
                      name="etage_ziel"
                      value={formData.etage_ziel}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="aufzug_ziel"
                      name="aufzug_ziel"
                      checked={formData.aufzug_ziel}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="aufzug_ziel" className="ml-2 block text-sm text-gray-700">
                      Aufzug vorhanden
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Team und Ressourcen */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Team und Ressourcen</h2>
          
          <div className="space-y-6">
            {/* Mitarbeiter */}
            <div>
              <h3 className="text-md font-medium mb-3 flex items-center">
                <Users size={18} className="mr-2 text-blue-500" /> Mitarbeiter
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {verfuegbareMitarbeiter.map((mitarbeiter) => (
                  <div
                    key={mitarbeiter.id}
                    onClick={() => handleMitarbeiterToggle(mitarbeiter.id)}
                    className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                      formData.mitarbeiter.includes(mitarbeiter.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-3 ${
                      formData.mitarbeiter.includes(mitarbeiter.id) ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      {mitarbeiter.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{mitarbeiter.name}</p>
                      <p className="text-xs text-gray-500">{mitarbeiter.rolle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Fahrzeuge */}
            <div>
              <h3 className="text-md font-medium mb-3 flex items-center">
                <TruckElectric size={18} className="mr-2 text-blue-500" /> Fahrzeuge
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {verfuegbareFahrzeuge.map((fahrzeug) => (
                  <div
                    key={fahrzeug.id}
                    onClick={() => handleFahrzeugToggle(fahrzeug.id)}
                    className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                      formData.fahrzeuge.includes(fahrzeug.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${
                      formData.fahrzeuge.includes(fahrzeug.id) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <TruckElectric size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{fahrzeug.kennzeichen}</p>
                      <p className="text-xs text-gray-500">{fahrzeug.typ}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Notizen */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Notizen</h2>
          
          <div>
            <textarea
              name="notizen"
              value={formData.notizen}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Besonderheiten und Anmerkungen zum Umzug..."
            ></textarea>
          </div>
        </div>
        
        {/* Formular-Buttons */}
        <div className="flex justify-end space-x-3">
          <Link 
            to="/umzuege" 
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <X size={16} className="mr-2" /> Abbrechen
          </Link>
          
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Save size={16} className="mr-2" /> Speichern
          </button>
        </div>
      </form>
    </div>
  );
};

export default UmzugForm;
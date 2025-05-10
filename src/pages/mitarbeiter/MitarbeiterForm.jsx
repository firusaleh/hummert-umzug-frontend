// src/pages/mitarbeiter/MitarbeiterForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Phone, 
  Mail, 
  User, 
  Calendar, 
  MapPin, 
  Upload,
  ImagePlus
} from 'lucide-react';

// Beispieldaten für einen Mitarbeiter beim Bearbeiten
const mockMitarbeiter = {
  id: 1, 
  vorname: 'Max', 
  nachname: 'Mustermann',
  position: 'Teamleiter',
  telefon: '+49 176 1234567',
  email: 'max.mustermann@hummert.de',
  eintrittsdatum: '2020-03-01', // Format für Datumseingabefeld
  strasse: 'Musterstraße 123',
  plz: '10115',
  ort: 'Berlin',
  geburtstag: '1985-05-15', // Format für Datumseingabefeld
  notizen: 'Sehr erfahrener Mitarbeiter, spricht Englisch und Französisch.',
  status: 'Aktiv',
  verfuegbarkeit: 'Verfügbar',
  faehigkeiten: ['Umzugsplanung', 'Teamführung', 'Führerschein Klasse C']
};

// Verfügbare Positionen
const verfuegbarePositionen = [
  'Teamleiter',
  'Packer',
  'Fahrer',
  'Aufnahmespezialist',
  'Aufnahme & Vertrieb',
  'Lagerverwalter',
  'Bürokraft'
];

// Verfügbare Fähigkeiten
const verfuegbareFaehigkeiten = [
  'Umzugsplanung',
  'Teamführung',
  'Führerschein Klasse B',
  'Führerschein Klasse C',
  'Englisch',
  'Französisch',
  'Spanisch',
  'Kundengespräch',
  'Verpackungsspezialist',
  'Möbelmontage',
  'Klaviertransport',
  'Schwerlasttransport'
];

const MitarbeiterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNeueModus = !id;
  
  // State für Formularfelder
  const [formData, setFormData] = useState({
    vorname: '',
    nachname: '',
    position: '',
    telefon: '',
    email: '',
    eintrittsdatum: '',
    strasse: '',
    plz: '',
    ort: '',
    geburtstag: '',
    notizen: '',
    status: 'Aktiv',
    verfuegbarkeit: 'Verfügbar',
    faehigkeiten: []
  });
  
  const [loading, setLoading] = useState(!!id);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');

  // Simuliere API-Aufruf zum Laden der Daten bei Bearbeitung
  useEffect(() => {
    if (id) {
      const fetchMitarbeiter = () => {
        // In einer echten Anwendung würde hier ein API-Aufruf mit der ID stattfinden
        setFormData(mockMitarbeiter);
        setLoading(false);
      };

      fetchMitarbeiter();
    }
  }, [id]);

  // Behandelt Änderungen in Input-Feldern
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Behandelt Auswahl von Fähigkeiten
  const handleFaehigkeitToggle = (faehigkeit) => {
    setFormData(prev => {
      const neueFaehigkeiten = prev.faehigkeiten.includes(faehigkeit)
        ? prev.faehigkeiten.filter(f => f !== faehigkeit)
        : [...prev.faehigkeiten, faehigkeit];
      
      return {
        ...prev,
        faehigkeiten: neueFaehigkeiten
      };
    });
  };

  // Behandelt Profilbildupload
  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In einer echten Anwendung würde hier ein API-Aufruf zum Speichern stattfinden
    console.log('Formular abgesendet:', formData);
    console.log('Profilbild:', profileImage);
    
    // Zurück zur Übersicht navigieren
    navigate('/mitarbeiter');
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
        <Link to="/mitarbeiter" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {isNeueModus ? 'Neuen Mitarbeiter anlegen' : 'Mitarbeiter bearbeiten'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profilbild und Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Profilbild & Status</h2>
            
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative mb-4">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 flex items-center justify-center bg-gray-100 ${
                  profileImagePreview ? '' : 'border-dashed'
                }`}>
                  {profileImagePreview ? (
                    <img 
                      src={profileImagePreview} 
                      alt="Profilvorschau" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <User size={32} />
                      <span className="text-xs mt-2">Kein Bild</span>
                    </div>
                  )}
                </div>
                <label 
                  htmlFor="profile-upload" 
                  className="absolute -right-2 bottom-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600"
                >
                  <ImagePlus size={16} />
                </label>
                <input 
                  type="file" 
                  id="profile-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleProfileImageUpload}
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
                  <option value="Aktiv">Aktiv</option>
                  <option value="Inaktiv">Inaktiv</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verfügbarkeit</label>
                <select
                  name="verfuegbarkeit"
                  value={formData.verfuegbarkeit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Verfügbar">Verfügbar</option>
                  <option value="Im Einsatz">Im Einsatz</option>
                  <option value="Urlaub">Urlaub</option>
                  <option value="Krank">Krank</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Persönliche Informationen */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Persönliche Informationen</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
                <input
                  type="text"
                  name="vorname"
                  value={formData.vorname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
                <input
                  type="text"
                  name="nachname"
                  value={formData.nachname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Bitte auswählen</option>
                  {verfuegbarePositionen.map((position) => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eintrittsdatum</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="eintrittsdatum"
                    value={formData.eintrittsdatum}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Geburtstag</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="geburtstag"
                    value={formData.geburtstag}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Kontaktdaten */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Kontaktdaten</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Straße</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="strasse"
                    value={formData.strasse}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                  <input
                    type="text"
                    name="plz"
                    value={formData.plz}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
                  <input
                    type="text"
                    name="ort"
                    value={formData.ort}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Fähigkeiten */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Fähigkeiten & Qualifikationen</h2>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-2">
                Wählen Sie alle zutreffenden Fähigkeiten aus:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {verfuegbareFaehigkeiten.map((faehigkeit) => (
                  <div key={faehigkeit} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`faehigkeit-${faehigkeit}`}
                      checked={formData.faehigkeiten.includes(faehigkeit)}
                      onChange={() => handleFaehigkeitToggle(faehigkeit)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`faehigkeit-${faehigkeit}`} className="ml-2 block text-sm text-gray-700">
                      {faehigkeit}
                    </label>
                  </div>
                ))}
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
                placeholder="Besonderheiten und Anmerkungen zum Mitarbeiter..."
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Formular-Buttons */}
        <div className="flex justify-end space-x-3">
          <Link 
            to="/mitarbeiter" 
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

export default MitarbeiterForm;
// src/pages/aufnahmen/AufnahmeForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Save, 
  X, 
  Image, 
  ClipboardList, 
  FileText, 
  Upload
} from 'lucide-react';

// Beispieldaten für eine Aufnahme beim Bearbeiten
const mockAufnahme = {
  id: 1, 
  kunde: 'Dr. Heinrich',
  kontaktperson: 'Dr. Heinrich',
  telefon: '+49 176 1234567',
  email: 'dr.heinrich@example.com',
  adresse: 'Lindenweg 12, 10115 Berlin',
  termin: '2025-05-12', // Format für Datumseingabefeld
  uhrzeit: '10:00',
  status: 'Geplant',
  mitarbeiter_id: 2, // ID des Mitarbeiters
  etage: '3',
  aufzug: true,
  zimmer: 4,
  qm: 85,
  umzugsgrund: 'Beruflich',
  spezielle_gegenstände: 'Klavier, antike Möbel',
  notizen: 'Kunde möchte Umzug von Berlin nach Hamburg planen. Besonderer Wert auf sichere Verpackung für Antiquitäten legen.'
};

// Beispieldaten für Mitarbeiter
const mockMitarbeiter = [
  { id: 1, name: 'Markus Wolf' },
  { id: 2, name: 'Sarah Müller' },
  { id: 3, name: 'Alexander Jung' }
];

const AufnahmeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNeueModus = !id;
  
  // State für Formularfelder
  const [formData, setFormData] = useState({
    kunde: '',
    kontaktperson: '',
    telefon: '',
    email: '',
    adresse: '',
    termin: '',
    uhrzeit: '09:00',
    status: 'Geplant',
    mitarbeiter_id: '',
    etage: '',
    aufzug: false,
    zimmer: '',
    qm: '',
    umzugsgrund: 'Privat',
    spezielle_gegenstände: '',
    notizen: ''
  });
  
  const [loading, setLoading] = useState(!!id);
  const [verfuegbareMitarbeiter, setVerfuegbareMitarbeiter] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Simuliere API-Aufruf zum Laden der Daten bei Bearbeitung
  useEffect(() => {
    if (id) {
      const fetchAufnahme = () => {
        // In einer echten Anwendung würde hier ein API-Aufruf mit der ID stattfinden
        setFormData(mockAufnahme);
        setLoading(false);
      };

      fetchAufnahme();
    }
    
    // Mitarbeiter laden
    setVerfuegbareMitarbeiter(mockMitarbeiter);
  }, [id]);

  // Behandelt Änderungen in Input-Feldern
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Simuliert das Hochladen von Dateien
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  // Entfernt eine Datei aus der Liste
  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In einer echten Anwendung würde hier ein API-Aufruf zum Speichern stattfinden
    console.log('Formular abgesendet:', formData);
    console.log('Hochgeladene Dateien:', uploadedFiles);
    
    // Zurück zur Übersicht navigieren
    navigate('/aufnahmen');
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
        <Link to="/aufnahmen" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {isNeueModus ? 'Neue Aufnahme anlegen' : 'Aufnahme bearbeiten'}
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
                name="kunde"
                value={formData.kunde}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktperson</label>
              <input
                type="text"
                name="kontaktperson"
                value={formData.kontaktperson}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
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
          </div>
        </div>
        
        {/* Termin- und Adressdetails */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Termin- und Adressdetails</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="termin"
                  value={formData.termin}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Uhrzeit</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock size={16} className="text-gray-400" />
                </div>
                <input
                  type="time"
                  name="uhrzeit"
                  value={formData.uhrzeit}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
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
                <option value="In Bearbeitung">In Bearbeitung</option>
                <option value="Abgeschlossen">Abgeschlossen</option>
                <option value="Storniert">Storniert</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Straße, Hausnummer, PLZ, Ort"
                  required
                />
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Etage</label>
                <input
                  type="text"
                  name="etage"
                  value={formData.etage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="w-2/3 flex items-end">
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    id="aufzug"
                    name="aufzug"
                    checked={formData.aufzug}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="aufzug" className="ml-2 block text-sm text-gray-700">
                    Aufzug vorhanden
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zuständiger Mitarbeiter</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-gray-400" />
              </div>
              <select
                name="mitarbeiter_id"
                value={formData.mitarbeiter_id}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Bitte auswählen</option>
                {verfuegbareMitarbeiter.map((mitarbeiter) => (
                  <option key={mitarbeiter.id} value={mitarbeiter.id}>
                    {mitarbeiter.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Umzugsdetails */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Umzugsdetails</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl Zimmer</label>
              <input
                type="number"
                name="zimmer"
                value={formData.zimmer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quadratmeter</label>
              <input
                type="number"
                name="qm"
                value={formData.qm}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Umzugsgrund</label>
              <select
                name="umzugsgrund"
                value={formData.umzugsgrund}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Privat">Privat</option>
                <option value="Beruflich">Beruflich</option>
                <option value="Senioren">Senioren</option>
                <option value="Geschäftlich">Geschäftlich</option>
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Spezielle Gegenstände (z.B. Klavier, Kunstwerke)</label>
            <input
              type="text"
              name="spezielle_gegenstände"
              value={formData.spezielle_gegenstände}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Klavier, antike Möbel, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notizen & Anmerkungen</label>
            <textarea
              name="notizen"
              value={formData.notizen}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Weitere Details zum Umzug..."
            ></textarea>
          </div>
        </div>
        
        {/* Fotos & Dokumente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Fotos & Dokumente</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotos und Dokumente hochladen</label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload size={36} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Drag & Drop Dateien hier oder klicken zum Auswählen</p>
                <p className="text-xs text-gray-500">PNG, JPG, PDF bis zu 10MB</p>
                
                <button
                  type="button"
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  Dateien auswählen
                </button>
              </label>
            </div>
          </div>
          
          {/* Liste der hochgeladenen Dateien */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Hochgeladene Dateien</h3>
              
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-gray-100 mr-3">
                      {file.type.startsWith('image/') ? (
                        <Image size={20} className="text-blue-600" />
                      ) : file.type === 'application/pdf' ? (
                        <FileText size={20} className="text-red-600" />
                      ) : (
                        <ClipboardList size={20} className="text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Formular-Buttons */}
        <div className="flex justify-end space-x-3">
          <Link 
            to="/aufnahmen" 
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

export default AufnahmeForm;
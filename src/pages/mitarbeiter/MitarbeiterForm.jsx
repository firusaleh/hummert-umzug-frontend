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
  ImagePlus
} from 'lucide-react';
import { mitarbeiterService, configService } from '../../services/api';
import { toast } from 'react-toastify';

// Configuration options will be loaded dynamically

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
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [error, setError] = useState(null);
  
  // Configuration options from API
  const [configOptions, setConfigOptions] = useState({
    positions: [],
    skills: [],
    configLoading: true
  });

  // Load configuration options
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const [positions, skills] = await Promise.all([
          configService.getEmployeePositions(),
          configService.getEmployeeSkills()
        ]);
        
        setConfigOptions({
          positions,
          skills,
          configLoading: false
        });
      } catch (error) {
        // Use fallback values
        const defaults = configService.getDefaultConfigs();
        setConfigOptions({
          positions: defaults.employeePositions,
          skills: defaults.employeeSkills,
          configLoading: false
        });
      }
    };
    
    loadConfigs();
  }, []);

  // Daten beim Bearbeiten laden
  useEffect(() => {
    if (id) {
      const fetchMitarbeiter = async () => {
        setLoading(true);
        try {
          const response = await mitarbeiterService.getById(id);
          if (response && response.data) {
            // Daten aus der API in das Formular-State übertragen
            const mitarbeiter = response.data;
            setFormData({
              vorname: mitarbeiter.vorname || '',
              nachname: mitarbeiter.nachname || '',
              position: mitarbeiter.position || '',
              telefon: mitarbeiter.telefon || '',
              email: mitarbeiter.email || mitarbeiter.userId?.email || '',
              eintrittsdatum: mitarbeiter.einstellungsdatum || mitarbeiter.eintrittsdatum || '',
              strasse: mitarbeiter.adresse?.strasse || '',
              plz: mitarbeiter.adresse?.plz || '',
              ort: mitarbeiter.adresse?.ort || '',
              geburtstag: mitarbeiter.geburtstag || '',
              notizen: mitarbeiter.notizen || '',
              status: mitarbeiter.status || mitarbeiter.isActive ? 'Aktiv' : 'Inaktiv',
              verfuegbarkeit: mitarbeiter.verfuegbarkeit || 'Verfügbar',
              faehigkeiten: mitarbeiter.faehigkeiten || []
            });
            
            // Wenn es ein Profilbild gibt, anzeigen
            if (mitarbeiter.profilbild) {
              setProfileImagePreview(mitarbeiter.profilbild);
            }
          }
          setLoading(false);
        } catch (err) {
          // Fehler beim Laden des Mitarbeiters
          setError('Der Mitarbeiter konnte nicht geladen werden.');
          setLoading(false);
        }
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

  // Ausgelagerter Code für Formik-Integration (derzeit nicht verwendet)
  // Erhalten als Referenz für zukünftige Formik-Integration
  /* 
  const formikSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Füge die Benutzer-ID hinzu, die vom Backend erwartet wird
      const mitarbeiterData = {
        ...values,
        userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null
      };
      if (isEditMode) {
        await mitarbeiterService.update(id, mitarbeiterData);
        toast.success('Mitarbeiter erfolgreich aktualisiert');
      } else {
        await mitarbeiterService.create(mitarbeiterData);
        toast.success('Mitarbeiter erfolgreich erstellt');
        resetForm();
      }
      navigate('/mitarbeiter');
    } catch (error) {
      // Fehler beim Speichern des Mitarbeiters
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.errors?.[0]?.msg || 
        'Fehler beim Speichern des Mitarbeiters'
      );
    } finally {
      setSubmitting(false);
    }
  };
  */

  // Formular absenden (bestehende Methode)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // API-Daten vorbereiten
      const mitarbeiterData = {
        vorname: formData.vorname,
        nachname: formData.nachname,
        position: formData.position,
        telefon: formData.telefon,
        email: formData.email,
        einstellungsdatum: formData.eintrittsdatum,
        geburtstag: formData.geburtstag,
        adresse: {
          strasse: formData.strasse,
          plz: formData.plz,
          ort: formData.ort
        },
        notizen: formData.notizen,
        isActive: formData.status === 'Aktiv',
        status: formData.status,
        verfuegbarkeit: formData.verfuegbarkeit,
        faehigkeiten: formData.faehigkeiten,
        // Füge die Benutzer-ID hinzu, die vom Backend erwartet wird
        userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null
      };
      
      let response;
      
      if (isNeueModus) {
        // Neuen Mitarbeiter erstellen
        response = await mitarbeiterService.create(mitarbeiterData);
        
        // Profilbild hochladen, wenn vorhanden
        if (profileImage && response.data && response.data._id) {
          const imageFormData = new FormData();
          imageFormData.append('file', profileImage);
          imageFormData.append('mitarbeiterId', response.data._id);
          
          await mitarbeiterService.uploadImage(response.data._id, imageFormData);
        }
        
        toast.success('Mitarbeiter wurde erfolgreich angelegt!');
      } else {
        // Bestehenden Mitarbeiter aktualisieren
        response = await mitarbeiterService.update(id, mitarbeiterData);
        
        // Profilbild hochladen, wenn vorhanden
        if (profileImage) {
          const imageFormData = new FormData();
          imageFormData.append('file', profileImage);
          imageFormData.append('mitarbeiterId', id);
          
          await mitarbeiterService.uploadImage(id, imageFormData);
        }
        
        toast.success('Mitarbeiter wurde erfolgreich aktualisiert!');
      }
      
      // Zurück zur Übersicht navigieren
      navigate('/mitarbeiter');
    } catch (err) {
      // Fehler beim Speichern des Mitarbeiters
      setError(err.response?.data?.message || 'Der Mitarbeiter konnte nicht gespeichert werden.');
      toast.error('Fehler beim Speichern des Mitarbeiters');
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
        <Link to="/mitarbeiter" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {isNeueModus ? 'Neuen Mitarbeiter anlegen' : 'Mitarbeiter bearbeiten'}
        </h1>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
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
                  {configOptions.positions.map((position) => (
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
                {configOptions.skills.map((faehigkeit) => (
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

export default MitarbeiterForm;
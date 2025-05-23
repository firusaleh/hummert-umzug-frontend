// src/pages/fahrzeuge/FahrzeugForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { extractApiData } from '../../utils/apiUtils';

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
  const [fieldErrors, setFieldErrors] = useState({});

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
          // Fehler beim Laden des Fahrzeugs
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
      // Check if file is too large (larger than 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Das Bild ist zu groß. Maximalgröße ist 2MB.');
        return;
      }
      
      // Check if file is an image
      if (!file.type.match('image.*')) {
        toast.error('Nur Bilder sind erlaubt (JPG, PNG, GIF, WEBP).');
        return;
      }
      
      setVehicleImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Data transformation function for proper API submission
  const transformFahrzeugData = useCallback((data) => {
    // Create a clean copy to avoid modifying the original
    const transformed = { ...data };
    
    // Format required fields
    transformed.kennzeichen = transformed.kennzeichen?.trim() || '';
    transformed.bezeichnung = transformed.bezeichnung?.trim() || '';
    transformed.typ = transformed.typ || 'Transporter';
    
    // Convert date fields to ISO format
    if (transformed.anschaffungsdatum) {
      try {
        const date = new Date(transformed.anschaffungsdatum);
        if (!isNaN(date.getTime())) {
          transformed.anschaffungsdatum = date.toISOString();
        } else {
          delete transformed.anschaffungsdatum;
        }
      } catch (error) {
        // Fehler beim Formatieren des Anschaffungsdatums
        delete transformed.anschaffungsdatum;
      }
    }
    
    if (transformed.tuev) {
      try {
        const date = new Date(transformed.tuev);
        if (!isNaN(date.getTime())) {
          transformed.tuev = date.toISOString();
        } else {
          delete transformed.tuev;
        }
      } catch (error) {
        // Fehler beim Formatieren des TÜV-Datums
        delete transformed.tuev;
      }
    }
    
    if (transformed.naechsterService) {
      try {
        const date = new Date(transformed.naechsterService);
        if (!isNaN(date.getTime())) {
          transformed.naechsterService = date.toISOString();
        } else {
          delete transformed.naechsterService;
        }
      } catch (error) {
        // Fehler beim Formatieren des Service-Datums
        delete transformed.naechsterService;
      }
    }
    
    // Ensure numeric values are actually numbers
    if (transformed.baujahr) {
      transformed.baujahr = parseInt(transformed.baujahr);
      if (isNaN(transformed.baujahr)) delete transformed.baujahr;
    }
    
    if (transformed.kilometerstand) {
      transformed.kilometerstand = parseInt(transformed.kilometerstand);
      if (isNaN(transformed.kilometerstand)) delete transformed.kilometerstand;
    }
    
    // Handle nested kapazitaet object
    if (transformed.kapazitaet) {
      // Handle ladeflaeche dimensions
      if (transformed.kapazitaet.ladeflaeche) {
        // Convert each dimension to a number or remove it if invalid
        ['laenge', 'breite', 'hoehe'].forEach(dim => {
          if (transformed.kapazitaet.ladeflaeche[dim]) {
            transformed.kapazitaet.ladeflaeche[dim] = parseFloat(transformed.kapazitaet.ladeflaeche[dim]);
            if (isNaN(transformed.kapazitaet.ladeflaeche[dim])) {
              delete transformed.kapazitaet.ladeflaeche[dim];
            }
          }
        });
        
        // If ladeflaeche is empty after removing invalid values, remove it entirely
        if (Object.keys(transformed.kapazitaet.ladeflaeche).length === 0) {
          delete transformed.kapazitaet.ladeflaeche;
        }
      }
      
      // Handle ladegewicht
      if (transformed.kapazitaet.ladegewicht) {
        transformed.kapazitaet.ladegewicht = parseFloat(transformed.kapazitaet.ladegewicht);
        if (isNaN(transformed.kapazitaet.ladegewicht)) {
          delete transformed.kapazitaet.ladegewicht;
        }
      }
      
      // If kapazitaet is now empty, remove it entirely
      if (Object.keys(transformed.kapazitaet).length === 0) {
        delete transformed.kapazitaet;
      }
    }
    
    // Handle versicherung object
    if (transformed.versicherung) {
      // Trim string fields
      if (transformed.versicherung.gesellschaft) {
        transformed.versicherung.gesellschaft = transformed.versicherung.gesellschaft.trim();
      }
      
      if (transformed.versicherung.vertragsnummer) {
        transformed.versicherung.vertragsnummer = transformed.versicherung.vertragsnummer.trim();
      }
      
      // Convert ablaufdatum to ISO string
      if (transformed.versicherung.ablaufdatum) {
        try {
          const date = new Date(transformed.versicherung.ablaufdatum);
          if (!isNaN(date.getTime())) {
            transformed.versicherung.ablaufdatum = date.toISOString();
          } else {
            delete transformed.versicherung.ablaufdatum;
          }
        } catch (error) {
          // Fehler beim Formatieren des Ablaufdatums
          delete transformed.versicherung.ablaufdatum;
        }
      }
      
      // If versicherung is now empty, remove it entirely
      if (Object.keys(transformed.versicherung).length === 0) {
        delete transformed.versicherung;
      }
    }
    
    // Clean up notizen field
    if (transformed.notizen) {
      transformed.notizen = transformed.notizen.trim();
      if (transformed.notizen === '') {
        delete transformed.notizen;
      }
    }
    
    // Validate status against allowed values
    const validStatusValues = ['Verfügbar', 'Im Einsatz', 'In Wartung', 'Defekt', 'Außer Dienst'];
    if (!validStatusValues.includes(transformed.status)) {
      transformed.status = 'Verfügbar';
    }
    
    // Validate typ against allowed values
    const validTypValues = ['LKW', 'Transporter', 'PKW', 'Anhänger', 'Sonstige'];
    if (!validTypValues.includes(transformed.typ)) {
      transformed.typ = 'Transporter';
    }
    
    // Remove undefined and null properties
    Object.keys(transformed).forEach(key => {
      if (transformed[key] === undefined || transformed[key] === null) {
        delete transformed[key];
      }
    });
    
    return transformed;
  }, []);

  // Enhanced client-side form validation
  const validateForm = () => {
    // Reset field errors
    setFieldErrors({});
    
    const errors = {};
    
    // Required fields validation
    if (!formData.kennzeichen.trim()) {
      errors.kennzeichen = 'Kennzeichen ist erforderlich';
    } else {
      // More forgiving regex for German license plates
      const kennzeichenRegex = /^[A-ZÄÖÜa-zäöü]{1,3}[-\s]?[A-ZÄÖÜa-zäöü]{1,2}[-\s]?[0-9A-ZÄÖÜa-zäöü]{1,6}$/;
      if (!kennzeichenRegex.test(formData.kennzeichen.trim())) {
        errors.kennzeichen = 'Ungültiges Kennzeichen-Format (z.B. M-AB 1234)';
      }
    }
    
    if (!formData.bezeichnung.trim()) {
      errors.bezeichnung = 'Bezeichnung ist erforderlich';
    }
    
    if (!formData.typ) {
      errors.typ = 'Typ ist erforderlich';
    }
    
    // Date validation
    if (formData.anschaffungsdatum) {
      const date = new Date(formData.anschaffungsdatum);
      if (isNaN(date.getTime())) {
        errors.anschaffungsdatum = 'Ungültiges Datum';
      }
    }
    
    if (formData.tuev) {
      const date = new Date(formData.tuev);
      if (isNaN(date.getTime())) {
        errors.tuev = 'Ungültiges Datum';
      }
    }
    
    if (formData.naechsterService) {
      const date = new Date(formData.naechsterService);
      if (isNaN(date.getTime())) {
        errors.naechsterService = 'Ungültiges Datum';
      }
    }
    
    // Numeric field validation
    if (formData.baujahr && (isNaN(parseInt(formData.baujahr)) || parseInt(formData.baujahr) < 1900)) {
      errors.baujahr = 'Ungültiges Baujahr';
    }
    
    if (formData.kilometerstand && isNaN(parseInt(formData.kilometerstand))) {
      errors.kilometerstand = 'Ungültiger Kilometerstand';
    }
    
    // If we have any errors
    if (Object.keys(errors).length > 0) {
      // Set field-specific errors for highlighting
      setFieldErrors(errors);
      
      // Build error message for the error box
      const errorMessages = Object.entries(errors)
        .map(([field, message]) => {
          // Format field names for display
          const displayField = {
            'kennzeichen': 'Kennzeichen',
            'bezeichnung': 'Bezeichnung',
            'typ': 'Fahrzeugtyp',
            'anschaffungsdatum': 'Anschaffungsdatum',
            'tuev': 'TÜV',
            'naechsterService': 'Nächster Service',
            'baujahr': 'Baujahr',
            'kilometerstand': 'Kilometerstand'
          }[field] || field;
          
          return `${displayField}: ${message}`;
        })
        .join('\n');
      
      setError(`Validierungsfehler:\n${errorMessages}`);
      return false;
    }
    
    return true;
  };

  // Formular absenden - mit verbesserter Fehlerbehandlung und Datenformatierung
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    // Anzeigen, dass die Anfrage verarbeitet wird
    toast.info('Verarbeite Anfrage...');
    
    // Client-side validation
    if (!validateForm()) {
      setSaving(false);
      return;
    }
    
    try {
      // Daten transformieren für API mit der neuen Transformationsfunktion
      const transformedData = transformFahrzeugData(formData);
      
      // Transformierte Daten zum Speichern vorbereitet
      
      let response;
      let fahrzeugId = id;
      
      if (isNeueModus) {
        // Neues Fahrzeug erstellen mit standardisierter API
        try {
          // Aktive Benutzerinformation während der Verarbeitung
          const toastId = toast.loading('Erstelle Fahrzeug...');
          
          response = await fahrzeugeService.create(transformedData);
          // API Antwort erhalten
          
          // Update den loading toast
          toast.dismiss(toastId);
          
          // Check if response indicates an error
          if (response && !response.success) {
            // API returned error
            
            // Extract and show detailed validation errors
            if (response.errors && Array.isArray(response.errors)) {
              // Errors table display for debugging
              
              // Group errors by field for easier debugging
              const errorsByField = {};
              response.errors.forEach(err => {
                if (err.field) {
                  errorsByField[err.field] = err.message;
                }
              });
              // Grouped errors by field for debugging
              
              // Generate a more user-friendly error message for display
              const errorFieldsList = Object.keys(errorsByField).map(field => 
                `${field.replace(/\./g, ' > ')}: ${errorsByField[field]}`
              ).join('\n');
              
              setFieldErrors(errorsByField);
              setError(`Validierungsfehler:\n${errorFieldsList}`);
              toast.error('Fehler bei der Erstellung des Fahrzeugs');
              return;
            } else {
              // Generic error message
              toast.error(response.message || 'Ein Fehler ist aufgetreten');
              setError(response.message || 'Ein Fehler ist aufgetreten');
              return;
            }
          }
          
          // Extract data and ID from successful response
          const responseData = extractApiData(response);
          if (!responseData) {
            throw new Error('Keine gültige Antwort vom Server erhalten');
          }
          
          // Get the new vehicle ID for image upload
          fahrzeugId = responseData._id;
          
          toast.success('Fahrzeug wurde erfolgreich erstellt!');
        } catch (error) {
          // Fehler beim Erstellen des Fahrzeugs
          handleApiError(error, 'Das Fahrzeug konnte nicht erstellt werden');
          return;
        }
      } else {
        // Bestehendes Fahrzeug aktualisieren
        try {
          // Aktive Benutzerinformation während der Verarbeitung
          const toastId = toast.loading('Aktualisiere Fahrzeug...');
          
          response = await fahrzeugeService.update(id, transformedData);
          
          // Update den loading toast
          toast.dismiss(toastId);
          
          // Check if response indicates an error
          if (response && !response.success) {
            // API error on update
            
            if (response.errors && Array.isArray(response.errors)) {
              // Generate a more user-friendly error message
              const errorMessage = response.errors.map(err => 
                `${err.field || ''}: ${err.message || ''}`
              ).join('\n');
              
              setError(`Fehler beim Aktualisieren:\n${errorMessage}`);
              
              // Create field errors map for highlighting
              const fieldErrorsMap = {};
              response.errors.forEach(err => {
                if (err.field) fieldErrorsMap[err.field] = err.message;
              });
              setFieldErrors(fieldErrorsMap);
              
              toast.error('Fehler beim Aktualisieren des Fahrzeugs');
              return;
            } else {
              toast.error(response.message || 'Ein Fehler ist aufgetreten');
              setError(response.message || 'Ein Fehler ist aufgetreten');
              return;
            }
          }
          
          toast.success('Fahrzeug wurde erfolgreich aktualisiert!');
        } catch (error) {
          // Fehler beim Aktualisieren des Fahrzeugs
          handleApiError(error, 'Das Fahrzeug konnte nicht aktualisiert werden');
          return;
        }
      }
      
      // Wenn ein neues Bild hochgeladen wurde und wir eine Fahrzeug-ID haben, Bild hochladen
      if (vehicleImage && fahrzeugId) {
        try {
          const uploadToastId = toast.loading('Lade Bild hoch...');
          
          const imageFormData = new FormData();
          imageFormData.append('file', vehicleImage);
          
          await fahrzeugeService.uploadImage(fahrzeugId, imageFormData);
          
          toast.dismiss(uploadToastId);
          toast.success('Bild erfolgreich hochgeladen');
        } catch (error) {
          // Fehler beim Hochladen des Bildes
          toast.error('Das Bild konnte nicht hochgeladen werden, Fahrzeug wurde aber gespeichert');
        }
      }
      
      // Zurück zur Übersicht navigieren
      navigate('/fahrzeuge');
    } catch (err) {
      // Fehler beim Speichern des Fahrzeugs
      handleApiError(err, 'Es ist ein unerwarteter Fehler aufgetreten');
    } finally {
      setSaving(false);
    }
  };
  
  // Helper function to handle API errors
  const handleApiError = (error, defaultMessage) => {
    // API Error Details for debugging
    
    // Reset field errors
    setFieldErrors({});
    
    let errorMessage = defaultMessage;
    
    // Handle different error formats
    if (error.errors && Array.isArray(error.errors)) {
      const fieldErrorsMap = {};
      const errorDetails = error.errors.map(err => {
        const field = err.field || err.param || '';
        const message = err.message || err.msg || '';
        
        if (field) fieldErrorsMap[field] = message;
        
        return `${field}: ${message}`;
      }).join('\n');
      
      setFieldErrors(fieldErrorsMap);
      errorMessage += `\n\nDetails:\n${errorDetails}`;
    } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const fieldErrorsMap = {};
      const errorDetails = error.response.data.errors.map(err => {
        const field = err.field || err.param || '';
        const message = err.message || err.msg || '';
        
        if (field) fieldErrorsMap[field] = message;
        
        return `${field}: ${message}`;
      }).join('\n');
      
      setFieldErrors(fieldErrorsMap);
      errorMessage += `\n\nDetails:\n${errorDetails}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    setError(errorMessage);
    toast.error(errorMessage.split('\n')[0]); // Only show first line in toast
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
          {error.includes('\n') ? (
            <div>
              <p className="font-semibold mb-2">Validierungsfehler:</p>
              <ul className="list-disc pl-5">
                {error.split('\n').filter(line => line && !line.startsWith('Validierungsfehler:')).map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>{error}</p>
          )}
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
                  className={`w-full px-3 py-2 border ${fieldErrors.kennzeichen ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="z.B. M-AB 1234"
                  required
                />
                {fieldErrors.kennzeichen && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.kennzeichen}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung *</label>
                <input
                  type="text"
                  name="bezeichnung"
                  value={formData.bezeichnung}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${fieldErrors.bezeichnung ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="z.B. Mercedes Sprinter"
                  required
                />
                {fieldErrors.bezeichnung && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.bezeichnung}</p>
                )}
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
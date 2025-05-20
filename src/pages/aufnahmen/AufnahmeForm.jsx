import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { fileService, aufnahmenService, mitarbeiterService } from '../../services/api';
import { toast } from 'react-toastify';
import { extractApiData, ensureArray } from '../../utils/apiUtils';

export default function AufnahmeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(!!id);
  const [formData, setFormData] = useState({
    kundenName: '',
    kontaktperson: '',
    telefon: '',
    email: '',
    auszugsadresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: '',
      land: 'Deutschland',
      etage: 0,
      aufzug: false,
      entfernung: 0
    },
    einzugsadresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: '',
      land: 'Deutschland',
      etage: 0,
      aufzug: false,
      entfernung: 0
    },
    umzugstyp: 'privat',
    umzugsvolumen: '',
    datum: '',
    uhrzeit: '',
    angebotspreis: {
      netto: '',
      brutto: '',
      mwst: 19
    },
    notizen: '',
    besonderheiten: '',
    bewertung: 3,
    mitarbeiterId: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [verfuegbareMitarbeiter, setVerfuegbareMitarbeiter] = useState([]);

  // Transformationsfunktion für aufnahmeData
  const transformAufnahmeData = useCallback((data) => {
    // Kopie erstellen, um das Original nicht zu verändern
    const transformed = { ...data };
    
    // Datumsfelder korrekt formatieren
    if (transformed.datum) {
      try {
        transformed.datum = new Date(transformed.datum).toISOString();
      } catch (error) {
        console.error('Fehler beim Formatieren des Datums:', error);
        transformed.datum = new Date().toISOString();
      }
    } else {
      transformed.datum = new Date().toISOString();
    }
    
    // Numerische Werte korrekt formatieren
    if (transformed.angebotspreis) {
      transformed.angebotspreis = {
        netto: parseFloat(transformed.angebotspreis.netto || 0),
        brutto: parseFloat(transformed.angebotspreis.brutto || 0),
        mwst: parseFloat(transformed.angebotspreis.mwst || 19)
      };
    }
    
    if (transformed.umzugsvolumen) {
      transformed.umzugsvolumen = parseFloat(transformed.umzugsvolumen || 0);
    }
    
    // Adressen als eingebettete Objekte übergeben, nicht als ObjectId-Referenzen
    if (transformed.auszugsadresse) {
      transformed.auszugsadresse = {
        ...transformed.auszugsadresse,
        etage: parseInt(transformed.auszugsadresse.etage || 0),
        entfernung: parseInt(transformed.auszugsadresse.entfernung || 0),
        aufzug: Boolean(transformed.auszugsadresse.aufzug)
      };
    }
    
    if (transformed.einzugsadresse) {
      transformed.einzugsadresse = {
        ...transformed.einzugsadresse,
        etage: parseInt(transformed.einzugsadresse.etage || 0),
        entfernung: parseInt(transformed.einzugsadresse.entfernung || 0),
        aufzug: Boolean(transformed.einzugsadresse.aufzug)
      };
    }
    
    // Optional: mitarbeiterId entfernen, wenn leer
    if (!transformed.mitarbeiterId || transformed.mitarbeiterId === '') {
      delete transformed.mitarbeiterId;
    }
    
    return transformed;
  }, []);

  // API-Aufrufe zum Laden der Daten
  useEffect(() => {
    if (id) {
      const fetchAufnahme = async () => {
        try {
          setLoading(true);
          
          // Aufnahmedaten mit standardisierter Fehlerbehandlung laden
          const response = await aufnahmenService.getById(id);
          const aufnahmeData = extractApiData(response);
          
          if (!aufnahmeData) {
            throw new Error('Keine gültigen Aufnahmedaten erhalten');
          }
          
          // Datumsfelder vorbereiten, falls nötig
          if (aufnahmeData.datum) {
            const datumObj = new Date(aufnahmeData.datum);
            aufnahmeData.datum = datumObj.toISOString().substring(0, 10);
            
            // Uhrzeit extrahieren, falls noch nicht vorhanden
            if (!aufnahmeData.uhrzeit) {
              aufnahmeData.uhrzeit = datumObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            }
          }
          
          setFormData(aufnahmeData);
          
          // Dateien laden - mit standardisierter Fehlerbehandlung
          try {
            const filesResponse = await api.get(`/uploads?bezugId=${id}&bezugModell=Aufnahme`);
            const filesData = extractApiData(filesResponse);
            setUploadedFiles(ensureArray(filesData) || []);
          } catch (fileError) {
            console.error('Fehler beim Laden der Dateien:', fileError);
            // Keine Aktion notwendig, Uploads sind optional
            setUploadedFiles([]);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Fehler beim Laden der Aufnahme:', error);
          toast.error('Die Aufnahme konnte nicht geladen werden: ' + (error.message || 'Unbekannter Fehler'));
          setLoading(false);
          navigate('/aufnahmen'); // Zurück zur Übersicht bei Fehler
        }
      };

      fetchAufnahme();
    } else {
      // Bei neuer Aufnahme Datum auf heute setzen
      const today = new Date();
      setFormData(prev => ({
        ...prev,
        datum: today.toISOString().substring(0, 10),
        uhrzeit: '09:00'
      }));
    }
    
    // Mitarbeiter laden mit standardisierter Fehlerbehandlung
    const fetchMitarbeiter = async () => {
      try {
        const response = await mitarbeiterService.getAll();
        const mitarbeiterData = extractApiData(response);
        
        if (mitarbeiterData) {
          const mitarbeiterListe = ensureArray(mitarbeiterData.mitarbeiter || mitarbeiterData);
          
          // Mitarbeiterdaten ins richtige Format bringen
          const formattedMitarbeiter = mitarbeiterListe.map(mitarbeiter => ({
            _id: mitarbeiter._id,
            vorname: mitarbeiter.vorname || '',
            nachname: mitarbeiter.nachname || '',
            rolle: mitarbeiter.position || mitarbeiter.rolle || 'Aufnahmeteam'
          }));
          
          setVerfuegbareMitarbeiter(formattedMitarbeiter);
        } else {
          throw new Error('Keine Mitarbeiterdaten erhalten');
        }
      } catch (error) {
        console.error('Fehler beim Laden der Mitarbeiter:', error);
        toast.error('Mitarbeiterdaten konnten nicht geladen werden');
        setVerfuegbareMitarbeiter([]);
      }
    };
    
    fetchMitarbeiter();
  }, [id, navigate]);

  // Behandelt Änderungen in Input-Feldern
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Für verschachtelte Objekte wie auszugsadresse.strasse
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
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

  // Datei-Upload mit dem echten fileService
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Setze Upload-Fortschritt zurück
    setUploadProgress({});
    
    try {
      for (const file of files) {
        // Zeige Toast für den Start des Uploads
        const toastId = toast.info(`Upload von ${file.name} gestartet...`, { autoClose: false });
        
        // Hochladen mit Fortschrittsanzeige
        const uploadResult = await fileService.upload({
          file: file,
          category: 'Aufnahme',
          description: `Aufnahme-Dokument: ${file.name}`,
          project: id || 'temp', // temporäre ID für neue Aufnahmen
          onProgress: (progress) => {
            // Update toast mit Fortschritt
            toast.update(toastId, { 
              render: `${file.name}: ${progress}% hochgeladen`,
              type: toast.TYPE.INFO
            });
          }
        });
        
        // Toast nach Fertigstellung schließen
        toast.dismiss(toastId);
        
        if (uploadResult.success) {
          // Bei Erfolg die hochgeladene Datei zur Liste hinzufügen
          const fileData = uploadResult.data.file || uploadResult.data;
          setUploadedFiles(prev => [...prev, {
            _id: fileData._id,
            name: fileData.name || file.name,
            groesse: fileData.groesse || file.size,
            typ: fileData.typ || file.type,
            datum: fileData.datum || new Date().toISOString(),
            pfad: fileData.pfad || '',
            bezugId: fileData.bezugId || id || 'temp',
            bezugModell: fileData.bezugModell || 'Aufnahme'
          }]);
          
          toast.success(`${file.name} erfolgreich hochgeladen`);
        } else {
          toast.error(`Fehler beim Hochladen von ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Fehler beim Datei-Upload:', error);
      toast.error('Fehler beim Hochladen der Dateien: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  // Datei löschen über API
  const handleFileDelete = async (fileId) => {
    try {
      // Bestätigung anfordern
      if (!window.confirm('Sind Sie sicher, dass Sie diese Datei löschen möchten?')) {
        return;
      }
      
      // API-Aufruf zum Löschen der Datei
      const response = await fileService.delete(fileId);
      const deleteResult = extractApiData(response);
      
      if (deleteResult && deleteResult.success) {
        // Datei aus lokaler Liste entfernen
        setUploadedFiles(prev => prev.filter(file => file._id !== fileId));
        toast.success('Datei erfolgreich gelöscht');
      } else {
        throw new Error(deleteResult?.message || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Datei:', error);
      toast.error('Fehler beim Löschen der Datei: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  // Formular absenden mit standardisierter Fehlerbehandlung
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Daten transformieren und validieren
      const transformedData = transformAufnahmeData(formData);
      
      // Validierung
      if (!transformedData.kundenName) {
        toast.error('Bitte geben Sie einen Kundennamen ein.');
        return;
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Speichere Aufnahme:', transformedData);
      }
      
      let response;
      
      if (id) {
        // Aktualisieren einer bestehenden Aufnahme
        const filesData = uploadedFiles.map(file => ({ fileId: file._id }));
        response = await aufnahmenService.update(id, { ...transformedData, dateien: filesData });
        const responseData = extractApiData(response);
        
        if (!responseData) {
          throw new Error('Keine gültige Antwort vom Server erhalten');
        }
        
        toast.success('Aufnahme erfolgreich aktualisiert');
      } else {
        // Erstellen einer neuen Aufnahme
        response = await aufnahmenService.create(transformedData);
        const responseData = extractApiData(response);
        
        if (!responseData) {
          throw new Error('Keine gültige Antwort vom Server erhalten');
        }
        
        // Neue Aufnahme-ID extrahieren
        const aufnahmeId = responseData._id || responseData.aufnahme?._id;
        
        // Wenn Dateien vorhanden sind, diese der neuen Aufnahme zuordnen
        if (uploadedFiles.length > 0 && aufnahmeId) {
          for (const file of uploadedFiles) {
            if (file.bezugId === 'temp') {
              // Datei zu neu erstellter Aufnahme zuordnen
              await fileService.update(file._id, {
                bezugId: aufnahmeId,
                bezugModell: 'Aufnahme'
              });
            }
          }
        }
        
        toast.success('Aufnahme erfolgreich erstellt');
      }
      
      setUploadedFiles([]);
      
      // Zurück zur Aufnahmen-Übersicht navigieren
      navigate('/aufnahmen');
    } catch (error) {
      console.error('Fehler beim Speichern der Aufnahme:', error);
      toast.error('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  // Vorschau der Adressdaten
  const renderAdressVorschau = () => {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border mb-6">
        <h3 className="text-lg font-semibold mb-4">Adressdaten Vorschau</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Auszugsadresse:</h4>
            <p>
              {formData.auszugsadresse.strasse} {formData.auszugsadresse.hausnummer}<br />
              {formData.auszugsadresse.plz} {formData.auszugsadresse.ort}<br />
              {formData.auszugsadresse.land}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Etage: {formData.auszugsadresse.etage} | 
              Aufzug: {formData.auszugsadresse.aufzug ? 'Ja' : 'Nein'} | 
              Entfernung zur Parkposition: {formData.auszugsadresse.entfernung} m
            </p>
          </div>
          <div>
            <h4 className="font-medium">Einzugsadresse:</h4>
            <p>
              {formData.einzugsadresse.strasse} {formData.einzugsadresse.hausnummer}<br />
              {formData.einzugsadresse.plz} {formData.einzugsadresse.ort}<br />
              {formData.einzugsadresse.land}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Etage: {formData.einzugsadresse.etage} | 
              Aufzug: {formData.einzugsadresse.aufzug ? 'Ja' : 'Nein'} | 
              Entfernung zur Parkposition: {formData.einzugsadresse.entfernung} m
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Lade-Status prüfen
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Aufnahme bearbeiten' : 'Neue Aufnahme erstellen'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Kundendaten */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Kundendaten</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kundenname *
              </label>
              <input
                type="text"
                name="kundenName"
                value={formData.kundenName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontaktperson
              </label>
              <input
                type="text"
                name="kontaktperson"
                value={formData.kontaktperson}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                name="telefon"
                value={formData.telefon}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
        
        {/* Auszugsadresse */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Auszugsadresse</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Straße *
              </label>
              <input
                type="text"
                name="auszugsadresse.strasse"
                value={formData.auszugsadresse.strasse}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hausnummer *
              </label>
              <input
                type="text"
                name="auszugsadresse.hausnummer"
                value={formData.auszugsadresse.hausnummer}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PLZ *
              </label>
              <input
                type="text"
                name="auszugsadresse.plz"
                value={formData.auszugsadresse.plz}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort *
              </label>
              <input
                type="text"
                name="auszugsadresse.ort"
                value={formData.auszugsadresse.ort}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etage
              </label>
              <input
                type="number"
                name="auszugsadresse.etage"
                value={formData.auszugsadresse.etage}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                name="auszugsadresse.aufzug"
                checked={formData.auszugsadresse.aufzug}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Aufzug vorhanden
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entfernung zur Parkmöglichkeit (m)
              </label>
              <input
                type="number"
                name="auszugsadresse.entfernung"
                value={formData.auszugsadresse.entfernung}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
          </div>
        </div>
        
        {/* Einzugsadresse */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Einzugsadresse</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Straße *
              </label>
              <input
                type="text"
                name="einzugsadresse.strasse"
                value={formData.einzugsadresse.strasse}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hausnummer *
              </label>
              <input
                type="text"
                name="einzugsadresse.hausnummer"
                value={formData.einzugsadresse.hausnummer}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PLZ *
              </label>
              <input
                type="text"
                name="einzugsadresse.plz"
                value={formData.einzugsadresse.plz}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort *
              </label>
              <input
                type="text"
                name="einzugsadresse.ort"
                value={formData.einzugsadresse.ort}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etage
              </label>
              <input
                type="number"
                name="einzugsadresse.etage"
                value={formData.einzugsadresse.etage}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                name="einzugsadresse.aufzug"
                checked={formData.einzugsadresse.aufzug}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Aufzug vorhanden
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entfernung zur Parkmöglichkeit (m)
              </label>
              <input
                type="number"
                name="einzugsadresse.entfernung"
                value={formData.einzugsadresse.entfernung}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
          </div>
        </div>
        
        {/* Vorschau der Adressen */}
        {formData.auszugsadresse.strasse && formData.einzugsadresse.strasse && renderAdressVorschau()}
        
        {/* Umzugsdetails */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Umzugsdetails</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umzugstyp
              </label>
              <select
                name="umzugstyp"
                value={formData.umzugstyp}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="privat">Privatumzug</option>
                <option value="gewerbe">Gewerbeumzug</option>
                <option value="senioren">Seniorenumzug</option>
                <option value="fernumzug">Fernumzug</option>
                <option value="buero">Büroumzug</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umzugsvolumen (m³)
              </label>
              <input
                type="number"
                name="umzugsvolumen"
                value={formData.umzugsvolumen}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                step="0.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum
              </label>
              <input
                type="date"
                name="datum"
                value={formData.datum}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uhrzeit
              </label>
              <input
                type="time"
                name="uhrzeit"
                value={formData.uhrzeit}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>
        
        {/* Preis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Preise</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Netto (€)
              </label>
              <input
                type="number"
                name="angebotspreis.netto"
                value={formData.angebotspreis.netto}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                step="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MwSt. (%)
              </label>
              <input
                type="number"
                name="angebotspreis.mwst"
                value={formData.angebotspreis.mwst}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brutto (€)
              </label>
              <input
                type="number"
                name="angebotspreis.brutto"
                value={formData.angebotspreis.brutto}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                step="10"
              />
            </div>
          </div>
        </div>
        
        {/* Zusatzinformationen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Zusatzinformationen</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Besonderheiten
              </label>
              <textarea
                name="besonderheiten"
                value={formData.besonderheiten}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows="3"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notizen
              </label>
              <textarea
                name="notizen"
                value={formData.notizen}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows="3"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mitarbeiter
              </label>
              <select
                name="mitarbeiterId"
                value={formData.mitarbeiterId}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Mitarbeiter auswählen --</option>
                {verfuegbareMitarbeiter.map(mitarbeiter => (
                  <option key={mitarbeiter._id} value={mitarbeiter._id}>
                    {mitarbeiter.vorname} {mitarbeiter.nachname} ({mitarbeiter.rolle})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bewertung
              </label>
              <select
                name="bewertung"
                value={formData.bewertung}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="1">1 - Sehr einfach</option>
                <option value="2">2 - Einfach</option>
                <option value="3">3 - Normal</option>
                <option value="4">4 - Komplex</option>
                <option value="5">5 - Sehr komplex</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Dateien */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Dateien</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dateien hochladen
              </label>
              <input 
                type="file" 
                onChange={handleFileUpload} 
                className="w-full p-2 border rounded"
                multiple
              />
            </div>
            
            {uploadedFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Hochgeladene Dateien:</h3>
                <div className="space-y-2">
                  {uploadedFiles.map(file => (
                    <div key={file._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {(file.groesse / 1024).toFixed(2)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileDelete(file._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Formular-Buttons */}
        <div className="flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={() => navigate('/aufnahmen')} 
            className="px-4 py-2 border rounded"
          >
            Abbrechen
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {id ? 'Änderungen speichern' : 'Aufnahme erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
}
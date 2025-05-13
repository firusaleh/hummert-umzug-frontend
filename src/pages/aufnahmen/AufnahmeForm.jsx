import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { fileService, aufnahmenService } from '../../services/api';

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

  // Simuliere API-Aufruf zum Laden der Daten bei Bearbeitung
  useEffect(() => {
    if (id) {
      const fetchAufnahme = async () => {
        try {
          setLoading(true);
          // In einer echten Anwendung würde hier ein API-Aufruf mit der ID stattfinden
          const response = await aufnahmenService.getById(id);
          setFormData(response.data);
          
          // Dateien laden
          try {
            const filesResponse = await api.get(`/uploads?bezugId=${id}&bezugModell=Aufnahme`);
            setUploadedFiles(filesResponse.data || []);
          } catch (fileError) {
            console.error('Fehler beim Laden der Dateien:', fileError);
            // Keine Aktion notwendig, Uploads sind optional
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Fehler beim Laden der Aufnahme:', error);
          setLoading(false);
          
          // Fallback zu Mockdaten für Demo
          const mockAufnahme = {
            kundenName: 'Musterfirma GmbH',
            kontaktperson: 'Max Mustermann',
            telefon: '0123-4567890',
            email: 'info@musterfirma.de',
            auszugsadresse: {
              strasse: 'Musterstraße',
              hausnummer: '123',
              plz: '12345',
              ort: 'Musterstadt',
              land: 'Deutschland',
              etage: 2,
              aufzug: true,
              entfernung: 10
            },
            einzugsadresse: {
              strasse: 'Beispielweg',
              hausnummer: '45',
              plz: '54321',
              ort: 'Beispielort',
              land: 'Deutschland',
              etage: 1,
              aufzug: false,
              entfernung: 20
            },
            umzugstyp: 'gewerbe',
            umzugsvolumen: '75',
            datum: '2025-05-15',
            uhrzeit: '09:00',
            angebotspreis: {
              netto: 2500,
              brutto: 2975,
              mwst: 19
            },
            notizen: 'Beispielnotizen zur Aufnahme',
            besonderheiten: 'Schwere Maschinen, Treppen ohne Aufzug',
            bewertung: 4,
            mitarbeiterId: '1'
          };
          setFormData(mockAufnahme);
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
    
    // Mitarbeiter laden
    const fetchMitarbeiter = async () => {
      try {
        const response = await api.get('/mitarbeiter');
        setVerfuegbareMitarbeiter(response.data);
      } catch (error) {
        console.error('Fehler beim Laden der Mitarbeiter:', error);
        
        // Fallback zu Mockdaten für Demo
        const mockMitarbeiter = [
          { _id: '1', vorname: 'Max', nachname: 'Mustermann', rolle: 'Aufnahmeteam' },
          { _id: '2', vorname: 'Anna', nachname: 'Schmidt', rolle: 'Aufnahmeteam' },
          { _id: '3', vorname: 'Thomas', nachname: 'Müller', rolle: 'Aufnahmeteam' }
        ];
        setVerfuegbareMitarbeiter(mockMitarbeiter);
      }
    };
    
    fetchMitarbeiter();
  }, [id]);

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

  // Datei-Upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // In einer echten Anwendung würde hier ein API-Aufruf zum Hochladen der Datei stattfinden
    files.forEach(file => {
      // Simuliere erfolgreichen Upload für Demo
      const mockUploadedFile = {
        _id: Date.now().toString() + Math.random().toString(36).substring(2, 8),
        name: file.name,
        groesse: file.size,
        typ: file.type,
        datum: new Date().toISOString(),
        pfad: URL.createObjectURL(file),
        bezugId: id || 'temp',
        bezugModell: 'Aufnahme'
      };
      
      setUploadedFiles(prev => [...prev, mockUploadedFile]);
    });
  };

  // Datei löschen
  const handleFileDelete = (fileId) => {
    // In einer echten Anwendung würde hier ein API-Aufruf zum Löschen der Datei stattfinden
    setUploadedFiles(prev => prev.filter(file => file._id !== fileId));
  };

  // Formular absenden
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Daten transformieren und validieren
      const transformedData = transformAufnahmeData(formData);
      
      // Validierung
      if (!transformedData.kundenName) {
        alert('Bitte geben Sie einen Kundennamen ein.');
        return;
      }
      
      console.log('Speichere Aufnahme:', transformedData);
      
      let response;
      
      if (id) {
        // Aktualisieren einer bestehenden Aufnahme
        const filesData = uploadedFiles.map(file => ({ fileId: file._id }));
        response = await aufnahmenService.update(id, { ...transformedData, dateien: filesData });
      } else {
        // Erstellen einer neuen Aufnahme
        response = await aufnahmenService.create(transformedData);
        
        // Wenn Dateien vorhanden sind, diese der neuen Aufnahme zuordnen
        if (uploadedFiles.length > 0 && response.data.aufnahme) {
          const aufnahmeId = response.data.aufnahme._id;
          
          for (const file of uploadedFiles) {
            // In einer echten Anwendung würde hier ein API-Aufruf zum Aktualisieren der Datei-Referenzen stattfinden
            await fileService.uploadFile({
              file: file,
              project: aufnahmeId,
              category: 'Aufnahme'
            });
          }
        }
      }
      
      setUploadedFiles([]);
      
      // Erfolgsmeldung
      alert(`Aufnahme erfolgreich ${id ? 'aktualisiert' : 'erstellt'}`);
      
      // Zurück zur Aufnahmen-Übersicht navigieren
      navigate('/aufnahmen');
    } catch (error) {
      console.error('Fehler beim Speichern der Aufnahme:', error);
      alert(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
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
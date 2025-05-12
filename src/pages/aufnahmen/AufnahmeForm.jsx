import React, { useState, useEffect } from 'react';
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
          const filesResponse = await api.get(`/uploads?bezugId=${id}&bezugModell=Aufnahme`);
          setUploadedFiles(filesResponse.data || []);
          
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
  const handleFileUpload = (file) => {
    // In einer echten Anwendung würde hier ein API-Aufruf zum Hochladen der Datei stattfinden
    
    // Simuliere erfolgreichen Upload für Demo
    const mockUploadedFile = {
      _id: Date.now().toString(),
      name: file.name,
      groesse: file.size,
      typ: file.type,
      datum: new Date().toISOString(),
      pfad: URL.createObjectURL(file),
      bezugId: id || 'temp',
      bezugModell: 'Aufnahme'
    };
    
    setUploadedFiles(prev => [...prev, mockUploadedFile]);
    
    return {
      success: true,
      file: mockUploadedFile
    };
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
      let response;
      
      if (id) {
        // Aktualisieren einer bestehenden Aufnahme
        const filesData = uploadedFiles.map(file => ({ fileId: file._id }));
        response = await aufnahmenService.update(id, { ...formData, dateien: filesData });
      } else {
        // Erstellen einer neuen Aufnahme
        response = await aufnahmenService.create(formData);
        
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
      
      {/* Dein Formular-Inhalt hier */}
    </div>
  );
}
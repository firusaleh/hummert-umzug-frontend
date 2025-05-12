// Import-Statements ändern
import { aufnahmenService, mitarbeiterService } from '../../services/api';

// useEffect-Hook für das Laden der Daten ändern
useEffect(() => {
  if (id) {
    const fetchAufnahme = async () => {
      try {
        setLoading(true);
        const response = await aufnahmenService.getById(id);
        
        // Daten aus der API für das Formular vorbereiten
        const aufnahmeData = {
          kunde: response.data.kunde,
          kontaktperson: response.data.kontaktperson,
          telefon: response.data.telefon,
          email: response.data.email,
          adresse: response.data.adresse,
          termin: new Date(response.data.termin).toISOString().split('T')[0],
          uhrzeit: new Date(response.data.termin).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          status: response.data.status,
          mitarbeiter_id: response.data.mitarbeiter_id,
          etage: response.data.etage,
          aufzug: response.data.aufzug,
          zimmer: response.data.zimmer,
          qm: response.data.qm,
          umzugsgrund: response.data.umzugsgrund,
          spezielle_gegenstände: response.data.spezielle_gegenstände,
          notizen: response.data.notizen
        };
        
        setFormData(aufnahmeData);
        
        // Auch Dateien laden, falls vorhanden
        const filesResponse = await aufnahmenService.getFiles(id);
        setUploadedFiles(filesResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Fehler beim Laden der Aufnahme:', error);
        setLoading(false);
        // Fallback zu Mock-Daten als temporäre Lösung
        setFormData(mockAufnahme);
      }
    };

    fetchAufnahme();
  }
  
  // Mitarbeiter laden
  const fetchMitarbeiter = async () => {
    try {
      const response = await mitarbeiterService.getAll();
      setVerfuegbareMitarbeiter(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error);
      // Fallback zu Mock-Daten
      setVerfuegbareMitarbeiter(mockMitarbeiter);
    }
  };
  
  fetchMitarbeiter();
}, [id]);

// Datei-Upload-Handler
const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files);
  
  try {
    if (id) {
      // Wenn wir eine bestehende Aufnahme bearbeiten, laden wir die Dateien hoch
      await aufnahmenService.uploadFiles(id, files);
      
      // Dateien lokal hinzufügen für optimistische UI-Aktualisierung
      const newFiles = files.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type
      }));
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
    } else {
      // Wenn wir eine neue Aufnahme erstellen, speichern wir die Dateien temporär
      const newFiles = files.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file  // Das Originaldatei-Objekt für späteren Upload speichern
      }));
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  } catch (error) {
    console.error('Fehler beim Hochladen der Dateien:', error);
    alert('Fehler beim Hochladen der Dateien');
  }
};

// Datei entfernen Handler
const handleRemoveFile = async (fileId) => {
  try {
    if (id) {
      // Bei bestehender Aufnahme auch vom Server löschen
      const fileToRemove = uploadedFiles.find(file => file.id === fileId);
      if (fileToRemove && fileToRemove.serverId) {
        // serverId ist die ID der Datei auf dem Server
        await fileService.deleteFile(fileToRemove.serverId);
      }
    }
    
    // Aus lokalem State entfernen
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  } catch (error) {
    console.error('Fehler beim Löschen der Datei:', error);
  }
};

// Formular absenden mit API-Aufruf
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // Formular-Daten in API-Format transformieren
    const apiData = {
      kunde: formData.kunde,
      kontaktperson: formData.kontaktperson,
      telefon: formData.telefon,
      email: formData.email,
      adresse: formData.adresse,
      // Termin-Datum und -Uhrzeit kombinieren
      termin: new Date(`${formData.termin}T${formData.uhrzeit}`).toISOString(),
      status: formData.status,
      mitarbeiter_id: formData.mitarbeiter_id,
      etage: formData.etage,
      aufzug: formData.aufzug,
      zimmer: parseInt(formData.zimmer) || 0,
      qm: parseInt(formData.qm) || 0,
      umzugsgrund: formData.umzugsgrund,
      spezielle_gegenstände: formData.spezielle_gegenstände,
      notizen: formData.notizen
    };
    
    let aufnahmeId;
    
    if (id) {
      // Bestehende Aufnahme aktualisieren
      await aufnahmenService.update(id, apiData);
      aufnahmeId = id;
    } else {
      // Neue Aufnahme erstellen
      const response = await aufnahmenService.create(apiData);
      aufnahmeId = response.data.id;
      
      // Wenn wir neue Dateien haben, hochladen
      if (uploadedFiles.length > 0) {
        const filesToUpload = uploadedFiles.filter(file => file.file).map(file => file.file);
        if (filesToUpload.length > 0) {
          await aufnahmenService.uploadFiles(aufnahmeId, filesToUpload);
        }
      }
    }
    
    // Erfolgsmeldung
    alert(`Aufnahme erfolgreich ${id ? 'aktualisiert' : 'erstellt'}`);
    
    // Zurück zur Übersicht navigieren
    navigate('/aufnahmen');
  } catch (error) {
    console.error('Fehler beim Speichern der Aufnahme:', error);
    alert(`Fehler beim ${id ? 'Aktualisieren' : 'Erstellen'} der Aufnahme: ${error.message}`);
  }
};
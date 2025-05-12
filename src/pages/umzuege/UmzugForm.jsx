// Import-Statements ändern
import { umzuegeService, mitarbeiterService, fahrzeugeService } from '../../services/api';

// useEffect-Hook für das Laden der Daten ändern
useEffect(() => {
  if (id) {
    const fetchUmzug = async () => {
      try {
        setLoading(true);
        const response = await umzuegeService.getById(id);
        
        // Formatieren der API-Daten für das Formular
        const umzugData = {
          kunde: {
            name: response.data.auftraggeber.name,
            kontaktperson: response.data.auftraggeber.kontaktperson,
            telefon: response.data.auftraggeber.telefon,
            email: response.data.auftraggeber.email
          },
          typ: response.data.typ,
          status: mapAPIStatus(response.data.status),
          datum: new Date(response.data.startDatum).toISOString().split('T')[0],
          uhrzeit_start: new Date(response.data.startDatum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          uhrzeit_ende: response.data.endDatum ? new Date(response.data.endDatum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '',
          startadresse: `${response.data.auszugsadresse.strasse} ${response.data.auszugsadresse.hausnummer}, ${response.data.auszugsadresse.plz} ${response.data.auszugsadresse.ort}`,
          zieladresse: `${response.data.einzugsadresse.strasse} ${response.data.einzugsadresse.hausnummer}, ${response.data.einzugsadresse.plz} ${response.data.einzugsadresse.ort}`,
          umzugsvolumen: response.data.volumen || '',
          etage_start: response.data.auszugsadresse.etage || '',
          aufzug_start: response.data.auszugsadresse.aufzug || false,
          etage_ziel: response.data.einzugsadresse.etage || '',
          aufzug_ziel: response.data.einzugsadresse.aufzug || false,
          mitarbeiter: response.data.mitarbeiter?.map(m => m.mitarbeiterId) || [],
          fahrzeuge: response.data.fahrzeuge?.map(f => f.fahrzeugId) || [],
          notizen: response.data.notizen || ''
        };
        
        setFormData(umzugData);
        setLoading(false);
      } catch (error) {
        console.error('Fehler beim Laden des Umzugs:', error);
        setLoading(false);
        // Fallback zu Mock-Daten als temporäre Lösung
        setFormData(mockUmzug);
      }
    };

    fetchUmzug();
  }
  
  // Mitarbeiter und Fahrzeuge laden
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
  
  const fetchFahrzeuge = async () => {
    try {
      const response = await fahrzeugeService.getAll();
      setVerfuegbareFahrzeuge(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Fahrzeuge:', error);
      // Fallback zu Mock-Daten
      setVerfuegbareFahrzeuge(mockFahrzeuge);
    }
  };
  
  fetchMitarbeiter();
  fetchFahrzeuge();
}, [id]);

// Formular absenden mit API-Aufruf
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // Adressdaten extrahieren und strukturiert aufbereiten
    const startAdressTeile = parseAdresse(formData.startadresse);
    const zielAdressTeile = parseAdresse(formData.zieladresse);
    
    // Formular-Daten in API-Format transformieren
    const apiData = {
      auftraggeber: {
        name: formData.kunde.name,
        kontaktperson: formData.kunde.kontaktperson,
        telefon: formData.kunde.telefon,
        email: formData.kunde.email
      },
      typ: formData.typ,
      status: mapFormStatus(formData.status),
      
      // Datum und Uhrzeit kombinieren
      startDatum: new Date(`${formData.datum}T${formData.uhrzeit_start}`).toISOString(),
      endDatum: formData.uhrzeit_ende ? 
                new Date(`${formData.datum}T${formData.uhrzeit_ende}`).toISOString() : 
                null,
      
      auszugsadresse: {
        strasse: startAdressTeile.strasse || '',
        hausnummer: startAdressTeile.hausnummer || '',
        plz: startAdressTeile.plz || '',
        ort: startAdressTeile.ort || '',
        etage: formData.etage_start,
        aufzug: formData.aufzug_start
      },
      einzugsadresse: {
        strasse: zielAdressTeile.strasse || '',
        hausnummer: zielAdressTeile.hausnummer || '',
        plz: zielAdressTeile.plz || '',
        ort: zielAdressTeile.ort || '',
        etage: formData.etage_ziel,
        aufzug: formData.aufzug_ziel
      },
      
      volumen: parseInt(formData.umzugsvolumen) || 0,
      
      // Mitarbeiter und Fahrzeuge in das richtige Format bringen
      mitarbeiter: formData.mitarbeiter.map(id => ({ mitarbeiterId: id })),
      fahrzeuge: formData.fahrzeuge.map(id => ({ fahrzeugId: id })),
      
      notizen: formData.notizen
    };
    
    // Je nach Modus entweder neuen Umzug erstellen oder bestehenden aktualisieren
    if (isNeueModus) {
      await umzuegeService.create(apiData);
      alert('Umzug erfolgreich erstellt');
    } else {
      await umzuegeService.update(id, apiData);
      alert('Umzug erfolgreich aktualisiert');
    }
    
    // Zurück zur Übersicht navigieren
    navigate('/umzuege');
  } catch (error) {
    console.error('Fehler beim Speichern des Umzugs:', error);
    alert(`Fehler beim ${isNeueModus ? 'Erstellen' : 'Aktualisieren'} des Umzugs: ${error.message}`);
  }
};

// Hilfsfunktion zum Extrahieren von Adressteilen
const parseAdresse = (adressString) => {
  const teile = {};
  
  // Vereinfachte Adress-Extraktion (kann je nach Format verbessert werden)
  try {
    const match = adressString.match(/^([^,\d]+)\s*(\d+)?,?\s*(\d+)?\s*(.+)?$/);
    
    if (match) {
      teile.strasse = match[1]?.trim() || '';
      teile.hausnummer = match[2] || '';
      teile.plz = match[3] || '';
      teile.ort = match[4]?.trim() || '';
    }
  } catch (e) {
    console.error('Fehler beim Parsen der Adresse:', e);
  }
  
  return teile;
};

// Hilfsfunktion zum Konvertieren des Frontend-Status in das API-Format
const mapFormStatus = (formStatus) => {
  switch (formStatus) {
    case 'Geplant':
      return 'geplant';
    case 'In Vorbereitung':
    case 'In Bearbeitung':
      return 'in_bearbeitung';
    case 'Abgeschlossen':
      return 'abgeschlossen';
    default:
      return 'geplant';
  }
};

// Hilfsfunktion zum Konvertieren des API-Status in das Frontend-Format
const mapAPIStatus = (apiStatus) => {
  switch (apiStatus) {
    case 'angefragt':
    case 'angebot':
    case 'geplant':
      return 'Geplant';
    case 'in_bearbeitung':
      return 'In Bearbeitung';
    case 'abgeschlossen':
      return 'Abgeschlossen';
    case 'storniert':
      return 'Storniert';
    default:
      return 'Geplant';
  }
};
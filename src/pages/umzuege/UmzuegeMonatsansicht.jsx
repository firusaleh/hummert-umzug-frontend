// Import-Statement ändern
import { umzuegeService } from '../../services/api'; // Umzüge-Service importieren

// useEffect-Hook für das Laden der Umzüge ändern
useEffect(() => {
  const fetchUmzuege = async () => {
    try {
      setLoading(true);
      // API-Aufruf mit der neuen Service-Funktion
      const response = await umzuegeService.getAll();
      
      // API-Daten in das Format transformieren, das von der Komponente verwendet wird
      const transformierteUmzuege = response.data.map(umzug => ({
        id: umzug._id,
        kunde: umzug.auftraggeber.name,
        telefon: umzug.auftraggeber.telefon,
        email: umzug.auftraggeber.email,
        kategorie: umzug.typ || 'Privatumzug',
        von: `${umzug.auszugsadresse.strasse} ${umzug.auszugsadresse.hausnummer}, ${umzug.auszugsadresse.plz} ${umzug.auszugsadresse.ort}`,
        nach: `${umzug.einzugsadresse.strasse} ${umzug.einzugsadresse.hausnummer}, ${umzug.einzugsadresse.plz} ${umzug.einzugsadresse.ort}`,
        datum: new Date(umzug.startDatum),
        uhrzeit: `${new Date(umzug.startDatum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - ${umzug.endDatum ? new Date(umzug.endDatum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}`,
        mitarbeiter: umzug.mitarbeiter?.map(m => m.mitarbeiterId?.vorname || 'Unbekannt') || [],
        fahrzeuge: umzug.fahrzeuge?.map(f => f.kennzeichen || f.typ || 'Fahrzeug') || [],
        status: mapAPIStatus(umzug.status),
        volumen: `${umzug.volumen || 0} m³`,
        preis: umzug.preis?.brutto || 0,
        notizen: umzug.notizen || '',
        materialien: 'Standard-Umzugsset'
      }));
      
      setUmzuege(transformierteUmzuege);
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Umzüge:', error);
      setLoading(false);
    }
  };
  
  fetchUmzuege();
}, []);

// Umzug löschen Funktion aktualisieren
const umzugLoeschen = async (id) => {
  if (window.confirm('Möchten Sie diesen Umzug wirklich löschen?')) {
    try {
      // API-Aufruf mit der neuen Service-Funktion
      await umzuegeService.delete(id);
      setUmzuege(umzuege.filter(umzug => umzug.id !== id));
      
      if (ausgewaehlterUmzug && ausgewaehlterUmzug.id === id) {
        setAusgewaehlterUmzug(null);
        setAnsicht('monatsdetails');
      }
      
      // Erfolgsmeldung
      alert('Umzug erfolgreich gelöscht');
    } catch (error) {
      console.error('Fehler beim Löschen des Umzugs:', error);
      alert('Fehler beim Löschen des Umzugs');
    }
  }
};

// Status aktualisieren Funktion anpassen
const updateUmzugStatus = async (id, neuerStatus) => {
  try {
    // API-Status-Format konvertieren
    let apiStatus;
    switch (neuerStatus) {
      case 'In Bearbeitung':
        apiStatus = 'in_bearbeitung';
        break;
      case 'Abgeschlossen':
        apiStatus = 'abgeschlossen';
        break;
      default:
        apiStatus = 'geplant';
    }
    
    // API-Aufruf mit der neuen Service-Funktion
    await umzuegeService.updateStatus(id, apiStatus);
    
    // Lokalen Status aktualisieren
    const aktualisierteUmzuege = umzuege.map(umzug => 
      umzug.id === id 
        ? { ...umzug, status: neuerStatus } 
        : umzug
    );
    setUmzuege(aktualisierteUmzuege);
    
    if (ausgewaehlterUmzug && ausgewaehlterUmzug.id === id) {
      setAusgewaehlterUmzug({...ausgewaehlterUmzug, status: neuerStatus});
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Status:', error);
    alert('Fehler beim Aktualisieren des Status');
  }
};
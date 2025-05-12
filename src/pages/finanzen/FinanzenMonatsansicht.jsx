// ****** FinanzenMonatsansicht.jsx Updates ******

// Import-Statements ändern
import { finanzenService } from '../../services/api';

// useEffect-Hook für das Laden der Transaktionen ändern
useEffect(() => {
  const fetchTransaktionen = async () => {
    try {
      const response = await finanzenService.getMonatsuebersicht(aktuellesJahr);
      setTransaktionen(response.data.transaktionen);
    } catch (error) {
      console.error('Fehler beim Laden der Finanzübersicht:', error);
      // Fallback zu Mock-Daten
      setTransaktionen([/* Ihre Mock-Daten hier */]);
    }
  };
  
  fetchTransaktionen();
}, [aktuellesJahr]);

// Monatsdetails laden
const loadMonatsdetails = async (monat, jahr) => {
  try {
    const response = await finanzenService.getMonatsdetails(monat, jahr);
    setTransaktionen(response.data.transaktionen);
  } catch (error) {
    console.error(`Fehler beim Laden der Details für ${monat}/${jahr}:`, error);
  }
};

// Transaktion löschen
const transaktionLoeschen = async (id) => {
  if (window.confirm('Möchten Sie diese Transaktion wirklich löschen?')) {
    try {
      // Je nach Typ (Einnahme/Ausgabe) den richtigen Endpunkt wählen
      if (ausgewaehlteTransaktion.typ === 'Einnahme') {
        await finanzenService.deleteRechnung(id);
      } else {
        await finanzenService.deleteProjektkosten(id);
      }
      
      setTransaktionen(transaktionen.filter(transaktion => transaktion.id !== id));
      
      if (ausgewaehlteTransaktion && ausgewaehlteTransaktion.id === id) {
        setAusgewaehlteTransaktion(null);
        setAnsicht('monatsdetails');
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Transaktion:', error);
      alert('Fehler beim Löschen der Transaktion');
    }
  }
};

// ****** Finanzverwaltung.jsx Updates ******

// Import-Statements ändern
import { finanzenService } from '../../services/api';

// useEffect-Hook für das Laden der Finanzdaten
useEffect(() => {
  const fetchFinanzData = async () => {
    try {
      // Übersicht laden
      const uebersichtResponse = await finanzenService.getUebersicht();
      setUebersicht(uebersichtResponse.data);
      
      // Angebote laden
      const angeboteResponse = await finanzenService.getAngebote();
      setAngebote(angeboteResponse.data);
      
      // Rechnungen laden
      const rechnungenResponse = await finanzenService.getRechnungen();
      setRechnungen(rechnungenResponse.data);
      
      // Projektkosten laden
      const projektkostenResponse = await finanzenService.getProjektkosten();
      setProjektkosten(projektkostenResponse.data);
      
      // Monatliche Umsätze für Chart laden
      // Hier wird angenommen, dass die Übersicht bereits monatliche Daten enthält
      if (uebersichtResponse.data.monatlicheUmsaetze) {
        setMonatlicheUmsaetze(uebersichtResponse.data.monatlicheUmsaetze);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Finanzdaten:', error);
      // Hier könnten Fallback-Daten gesetzt werden
    }
  };
  
  fetchFinanzData();
}, []);

// Angebot speichern Handler
const handleSaveAngebot = async (angebot) => {
  try {
    if (currentAngebot) {
      // Bestehendes Angebot aktualisieren
      await finanzenService.updateAngebot(currentAngebot.id, angebot);
      setAngebote(angebote.map(a => a.id === currentAngebot.id ? {...angebot, id: a.id} : a));
    } else {
      // Neues Angebot erstellen
      const response = await finanzenService.createAngebot(angebot);
      const newId = response.data.id;
      setAngebote([...angebote, {...angebot, id: newId, datum: new Date(angebot.datum)}]);
    }
    
    // Modal schließen
    setShowAngebotModal(false);
    
    // Übersicht aktualisieren
    refreshUebersicht();
  } catch (error) {
    console.error('Fehler beim Speichern des Angebots:', error);
    alert('Fehler beim Speichern des Angebots');
  }
};

// Rechnung speichern Handler
const handleSaveRechnung = async (rechnung) => {
  try {
    if (currentRechnung) {
      // Bestehende Rechnung aktualisieren
      await finanzenService.updateRechnung(currentRechnung.id, rechnung);
      setRechnungen(rechnungen.map(r => r.id === currentRechnung.id ? {...rechnung, id: r.id} : r));
    } else {
      // Neue Rechnung erstellen
      const response = await finanzenService.createRechnung(rechnung);
      const newId = response.data.id;
      
      // Status festlegen
      const status = rechnung.zahlungsDatum ? 'Bezahlt' : 
                    (new Date() > new Date(rechnung.faelligkeitsDatum)) ? 'Überfällig' : 'Offen';
      
      const neueRechnung = {
        ...rechnung, 
        id: newId,
        status: rechnung.status || status
      };
      
      setRechnungen([...rechnungen, neueRechnung]);
    }
    
    // Modal schließen
    setShowRechnungModal(false);
    
    // Übersicht aktualisieren
    refreshUebersicht();
  } catch (error) {
    console.error('Fehler beim Speichern der Rechnung:', error);
    alert('Fehler beim Speichern der Rechnung');
  }
};

// Kosten speichern Handler
const handleSaveKosten = async (kosten) => {
  try {
    if (currentKosten) {
      // Bestehende Kosten aktualisieren
      await finanzenService.updateProjektkosten(currentKosten.id, kosten);
      setProjektkosten(projektkosten.map(p => p.id === currentKosten.id ? {...kosten, id: p.id} : p));
    } else {
      // Neue Kosten erstellen
      const response = await finanzenService.createProjektkosten(kosten);
      const newId = response.data.id;
      setProjektkosten([...projektkosten, {...kosten, id: newId}]);
    }
    
    // Modal schließen
    setShowKostenModal(false);
    
    // Übersicht aktualisieren
    refreshUebersicht();
  } catch (error) {
    console.error('Fehler beim Speichern der Projektkosten:', error);
    alert('Fehler beim Speichern der Projektkosten');
  }
};

// Handler zum Markieren einer Rechnung als bezahlt
const handleRechnungAlsBezahltMarkieren = async (id) => {
  try {
    await finanzenService.markRechnungAsBezahlt(id);
    
    // Lokalen Zustand aktualisieren
    setRechnungen(rechnungen.map(rechnung => 
      rechnung.id === id 
        ? { ...rechnung, status: 'Bezahlt', zahlungsDatum: new Date() } 
        : rechnung
    ));
    
    // Übersicht aktualisieren
    refreshUebersicht();
  } catch (error) {
    console.
    // Fortsetzung der Finanzverwaltung.jsx Updates

// Handler zum Markieren einer Rechnung als bezahlt (Fortsetzung)
const handleRechnungAlsBezahltMarkieren = async (id) => {
  try {
    await finanzenService.markRechnungAsBezahlt(id);
    
    // Lokalen Zustand aktualisieren
    setRechnungen(rechnungen.map(rechnung => 
      rechnung.id === id 
        ? { ...rechnung, status: 'Bezahlt', zahlungsDatum: new Date() } 
        : rechnung
    ));
    
    // Übersicht aktualisieren
    refreshUebersicht();
  } catch (error) {
    console.error('Fehler beim Markieren der Rechnung als bezahlt:', error);
    alert('Fehler beim Markieren der Rechnung als bezahlt');
  }
};

// Funktion zum Aktualisieren der Übersicht
const refreshUebersicht = async () => {
  try {
    const response = await finanzenService.getUebersicht();
    setUebersicht(response.data);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Übersicht:', error);
  }
};

// Funktion zum Löschen eines Angebots
const handleDeleteAngebot = async (id) => {
  if (window.confirm('Möchten Sie dieses Angebot wirklich löschen?')) {
    try {
      await finanzenService.deleteAngebot(id);
      setAngebote(angebote.filter(a => a.id !== id));
      refreshUebersicht();
    } catch (error) {
      console.error('Fehler beim Löschen des Angebots:', error);
      alert('Fehler beim Löschen des Angebots');
    }
  }
};

// Funktion zum Ändern des Angebotsstatus
const handleAngebotStatusAendern = async (id, neuerStatus) => {
  try {
    // Angebot mit aktualisierten Status finden
    const angebot = angebote.find(a => a.id === id);
    if (!angebot) return;
    
    const aktualisiertesDaten = { ...angebot, status: neuerStatus };
    
    // API-Aufruf zum Aktualisieren des Angebots
    await finanzenService.updateAngebot(id, aktualisiertesDaten);
    
    // Lokalen State aktualisieren
    setAngebote(angebote.map(a => 
      a.id === id ? { ...a, status: neuerStatus } : a
    ));
    
    // Wenn ein Angebot angenommen wird, evtl. automatisch eine Rechnung erstellen?
    if (neuerStatus === 'Angenommen') {
      // Optional: Hier könnte ein automatisches Erstellen einer Rechnung aus dem Angebot erfolgen
      // z.B. automatisches Öffnen des Rechnungs-Modal mit vorausgefüllten Daten
    }
    
    // Übersicht aktualisieren
    refreshUebersicht();
  } catch (error) {
    console.error('Fehler beim Ändern des Angebotsstatus:', error);
    alert('Fehler beim Ändern des Angebotsstatus');
  }
};
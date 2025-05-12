// Import-Statements ändern
import { zeiterfassungService } from '../../services/api';

// useEffect-Hook für das Laden der Daten ändern
useEffect(() => {
  const fetchData = async () => {
    try {
      // Mitarbeiter laden
      const mitarbeiterResponse = await zeiterfassungService.getMitarbeiter();
      setMitarbeiter(mitarbeiterResponse.data);
      
      // Umzugsprojekte laden
      const projekteResponse = await zeiterfassungService.getUmzugsprojekte();
      setUmzugsprojekte(projekteResponse.data);
      
      // Wenn ein Projekt ausgewählt ist, Zeiterfassungen dafür laden
      if (aktuellesProjekt) {
        const zeiterfassungenResponse = await zeiterfassungService.getZeiterfassungen(aktuellesProjekt.id);
        setZeiterfassungen(zeiterfassungenResponse.data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      // Fallback zu Mock-Daten
      setMitarbeiter([
        { id: 1, name: 'Max Mustermann', position: 'Umzugshelfer' },
        { id: 2, name: 'Anna Schmidt', position: 'Fahrer' },
        { id: 3, name: 'Peter Müller', position: 'Umzugshelfer' },
        { id: 4, name: 'Lisa Wagner', position: 'Teamleiter' }
      ]);
      
      setUmzugsprojekte([
        { id: 1, kundenName: 'Familie Müller', datum: '2025-05-10', status: 'In Bearbeitung' },
        { id: 2, kundenName: 'Herr Schmidt', datum: '2025-05-12', status: 'In Bearbeitung' },
        { id: 3, kundenName: 'Frau Weber', datum: '2025-05-15', status: 'Geplant' },
        { id: 4, kundenName: 'Familie Bauer', datum: '2025-05-08', status: 'Abgeschlossen' }
      ]);
    }
  };
  
  fetchData();
}, [aktuellesProjekt?.id]);

// Zeiterfassung speichern
const handleZeiterfassungSpeichern = async () => {
  if (!formular.mitarbeiterId || !formular.startZeit || !formular.endZeit || !aktuellesProjekt) {
    alert('Bitte füllen Sie alle Pflichtfelder aus.');
    return;
  }
  
  try {
    const zeiterfassungData = {
      mitarbeiterId: parseInt(formular.mitarbeiterId),
      umzugsprojektId: aktuellesProjekt.id,
      datum: aktuellesProjekt.datum,
      startZeit: formular.startZeit,
      endZeit: formular.endZeit,
      pausen: parseInt(formular.pausen),
      bemerkung: formular.bemerkung
    };
    
    if (bearbeitungId) {
      // Zeiterfassung aktualisieren
      await zeiterfassungService.updateZeiterfassung(bearbeitungId, zeiterfassungData);
      
      // Optimistische UI-Aktualisierung
      setZeiterfassungen(
        zeiterfassungen.map(z => 
          z.id === bearbeitungId 
            ? { ...z, ...zeiterfassungData } 
            : z
        )
      );
      setBearbeitungId(null);
    } else {
      // Neue Zeiterfassung hinzufügen
      const response = await zeiterfassungService.addZeiterfassung(zeiterfassungData);
      
      // Optimistische UI-Aktualisierung mit der zurückgegebenen ID
      const neueZeiterfassung = {
        id: response.data.id,
        ...zeiterfassungData
      };
      
      setZeiterfassungen([...zeiterfassungen, neueZeiterfassung]);
    }
    
    // Formular zurücksetzen
    setFormular({
      mitarbeiterId: '',
      startZeit: '',
      endZeit: '',
      pausen: 30,
      bemerkung: ''
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Zeiterfassung:', error);
    alert('Fehler beim Speichern der Zeiterfassung');
  }
};

// Zeiterfassung löschen
const handleZeiterfassungLoeschen = async (id) => {
  if (window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
    try {
      await zeiterfassungService.deleteZeiterfassung(id);
      setZeiterfassungen(zeiterfassungen.filter(z => z.id !== id));
    } catch (error) {
      console.error('Fehler beim Löschen der Zeiterfassung:', error);
      alert('Fehler beim Löschen der Zeiterfassung');
    }
  }
};

// Neuen Mitarbeiter hinzufügen
const handleAddMitarbeiter = async (name, position) => {
  try {
    const mitarbeiterData = { name, position };
    const response = await zeiterfassungService.addMitarbeiter(mitarbeiterData);
    
    const neuerMitarbeiter = {
      id: response.data.id,
      name,
      position
    };
    
    setMitarbeiter([...mitarbeiter, neuerMitarbeiter]);
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Mitarbeiters:', error);
    alert('Fehler beim Hinzufügen des Mitarbeiters');
  }
};

// Mitarbeiter löschen
const handleDeleteMitarbeiter = async (id) => {
  if (window.confirm(`Möchten Sie den Mitarbeiter wirklich löschen?`)) {
    try {
      await zeiterfassungService.deleteMitarbeiter(id);
      setMitarbeiter(mitarbeiter.filter(m => m.id !== id));
      // Auch zugehörige Zeiterfassungen löschen
      setZeiterfassungen(zeiterfassungen.filter(z => z.mitarbeiterId !== id));
    } catch (error) {
      console.error('Fehler beim Löschen des Mitarbeiters:', error);
      alert('Fehler beim Löschen des Mitarbeiters');
    }
  }
};
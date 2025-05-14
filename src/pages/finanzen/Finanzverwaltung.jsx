import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, FileText, TrendingUp, PieChart, BarChart2, Download, Filter, Plus, Edit, Trash2, ArrowUp, ArrowDown, Check, CheckCircle, XCircle, Clock, Clipboard, Search } from 'lucide-react';
// Neue Imports für die Modal-Komponenten
import Modal from '../../components/Modal';
import AngebotForm from '../../components/finanzen/AngebotForm';
import RechnungForm from '../../components/finanzen/RechnungForm';
import ProjektkostenForm from '../../components/finanzen/ProjektkostenForm';
import { finanzenService, zeiterfassungService } from '../../services/api'; // Korrekte Services importieren
import { toast } from 'react-toastify'; // Für Benachrichtigungen

export default function Finanzverwaltung() {
  // State für Lade- und Fehlerzustände
  const [loading, setLoading] = useState({
    uebersicht: true,
    angebote: true,
    rechnungen: true,
    projektkosten: true
  });
  const [error, setError] = useState({
    uebersicht: null,
    angebote: null,
    rechnungen: null,
    projektkosten: null
  });

  // State für Finanzübersicht
  const [uebersicht, setUebersicht] = useState({
    umsatzGesamt: 124500,
    offeneRechnungen: 15680,
    bezahlteRechnungen: 108820,
    offeneAngebote: 35750,
    kostenGesamt: 86150,
    gewinn: 38350
  });
  
  // State für Angebote
  const [angebote, setAngebote] = useState([
    {
      id: 1,
      nummer: 'ANG-2025-001',
      kunde: 'Familie Müller',
      betrag: 1850,
      datum: new Date(2025, 4, 2),
      status: 'Angenommen',
      umzugsDatum: new Date(2025, 5, 10),
      gueltigBis: new Date(2025, 4, 30)
    },
    {
      id: 2,
      nummer: 'ANG-2025-002',
      kunde: 'Herr Schmidt',
      betrag: 980,
      datum: new Date(2025, 4, 3),
      status: 'Offen',
      umzugsDatum: new Date(2025, 5, 15),
      gueltigBis: new Date(2025, 5, 3)
    },
    {
      id: 3,
      nummer: 'ANG-2025-003',
      kunde: 'Frau Weber',
      betrag: 2450,
      datum: new Date(2025, 4, 5),
      status: 'Angenommen',
      umzugsDatum: new Date(2025, 5, 20),
      gueltigBis: new Date(2025, 5, 5)
    },
    {
      id: 4,
      nummer: 'ANG-2025-004',
      kunde: 'Firma Tech Solutions',
      betrag: 4850,
      datum: new Date(2025, 4, 6),
      status: 'Abgelehnt',
      umzugsDatum: new Date(2025, 6, 1),
      gueltigBis: new Date(2025, 5, 6)
    },
    {
      id: 5,
      nummer: 'ANG-2025-005',
      kunde: 'Familie Bauer',
      betrag: 1650,
      datum: new Date(2025, 4, 7),
      status: 'Offen',
      umzugsDatum: new Date(2025, 6, 5),
      gueltigBis: new Date(2025, 5, 7)
    }
  ]);
  
  // State für Rechnungen
  const [rechnungen, setRechnungen] = useState([
    {
      id: 1,
      nummer: 'RE-2025-001',
      kunde: 'Familie Müller',
      betrag: 1850,
      datum: new Date(2025, 5, 12),
      status: 'Bezahlt',
      zahlungsDatum: new Date(2025, 5, 18),
      faelligkeitsDatum: new Date(2025, 6, 12)
    },
    {
      id: 2,
      nummer: 'RE-2025-002',
      kunde: 'Herr Schmidt',
      betrag: 980,
      datum: new Date(2025, 5, 16),
      status: 'Offen',
      zahlungsDatum: null,
      faelligkeitsDatum: new Date(2025, 6, 16)
    },
    {
      id: 3,
      nummer: 'RE-2025-003',
      kunde: 'Frau Weber',
      betrag: 2450,
      datum: new Date(2025, 5, 21),
      status: 'Bezahlt',
      zahlungsDatum: new Date(2025, 5, 25),
      faelligkeitsDatum: new Date(2025, 6, 21)
    },
    {
      id: 4,
      nummer: 'RE-2025-004',
      kunde: 'Herr Fischer',
      betrag: 1250,
      datum: new Date(2025, 5, 25),
      status: 'Überfällig',
      zahlungsDatum: null,
      faelligkeitsDatum: new Date(2025, 6, 25)
    },
    {
      id: 5,
      nummer: 'RE-2025-005',
      kunde: 'Firma Bergmann GmbH',
      betrag: 3580,
      datum: new Date(2025, 5, 28),
      status: 'Bezahlt',
      zahlungsDatum: new Date(2025, 6, 5),
      faelligkeitsDatum: new Date(2025, 6, 28)
    }
  ]);// State für Projektkosten
  const [projektkosten, setProjektkosten] = useState([
    {
      id: 1,
      projekt: 'Umzug Familie Müller',
      personalkosten: 850,
      materialkosten: 250,
      fahrzeugkosten: 180,
      sonstige: 70,
      gesamt: 1350,
      ertrag: 1850,
      marge: 27
    },
    {
      id: 2,
      projekt: 'Umzug Herr Schmidt',
      personalkosten: 450,
      materialkosten: 120,
      fahrzeugkosten: 90,
      sonstige: 20,
      gesamt: 680,
      ertrag: 980,
      marge: 31
    },
    {
      id: 3,
      projekt: 'Umzug Frau Weber',
      personalkosten: 1100,
      materialkosten: 380,
      fahrzeugkosten: 220,
      sonstige: 150,
      gesamt: 1850,
      ertrag: 2450,
      marge: 24
    }
  ]);
  
  // UI-States
  const [aktiverTab, setAktiverTab] = useState('uebersicht');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedAngebotsfilter, setSelectedAngebotsfilter] = useState('Alle');
  const [selectedRechnungsfilter, setSelectedRechnungsfilter] = useState('Alle');
  const [suchbegriff, setSuchbegriff] = useState('');
  const [sortierung, setSortierung] = useState({
    feld: 'datum',
    richtung: 'absteigend'
  });
  
  // State für Modals
  const [showAngebotModal, setShowAngebotModal] = useState(false);
  const [showRechnungModal, setShowRechnungModal] = useState(false);
  const [showKostenModal, setShowKostenModal] = useState(false);
  const [currentAngebot, setCurrentAngebot] = useState(null);
  const [currentRechnung, setCurrentRechnung] = useState(null);
  const [currentKosten, setCurrentKosten] = useState(null);
  
  // Monatliche Umsätze für Chart
  const [monatlicheUmsaetze, setMonatlicheUmsaetze] = useState([
    { monat: 'Jan', umsatz: 9800, kosten: 6860 },
    { monat: 'Feb', umsatz: 8500, kosten: 5950 },
    { monat: 'Mär', umsatz: 11200, kosten: 7840 },
    { monat: 'Apr', umsatz: 10500, kosten: 7350 },
    { monat: 'Mai', umsatz: 12800, kosten: 8960 }
  ]);
  
  // Umzugsprojekte für die ProjektkostenForm
  const [umzugsprojekte, setUmzugsprojekte] = useState([
    { id: 1, name: 'Umzug Familie Müller' },
    { id: 2, name: 'Umzug Herr Schmidt' },
    { id: 3, name: 'Umzug Frau Weber' },
    { id: 4, name: 'Umzug Herr Fischer' },
    { id: 5, name: 'Umzug Firma Bergmann GmbH' }
  ]);

  // Effekt zum Laden der Übersichtsdaten
  useEffect(() => {
    const fetchUebersicht = async () => {
      setLoading(prev => ({ ...prev, uebersicht: true }));
      setError(prev => ({ ...prev, uebersicht: null }));
      
      try {
        // Verwende getUebersicht aus finanzenService, wenn Backend bereit ist
        // const response = await finanzenService.getUebersicht();
        // setUebersicht(response.data);
        
        // Simuliere Ladezustand
        setTimeout(() => {
          setLoading(prev => ({ ...prev, uebersicht: false }));
        }, 800);
      } catch (err) {
        console.error('Fehler beim Laden der Finanzübersicht:', err);
        setError(prev => ({ ...prev, uebersicht: 'Die Finanzübersicht konnte nicht geladen werden.' }));
        setLoading(prev => ({ ...prev, uebersicht: false }));
      }
    };
    
    fetchUebersicht();
  }, []);
  
  // Effekt zum Laden der Angebote
  useEffect(() => {
    const fetchAngebote = async () => {
      setLoading(prev => ({ ...prev, angebote: true }));
      setError(prev => ({ ...prev, angebote: null }));
      
      try {
        const response = await finanzenService.getAngebote();
        
        // Wenn API erfolgreich, Daten verwenden
        if (response && response.data) {
          // Datum-Strings in Date-Objekte umwandeln
          const formattedAngebote = response.data.map(angebot => ({
            ...angebot,
            datum: new Date(angebot.datum),
            umzugsDatum: new Date(angebot.umzugsDatum),
            gueltigBis: new Date(angebot.gueltigBis)
          }));
          
          setAngebote(formattedAngebote);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Angebote:', err);
        setError(prev => ({ ...prev, angebote: 'Die Angebote konnten nicht geladen werden.' }));
        // Behält die Mock-Daten bei Fehler bei
      } finally {
        setLoading(prev => ({ ...prev, angebote: false }));
      }
    };
    
    fetchAngebote();
  }, []);
  
  // Effekt zum Laden der Rechnungen
  useEffect(() => {
    const fetchRechnungen = async () => {
      setLoading(prev => ({ ...prev, rechnungen: true }));
      setError(prev => ({ ...prev, rechnungen: null }));
      
      try {
        const response = await finanzenService.getRechnungen();
        
        // Wenn API erfolgreich, Daten verwenden
        if (response && response.data) {
          // Datum-Strings in Date-Objekte umwandeln
          const formattedRechnungen = response.data.map(rechnung => ({
            ...rechnung,
            datum: new Date(rechnung.datum),
            faelligkeitsDatum: new Date(rechnung.faelligkeitsDatum),
            zahlungsDatum: rechnung.zahlungsDatum ? new Date(rechnung.zahlungsDatum) : null
          }));
          
          setRechnungen(formattedRechnungen);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Rechnungen:', err);
        setError(prev => ({ ...prev, rechnungen: 'Die Rechnungen konnten nicht geladen werden.' }));
        // Behält die Mock-Daten bei Fehler bei
      } finally {
        setLoading(prev => ({ ...prev, rechnungen: false }));
      }
    };
    
    fetchRechnungen();
  }, []);// Effekt zum Laden der Projektkosten
  useEffect(() => {
    const fetchProjektkosten = async () => {
      setLoading(prev => ({ ...prev, projektkosten: true }));
      setError(prev => ({ ...prev, projektkosten: null }));
      
      try {
        const response = await finanzenService.getProjektkosten();
        
        // Wenn API erfolgreich, Daten verwenden
        if (response && response.data) {
          setProjektkosten(response.data);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Projektkosten:', err);
        setError(prev => ({ ...prev, projektkosten: 'Die Projektkosten konnten nicht geladen werden.' }));
        // Behält die Mock-Daten bei Fehler bei
      } finally {
        setLoading(prev => ({ ...prev, projektkosten: false }));
      }
    };
    
    fetchProjektkosten();
  }, []);
  
  // Laden der Umzugsprojekte für das Formular
  useEffect(() => {
    const fetchUmzugsprojekte = async () => {
      try {
        // Verwende zeiterfassungService.getUmzugsprojekte statt eines nicht vorhandenen finanzenService.getUmzugsprojekte
        const response = await zeiterfassungService.getUmzugsprojekte();
        
        if (response && response.data) {
          setUmzugsprojekte(response.data);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Umzugsprojekte:', err);
        // Mock-Daten behalten als Fallback
      }
    };
    
    fetchUmzugsprojekte();
  }, []);
  
  // Monatliche Umsätze - Hier können wir die Monatsübersicht für das aktuelle Jahr verwenden
  useEffect(() => {
    const fetchMonatlicheUmsaetze = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const response = await finanzenService.getMonatsuebersicht(currentYear);
        
        if (response && response.data) {
          // Daten möglicherweise in das benötigte Format transformieren
          const monatskuerzel = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
          
          const formattedData = response.data.map((item, index) => ({
            monat: monatskuerzel[item.month || index],
            umsatz: item.einnahmen || item.umsatz,
            kosten: item.ausgaben || item.kosten
          }));
          
          setMonatlicheUmsaetze(formattedData);
        }
      } catch (err) {
        console.error('Fehler beim Laden der monatlichen Umsätze:', err);
        // Mock-Daten behalten als Fallback
      }
    };
    
    fetchMonatlicheUmsaetze();
  }, []);
  
  // Datumsformatierung
  const formatieresDatum = (datum) => {
    return datum.toLocaleDateString('de-DE');
  };
  
  // Status-Badge Styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Angenommen':
        return 'bg-green-100 text-green-800';
      case 'Offen':
        return 'bg-blue-100 text-blue-800';
      case 'Abgelehnt':
        return 'bg-red-100 text-red-800';
      case 'Bezahlt':
        return 'bg-green-100 text-green-800';
      case 'Überfällig':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Status-Icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Angenommen':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Offen':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Abgelehnt':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Bezahlt':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Überfällig':
        return <Clock className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };
  
  // Gefilterte Angebote
  const gefilerteAngebote = angebote.filter(angebot => {
    if (selectedAngebotsfilter !== 'Alle' && angebot.status !== selectedAngebotsfilter) {
      return false;
    }
    
    if (suchbegriff && !angebot.kunde.toLowerCase().includes(suchbegriff.toLowerCase()) &&
        !angebot.nummer.toLowerCase().includes(suchbegriff.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (sortierung.feld === 'datum') {
      return sortierung.richtung === 'aufsteigend' ? a.datum - b.datum : b.datum - a.datum;
    } else if (sortierung.feld === 'betrag') {
      return sortierung.richtung === 'aufsteigend' ? a.betrag - b.betrag : b.betrag - a.betrag;
    } else if (sortierung.feld === 'kunde') {
      return sortierung.richtung === 'aufsteigend' ? a.kunde.localeCompare(b.kunde) : b.kunde.localeCompare(a.kunde);
    }
    
    return 0;
  });
  
  // Gefilterte Rechnungen
  const gefilerteRechnungen = rechnungen.filter(rechnung => {
    if (selectedRechnungsfilter !== 'Alle' && rechnung.status !== selectedRechnungsfilter) {
      return false;
    }
    
    if (suchbegriff && !rechnung.kunde.toLowerCase().includes(suchbegriff.toLowerCase()) &&
        !rechnung.nummer.toLowerCase().includes(suchbegriff.toLowerCase())) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (sortierung.feld === 'datum') {
      return sortierung.richtung === 'aufsteigend' ? a.datum - b.datum : b.datum - a.datum;
    } else if (sortierung.feld === 'betrag') {
      return sortierung.richtung === 'aufsteigend' ? a.betrag - b.betrag : b.betrag - a.betrag;
    } else if (sortierung.feld === 'kunde') {
      return sortierung.richtung === 'aufsteigend' ? a.kunde.localeCompare(b.kunde) : b.kunde.localeCompare(a.kunde);
    }
    
    return 0;
  });// Angebot speichern Handler
  const handleSaveAngebot = async (angebot) => {
    try {
      if (currentAngebot) {
        // Bestehendes Angebot aktualisieren
        const response = await finanzenService.updateAngebot(currentAngebot.id, angebot);
        
        if (response && response.data) {
          const updatedAngebot = {
            ...response.data,
            datum: new Date(response.data.datum),
            umzugsDatum: new Date(response.data.umzugsDatum),
            gueltigBis: new Date(response.data.gueltigBis)
          };
          
          setAngebote(angebote.map(a => a.id === currentAngebot.id ? updatedAngebot : a));
          toast.success('Angebot wurde erfolgreich aktualisiert!');
        } else {
          // Fallback wenn API nur Status zurückgibt aber keine Daten
          setAngebote(angebote.map(a => a.id === currentAngebot.id ? {
            ...angebot, 
            id: a.id,
            datum: new Date(angebot.datum),
            umzugsDatum: new Date(angebot.umzugsDatum),
            gueltigBis: new Date(angebot.gueltigBis)
          } : a));
          toast.success('Angebot wurde erfolgreich aktualisiert!');
        }
      } else {
        // Neues Angebot erstellen
        const response = await finanzenService.createAngebot(angebot);
        
        if (response && response.data) {
          const newAngebot = {
            ...response.data,
            datum: new Date(response.data.datum),
            umzugsDatum: new Date(response.data.umzugsDatum),
            gueltigBis: new Date(response.data.gueltigBis)
          };
          
          setAngebote([...angebote, newAngebot]);
          toast.success('Angebot wurde erfolgreich erstellt!');
        } else {
          // Fallback wenn API nur Status zurückgibt aber keine Daten
          const newId = angebote.length > 0 ? Math.max(...angebote.map(a => a.id)) + 1 : 1;
          const newAngebot = {
            ...angebot, 
            id: newId,
            datum: new Date(angebot.datum),
            umzugsDatum: new Date(angebot.umzugsDatum),
            gueltigBis: new Date(angebot.gueltigBis)
          };
          
          setAngebote([...angebote, newAngebot]);
          toast.success('Angebot wurde erfolgreich erstellt!');
        }
        
        // Aktualisiere Übersicht, wenn das Angebot erfolgreich erstellt wurde
        await updateUebersicht();
      }
    } catch (err) {
      console.error('Fehler beim Speichern des Angebots:', err);
      toast.error('Fehler beim Speichern des Angebots. Bitte versuchen Sie es erneut.');
    }
    
    // Modal schließen
    setShowAngebotModal(false);
  };
  
  // Rechnung speichern Handler
  const handleSaveRechnung = async (rechnung) => {
    try {
      if (currentRechnung) {
        // Bestehende Rechnung aktualisieren
        const response = await finanzenService.updateRechnung(currentRechnung.id, rechnung);
        
        if (response && response.data) {
          const updatedRechnung = {
            ...response.data,
            datum: new Date(response.data.datum),
            faelligkeitsDatum: new Date(response.data.faelligkeitsDatum),
            zahlungsDatum: response.data.zahlungsDatum ? new Date(response.data.zahlungsDatum) : null
          };
          
          setRechnungen(rechnungen.map(r => r.id === currentRechnung.id ? updatedRechnung : r));
          toast.success('Rechnung wurde erfolgreich aktualisiert!');
        } else {
          // Fallback wenn API nur Status zurückgibt aber keine Daten
          setRechnungen(rechnungen.map(r => r.id === currentRechnung.id ? {
            ...rechnung,
            id: r.id,
            datum: new Date(rechnung.datum),
            faelligkeitsDatum: new Date(rechnung.faelligkeitsDatum),
            zahlungsDatum: rechnung.zahlungsDatum ? new Date(rechnung.zahlungsDatum) : null
          } : r));
          toast.success('Rechnung wurde erfolgreich aktualisiert!');
        }
        
        // Übersicht aktualisieren
        await updateUebersicht();
      } else {
        // Neue Rechnung erstellen
        const response = await finanzenService.createRechnung(rechnung);
        
        if (response && response.data) {
          const newRechnung = {
            ...response.data,
            datum: new Date(response.data.datum),
            faelligkeitsDatum: new Date(response.data.faelligkeitsDatum),
            zahlungsDatum: response.data.zahlungsDatum ? new Date(response.data.zahlungsDatum) : null
          };
          
          setRechnungen([...rechnungen, newRechnung]);
          toast.success('Rechnung wurde erfolgreich erstellt!');
        } else {
          // Fallback wenn API nur Status zurückgibt aber keine Daten
          const newId = rechnungen.length > 0 ? Math.max(...rechnungen.map(r => r.id)) + 1 : 1;
          
          // Status festlegen
          const status = rechnung.zahlungsDatum ? 'Bezahlt' : 
                      (new Date() > new Date(rechnung.faelligkeitsDatum)) ? 'Überfällig' : 'Offen';
          
          const neueRechnung = {
            ...rechnung, 
            id: newId,
            status: rechnung.status || status,
            datum: new Date(rechnung.datum),
            faelligkeitsDatum: new Date(rechnung.faelligkeitsDatum),
            zahlungsDatum: rechnung.zahlungsDatum ? new Date(rechnung.zahlungsDatum) : null
          };
          
          setRechnungen([...rechnungen, neueRechnung]);
          toast.success('Rechnung wurde erfolgreich erstellt!');
        }
        
        // Übersicht aktualisieren
        await updateUebersicht();
      }
    } catch (err) {
      console.error('Fehler beim Speichern der Rechnung:', err);
      toast.error('Fehler beim Speichern der Rechnung. Bitte versuchen Sie es erneut.');
    }
    
    // Modal schließen
    setShowRechnungModal(false);
  };
  
  // Kosten speichern Handler
  const handleSaveKosten = async (kosten) => {
    try {
      if (currentKosten) {
        // Bestehende Kosten aktualisieren
        const response = await finanzenService.updateProjektkosten(currentKosten.id, kosten);
        
        if (response && response.data) {
          setProjektkosten(projektkosten.map(p => p.id === currentKosten.id ? response.data : p));
          toast.success('Projektkosten wurden erfolgreich aktualisiert!');
        } else {
          // Fallback wenn API nur Status zurückgibt aber keine Daten
          setProjektkosten(projektkosten.map(p => p.id === currentKosten.id ? {...kosten, id: p.id} : p));
          toast.success('Projektkosten wurden erfolgreich aktualisiert!');
        }
      } else {
        // Neue Kosten erstellen
        const response = await finanzenService.createProjektkosten(kosten);
        
        if (response && response.data) {
          setProjektkosten([...projektkosten, response.data]);
          toast.success('Projektkosten wurden erfolgreich erfasst!');
        } else {
          // Fallback wenn API nur Status zurückgibt aber keine Daten
          const newId = projektkosten.length > 0 ? Math.max(...projektkosten.map(p => p.id)) + 1 : 1;
          setProjektkosten([...projektkosten, {...kosten, id: newId}]);
          toast.success('Projektkosten wurden erfolgreich erfasst!');
        }
        
        // Übersicht aktualisieren
        await updateUebersicht();
      }
    } catch (err) {
      console.error('Fehler beim Speichern der Projektkosten:', err);
      toast.error('Fehler beim Speichern der Projektkosten. Bitte versuchen Sie es erneut.');
    }
    
    // Modal schließen
    setShowKostenModal(false);
  };// Handler zum Markieren einer Rechnung als bezahlt
  const handleRechnungAlsBezahltMarkieren = async (id) => {
    try {
      // Verwende die dedizierte Funktion im Service, wenn vorhanden
      await finanzenService.markRechnungAsBezahlt(id);
      
      setRechnungen(rechnungen.map(rechnung => 
        rechnung.id === id 
          ? { ...rechnung, status: 'Bezahlt', zahlungsDatum: new Date() } 
          : rechnung
      ));
      
      // Aktualisiere Übersicht
      await updateUebersicht();
      
      toast.success('Rechnung wurde als bezahlt markiert!');
    } catch (err) {
      console.error('Fehler beim Markieren der Rechnung als bezahlt:', err);
      
      // Fallback, falls der API-Aufruf fehlschlägt - aktualisiere UI trotzdem
      setRechnungen(rechnungen.map(rechnung => 
        rechnung.id === id 
          ? { ...rechnung, status: 'Bezahlt', zahlungsDatum: new Date() } 
          : rechnung
      ));
      
      // Berechne aktualisierte Übersicht lokal
      const rechnung = rechnungen.find(r => r.id === id);
      if (rechnung && rechnung.status !== 'Bezahlt') {
        setUebersicht({
          ...uebersicht,
          offeneRechnungen: uebersicht.offeneRechnungen - rechnung.betrag,
          bezahlteRechnungen: uebersicht.bezahlteRechnungen + rechnung.betrag
        });
      }
      
      toast.success('Rechnung wurde als bezahlt markiert!');
    }
  };
  
  // Angebot-Status ändern
  const handleAngebotStatusAendern = async (id, newStatus) => {
    try {
      const angebot = angebote.find(a => a.id === id);
      const updateData = {
        ...angebot,
        status: newStatus
      };
      
      // API-Aufruf
      await finanzenService.updateAngebot(id, updateData);
      
      setAngebote(angebote.map(a => 
        a.id === id ? { ...a, status: newStatus } : a
      ));
      
      // Aktualisiere Übersicht
      await updateUebersicht();
      
      toast.success(`Angebot wurde als ${newStatus} markiert!`);
    } catch (err) {
      console.error('Fehler beim Ändern des Angebotsstatus:', err);
      
      // Fallback: UI trotzdem aktualisieren
      setAngebote(angebote.map(a => 
        a.id === id ? { ...a, status: newStatus } : a
      ));
      
      // Lokale Berechnung für die Übersicht, wenn der API-Aufruf fehlschlägt
      const angebot = angebote.find(a => a.id === id);
      if (angebot && angebot.status === 'Offen' && newStatus !== 'Offen') {
        setUebersicht({
          ...uebersicht,
          offeneAngebote: uebersicht.offeneAngebote - angebot.betrag
        });
      } else if (angebot && angebot.status !== 'Offen' && newStatus === 'Offen') {
        setUebersicht({
          ...uebersicht,
          offeneAngebote: uebersicht.offeneAngebote + angebot.betrag
        });
      }
      
      toast.success(`Angebot wurde als ${newStatus} markiert!`);
    }
  };
  
  // Hilfsfunktion zum Aktualisieren der Übersicht
  const updateUebersicht = async () => {
    try {
      // Für die Zukunft, wenn der API-Endpunkt implementiert ist:
      // const response = await finanzenService.getUebersicht();
      // setUebersicht(response.data);
      
      // Bis dahin berechnen wir die Übersicht manuell basierend auf den lokalen Daten
      const offeneAngebote = angebote
        .filter(a => a.status === 'Offen')
        .reduce((sum, a) => sum + a.betrag, 0);
      
      const offeneRechnungen = rechnungen
        .filter(r => r.status !== 'Bezahlt')
        .reduce((sum, r) => sum + r.betrag, 0);
      
      const bezahlteRechnungen = rechnungen
        .filter(r => r.status === 'Bezahlt')
        .reduce((sum, r) => sum + r.betrag, 0);
      
      const umsatzGesamt = offeneRechnungen + bezahlteRechnungen;
      
      const kostenGesamt = projektkosten
        .reduce((sum, p) => sum + p.gesamt, 0);
      
      const gewinn = umsatzGesamt - kostenGesamt;
      
      setUebersicht({
        umsatzGesamt,
        offeneRechnungen,
        bezahlteRechnungen,
        offeneAngebote,
        kostenGesamt,
        gewinn
      });
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Finanzübersicht:', err);
    }
  };
  
  // PDF-Download-Funktionen
  const handleAngebotPDFDownload = async (id) => {
    try {
      // Diese Funktion muss noch im Backend implementiert werden
      // await finanzenService.downloadAngebotPDF(id);
      toast.success('PDF wird heruntergeladen');
      
      // Vorübergehender Mock für den Download
      setTimeout(() => {
        const angebot = angebote.find(a => a.id === id);
        if (angebot) {
          alert(`PDF für Angebot ${angebot.nummer} (${angebot.kunde}) würde jetzt heruntergeladen werden.`);
        }
      }, 1000);
    } catch (err) {
      console.error('Fehler beim Herunterladen des PDFs:', err);
      toast.error('Fehler beim Herunterladen des PDFs');
    }
  };
  
  const handleRechnungPDFDownload = async (id) => {
    try {
      // Diese Funktion muss noch im Backend implementiert werden
      // await finanzenService.downloadRechnungPDF(id);
      toast.success('PDF wird heruntergeladen');
      
      // Vorübergehender Mock für den Download
      setTimeout(() => {
        const rechnung = rechnungen.find(r => r.id === id);
        if (rechnung) {
          alert(`PDF für Rechnung ${rechnung.nummer} (${rechnung.kunde}) würde jetzt heruntergeladen werden.`);
        }
      }, 1000);
    } catch (err) {
      console.error('Fehler beim Herunterladen des PDFs:', err);
      toast.error('Fehler beim Herunterladen des PDFs');
    }
  };
  
  const handleKostenReportDownload = async () => {
    try {
      // Diese Funktion muss noch im Backend implementiert werden
      // await finanzenService.downloadKostenReport();
      toast.success('Kostenbericht wird generiert und heruntergeladen');
      
      // Vorübergehender Mock für den Download
      setTimeout(() => {
        alert('Der Projektkostenbericht würde jetzt heruntergeladen werden.');
      }, 1000);
    } catch (err) {
      console.error('Fehler beim Generieren des Reports:', err);
      toast.error('Fehler beim Generieren des Reports');
    }
  };// Rendere die Finanzübersicht
  const renderUebersicht = () => {
    if (loading.uebersicht) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (error.uebersicht) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <p>{error.uebersicht}</p>
          <p className="text-sm mt-2">Bitte versuchen Sie, die Seite neu zu laden.</p>
        </div>
      );
    }
    
    return (
      <div>
        {/* Finanzüberblick */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border shadow">
            <div className="flex items-center mb-2">
              <DollarSign className="w-5 h-5 text-green-500 mr-2" />
              <h3 className="text-gray-700 font-medium">Gesamtumsatz</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{uebersicht.umsatzGesamt.toLocaleString('de-DE')} €</p>
            <div className="flex justify-between items-center mt-2 text-sm">
              <div>
                <span className="text-gray-500">Bezahlt:</span>
                <span className="ml-1 text-green-600 font-medium">{uebersicht.bezahlteRechnungen.toLocaleString('de-DE')} €</span>
              </div>
              <div>
                <span className="text-gray-500">Offen:</span>
                <span className="ml-1 text-blue-600 font-medium">{uebersicht.offeneRechnungen.toLocaleString('de-DE')} €</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow">
            <div className="flex items-center mb-2">
              <FileText className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="text-gray-700 font-medium">Offene Angebote</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{uebersicht.offeneAngebote.toLocaleString('de-DE')} €</p>
            <div className="mt-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Angebote:</span>
                <span className="text-blue-600 font-medium">{angebote.filter(a => a.status === 'Offen').length}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
              <h3 className="text-gray-700 font-medium">Gewinn</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{uebersicht.gewinn.toLocaleString('de-DE')} €</p>
            <div className="mt-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Marge:</span>
                <span className="text-purple-600 font-medium">
                  {uebersicht.umsatzGesamt > 0 
                    ? Math.round((uebersicht.gewinn / uebersicht.umsatzGesamt) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg border shadow">
            <h3 className="text-gray-700 font-medium mb-4">Umsatzentwicklung</h3>
            {monatlicheUmsaetze.length > 0 ? (
              <div className="h-64 flex items-end justify-between px-2">
                {monatlicheUmsaetze.map((monat, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="flex flex-col items-center space-y-1">
                      <div 
                        className="w-10 bg-blue-500 rounded-t"
                        style={{ height: `${(monat.umsatz / Math.max(...monatlicheUmsaetze.map(m => m.umsatz))) * 200}px` }}
                      ></div>
                      <div 
                        className="w-10 bg-red-400 rounded-t"
                        style={{ height: `${(monat.kosten / Math.max(...monatlicheUmsaetze.map(m => m.umsatz))) * 200}px` }}
                      ></div>
                    </div>
                    <div className="text-xs mt-2">{monat.monat}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-400">
                Keine Daten verfügbar
              </div>
            )}
            <div className="flex justify-center mt-4">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                <span className="text-xs text-gray-600">Umsatz</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded mr-1"></div>
                <span className="text-xs text-gray-600">Kosten</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow">
            <h3 className="text-gray-700 font-medium mb-4">Kostenverteilung</h3>
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                {/* Vereinfachtes Pie-Chart */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Personal: 55% */}
                  <path 
                    d="M 50 50 L 50 0 A 50 50 0 0 1 93.3 75 Z" 
                    fill="#3b82f6" 
                  />
                  {/* Material: 20% */}
                  <path 
                    d="M 50 50 L 93.3 75 A 50 50 0 0 1 28.7 96.6 Z" 
                    fill="#ef4444" 
                  />
                  {/* Fahrzeuge: 15% */}
                  <path 
                    d="M 50 50 L 28.7 96.6 A 50 50 0 0 1 6.7 25 Z" 
                    fill="#10b981" 
                  />
                  {/* Sonstiges: 10% */}
                  <path 
                    d="M 50 50 L 6.7 25 A 50 50 0 0 1 50 0 Z" 
                    fill="#f59e0b" 
                  />
                </svg>
              </div>
            </div>
            <div className="flex flex-wrap justify-center mt-4">
              <div className="flex items-center mx-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                <span className="text-xs text-gray-600">Personal (55%)</span>
              </div>
              <div className="flex items-center mx-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                <span className="text-xs text-gray-600">Material (20%)</span>
              </div>
              <div className="flex items-center mx-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                <span className="text-xs text-gray-600">Fahrzeuge (15%)</span>
              </div>
              <div className="flex items-center mx-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
                <span className="text-xs text-gray-600">Sonstiges (10%)</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Neueste Finanztransaktionen */}
        <div className="bg-white p-4 rounded-lg border shadow mb-6">
          <h3 className="text-gray-700 font-medium mb-4">Neueste Transaktionen</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nummer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[...rechnungen, ...angebote.map(a => ({...a, typ: 'Angebot' }))].sort((a, b) => b.datum - a.datum).slice(0, 5).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      {item.typ || 'Rechnung'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      {item.nummer}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      {item.kunde}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      {formatieresDatum(item.datum)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                      {item.betrag.toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1">{item.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {[...rechnungen, ...angebote].length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                      Keine Transaktionen vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };// Rendere die Angebote
  const renderAngebote = () => {
    if (loading.angebote) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (error.angebote) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <p>{error.angebote}</p>
          <p className="text-sm mt-2">Bitte versuchen Sie, die Seite neu zu laden.</p>
        </div>
      );
    }
    
    return (
      <div>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Angebote</h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input 
                type="text"
                value={suchbegriff}
                onChange={(e) => setSuchbegriff(e.target.value)}
                className="pl-8 pr-2 py-1 border border-gray-300 rounded-md"
                placeholder="Suchen..."
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            <select
              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              value={selectedAngebotsfilter}
              onChange={(e) => setSelectedAngebotsfilter(e.target.value)}
            >
              <option value="Alle">Alle Status</option>
              <option value="Offen">Offen</option>
              <option value="Angenommen">Angenommen</option>
              <option value="Abgelehnt">Abgelehnt</option>
            </select>
            
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
              onClick={() => {
                setCurrentAngebot(null);
                setShowAngebotModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Neues Angebot
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortierung({
                      feld: 'nummer',
                      richtung: sortierung.feld === 'nummer' && sortierung.richtung === 'aufsteigend' ? 'absteigend' : 'aufsteigend'
                    })}
                  >
                    Angebotsnummer
                    {sortierung.feld === 'nummer' && (
                      <span className="ml-1">
                        {sortierung.richtung === 'aufsteigend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortierung({
                      feld: 'kunde',
                      richtung: sortierung.feld === 'kunde' && sortierung.richtung === 'aufsteigend' ? 'absteigend' : 'aufsteigend'
                    })}
                  >
                    Kunde
                    {sortierung.feld === 'kunde' && (
                      <span className="ml-1">
                        {sortierung.richtung === 'aufsteigend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortierung({
                      feld: 'datum',
                      richtung: sortierung.feld === 'datum' && sortierung.richtung === 'aufsteigend' ? 'absteigend' : 'aufsteigend'
                    })}
                  >
                    Datum
                    {sortierung.feld === 'datum' && (
                      <span className="ml-1">
                        {sortierung.richtung === 'aufsteigend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gültig bis
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Umzugsdatum
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortierung({
                      feld: 'betrag',
                      richtung: sortierung.feld === 'betrag' && sortierung.richtung === 'aufsteigend' ? 'absteigend' : 'aufsteigend'
                    })}
                  >
                    Betrag
                    {sortierung.feld === 'betrag' && (
                      <span className="ml-1">
                        {sortierung.richtung === 'aufsteigend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gefilerteAngebote.map(angebot => (
                  <tr key={angebot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {angebot.nummer}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                      {angebot.kunde}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatieresDatum(angebot.datum)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatieresDatum(angebot.gueltigBis)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatieresDatum(angebot.umzugsDatum)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {angebot.betrag.toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(angebot.status)}`}>
                        {getStatusIcon(angebot.status)}
                        <span className="ml-1">{angebot.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex space-x-2">
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="PDF herunterladen"
                          onClick={() => handleAngebotPDFDownload(angebot.id)}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Bearbeiten"
                          onClick={() => {
                            setCurrentAngebot(angebot);
                            setShowAngebotModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {angebot.status === 'Offen' && (
                          <button 
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Als Angenommen markieren"
                            onClick={() => handleAngebotStatusAendern(angebot.id, 'Angenommen')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {gefilerteAngebote.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                      {angebote.length === 0 ? 'Keine Angebote vorhanden' : 'Keine Angebote mit den aktuellen Filterkriterien gefunden'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };// Rendere die Rechnungen
  const renderRechnungen = () => {
    if (loading.rechnungen) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (error.rechnungen) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <p>{error.rechnungen}</p>
          <p className="text-sm mt-2">Bitte versuchen Sie, die Seite neu zu laden.</p>
        </div>
      );
    }
    
    return (
      <div>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Rechnungen</h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input 
                type="text"
                value={suchbegriff}
                onChange={(e) => setSuchbegriff(e.target.value)}
                className="pl-8 pr-2 py-1 border border-gray-300 rounded-md"
                placeholder="Suchen..."
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            <select
              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              value={selectedRechnungsfilter}
              onChange={(e) => setSelectedRechnungsfilter(e.target.value)}
            >
              <option value="Alle">Alle Status</option>
              <option value="Offen">Offen</option>
              <option value="Bezahlt">Bezahlt</option>
              <option value="Überfällig">Überfällig</option>
            </select>
            
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
              onClick={() => {
                setCurrentRechnung(null);
                setShowRechnungModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Neue Rechnung
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortierung({
                      feld: 'nummer',
                      richtung: sortierung.feld === 'nummer' && sortierung.richtung === 'aufsteigend' ? 'absteigend' : 'aufsteigend'
                    })}
                  >
                    Rechnungsnummer
                    {sortierung.feld === 'nummer' && (
                      <span className="ml-1">
                        {sortierung.richtung === 'aufsteigend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortierung({
                      feld: 'kunde',
                      richtung: sortierung.feld === 'kunde' && sortierung.richtung === 'aufsteigend' ? 'absteigend' : 'aufsteigend'
                    })}
                  >
                    Kunde
                    {sortierung.feld === 'kunde' && (
                      <span className="ml-1">
                        {sortierung.richtung === 'aufsteigend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortierung({
                      feld: 'datum',
                      richtung: sortierung.feld === 'datum' && sortierung.richtung === 'aufsteigend' ? 'absteigend' : 'aufsteigend'
                    })}
                  >
                    Datum
                    {sortierung.feld === 'datum' && (
                      <span className="ml-1">
                        {sortierung.richtung === 'aufsteigend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fälligkeit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zahlungsdatum
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => setSortierung({
                      feld: 'betrag',
                      richtung: sortierung.feld === 'betrag' && sortierung.richtung === 'aufsteigend' ? 'absteigend' : 'aufsteigend'
                    })}
                  >
                    Betrag
                    {sortierung.feld === 'betrag' && (
                      <span className="ml-1">
                        {sortierung.richtung === 'aufsteigend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gefilerteRechnungen.map(rechnung => (
                  <tr key={rechnung.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {rechnung.nummer}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                      {rechnung.kunde}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatieresDatum(rechnung.datum)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatieresDatum(rechnung.faelligkeitsDatum)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {rechnung.zahlungsDatum ? formatieresDatum(rechnung.zahlungsDatum) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {rechnung.betrag.toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(rechnung.status)}`}>
                        {getStatusIcon(rechnung.status)}
                        <span className="ml-1">{rechnung.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex space-x-2">
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="PDF herunterladen"
                          onClick={() => handleRechnungPDFDownload(rechnung.id)}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Bearbeiten"
                          onClick={() => {
                            setCurrentRechnung(rechnung);
                            setShowRechnungModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {(rechnung.status === 'Offen' || rechnung.status === 'Überfällig') && (
                          <button 
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Als bezahlt markieren"
                            onClick={() => handleRechnungAlsBezahltMarkieren(rechnung.id)}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {gefilerteRechnungen.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                      {rechnungen.length === 0 ? 'Keine Rechnungen vorhanden' : 'Keine Rechnungen mit den aktuellen Filterkriterien gefunden'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };// Rendere die Projektkostenanalyse
  const renderProjektkosten = () => {
    if (loading.projektkosten) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (error.projektkosten) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <p>{error.projektkosten}</p>
          <p className="text-sm mt-2">Bitte versuchen Sie, die Seite neu zu laden.</p>
        </div>
      );
    }
    
    return (
      <div>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Projektkostenanalyse</h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input 
                type="text"
                value={suchbegriff}
                onChange={(e) => setSuchbegriff(e.target.value)}
                className="pl-8 pr-2 py-1 border border-gray-300 rounded-md"
                placeholder="Projekt suchen..."
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
              onClick={() => {
                setCurrentKosten(null);
                setShowKostenModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Neue Kostenerfassung
            </button>
            
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
              onClick={handleKostenReportDownload}
            >
              <FileText className="w-4 h-4 mr-1" />
              Report generieren
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projekt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personalkosten
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Materialkosten
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fahrzeugkosten
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sonstige
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gesamtkosten
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ertrag
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marge
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projektkosten
                  .filter(projekt => 
                    !suchbegriff || 
                    projekt.projekt.toLowerCase().includes(suchbegriff.toLowerCase())
                  )
                  .map(projekt => (
                  <tr key={projekt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                      {projekt.projekt}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {projekt.personalkosten.toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {projekt.materialkosten.toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {projekt.fahrzeugkosten.toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {projekt.sonstige.toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {projekt.gesamt.toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                      {projekt.ertrag.toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className={`font-medium ${projekt.marge > 25 ? 'text-green-600' : projekt.marge > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {projekt.marge}%
                        </span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${projekt.marge > 25 ? 'bg-green-500' : projekt.marge > 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, projekt.marge * 2)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex space-x-2">
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Bearbeiten"
                          onClick={() => {
                            setCurrentKosten(projekt);
                            setShowKostenModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {projektkosten.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-4 py-4 text-center text-gray-500">
                      Keine Projektkosten vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
              {projektkosten.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                      Gesamt
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {projektkosten.reduce((sum, p) => sum + p.personalkosten, 0).toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {projektkosten.reduce((sum, p) => sum + p.materialkosten, 0).toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {projektkosten.reduce((sum, p) => sum + p.fahrzeugkosten, 0).toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {projektkosten.reduce((sum, p) => sum + p.sonstige, 0).toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {projektkosten.reduce((sum, p) => sum + p.gesamt, 0).toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                      {projektkosten.reduce((sum, p) => sum + p.ertrag, 0).toLocaleString('de-DE')} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {projektkosten.length > 0 
                        ? Math.round(
                            (projektkosten.reduce((sum, p) => sum + p.ertrag, 0) / 
                            projektkosten.reduce((sum, p) => sum + p.gesamt, 0)) * 100
                          )
                        : 0}%
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border shadow">
            <h3 className="text-gray-700 font-medium mb-4">Kostenverteilung nach Projekttyp</h3>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Umzug (Privatkunden)</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Umzug (Geschäftskunden)</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Einlagerung</span>
                      <span className="font-medium">10%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow">
            <h3 className="text-gray-700 font-medium mb-4">Profitabilität nach Projektgröße</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Projektgröße</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Durchschn. Umsatz</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Durchschn. Marge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-700">Klein (&lt; 1.000 €)</td>
                    <td className="px-4 py-2 text-sm text-gray-700">850 €</td>
                    <td className="px-4 py-2 text-sm font-medium text-green-600">32%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-700">Mittel (1.000 - 3.000 €)</td>
                    <td className="px-4 py-2 text-sm text-gray-700">1.950 €</td>
                    <td className="px-4 py-2 text-sm font-medium text-green-600">28%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm text-gray-700">Groß (&gt; 3.000 €)</td>
                    <td className="px-4 py-2 text-sm text-gray-700">4.250 €</td>
                    <td className="px-4 py-2 text-sm font-medium text-yellow-600">22%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };// Hauptkomponente rendern
  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Finanzverwaltung</h1>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap border-b">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              aktiverTab === 'uebersicht' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setAktiverTab('uebersicht')}
          >
            <div className="flex items-center">
              <BarChart2 className="w-4 h-4 mr-2" />
              Übersicht
            </div>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm ${
              aktiverTab === 'angebote' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setAktiverTab('angebote')}
          >
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Angebote
            </div>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm ${
              aktiverTab === 'rechnungen' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setAktiverTab('rechnungen')}
          >
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Rechnungen
            </div>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm ${
              aktiverTab === 'projektkosten' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setAktiverTab('projektkosten')}
          >
            <div className="flex items-center">
              <PieChart className="w-4 h-4 mr-2" />
              Projektkosten
            </div>
          </button>
        </div>
      </div>
      
      {/* Tab-Inhalte */}
      {aktiverTab === 'uebersicht' && renderUebersicht()}
      {aktiverTab === 'angebote' && renderAngebote()}
      {aktiverTab === 'rechnungen' && renderRechnungen()}
      {aktiverTab === 'projektkosten' && renderProjektkosten()}
      
      {/* Modals */}
      <Modal
        isOpen={showAngebotModal}
        onClose={() => setShowAngebotModal(false)}
        title={currentAngebot ? "Angebot bearbeiten" : "Neues Angebot erstellen"}
        size="lg"
      >
        <AngebotForm
          bestehendesAngebot={currentAngebot}
          onSave={handleSaveAngebot}
          onCancel={() => setShowAngebotModal(false)}
        />
      </Modal>
      
      <Modal
        isOpen={showRechnungModal}
        onClose={() => setShowRechnungModal(false)}
        title={currentRechnung ? "Rechnung bearbeiten" : "Neue Rechnung erstellen"}
        size="lg"
      >
        <RechnungForm
          bestehendeRechnung={currentRechnung}
          angebote={angebote}
          onSave={handleSaveRechnung}
          onCancel={() => setShowRechnungModal(false)}
        />
      </Modal>
      
      <Modal
        isOpen={showKostenModal}
        onClose={() => setShowKostenModal(false)}
        title={currentKosten ? "Projektkosten bearbeiten" : "Neue Projektkosten erfassen"}
        size="lg"
      >
        <ProjektkostenForm
          bestehendeKosten={currentKosten}
          umzugsprojekte={umzugsprojekte}
          onSave={handleSaveKosten}
          onCancel={() => setShowKostenModal(false)}
        />
      </Modal>
    </div>
  );
}
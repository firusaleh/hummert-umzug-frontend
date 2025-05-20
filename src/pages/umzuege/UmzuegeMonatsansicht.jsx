import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Truck, User, Phone, MapPin, Search, Check, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { umzuegeService } from '../../services/api'; // API-Service importieren
import { extractApiData, ensureArray } from '../../utils/apiUtils';
import { toast } from 'react-toastify';

export default function UmzuegeMonatsansicht() {
  // Navigation-Hook für Routing
  const navigate = useNavigate();
  
  // Aktuelles Datum und Jahr
  const [/* aktuellesDatum */, /* setAktuellesDatum */] = useState(new Date());
  const [aktuellesJahr, setAktuellesJahr] = useState(new Date().getFullYear());
  
  // State für die verschiedenen Ansichten
  const [ansicht, setAnsicht] = useState('monatsuebersicht'); // 'monatsuebersicht', 'monatsdetails', 'umzugsdetails'
  const [ausgewaehlterMonat, setAusgewaehlterMonat] = useState(new Date().getMonth());
  const [ausgewaehlterUmzug, setAusgewaehlterUmzug] = useState(null);
  
  // Filter State
  const [suchbegriff, setSuchbegriff] = useState('');
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [kategorieFilter, setKategorieFilter] = useState('Alle');
  
  // Umzüge aus API laden
  const [umzuege, setUmzuege] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // API-Status auf Frontend-Status mappen
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
  
  // Daten aus API laden
  useEffect(() => {
    // Hilfsfunktion zum Transformieren der Umzugsdaten
    const transformUmzug = (umzug) => {
      // Fallback-Werte für den Fall, dass Daten fehlen
      const auftraggeber = umzug.auftraggeber || { name: 'Unbekannt', telefon: 'N/A', email: 'N/A' };
      const auszugsadresse = umzug.auszugsadresse || { 
        strasse: 'Unbekannt', hausnummer: '', plz: '', ort: '', etage: 0, aufzug: false
      };
      const einzugsadresse = umzug.einzugsadresse || { 
        strasse: 'Unbekannt', hausnummer: '', plz: '', ort: '', etage: 0, aufzug: false
      };
      
      return {
        id: umzug._id || umzug.id || Date.now().toString(),
        kunde: auftraggeber.name,
        telefon: auftraggeber.telefon,
        email: auftraggeber.email,
        kategorie: umzug.typ || 'Privatumzug',
        von: `${auszugsadresse.strasse} ${auszugsadresse.hausnummer}, ${auszugsadresse.plz} ${auszugsadresse.ort}`,
        nach: `${einzugsadresse.strasse} ${einzugsadresse.hausnummer}, ${einzugsadresse.plz} ${einzugsadresse.ort}`,
        datum: new Date(umzug.startDatum || umzug.datum || new Date()),
        uhrzeit: umzug.startDatum 
          ? `${new Date(umzug.startDatum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - ${umzug.endDatum ? new Date(umzug.endDatum).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}`
          : '08:00 - 16:00',
        mitarbeiter: (umzug.mitarbeiter?.map(m => m.mitarbeiterId?.vorname || m.name || 'Unbekannt') || []),
        fahrzeuge: (umzug.fahrzeuge?.map(f => f.kennzeichen || f.typ || 'Fahrzeug') || []),
        status: mapAPIStatus(umzug.status),
        volumen: `${umzug.volumen || 0} m³`,
        preis: umzug.preis?.brutto || umzug.preis || 0,
        notizen: umzug.notizen || '',
        materialien: umzug.materialien || 'Standard-Umzugsset'
      };
    };
    
    const fetchUmzuege = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // API-Aufruf mit Standardisierter Fehlerbehandlung
        const response = await umzuegeService.getAll();
        const umzuegeData = extractApiData(response);
        
        if (!umzuegeData) {
          throw new Error('Keine gültigen Umzugsdaten erhalten');
        }
        
        // API-Daten extrahieren und validieren
        const umzuegeListe = ensureArray(umzuegeData.umzuege || umzuegeData);
        
        // Daten protokollieren (nur für Entwicklungszwecke)
        if (process.env.NODE_ENV !== 'production') {
          console.log('Geladene Umzüge:', umzuegeListe.length);
        }
        
        // Keine Verwendung von Mock-Daten mehr - Nur noch echte API-Daten
        // API-Daten in das Format transformieren, das von der Komponente verwendet wird
        const transformierteUmzuege = umzuegeListe.map(umzug => transformUmzug(umzug));
        
        setUmzuege(transformierteUmzuege);
        setLoading(false);
      } catch (error) {
        console.error('Fehler beim Laden der Umzüge:', error);
        setError(`Fehler beim Laden der Umzüge: ${error.message || 'Unbekannter Fehler'}`);
        toast.error('Die Umzugsdaten konnten nicht geladen werden.');
        
        // Leere Liste setzen anstelle von Mock-Daten
        setUmzuege([]);
        setLoading(false);
      }
    };
    
    fetchUmzuege();
  }, []);
  
  // Mock-Daten wurden entfernt - es werden nur noch echte API-Daten verwendet
  
  // Erhalte alle Monate mit Umzügen für das ausgewählte Jahr
  const getMonatsUebersicht = () => {
    // Array mit 12 Einträgen (0 = Januar, 11 = Dezember)
    const monatsUebersicht = Array(12).fill(0);
    
    umzuege.forEach(umzug => {
      if (umzug.datum.getFullYear() === aktuellesJahr) {
        const monat = umzug.datum.getMonth();
        monatsUebersicht[monat]++;
      }
    });
    
    return monatsUebersicht;
  };
  
  // Erhalte alle Umzüge für einen bestimmten Monat im ausgewählten Jahr
  const getUmzuegeImMonat = (monat) => {
    return umzuege.filter(umzug => 
      umzug.datum.getFullYear() === aktuellesJahr && 
      umzug.datum.getMonth() === monat
    ).sort((a, b) => a.datum - b.datum);
  };
  
  // Gefilterte Umzüge für die Detailansicht
  const getGefilterte = () => {
    let gefiltert = getUmzuegeImMonat(ausgewaehlterMonat);
    
    // Nach Status filtern
    if (statusFilter !== 'Alle') {
      gefiltert = gefiltert.filter(umzug => umzug.status === statusFilter);
    }
    
    // Nach Kategorie filtern
    if (kategorieFilter !== 'Alle') {
      gefiltert = gefiltert.filter(umzug => umzug.kategorie === kategorieFilter);
    }
    
    // Nach Suchbegriff filtern
    if (suchbegriff) {
      gefiltert = gefiltert.filter(umzug => 
        umzug.kunde.toLowerCase().includes(suchbegriff.toLowerCase()) ||
        umzug.von.toLowerCase().includes(suchbegriff.toLowerCase()) ||
        umzug.nach.toLowerCase().includes(suchbegriff.toLowerCase())
      );
    }
    
    return gefiltert;
  };
  
  // Formatierung des Datums
  const formatieresDatum = (datum) => {
    return datum.toLocaleDateString('de-DE');
  };
  
  // Monatsnamen
  const monate = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  
  // Status Styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Geplant':
        return 'bg-blue-100 text-blue-800';
      case 'In Bearbeitung':
        return 'bg-yellow-100 text-yellow-800';
      case 'Abgeschlossen':
        return 'bg-green-100 text-green-800';
      case 'Storniert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Status Icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Geplant':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'In Bearbeitung':
        return <Truck className="w-4 h-4 text-yellow-600" />;
      case 'Abgeschlossen':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Storniert':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };
  
  // Jahr wechseln
  const jahrWechseln = (schritt) => {
    setAktuellesJahr(aktuellesJahr + schritt);
  };
  
  // Umzug löschen mit verbesserter Fehlerbehandlung
  const umzugLoeschen = async (id) => {
    if (window.confirm('Möchten Sie diesen Umzug wirklich löschen?')) {
      try {
        const response = await umzuegeService.delete(id);
        const deleteData = extractApiData(response);
        
        if (!deleteData && !deleteData.success) {
          throw new Error('Löschen fehlgeschlagen: Keine Bestätigung vom Server erhalten');
        }
        
        // UI aktualisieren
        setUmzuege(umzuege.filter(umzug => umzug.id !== id));
        
        if (ausgewaehlterUmzug && ausgewaehlterUmzug.id === id) {
          setAusgewaehlterUmzug(null);
          setAnsicht('monatsdetails');
        }
        
        // Erfolgsmeldung mit Toast statt Alert
        toast.success('Umzug erfolgreich gelöscht');
      } catch (error) {
        console.error('Fehler beim Löschen des Umzugs:', error);
        toast.error(`Fehler beim Löschen des Umzugs: ${error.message || 'Unbekannter Fehler'}`);
      }
    }
  };
  
  // Status aktualisieren mit verbesserter Fehlerbehandlung
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
        case 'Storniert':
          apiStatus = 'storniert';
          break;
        default:
          apiStatus = 'geplant';
      }
      
      // API-Aufruf zum Aktualisieren des Status
      const response = await umzuegeService.updateStatus(id, { status: apiStatus });
      const updatedData = extractApiData(response);
      
      if (!updatedData) {
        throw new Error('Keine Antwortdaten vom Server erhalten');
      }
      
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
      
      // Erfolgsmeldung mit Toast statt Alert
      toast.success(`Status erfolgreich auf "${neuerStatus}" aktualisiert`);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Status:', error);
      toast.error(`Fehler beim Aktualisieren des Status: ${error.message || 'Unbekannter Fehler'}`);
    }
  };
  
  // Statistische Werte für einen Monat
  const getMonatsstatistik = (monat) => {
    const umzuegeImMonat = getUmzuegeImMonat(monat);
    
    return {
      anzahl: umzuegeImMonat.length,
      abgeschlossen: umzuegeImMonat.filter(u => u.status === 'Abgeschlossen').length,
      privatumzuege: umzuegeImMonat.filter(u => u.kategorie === 'Privatumzug').length,
      firmenumzuege: umzuegeImMonat.filter(u => u.kategorie === 'Firmenumzug' || u.kategorie === 'Gewerbeverlegung').length,
      gesamtvolumen: umzuegeImMonat.reduce((sum, u) => {
        // Extrahiere die Zahl aus dem String (z.B. "35 m³" -> 35)
        const volumen = parseInt(u.volumen, 10) || 0;
        return sum + volumen;
      }, 0),
      umsatz: umzuegeImMonat.reduce((sum, u) => sum + u.preis, 0)
    };
  };
  
  // Render Funktion für die Monatsübersicht
  const renderMonatsuebersicht = () => {
    const monatsUebersicht = getMonatsUebersicht();
    const maxUmzuege = Math.max(...monatsUebersicht, 1); // Mindestens 1, um Division durch 0 zu vermeiden
    
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Fehler</p>
          <p>{error}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Seite neu laden
          </button>
        </div>
      );
    }
    
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button 
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => jahrWechseln(-1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold mx-4">{aktuellesJahr}</h2>
            <button 
              className="p-1 rounded hover:bg-gray-200"
              onClick={() => jahrWechseln(1)}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            onClick={() => navigate('/umzuege/neu')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Neuer Umzug
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monatsUebersicht.map((anzahl, index) => {
            const statistik = getMonatsstatistik(index);
            
            return (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${anzahl > 0 ? 'bg-white cursor-pointer hover:shadow-md' : 'bg-gray-50'}`}
                onClick={() => {
                  if (anzahl > 0) {
                    setAusgewaehlterMonat(index);
                    setAnsicht('monatsdetails');
                  }
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-lg">{monate[index]}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${anzahl > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {anzahl} Umzüge
                  </span>
                </div>
                
                {anzahl > 0 && (
                  <>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Privatumzüge:</span>
                        <span className="font-medium">{statistik.privatumzuege}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Firmenumzüge:</span>
                        <span className="font-medium">{statistik.firmenumzuege}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Abgeschlossen:</span>
                        <span className="font-medium">{statistik.abgeschlossen}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(anzahl / maxUmzuege) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Gesamtvolumen: {statistik.gesamtvolumen} m³</span>
                        <span>Umsatz: {statistik.umsatz.toLocaleString('de-DE')} €</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render Funktion für die Monatsdetails
  const renderMonatsdetails = () => {
    const gefiltert = getGefilterte();
    
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    return (
      <div>
        <div className="flex items-center mb-6">
          <button 
            className="p-1 rounded hover:bg-gray-200 mr-3"
            onClick={() => setAnsicht('monatsuebersicht')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">{monate[ausgewaehlterMonat]} {aktuellesJahr}</h2>
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {gefiltert.length} Umzüge
          </span>
        </div>
        
        {/* Filter */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-grow max-w-xs">
              <input 
                type="text"
                value={suchbegriff}
                onChange={(e) => setSuchbegriff(e.target.value)}
                className="pl-8 pr-2 py-1 w-full border border-gray-300 rounded-md"
                placeholder="Suchen..."
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="Alle">Alle</option>
                <option value="Geplant">Geplant</option>
                <option value="In Bearbeitung">In Bearbeitung</option>
                <option value="Abgeschlossen">Abgeschlossen</option>
                <option value="Storniert">Storniert</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Kategorie:</span>
              <select 
                value={kategorieFilter}
                onChange={(e) => setKategorieFilter(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="Alle">Alle</option>
                <option value="Privatumzug">Privatumzug</option>
                <option value="Firmenumzug">Firmenumzug</option>
                <option value="Gewerbeverlegung">Gewerbeverlegung</option>
              </select>
            </div>
            
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center ml-auto"
              onClick={() => navigate('/umzuege/neu')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Neuer Umzug
            </button>
          </div>
        </div>
        
        {/* Umzüge Liste */}
        {gefiltert.length > 0 ? (
          <div className="space-y-4">
            {gefiltert.map(umzug => (
              <div 
                key={umzug.id}
                className="p-4 bg-white rounded-lg border hover:shadow-md cursor-pointer"
                onClick={() => {
                  setAusgewaehlterUmzug(umzug);
                  setAnsicht('umzugsdetails');
                }}
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <h3 className="font-medium text-lg">{umzug.kunde}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatieresDatum(umzug.datum)}, {umzug.uhrzeit}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 inline-flex items-center rounded-full text-xs font-semibold ${getStatusStyle(umzug.status)}`}>
                      {getStatusIcon(umzug.status)}
                      <span className="ml-1">{umzug.status}</span>
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">
                      {umzug.kategorie}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-1 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">Von:</div>
                      <div className="text-sm">{umzug.von}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-1 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">Nach:</div>
                      <div className="text-sm">{umzug.nach}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap justify-between text-sm">
                  <div className="space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      <Truck className="w-3 h-3 mr-1" />
                      {umzug.fahrzeuge.length} Fahrzeug(e)
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700">
                      <User className="w-3 h-3 mr-1" />
                      {umzug.mitarbeiter.length} Mitarbeiter
                    </span>
                  </div>
                  
                  <div className="font-medium text-gray-700">
                    {umzug.volumen} - {umzug.preis.toLocaleString('de-DE')} €
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-md">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Keine Umzüge gefunden</h3>
            <p className="text-gray-500">
              Es wurden keine Umzüge gefunden, die den Filterkriterien entsprechen.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // Render Funktion für die Umzugsdetails
  const renderUmzugsdetails = () => {
    if (!ausgewaehlterUmzug) return null;
    
    return (
      <div>
        <div className="flex items-center mb-6">
          <button 
            className="p-1 rounded hover:bg-gray-200 mr-3"
            onClick={() => {
              setAusgewaehlterUmzug(null);
              setAnsicht('monatsdetails');
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">{ausgewaehlterUmzug.kunde}</h2>
          <span className={`ml-2 px-2 py-1 inline-flex items-center rounded-full text-xs font-semibold ${getStatusStyle(ausgewaehlterUmzug.status)}`}>
            {getStatusIcon(ausgewaehlterUmzug.status)}
            <span className="ml-1">{ausgewaehlterUmzug.status}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Hauptinformationen */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-800 mb-4">Umzugsinformationen</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Kategorie:</div>
                    <div>{ausgewaehlterUmzug.kategorie}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Datum & Uhrzeit:</div>
                    <div>{formatieresDatum(ausgewaehlterUmzug.datum)}, {ausgewaehlterUmzug.uhrzeit}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Umzugsvolumen:</div>
                    <div>{ausgewaehlterUmzug.volumen}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Von:</div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                      {ausgewaehlterUmzug.von}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Nach:</div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                      {ausgewaehlterUmzug.nach}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Preis:</div>
                    <div className="font-medium">{ausgewaehlterUmzug.preis.toLocaleString('de-DE')} €</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm text-gray-600">Notizen:</div>
                <div className="p-2 bg-gray-50 rounded mt-1">
                  {ausgewaehlterUmzug.notizen || 'Keine Notizen vorhanden'}
                </div>
              </div>
            </div>
            
            {/* Ressourcen */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-800 mb-4">Ressourcen</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Zugewiesene Mitarbeiter:</div>
                  <div className="space-y-2">
                    {ausgewaehlterUmzug.mitarbeiter.length > 0 ? (
                      ausgewaehlterUmzug.mitarbeiter.map((mitarbeiter, index) => (
                        <div key={index} className="flex items-center px-2 py-1 bg-gray-50 rounded">
                          <User className="w-4 h-4 mr-2 text-blue-500" />
                          {mitarbeiter}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">Keine Mitarbeiter zugewiesen</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">Zugewiesene Fahrzeuge:</div>
                  <div className="space-y-2">
                    {ausgewaehlterUmzug.fahrzeuge.length > 0 ? (
                      ausgewaehlterUmzug.fahrzeuge.map((fahrzeug, index) => (
                        <div key={index} className="flex items-center px-2 py-1 bg-gray-50 rounded">
                          <Truck className="w-4 h-4 mr-2 text-green-500" />
                          {fahrzeug}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">Keine Fahrzeuge zugewiesen</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Benötigte Materialien:</div>
                <div className="p-2 bg-gray-50 rounded">
                  {ausgewaehlterUmzug.materialien}
                </div>
              </div>
            </div>
          </div>
          
          {/* Kundendaten und Aktionen */}
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-800 mb-4">Kundendaten</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Kunde:</div>
                  <div className="font-medium">{ausgewaehlterUmzug.kunde}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Telefon:</div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1 text-gray-500" />
                    <a href={`tel:${ausgewaehlterUmzug.telefon}`} className="text-blue-600 hover:underline">
                      {ausgewaehlterUmzug.telefon}
                    </a>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">E-Mail:</div>
                  <div>
                    <a href={`mailto:${ausgewaehlterUmzug.email}`} className="text-blue-600 hover:underline">
                      {ausgewaehlterUmzug.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-800 mb-4">Aktionen</h3>
              
              <div className="space-y-2">
                <button 
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                  onClick={() => navigate(`/umzuege/${ausgewaehlterUmzug.id}/bearbeiten`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Umzug bearbeiten
                </button>
                
                <button 
                  className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center justify-center"
                  onClick={() => {
                    // Hier würde normalerweise das Dokument generiert
                    alert(`Umzugsauftrag für ${ausgewaehlterUmzug.kunde} drucken`);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Umzugsauftrag drucken
                </button>
                
                {ausgewaehlterUmzug.status === 'Geplant' && (
                  <button 
                    className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
                    onClick={() => updateUmzugStatus(ausgewaehlterUmzug.id, 'In Bearbeitung')}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Umzug starten
                  </button>
                )}
                
                {ausgewaehlterUmzug.status === 'In Bearbeitung' && (
                  <button 
                    className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
                    onClick={() => updateUmzugStatus(ausgewaehlterUmzug.id, 'Abgeschlossen')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Umzug abschließen
                  </button>
                )}
                
                {(ausgewaehlterUmzug.status === 'Geplant' || ausgewaehlterUmzug.status === 'In Bearbeitung') && (
                  <button 
                    className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center justify-center"
                    onClick={() => updateUmzugStatus(ausgewaehlterUmzug.id, 'Storniert')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Umzug stornieren
                  </button>
                )}
                
                <button 
                  className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                  onClick={() => umzugLoeschen(ausgewaehlterUmzug.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Umzug löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Umzüge nach Monaten</h1>
      
      {ansicht === 'monatsuebersicht' && renderMonatsuebersicht()}
      {ansicht === 'monatsdetails' && renderMonatsdetails()}
      {ansicht === 'umzugsdetails' && renderUmzugsdetails()}
    </div>
  );
}
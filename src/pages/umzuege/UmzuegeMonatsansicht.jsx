import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import hinzugefügt
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Eye, Truck, User, Phone, MapPin, Filter, Search, Check, Clock, AlertTriangle, Home, CheckCircle, XCircle, FileText } from 'lucide-react';

export default function UmzuegeMonatsansicht() {
  // Navigation-Hook für Routing
  const navigate = useNavigate(); // Hook hinzugefügt
  
  // Aktuelles Datum und Jahr
  const [aktuellesDatum, setAktuellesDatum] = useState(new Date());
  const [aktuellesJahr, setAktuellesJahr] = useState(new Date().getFullYear());
  
  // State für die verschiedenen Ansichten
  const [ansicht, setAnsicht] = useState('monatsuebersicht'); // 'monatsuebersicht', 'monatsdetails', 'umzugsdetails'
  const [ausgewaehlterMonat, setAusgewaehlterMonat] = useState(new Date().getMonth());
  const [ausgewaehlterUmzug, setAusgewaehlterUmzug] = useState(null);
  
  // Filter State
  const [suchbegriff, setSuchbegriff] = useState('');
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [kategorieFilter, setKategorieFilter] = useState('Alle');
  
  // Demo-Daten für Umzüge
  const [umzuege, setUmzuege] = useState([
    {
      id: 1,
      kunde: 'Familie Müller',
      telefon: '0123-4567890',
      email: 'mueller@beispiel.de',
      kategorie: 'Privatumzug',
      von: 'Bahnhofstraße 12, München',
      nach: 'Kirchweg 3, Augsburg',
      datum: new Date(2025, 4, 10), // 10. Mai 2025
      uhrzeit: '08:00 - 16:00',
      mitarbeiter: ['Max', 'Anna', 'Peter'],
      fahrzeuge: ['LKW-01'],
      status: 'Geplant',
      volumen: '35 m³',
      preis: 1850,
      notizen: 'Klavier im 3. Stock ohne Aufzug',
      materialien: 'Standard-Umzugsset + Klavertransport-Set'
    },
    {
      id: 2,
      kunde: 'Herr Schmidt',
      telefon: '0123-9876543',
      email: 'schmidt@beispiel.de',
      kategorie: 'Privatumzug',
      von: 'Goethestraße 45, München',
      nach: 'Breslauer Str. 67, München',
      datum: new Date(2025, 4, 12), // 12. Mai 2025
      uhrzeit: '09:00 - 14:00',
      mitarbeiter: ['Thomas', 'Michael'],
      fahrzeuge: ['LKW-02'],
      status: 'Geplant',
      volumen: '18 m³',
      preis: 980,
      notizen: 'Parkplatzreservierung bestätigt',
      materialien: 'Standard-Umzugsset'
    },
    {
      id: 3,
      kunde: 'Frau Weber',
      telefon: '0123-1234567',
      email: 'weber@beispiel.de',
      kategorie: 'Privatumzug',
      von: 'Karlstraße 10, Freising',
      nach: 'Amselweg 23, München',
      datum: new Date(2025, 4, 15), // 15. Mai 2025
      uhrzeit: '10:00 - 17:00',
      mitarbeiter: ['Max', 'Paul'],
      fahrzeuge: ['LKW-03'],
      status: 'Geplant',
      volumen: '42 m³',
      preis: 2450,
      notizen: 'Antiker Schrank erfordert besondere Sorgfalt',
      materialien: 'Standard-Umzugsset + Zusatzkartons'
    },
    {
      id: 4,
      kunde: 'Tech Solutions GmbH',
      telefon: '089-12345678',
      email: 'kontakt@techsolutions.de',
      kategorie: 'Firmenumzug',
      von: 'Industriestraße 5, München',
      nach: 'Businesspark 12, München',
      datum: new Date(2025, 4, 20), // 20. Mai 2025
      uhrzeit: '07:00 - 18:00',
      mitarbeiter: ['Max', 'Anna', 'Peter', 'Thomas', 'Michael', 'Paul'],
      fahrzeuge: ['LKW-01', 'LKW-02', 'LKW-03'],
      status: 'Geplant',
      volumen: '120 m³',
      preis: 4850,
      notizen: 'IT-Equipment erfordert besondere Vorsicht, Serverraum hat Priorität',
      materialien: 'Büro-Umzugsset + IT-Spezialverpackungen'
    },
    {
      id: 5,
      kunde: 'Familie Bauer',
      telefon: '0123-4567123',
      email: 'bauer@beispiel.de',
      kategorie: 'Privatumzug',
      von: 'Lindenstraße 8, Dachau',
      nach: 'Rosenweg 15, München',
      datum: new Date(2025, 4, 25), // 25. Mai 2025
      uhrzeit: '08:30 - 15:30',
      mitarbeiter: ['Thomas', 'Paul'],
      fahrzeuge: ['LKW-02'],
      status: 'Geplant',
      volumen: '28 m³',
      preis: 1650,
      notizen: 'Haustiere vorhanden: 2 Katzen',
      materialien: 'Standard-Umzugsset'
    },
    {
      id: 6,
      kunde: 'Dr. Fischer',
      telefon: '0123-5555123',
      email: 'fischer@beispiel.de',
      kategorie: 'Privatumzug',
      von: 'Marktplatz 3, München',
      nach: 'Bergstraße 42, Starnberg',
      datum: new Date(2025, 3, 5), // 5. April 2025
      uhrzeit: '09:00 - 16:00',
      mitarbeiter: ['Max', 'Anna'],
      fahrzeuge: ['LKW-01'],
      status: 'Abgeschlossen',
      volumen: '30 m³',
      preis: 1780,
      notizen: 'Kunde war sehr zufrieden',
      materialien: 'Standard-Umzugsset'
    },
    {
      id: 7,
      kunde: 'Boutique Eleganz',
      telefon: '089-9876543',
      email: 'kontakt@boutique-eleganz.de',
      kategorie: 'Gewerbeverlegung',
      von: 'Einkaufsstraße 10, München',
      nach: 'Schwanenplatz 5, München',
      datum: new Date(2025, 3, 15), // 15. April 2025
      uhrzeit: '08:00 - 14:00',
      mitarbeiter: ['Peter', 'Thomas', 'Michael'],
      fahrzeuge: ['LKW-03'],
      status: 'Abgeschlossen',
      volumen: '45 m³',
      preis: 2200,
      notizen: 'Kleiderstangen und Regale benötigten Spezialverpackung',
      materialien: 'Gewerbe-Umzugsset + Kleiderstangenkartons'
    },
    {
      id: 8,
      kunde: 'Familie Huber',
      telefon: '0123-7777123',
      email: 'huber@beispiel.de',
      kategorie: 'Privatumzug',
      von: 'Dorfstraße 2, Landshut',
      nach: 'Hauptstraße 56, Freising',
      datum: new Date(2025, 5, 5), // 5. Juni 2025
      uhrzeit: '08:00 - 17:00',
      mitarbeiter: ['Max', 'Peter', 'Paul'],
      fahrzeuge: ['LKW-01'],
      status: 'Geplant',
      volumen: '50 m³',
      preis: 2680,
      notizen: 'Haus mit Garten, einige Gartengeräte und Möbel',
      materialien: 'Standard-Umzugsset + Großkartons'
    },
    {
      id: 9,
      kunde: 'Rechtsanwaltskanzlei Meyer',
      telefon: '089-7654321',
      email: 'kontakt@kanzlei-meyer.de',
      kategorie: 'Firmenumzug',
      von: 'Anwaltsplatz 1, München',
      nach: 'Justizia-Allee 8, München',
      datum: new Date(2025, 5, 10), // 10. Juni 2025
      uhrzeit: '07:00 - 18:00',
      mitarbeiter: ['Anna', 'Thomas', 'Michael', 'Paul'],
      fahrzeuge: ['LKW-02', 'LKW-03'],
      status: 'Geplant',
      volumen: '80 m³',
      preis: 3900,
      notizen: 'Akten und sensible Dokumente müssen sicher transportiert werden',
      materialien: 'Büro-Umzugsset + Aktenkartons'
    }
  ]);
  
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
  
  // Umzug löschen
  const umzugLoeschen = (id) => {
    if (window.confirm('Möchten Sie diesen Umzug wirklich löschen?')) {
      setUmzuege(umzuege.filter(umzug => umzug.id !== id));
      if (ausgewaehlterUmzug && ausgewaehlterUmzug.id === id) {
        setAusgewaehlterUmzug(null);
        setAnsicht('monatsdetails');
      }
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
      gesamtvolumen: umzuegeImMonat.reduce((sum, u) => sum + parseInt(u.volumen), 0),
      umsatz: umzuegeImMonat.reduce((sum, u) => sum + u.preis, 0)
    };
  };
  
  // Render Funktion für die Monatsübersicht
  const renderMonatsuebersicht = () => {
    const monatsUebersicht = getMonatsUebersicht();
    const maxUmzuege = Math.max(...monatsUebersicht);
    
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
            onClick={() => navigate('/umzuege/neu')} // Geändert: Navigiert zur Formularseite
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
              onClick={() => navigate('/umzuege/neu')} // Geändert: Navigiert zur Formularseite
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
                    {ausgewaehlterUmzug.mitarbeiter.map((mitarbeiter, index) => (
                      <div key={index} className="flex items-center px-2 py-1 bg-gray-50 rounded">
                        <User className="w-4 h-4 mr-2 text-blue-500" />
                        {mitarbeiter}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">Zugewiesene Fahrzeuge:</div>
                  <div className="space-y-2">
                    {ausgewaehlterUmzug.fahrzeuge.map((fahrzeug, index) => (
                      <div key={index} className="flex items-center px-2 py-1 bg-gray-50 rounded">
                        <Truck className="w-4 h-4 mr-2 text-green-500" />
                        {fahrzeug}
                      </div>
                    ))}
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
                  onClick={() => navigate(`/umzuege/${ausgewaehlterUmzug.id}/bearbeiten`)} // Geändert: Navigiert zur Bearbeitungsseite
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
                    onClick={() => {
                      // Status auf "In Bearbeitung" setzen
                      const aktualisierteUmzuege = umzuege.map(umzug => 
                        umzug.id === ausgewaehlterUmzug.id 
                          ? { ...umzug, status: 'In Bearbeitung' } 
                          : umzug
                      );
                      setUmzuege(aktualisierteUmzuege);
                      setAusgewaehlterUmzug({...ausgewaehlterUmzug, status: 'In Bearbeitung'});
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Umzug starten
                  </button>
                )}
                
                {ausgewaehlterUmzug.status === 'In Bearbeitung' && (
                  <button 
                    className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
                    onClick={() => {
                      // Status auf "Abgeschlossen" setzen
                      const aktualisierteUmzuege = umzuege.map(umzug => 
                        umzug.id === ausgewaehlterUmzug.id 
                          ? { ...umzug, status: 'Abgeschlossen' } 
                          : umzug
                      );
                      setUmzuege(aktualisierteUmzuege);
                      setAusgewaehlterUmzug({...ausgewaehlterUmzug, status: 'Abgeschlossen'});
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Umzug abschließen
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
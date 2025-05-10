import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Eye, FileText, Download, DollarSign, TrendingUp, PieChart, CreditCard, User, Search, Filter, ArrowUp, ArrowDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function FinanzenMonatsansicht() {
  // Aktuelles Datum und Jahr
  const [aktuellesDatum, setAktuellesDatum] = useState(new Date());
  const [aktuellesJahr, setAktuellesJahr] = useState(new Date().getFullYear());
  
  // State für die verschiedenen Ansichten
  const [ansicht, setAnsicht] = useState('monatsuebersicht'); // 'monatsuebersicht', 'monatsdetails', 'transaktionsdetails'
  const [ausgewaehlterMonat, setAusgewaehlterMonat] = useState(new Date().getMonth());
  const [ausgewaehlteTransaktion, setAusgewaehlteTransaktion] = useState(null);
  
  // Filter State
  const [suchbegriff, setSuchbegriff] = useState('');
  const [typFilter, setTypFilter] = useState('Alle');
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [kategorieSortierung, setKategorieSortierung] = useState(false); // false = nach Datum, true = nach Kategorie
  
  // Demo-Daten für Einnahmen und Ausgaben
  const [transaktionen, setTransaktionen] = useState([
    {
      id: 1,
      typ: 'Einnahme',
      kategorie: 'Umzüge',
      referenz: 'Familie Müller',
      beschreibung: 'Umzug von München nach Augsburg',
      betrag: 1850,
      datum: new Date(2025, 4, 11), // 11. Mai 2025
      status: 'Bezahlt',
      zahlungsart: 'Überweisung',
      rechnung: 'RE-2025-001',
      angebot: 'ANG-2025-001',
      notizen: 'Zahlung pünktlich eingegangen',
      kunde: {
        name: 'Familie Müller',
        email: 'mueller@beispiel.de',
        telefon: '0123-4567890'
      }
    },
    {
      id: 2,
      typ: 'Ausgabe',
      kategorie: 'Personal',
      referenz: 'Gehälter Mai',
      beschreibung: 'Gehaltszahlungen für Mai 2025',
      betrag: 12500,
      datum: new Date(2025, 4, 28), // 28. Mai 2025
      status: 'Bezahlt',
      zahlungsart: 'Bankeinzug',
      rechnung: 'GEHALTER-MAI-2025',
      angebot: '',
      notizen: 'Monatliche Gehälter für 5 Vollzeitmitarbeiter',
      empfaenger: 'Mitarbeiter'
    },
    {
      id: 3,
      typ: 'Ausgabe',
      kategorie: 'Fahrzeuge',
      referenz: 'Diesel LKW-01',
      beschreibung: 'Tankkosten für LKW-01',
      betrag: 230,
      datum: new Date(2025, 4, 15), // 15. Mai 2025
      status: 'Bezahlt',
      zahlungsart: 'Firmenkreditkarte',
      rechnung: 'TK-2025-135',
      angebot: '',
      notizen: 'Tanken nach dem Umzug von Familie Müller',
      empfaenger: 'Esso Tankstelle München'
    },
    {
      id: 4,
      typ: 'Einnahme',
      kategorie: 'Umzüge',
      referenz: 'Herr Schmidt',
      beschreibung: 'Umzug innerhalb München',
      betrag: 980,
      datum: new Date(2025, 4, 20), // 20. Mai 2025
      status: 'Offen',
      zahlungsart: '',
      rechnung: 'RE-2025-002',
      angebot: 'ANG-2025-002',
      notizen: 'Zahlungsfrist: 30 Tage',
      kunde: {
        name: 'Herr Schmidt',
        email: 'schmidt@beispiel.de',
        telefon: '0123-9876543'
      }
    },
    {
      id: 5,
      typ: 'Ausgabe',
      kategorie: 'Material',
      referenz: 'Umzugskartons',
      beschreibung: 'Nachbestellung Umzugskartons',
      betrag: 450,
      datum: new Date(2025, 4, 5), // 5. Mai 2025
      status: 'Bezahlt',
      zahlungsart: 'Überweisung',
      rechnung: 'RE-V-2025-078',
      angebot: '',
      notizen: '200 Standardkartons, 50 Bücherkartons',
      empfaenger: 'Verpackungsprofi GmbH'
    },
    {
      id: 6,
      typ: 'Einnahme',
      kategorie: 'Umzüge',
      referenz: 'Frau Weber',
      beschreibung: 'Umzug von Freising nach München',
      betrag: 2450,
      datum: new Date(2025, 4, 25), // 25. Mai 2025
      status: 'Bezahlt',
      zahlungsart: 'Bar',
      rechnung: 'RE-2025-003',
      angebot: 'ANG-2025-003',
      notizen: 'Barzahlung bei Abschluss des Umzugs',
      kunde: {
        name: 'Frau Weber',
        email: 'weber@beispiel.de',
        telefon: '0123-1234567'
      }
    },
    {
      id: 7,
      typ: 'Ausgabe',
      kategorie: 'Fahrzeuge',
      referenz: 'Reparatur LKW-02',
      beschreibung: 'Austausch der Bremsbeläge',
      betrag: 580,
      datum: new Date(2025, 4, 18), // 18. Mai 2025
      status: 'Bezahlt',
      zahlungsart: 'Überweisung',
      rechnung: 'WK-2025-045',
      angebot: '',
      notizen: 'Reguläre Wartung nach Inspektion',
      empfaenger: 'Kfz-Werkstatt Schulz'
    },
    {
      id: 8,
      typ: 'Ausgabe',
      kategorie: 'Betriebskosten',
      referenz: 'Miete Lager & Büro',
      beschreibung: 'Monatsmiete Mai 2025',
      betrag: 2200,
      datum: new Date(2025, 4, 3), // 3. Mai 2025
      status: 'Bezahlt',
      zahlungsart: 'Dauerauftrag',
      rechnung: 'MIETE-MAI-2025',
      angebot: '',
      notizen: 'Monatliche Miete für Lager und Büroräume',
      empfaenger: 'Immobilien Schmidt & Partner'
    },
    {
      id: 9,
      typ: 'Einnahme',
      kategorie: 'Umzüge',
      referenz: 'Tech Solutions GmbH',
      beschreibung: 'Firmenumzug',
      betrag: 4850,
      datum: new Date(2025, 4, 23), // 23. Mai 2025
      status: 'Bezahlt',
      zahlungsart: 'Überweisung',
      rechnung: 'RE-2025-004',
      angebot: 'ANG-2025-004',
      notizen: 'Großer Firmenumzug, 3 LKWs',
      kunde: {
        name: 'Tech Solutions GmbH',
        email: 'kontakt@techsolutions.de',
        telefon: '089-12345678'
      }
    },
    {
      id: 10,
      typ: 'Ausgabe',
      kategorie: 'Versicherung',
      referenz: 'Betriebshaftpflicht',
      beschreibung: 'Jahresbeitrag Betriebshaftpflicht',
      betrag: 1350,
      datum: new Date(2025, 5, 15), // 15. Juni 2025
      status: 'Offen',
      zahlungsart: '',
      rechnung: 'VS-2025-11425',
      angebot: '',
      notizen: 'Jährliche Versicherungszahlung, fällig am 15.06.2025',
      empfaenger: 'AllSecure Versicherung AG'
    },
    {
      id: 11,
      typ: 'Einnahme',
      kategorie: 'Umzüge',
      referenz: 'Familie Bauer',
      beschreibung: 'Umzug von Dachau nach München',
      betrag: 1650,
      datum: new Date(2025, 5, 27), // 27. Juni 2025
      status: 'Offen',
      zahlungsart: '',
      rechnung: 'RE-2025-005',
      angebot: 'ANG-2025-005',
      notizen: 'Anzahlung von 500€ erhalten',
      kunde: {
        name: 'Familie Bauer',
        email: 'bauer@beispiel.de',
        telefon: '0123-4567123'
      }
    },
    {
      id: 12,
      typ: 'Einnahme',
      kategorie: 'Umzüge',
      referenz: 'Dr. Fischer',
      beschreibung: 'Umzug von München nach Starnberg',
      betrag: 1780,
      datum: new Date(2025, 3, 8), // 8. April 2025
      status: 'Bezahlt',
      zahlungsart: 'Überweisung',
      rechnung: 'RE-2025-0012',
      angebot: 'ANG-2025-0010',
      notizen: 'Zahlung vollständig erhalten',
      kunde: {
        name: 'Dr. Fischer',
        email: 'fischer@beispiel.de',
        telefon: '0123-5555123'
      }
    },
    {
      id: 13,
      typ: 'Ausgabe',
      kategorie: 'Marketing',
      referenz: 'Werbeanzeigen',
      beschreibung: 'Google Ads & Facebook-Kampagne',
      betrag: 450,
      datum: new Date(2025, 3, 20), // 20. April 2025
      status: 'Bezahlt',
      zahlungsart: 'Kreditkarte',
      rechnung: 'ONLINE-MKT-042025',
      angebot: '',
      notizen: 'Monatliches Online-Marketing-Budget',
      empfaenger: 'Diverse Online-Plattformen'
    }
  ]);
  
  // Erhalte alle Monate mit Transaktionen für das ausgewählte Jahr
  const getMonatsUebersicht = () => {
    // Array mit 12 Einträgen (0 = Januar, 11 = Dezember) für Einnahmen und Ausgaben
    const monatsUebersicht = Array(12).fill().map(() => ({ einnahmen: 0, ausgaben: 0 }));
    
    transaktionen.forEach(transaktion => {
      if (transaktion.datum.getFullYear() === aktuellesJahr) {
        const monat = transaktion.datum.getMonth();
        if (transaktion.typ === 'Einnahme') {
          monatsUebersicht[monat].einnahmen += transaktion.betrag;
        } else {
          monatsUebersicht[monat].ausgaben += transaktion.betrag;
        }
      }
    });
    
    return monatsUebersicht;
  };
  
  // Erhalte alle Transaktionen für einen bestimmten Monat im ausgewählten Jahr
  const getTransaktionenImMonat = (monat) => {
    return transaktionen.filter(transaktion => 
      transaktion.datum.getFullYear() === aktuellesJahr && 
      transaktion.datum.getMonth() === monat
    ).sort((a, b) => a.datum - b.datum);
  };
  
  // Gefilterte Transaktionen für die Detailansicht
  const getGefilterte = () => {
    let gefiltert = getTransaktionenImMonat(ausgewaehlterMonat);
    
    // Nach Typ filtern
    if (typFilter !== 'Alle') {
      gefiltert = gefiltert.filter(transaktion => transaktion.typ === typFilter);
    }
    
    // Nach Status filtern
    if (statusFilter !== 'Alle') {
      gefiltert = gefiltert.filter(transaktion => transaktion.status === statusFilter);
    }
    
    // Nach Suchbegriff filtern
    if (suchbegriff) {
      gefiltert = gefiltert.filter(transaktion => 
        transaktion.referenz.toLowerCase().includes(suchbegriff.toLowerCase()) ||
        transaktion.beschreibung.toLowerCase().includes(suchbegriff.toLowerCase()) ||
        transaktion.kategorie.toLowerCase().includes(suchbegriff.toLowerCase())
      );
    }
    
    // Sortieren nach Datum oder Kategorie
    if (kategorieSortierung) {
      gefiltert.sort((a, b) => a.kategorie.localeCompare(b.kategorie));
    } else {
      gefiltert.sort((a, b) => a.datum - b.datum);
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
      case 'Bezahlt':
        return 'bg-green-100 text-green-800';
      case 'Offen':
        return 'bg-yellow-100 text-yellow-800';
      case 'Überfällig':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Status Icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Bezahlt':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Offen':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Überfällig':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };
  
  // Kategorie Farbe
  const getKategorieFarbe = (kategorie) => {
    const kategorien = {
      'Umzüge': 'bg-blue-100 text-blue-800',
      'Personal': 'bg-purple-100 text-purple-800',
      'Fahrzeuge': 'bg-green-100 text-green-800',
      'Material': 'bg-yellow-100 text-yellow-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Betriebskosten': 'bg-orange-100 text-orange-800',
      'Versicherung': 'bg-indigo-100 text-indigo-800'
    };
    
    return kategorien[kategorie] || 'bg-gray-100 text-gray-800';
  };
  
  // Jahr wechseln
  const jahrWechseln = (schritt) => {
    setAktuellesJahr(aktuellesJahr + schritt);
  };
  
  // Transaktion löschen
  const transaktionLoeschen = (id) => {
    if (window.confirm('Möchten Sie diese Transaktion wirklich löschen?')) {
      setTransaktionen(transaktionen.filter(transaktion => transaktion.id !== id));
      if (ausgewaehlteTransaktion && ausgewaehlteTransaktion.id === id) {
        setAusgewaehlteTransaktion(null);
        setAnsicht('monatsdetails');
      }
    }
  };
  
  // Statistische Werte für einen Monat
  const getMonatsstatistik = (monat) => {
    const transaktionenImMonat = getTransaktionenImMonat(monat);
    
    const einnahmen = transaktionenImMonat
      .filter(t => t.typ === 'Einnahme')
      .reduce((sum, t) => sum + t.betrag, 0);
      
    const ausgaben = transaktionenImMonat
      .filter(t => t.typ === 'Ausgabe')
      .reduce((sum, t) => sum + t.betrag, 0);
    
    const gewinn = einnahmen - ausgaben;
    const marge = einnahmen > 0 ? Math.round((gewinn / einnahmen) * 100) : 0;
    
    return {
      einnahmen,
      ausgaben,
      gewinn,
      marge,
      offeneRechnungen: transaktionenImMonat
        .filter(t => t.typ === 'Einnahme' && t.status === 'Offen')
        .reduce((sum, t) => sum + t.betrag, 0),
      transaktionenGesamt: transaktionenImMonat.length
    };
  };
  
  // Kategorieverteilung für einen Monat
  const getKategorieVerteilung = (monat, typ) => {
    const transaktionenImMonat = getTransaktionenImMonat(monat)
      .filter(t => t.typ === typ);
    
    const verteilung = {};
    
    transaktionenImMonat.forEach(transaktion => {
      if (!verteilung[transaktion.kategorie]) {
        verteilung[transaktion.kategorie] = 0;
      }
      verteilung[transaktion.kategorie] += transaktion.betrag;
    });
    
    return verteilung;
  };
  
  // Kategorie-Anteil in Prozent
  const getKategorieAnteil = (kategorie, gesamtVerteilung, gesamtBetrag) => {
    if (gesamtBetrag === 0) return 0;
    return Math.round((gesamtVerteilung[kategorie] / gesamtBetrag) * 100);
  };
  
  // Render Funktion für die Monatsübersicht
  const renderMonatsuebersicht = () => {
    const monatsUebersicht = getMonatsUebersicht();
    
    // Höchstwerte für Skalierung finden
    const maxEinnahmen = Math.max(...monatsUebersicht.map(m => m.einnahmen));
    const maxAusgaben = Math.max(...monatsUebersicht.map(m => m.ausgaben));
    const maxWert = Math.max(maxEinnahmen, maxAusgaben);
    
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
            onClick={() => {
              // Hier würde normalerweise ein Modal für eine neue Transaktion geöffnet werden
              alert('Neue Transaktion erfassen');
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Neue Transaktion
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monatsUebersicht.map((daten, index) => {
            const statistik = getMonatsstatistik(index);
            
            return (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${statistik.transaktionenGesamt > 0 ? 'bg-white cursor-pointer hover:shadow-md' : 'bg-gray-50'}`}
                onClick={() => {
                  if (statistik.transaktionenGesamt > 0) {
                    setAusgewaehlterMonat(index);
                    setAnsicht('monatsdetails');
                  }
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-lg">{monate[index]}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statistik.transaktionenGesamt > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {statistik.transaktionenGesamt} Transaktionen
                  </span>
                </div>
                
                {statistik.transaktionenGesamt > 0 && (
                  <>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Einnahmen:</span>
                        <span className="font-medium text-green-600">{daten.einnahmen.toLocaleString('de-DE')} €</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Ausgaben:</span>
                        <span className="font-medium text-red-600">{daten.ausgaben.toLocaleString('de-DE')} €</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Gewinn:</span>
                        <span className={`font-medium ${statistik.gewinn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {statistik.gewinn.toLocaleString('de-DE')} €
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Einnahmen Balken */}
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                          style={{ width: `${maxWert ? (daten.einnahmen / maxWert) * 100 : 0}%` }}
                        ></div>
                      </div>
                      
                      {/* Ausgaben Balken */}
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-red-500 rounded-full"
                          style={{ width: `${maxWert ? (daten.ausgaben / maxWert) * 100 : 0}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Marge: {statistik.marge}%</span>
                        <span className="text-yellow-600">
                          Offen: {statistik.offeneRechnungen.toLocaleString('de-DE')} €
                        </span>
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
    const statistik = getMonatsstatistik(ausgewaehlterMonat);
    
    // Verteilung nach Kategorien
    const einnahmenVerteilung = getKategorieVerteilung(ausgewaehlterMonat, 'Einnahme');
    const ausgabenVerteilung = getKategorieVerteilung(ausgewaehlterMonat, 'Ausgabe');
    
    // Alle Kategorien ohne Duplikate
    const einnahmenKategorien = Object.keys(einnahmenVerteilung);
    const ausgabenKategorien = Object.keys(ausgabenVerteilung);
    
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
            {gefiltert.length} Transaktionen
          </span>
        </div>
        
        {/* Finanzübersicht */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border shadow">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
              <h3 className="text-gray-700 font-medium">Einnahmen</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{statistik.einnahmen.toLocaleString('de-DE')} €</p>
            <div className="mt-1 text-sm text-gray-500">
              {getTransaktionenImMonat(ausgewaehlterMonat).filter(t => t.typ === 'Einnahme').length} Transaktionen
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-red-500 mr-2" />
              <h3 className="text-gray-700 font-medium">Ausgaben</h3>
            </div>
            <p className="text-2xl font-bold text-red-600">{statistik.ausgaben.toLocaleString('de-DE')} €</p>
            <div className="mt-1 text-sm text-gray-500">
              {getTransaktionenImMonat(ausgewaehlterMonat).filter(t => t.typ === 'Ausgabe').length} Transaktionen
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow">
            <div className="flex items-center mb-2">
              <DollarSign className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="text-gray-700 font-medium">Gewinn</h3>
            </div>
            <p className={`text-2xl font-bold ${statistik.gewinn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {statistik.gewinn.toLocaleString('de-DE')} €
            </p>
            <div className="mt-1 text-sm text-gray-500">
              Marge: {statistik.marge}%
            </div>
          </div>
        </div>
        
        {/* Kategorieverteilung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg border shadow">
            <h3 className="text-gray-700 font-medium mb-3">Einnahmen nach Kategorien</h3>
            
            {einnahmenKategorien.length > 0 ? (
              <div className="space-y-3">
                {einnahmenKategorien.map(kategorie => {
                  const betrag = einnahmenVerteilung[kategorie];
                  const anteil = getKategorieAnteil(kategorie, einnahmenVerteilung, statistik.einnahmen);
                  
                  return (
                    <div key={kategorie}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{kategorie}</span>
                        <span className="font-medium">
                          {betrag.toLocaleString('de-DE')} € ({anteil}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full" 
                          style={{ width: `${anteil}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Keine Einnahmen in diesem Monat
              </div>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow">
            <h3 className="text-gray-700 font-medium mb-3">Ausgaben nach Kategorien</h3>
            
            {ausgabenKategorien.length > 0 ? (
              <div className="space-y-3">
                {ausgabenKategorien.map(kategorie => {
                  const betrag = ausgabenVerteilung[kategorie];
                  const anteil = getKategorieAnteil(kategorie, ausgabenVerteilung, statistik.ausgaben);
                  
                  return (
                    <div key={kategorie}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{kategorie}</span>
                        <span className="font-medium">
                          {betrag.toLocaleString('de-DE')} € ({anteil}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-red-500 h-2.5 rounded-full" 
                          style={{ width: `${anteil}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Keine Ausgaben in diesem Monat
              </div>
            )}
          </div>
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
              <span className="text-sm text-gray-600">Typ:</span>
              <select 
                value={typFilter}
                onChange={(e) => setTypFilter(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="Alle">Alle</option>
                <option value="Einnahme">Einnahmen</option>
                <option value="Ausgabe">Ausgaben</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="Alle">Alle</option>
                <option value="Bezahlt">Bezahlt</option>
                <option value="Offen">Offen</option>
                <option value="Überfällig">Überfällig</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sortierung:</span>
              <button 
                className={`px-2 py-1 border rounded-md text-sm ${!kategorieSortierung ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'}`}
                onClick={() => setKategorieSortierung(false)}
              >
                Datum
              </button>
              <button 
                className={`px-2 py-1 border rounded-md text-sm ${kategorieSortierung ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'}`}
                onClick={() => setKategorieSortierung(true)}
              >
                Kategorie
              </button>
            </div>
            
            <button 
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center ml-auto"
              onClick={() => {
                // Hier würde normalerweise ein Modal für eine neue Transaktion geöffnet werden
                alert('Neue Transaktion erfassen');
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Neue Transaktion
            </button>
          </div>
        </div>
        
        {/* Transaktionsliste */}
        {gefiltert.length > 0 ? (
          <div className="space-y-4">
            {gefiltert.map(transaktion => (
              <div 
                key={transaktion.id}
                className="p-4 bg-white rounded-lg border hover:shadow-md cursor-pointer"
                onClick={() => {
                  setAusgewaehlteTransaktion(transaktion);
                  setAnsicht('transaktionsdetails');
                }}
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <h3 className="font-medium text-lg">{transaktion.referenz}</h3>
                    <div className="text-sm text-gray-600 mt-1">{transaktion.beschreibung}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 inline-flex items-center rounded-full text-xs font-semibold ${transaktion.typ === 'Einnahme' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {transaktion.typ === 'Einnahme' ? (
                        <ArrowUp className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDown className="w-3 h-3 mr-1" />
                      )}
                      {transaktion.typ}
                    </span>
                    <span className={`px-2 py-1 inline-flex items-center rounded-full text-xs font-semibold ${getStatusStyle(transaktion.status)}`}>
                      {getStatusIcon(transaktion.status)}
                      <span className="ml-1">{transaktion.status}</span>
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-600">{formatieresDatum(transaktion.datum)}</span>
                    
                    <span className="mx-2 text-gray-300">|</span>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKategorieFarbe(transaktion.kategorie)}`}>
                      {transaktion.kategorie}
                    </span>
                  </div>
                  
                  <div className={`font-medium text-lg ${transaktion.typ === 'Einnahme' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaktion.typ === 'Einnahme' ? '+' : '-'} {transaktion.betrag.toLocaleString('de-DE')} €
                  </div>
                </div>
                
                {transaktion.rechnung && (
                  <div className="mt-2 text-sm text-gray-500">
                    <FileText className="w-3 h-3 inline mr-1" /> Rechnung: {transaktion.rechnung}
                    {transaktion.zahlungsart && <span className="ml-2">• Zahlung: {transaktion.zahlungsart}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-md">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Keine Transaktionen gefunden</h3>
            <p className="text-gray-500">
              Es wurden keine Transaktionen gefunden, die den Filterkriterien entsprechen.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // Render Funktion für die Transaktionsdetails
  const renderTransaktionsdetails = () => {
    if (!ausgewaehlteTransaktion) return null;
    
    return (
      <div>
        <div className="flex items-center mb-6">
          <button 
            className="p-1 rounded hover:bg-gray-200 mr-3"
            onClick={() => {
              setAusgewaehlteTransaktion(null);
              setAnsicht('monatsdetails');
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">{ausgewaehlteTransaktion.referenz}</h2>
          <span className={`ml-2 px-2 py-1 inline-flex items-center rounded-full text-xs font-semibold ${ausgewaehlteTransaktion.typ === 'Einnahme' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {ausgewaehlteTransaktion.typ === 'Einnahme' ? (
              <ArrowUp className="w-3 h-3 mr-1" />
            ) : (
              <ArrowDown className="w-3 h-3 mr-1" />
            )}
            {ausgewaehlteTransaktion.typ}
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Hauptinformationen */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-800 mb-4">Transaktionsdetails</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Kategorie:</div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKategorieFarbe(ausgewaehlteTransaktion.kategorie)}`}>
                        {ausgewaehlteTransaktion.kategorie}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Datum:</div>
                    <div>{formatieresDatum(ausgewaehlteTransaktion.datum)}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Beschreibung:</div>
                    <div>{ausgewaehlteTransaktion.beschreibung}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Status:</div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 inline-flex items-center rounded-full text-xs font-semibold ${getStatusStyle(ausgewaehlteTransaktion.status)}`}>
                        {getStatusIcon(ausgewaehlteTransaktion.status)}
                        <span className="ml-1">{ausgewaehlteTransaktion.status}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Betrag:</div>
                    <div className={`text-xl font-medium ${ausgewaehlteTransaktion.typ === 'Einnahme' ? 'text-green-600' : 'text-red-600'}`}>
                      {ausgewaehlteTransaktion.betrag.toLocaleString('de-DE')} €
                    </div>
                  </div>
                  
                  {ausgewaehlteTransaktion.zahlungsart && (
                    <div>
                      <div className="text-sm text-gray-600">Zahlungsart:</div>
                      <div>{ausgewaehlteTransaktion.zahlungsart}</div>
                    </div>
                  )}
                  
                  {ausgewaehlteTransaktion.rechnung && (
                    <div>
                      <div className="text-sm text-gray-600">Rechnungsnummer:</div>
                      <div>{ausgewaehlteTransaktion.rechnung}</div>
                    </div>
                  )}
                  
                  {ausgewaehlteTransaktion.angebot && (
                    <div>
                      <div className="text-sm text-gray-600">Angebotsnummer:</div>
                      <div>{ausgewaehlteTransaktion.angebot}</div>
                    </div>
                  )}
                </div>
              </div>
              
              {ausgewaehlteTransaktion.notizen && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600">Notizen:</div>
                  <div className="p-2 bg-gray-50 rounded mt-1">
                    {ausgewaehlteTransaktion.notizen}
                  </div>
                </div>
              )}
            </div>
            
            {/* Zusätzliche Informationen */}
            {ausgewaehlteTransaktion.typ === 'Einnahme' && ausgewaehlteTransaktion.kunde && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-medium text-gray-800 mb-4">Kundeninformationen</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Kunde:</div>
                    <div className="font-medium">{ausgewaehlteTransaktion.kunde.name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">E-Mail:</div>
                    <div>
                      <a href={`mailto:${ausgewaehlteTransaktion.kunde.email}`} className="text-blue-600 hover:underline">
                        {ausgewaehlteTransaktion.kunde.email}
                      </a>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Telefon:</div>
                    <div>
                      <a href={`tel:${ausgewaehlteTransaktion.kunde.telefon}`} className="text-blue-600 hover:underline">
                        {ausgewaehlteTransaktion.kunde.telefon}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {ausgewaehlteTransaktion.typ === 'Ausgabe' && ausgewaehlteTransaktion.empfaenger && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-medium text-gray-800 mb-4">Empfänger</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Empfänger:</div>
                    <div className="font-medium">{ausgewaehlteTransaktion.empfaenger}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Aktionen */}
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-800 mb-4">Betrag</h3>
              
              <div className={`text-center text-3xl font-bold mb-2 ${ausgewaehlteTransaktion.typ === 'Einnahme' ? 'text-green-600' : 'text-red-600'}`}>
                {ausgewaehlteTransaktion.typ === 'Einnahme' ? '+' : '-'} {ausgewaehlteTransaktion.betrag.toLocaleString('de-DE')} €
              </div>
              
              <div className="flex justify-center items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-1" />
                {formatieresDatum(ausgewaehlteTransaktion.datum)}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-800 mb-4">Aktionen</h3>
              
              <div className="space-y-2">
                <button 
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                  onClick={() => {
                    // Hier würde normalerweise das Bearbeitungsformular geöffnet
                    alert(`Transaktion bearbeiten: ${ausgewaehlteTransaktion.referenz}`);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Transaktion bearbeiten
                </button>
                
                {ausgewaehlteTransaktion.rechnung && (
                  <button 
                    className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center justify-center"
                    onClick={() => {
                      // Hier würde normalerweise das Dokument heruntergeladen
                      alert(`Rechnung ${ausgewaehlteTransaktion.rechnung} herunterladen`);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Rechnung herunterladen
                  </button>
                )}
                
                {ausgewaehlteTransaktion.typ === 'Einnahme' && ausgewaehlteTransaktion.status === 'Offen' && (
                  <button 
                    className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
                    onClick={() => {
                      // Status auf "Bezahlt" setzen
                      const aktualisierteTransaktionen = transaktionen.map(transaktion => 
                        transaktion.id === ausgewaehlteTransaktion.id 
                          ? { ...transaktion, status: 'Bezahlt', zahlungsart: 'Überweisung' } 
                          : transaktion
                      );
                      setTransaktionen(aktualisierteTransaktionen);
                      setAusgewaehlteTransaktion({
                        ...ausgewaehlteTransaktion, 
                        status: 'Bezahlt',
                        zahlungsart: 'Überweisung'
                      });
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Als bezahlt markieren
                  </button>
                )}
                
                <button 
                  className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                  onClick={() => transaktionLoeschen(ausgewaehlteTransaktion.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Transaktion löschen
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Finanzen nach Monaten</h1>
      
      {ansicht === 'monatsuebersicht' && renderMonatsuebersicht()}
      {ansicht === 'monatsdetails' && renderMonatsdetails()}
      {ansicht === 'transaktionsdetails' && renderTransaktionsdetails()}
    </div>
  );
}
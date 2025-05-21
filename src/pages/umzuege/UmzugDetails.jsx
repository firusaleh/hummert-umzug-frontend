// src/pages/umzuege/UmzugDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  TruckElectric, 
  Users, 
  Phone, 
  Mail,
  FileText,
  MessageSquare,
  Clipboard,
  Edit,
  Trash2
} from 'lucide-react';

// Beispieldaten für einen Umzug
const mockUmzug = {
  id: 1,
  kunde: {
    name: 'Familie Becker',
    kontaktperson: 'Thomas Becker',
    telefon: '+49 176 12345678',
    email: 'thomas.becker@example.com'
  },
  typ: 'Privat',
  status: 'Geplant',
  datum: '15.05.2025',
  uhrzeit: '08:00 - 16:00',
  startadresse: 'Rosenweg 8, 10115 Berlin',
  zieladresse: 'Tulpenallee 23, 80333 München',
  umzugsvolumen: '70m³',
  etage_start: '3. OG (mit Aufzug)',
  etage_ziel: '2. OG (ohne Aufzug)',
  mitarbeiter: [
    { id: 1, name: 'Max Mustermann', rolle: 'Teamleiter' },
    { id: 2, name: 'Anna Schmidt', rolle: 'Packer' },
    { id: 3, name: 'Lukas Meyer', rolle: 'Fahrer' },
    { id: 4, name: 'Julia Weber', rolle: 'Packer' }
  ],
  fahrzeuge: [
    { id: 1, kennzeichen: 'B-HU 1234', typ: '7,5t LKW' },
    { id: 2, kennzeichen: 'B-HU 5678', typ: 'Transporter' }
  ],
  notizen: 'Klavier muss transportiert werden. Kunde hat spezielle Verpackungswünsche für die Kunstsammlung.',
  aufnahmeBericht: 'Aufnahme_Becker_2025-04-20.pdf',
  preisangebot: 'Angebot_Becker_2025-04-22.pdf',
  vertrag: 'Vertrag_Becker_2025-04-25.pdf',
  aktivitaeten: [
    { id: 1, datum: '20.04.2025', uhrzeit: '14:30', typ: 'Aufnahme', benutzer: 'Sarah Müller', notiz: 'Aufnahme vor Ort durchgeführt.' },
    { id: 2, datum: '22.04.2025', uhrzeit: '10:15', typ: 'Angebot erstellt', benutzer: 'Markus Wolf', notiz: 'Angebot an Kunden versendet.' },
    { id: 3, datum: '25.04.2025', uhrzeit: '16:45', typ: 'Vertrag', benutzer: 'Markus Wolf', notiz: 'Vertrag vom Kunden unterschrieben erhalten.' },
    { id: 4, datum: '28.04.2025', uhrzeit: '09:00', typ: 'Ressourcenplanung', benutzer: 'Sarah Müller', notiz: 'Team und Fahrzeuge zugewiesen.' }
  ]
};

const UmzugDetails = () => {
  const { id } = useParams();
  const [umzug, setUmzug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [neueNotiz, setNeueNotiz] = useState('');

  // Simuliere API-Aufruf
  useEffect(() => {
    const fetchUmzug = () => {
      // In einer echten Anwendung würde hier ein API-Aufruf mit der ID stattfinden
      setUmzug(mockUmzug);
      setLoading(false);
    };

    fetchUmzug();
  }, [id]);

  const handleNotizSubmit = (e) => {
    e.preventDefault();
    
    if (!neueNotiz.trim()) return;
    
    // Make sure umzug and aktivitaeten exist
    if (!umzug || !umzug.aktivitaeten) return;
    
    // In einer echten Anwendung würde hier ein API-Aufruf stattfinden
    const neueAktivitaet = {
      id: umzug.aktivitaeten.length + 1,
      datum: new Date().toLocaleDateString('de-DE'),
      uhrzeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      typ: 'Notiz',
      benutzer: 'Angemeldeter Benutzer', // In einer echten Anwendung aus dem Auth-Kontext nehmen
      notiz: neueNotiz
    };
    
    setUmzug({
      ...umzug,
      aktivitaeten: [...umzug.aktivitaeten, neueAktivitaet]
    });
    
    setNeueNotiz('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!umzug) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        Umzug nicht gefunden.
      </div>
    );
  }

  // StatusBadge Komponente
  const StatusBadge = ({ status }) => {
    let bgColor, textColor;
    
    switch (status) {
      case 'Geplant':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'In Vorbereitung':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'Abgeschlossen':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      {/* Kopfzeile mit Navigation und Aktionen */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center">
          <Link to="/umzuege" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Umzugsdetails</h1>
          <StatusBadge status={umzug.status} className="ml-4" />
        </div>
        
        <div className="flex space-x-3">
          <Link 
            to={`/umzuege/${id}/bearbeiten`}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <Edit size={16} className="mr-2" /> Bearbeiten
          </Link>
          <button 
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <Trash2 size={16} className="mr-2" /> Löschen
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hauptinformationen */}
        <div className="lg:col-span-2 space-y-6">
          {/* Übersicht */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Übersicht</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Kunde</h3>
                <p className="text-gray-900 font-medium">{umzug.kunde.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Umzugstyp</h3>
                <p className="text-gray-900">{umzug.typ}</p>
              </div>
              
              <div className="flex items-start">
                <Calendar size={18} className="mt-0.5 mr-2 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Datum</h3>
                  <p className="text-gray-900">{umzug.datum}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock size={18} className="mt-0.5 mr-2 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Uhrzeit</h3>
                  <p className="text-gray-900">{umzug.uhrzeit}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin size={18} className="mt-0.5 mr-2 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Startadresse</h3>
                  <p className="text-gray-900">{umzug.startadresse}</p>
                  <p className="text-sm text-gray-600">{umzug.etage_start}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin size={18} className="mt-0.5 mr-2 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Zieladresse</h3>
                  <p className="text-gray-900">{umzug.zieladresse}</p>
                  <p className="text-sm text-gray-600">{umzug.etage_ziel}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Umzugsvolumen</h3>
                <p className="text-gray-900">{umzug.umzugsvolumen}</p>
              </div>
            </div>
          </div>
          
          {/* Team und Ressourcen */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Team und Ressourcen</h2>
            
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Users size={18} className="mr-2 text-gray-400" />
                <h3 className="text-md font-medium">Mitarbeiter</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {umzug.mitarbeiter.map((ma) => (
                  <div key={ma.id} className="flex items-center p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                      {ma.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ma.name}</p>
                      <p className="text-xs text-gray-500">{ma.rolle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex items-center mb-2">
                <TruckElectric size={18} className="mr-2 text-gray-400" />
                <h3 className="text-md font-medium">Fahrzeuge</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {umzug.fahrzeuge.map((fahrzeug) => (
                  <div key={fahrzeug.id} className="flex items-center p-3 border rounded-lg">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <TruckElectric size={20} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{fahrzeug.kennzeichen}</p>
                      <p className="text-xs text-gray-500">{fahrzeug.typ}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Dokumente */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Dokumente</h2>
            
            <div className="space-y-3">
              {umzug.aufnahmeBericht && (
                <div className="flex items-center p-3 border rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Clipboard size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Aufnahmebericht</p>
                    <p className="text-xs text-gray-500">{umzug.aufnahmeBericht}</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Öffnen
                  </button>
                </div>
              )}
              
              {umzug.preisangebot && (
                <div className="flex items-center p-3 border rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <FileText size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Preisangebot</p>
                    <p className="text-xs text-gray-500">{umzug.preisangebot}</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Öffnen
                  </button>
                </div>
              )}
              
              {umzug.vertrag && (
                <div className="flex items-center p-3 border rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <FileText size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Vertrag</p>
                    <p className="text-xs text-gray-500">{umzug.vertrag}</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Öffnen
                  </button>
                </div>
              )}
              
              <button className="w-full mt-3 flex items-center justify-center py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <span className="text-sm font-medium">Dokument hinzufügen</span>
              </button>
            </div>
          </div>
          
          {/* Notizen */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Notizen</h2>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700 whitespace-pre-line">{umzug.notizen}</p>
            </div>
            
            <form onSubmit={handleNotizSubmit}>
              <div className="mb-3">
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Neue Notiz hinzufügen..."
                  value={neueNotiz}
                  onChange={(e) => setNeueNotiz(e.target.value)}
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                disabled={!neueNotiz.trim()}
              >
                <MessageSquare size={16} className="mr-2" /> Notiz hinzufügen
              </button>
            </form>
          </div>
        </div>
        
        {/* Seitenleiste */}
        <div className="space-y-6">
          {/* Kundeninformationen */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Kundeninformationen</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Kontaktperson</h3>
                <p className="text-gray-900 font-medium">{umzug.kunde.kontaktperson}</p>
              </div>
              
              <div className="flex items-start">
                <Phone size={18} className="mt-0.5 mr-2 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Telefon</h3>
                  <p className="text-gray-900">{umzug.kunde.telefon}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail size={18} className="mt-0.5 mr-2 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">E-Mail</h3>
                  <p className="text-gray-900">{umzug.kunde.email}</p>
                </div>
              </div>
              
              <div className="pt-3 border-t flex flex-col space-y-2">
                <button className="w-full py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center">
                  <Phone size={16} className="mr-2" /> Anrufen
                </button>
                <button className="w-full py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center">
                  <Mail size={16} className="mr-2" /> E-Mail senden
                </button>
              </div>
            </div>
          </div>
          
          {/* Aktivitätenprotokoll */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Aktivitätenprotokoll</h2>
            
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-2.5 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                {umzug.aktivitaeten.map((aktivitaet, index) => (
                  <div key={aktivitaet.id} className="relative pl-8">
                    <div className="absolute left-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                    </div>
                    
                    <div>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-1">
                        <p className="text-sm font-medium text-gray-900">{aktivitaet.typ}</p>
                        <div className="text-xs text-gray-500">
                          {aktivitaet.datum} um {aktivitaet.uhrzeit}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700">{aktivitaet.notiz}</p>
                      <p className="text-xs text-gray-500 mt-1">Von: {aktivitaet.benutzer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UmzugDetails;
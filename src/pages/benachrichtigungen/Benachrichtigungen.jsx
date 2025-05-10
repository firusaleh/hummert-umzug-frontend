// src/pages/benachrichtigungen/Benachrichtigungen.jsx
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Calendar, 
  Clock, 
  TruckElectric, 
  ClipboardList, 
  Users, 
  MessageSquare,
  FileText,
  CheckCircle,
  X
} from 'lucide-react';

// Beispieldaten für Benachrichtigungen
const mockBenachrichtigungen = [
  { 
    id: 1, 
    titel: 'Neuer Umzug geplant', 
    nachricht: 'Umzug für Familie Becker wurde für den 15.05.2025 geplant.',
    typ: 'umzug',
    erstellt: new Date(2025, 4, 5, 9, 17), // Jahr, Monat (0-11), Tag, Stunde, Minute
    gelesen: false,
    link: '/umzuege/1'
  },
  { 
    id: 2, 
    titel: 'Neue Aufnahme', 
    nachricht: 'Sarah Müller hat eine neue Aufnahme für Dr. Heinrich am 12.05.2025 eingetragen.',
    typ: 'aufnahme',
    erstellt: new Date(2025, 4, 4, 15, 30),
    gelesen: true,
    link: '/aufnahmen/3'
  },
  { 
    id: 3, 
    titel: 'Umzug aktualisiert', 
    nachricht: 'Der Umzug für Technik GmbH wurde von Markus Wolf aktualisiert.',
    typ: 'umzug',
    erstellt: new Date(2025, 4, 3, 11, 45),
    gelesen: false,
    link: '/umzuege/2'
  },
  { 
    id: 4, 
    titel: 'Teammeeting', 
    nachricht: 'Erinnerung: Teammeeting morgen um 9:00 Uhr.',
    typ: 'meeting',
    erstellt: new Date(2025, 4, 3, 10, 0),
    gelesen: true,
    link: '/zeitachse'
  },
  { 
    id: 5, 
    titel: 'Neuer Mitarbeiter', 
    nachricht: 'Alexander Jung wurde als neuer Mitarbeiter angelegt.',
    typ: 'mitarbeiter',
    erstellt: new Date(2025, 4, 1, 9, 0),
    gelesen: true,
    link: '/mitarbeiter/5'
  },
  { 
    id: 6, 
    titel: 'Dokument hochgeladen', 
    nachricht: 'Markus Wolf hat ein neues Dokument zum Umzug von Familie Becker hochgeladen.',
    typ: 'dokument',
    erstellt: new Date(2025, 4, 1, 8, 30),
    gelesen: false,
    link: '/umzuege/1'
  },
  { 
    id: 7, 
    titel: 'Aufnahme abgeschlossen', 
    nachricht: 'Die Aufnahme für Familie Krämer wurde abgeschlossen.',
    typ: 'aufnahme',
    erstellt: new Date(2025, 3, 28, 16, 20), // April
    gelesen: true,
    link: '/aufnahmen/5'
  },
];

const Benachrichtigungen = () => {
  const [benachrichtigungen, setBenachrichtigungen] = useState([]);
  const [filterStatus, setFilterStatus] = useState('alle'); // 'alle', 'gelesen', 'ungelesen'
  const [filteredBenachrichtigungen, setFilteredBenachrichtigungen] = useState([]);

  // Simuliere API-Aufruf
  useEffect(() => {
    const fetchBenachrichtigungen = () => {
      setBenachrichtigungen(mockBenachrichtigungen);
    };

    fetchBenachrichtigungen();
  }, []);

  // Filtern der Benachrichtigungen
  useEffect(() => {
    let filtered = [...benachrichtigungen];
    
    if (filterStatus === 'gelesen') {
      filtered = filtered.filter(n => n.gelesen);
    } else if (filterStatus === 'ungelesen') {
      filtered = filtered.filter(n => !n.gelesen);
    }
    
    // Nach Erstelldatum sortieren (neueste zuerst)
    filtered.sort((a, b) => b.erstellt - a.erstellt);
    
    setFilteredBenachrichtigungen(filtered);
  }, [benachrichtigungen, filterStatus]);

  // Markiert eine Benachrichtigung als gelesen
  const markAsRead = (id) => {
    setBenachrichtigungen(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, gelesen: true } 
          : notification
      )
    );
  };

  // Markiert alle Benachrichtigungen als gelesen
  const markAllAsRead = () => {
    setBenachrichtigungen(prev => 
      prev.map(notification => ({ ...notification, gelesen: true }))
    );
  };

  // Löscht eine Benachrichtigung
  const deleteNotification = (id) => {
    setBenachrichtigungen(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  // Löscht alle gelesenen Benachrichtigungen
  const deleteAllRead = () => {
    setBenachrichtigungen(prev => 
      prev.filter(notification => !notification.gelesen)
    );
  };

  // Formatiert das Datum relativ zur aktuellen Zeit
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return "gerade eben";
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} ${diffInMinutes === 1 ? 'Minute' : 'Minuten'}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `vor ${diffInHours} ${diffInHours === 1 ? 'Stunde' : 'Stunden'}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `vor ${diffInDays} ${diffInDays === 1 ? 'Tag' : 'Tagen'}`;
    }
    
    // Für ältere Benachrichtigungen das vollständige Datum anzeigen
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Icon basierend auf Benachrichtigungstyp
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'umzug':
        return <TruckElectric size={20} className="text-blue-500" />;
      case 'aufnahme':
        return <ClipboardList size={20} className="text-green-500" />;
      case 'meeting':
        return <Calendar size={20} className="text-purple-500" />;
      case 'mitarbeiter':
        return <Users size={20} className="text-orange-500" />;
      case 'dokument':
        return <FileText size={20} className="text-red-500" />;
      case 'nachricht':
        return <MessageSquare size={20} className="text-yellow-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  // Zählt ungelesene Benachrichtigungen
  const ungeleseneAnzahl = benachrichtigungen.filter(n => !n.gelesen).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">Benachrichtigungen</h1>
          {ungeleseneAnzahl > 0 && (
            <span className="ml-3 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
              {ungeleseneAnzahl} ungelesen
            </span>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={markAllAsRead}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={!benachrichtigungen.some(n => !n.gelesen)}
          >
            <CheckCircle size={16} className="mr-2" />
            <span>Alle als gelesen markieren</span>
          </button>
          
          <button 
            onClick={deleteAllRead}
            className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            disabled={!benachrichtigungen.some(n => n.gelesen)}
          >
            <Trash2 size={16} className="mr-2" />
            <span>Gelesene löschen</span>
          </button>
        </div>
      </div>
      
      {/* Filter-Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setFilterStatus('alle')}
              className={`px-4 py-3 text-sm font-medium ${
                filterStatus === 'alle'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilterStatus('ungelesen')}
              className={`px-4 py-3 text-sm font-medium ${
                filterStatus === 'ungelesen'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ungelesen
            </button>
            <button
              onClick={() => setFilterStatus('gelesen')}
              className={`px-4 py-3 text-sm font-medium ${
                filterStatus === 'gelesen'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gelesen
            </button>
          </nav>
        </div>
        
        {/* Benachrichtigungsliste */}
        <div className="divide-y">
          {filteredBenachrichtigungen.length > 0 ? (
            filteredBenachrichtigungen.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 ${!notification.gelesen ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {getNotificationIcon(notification.typ)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.titel}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(notification.erstellt)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.nachricht}
                    </p>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0 flex">
                    {!notification.gelesen && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="mr-2 text-gray-400 hover:text-green-500"
                        title="Als gelesen markieren"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-500"
                      title="Löschen"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <a 
                    href={notification.link} 
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Details anzeigen
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium">Keine Benachrichtigungen vorhanden</p>
              <p className="text-sm">
                {filterStatus === 'alle' 
                  ? 'Du hast keine Benachrichtigungen.' 
                  : filterStatus === 'ungelesen' 
                    ? 'Du hast keine ungelesenen Benachrichtigungen.' 
                    : 'Du hast keine gelesenen Benachrichtigungen.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Benachrichtigungen;
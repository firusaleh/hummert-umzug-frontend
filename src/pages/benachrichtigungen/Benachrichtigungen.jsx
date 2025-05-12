import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, X, Trash2, Filter, Search } from 'lucide-react';
import api, { benachrichtigungenService } from '../../services/api';

export default function Benachrichtigungen() {
  const [benachrichtigungen, setBenachrichtigungen] = useState([]);
  const [filter, setFilter] = useState('alle');
  const [suchbegriff, setSuchbegriff] = useState('');

  // Daten laden
  useEffect(() => {
    const fetchBenachrichtigungen = async () => {
      try {
        // API-Aufruf für Benachrichtigungen
        const response = await benachrichtigungenService.getAll();
        setBenachrichtigungen(response.data);
      } catch (error) {
        console.error('Fehler beim Laden der Benachrichtigungen:', error);
        
        // Simulierte Daten für Demo im Fehlerfall
        const mockBenachrichtigungen = [
          {
            id: 1,
            typ: 'aufnahme',
            titel: 'Neue Umzugsaufnahme',
            nachricht: 'Eine neue Umzugsaufnahme wurde für Kunde Müller erstellt.',
            datum: '2025-05-10T10:30:00',
            gelesen: false,
            prioritaet: 'mittel'
          },
          {
            id: 2,
            typ: 'umzug',
            titel: 'Umzug heute',
            nachricht: 'Der Umzug für Firma Schneider beginnt heute um 8:00 Uhr.',
            datum: '2025-05-11T08:00:00',
            gelesen: false,
            prioritaet: 'hoch'
          },
          {
            id: 3,
            typ: 'system',
            titel: 'Systemwartung',
            nachricht: 'Das System wird heute Abend um 22:00 Uhr für Wartungsarbeiten kurzzeitig nicht verfügbar sein.',
            datum: '2025-05-09T15:00:00',
            gelesen: true,
            prioritaet: 'niedrig'
          },
          {
            id: 4,
            typ: 'umzug',
            titel: 'Umzug verschoben',
            nachricht: 'Der Umzug für Kunde Weber wurde auf den 15.05.2025 verschoben.',
            datum: '2025-05-08T11:45:00',
            gelesen: true,
            prioritaet: 'mittel'
          },
          {
            id: 5,
            typ: 'aufnahme',
            titel: 'Aufnahme bestätigt',
            nachricht: 'Die Umzugsaufnahme für Kunde Schmidt wurde für den 20.05.2025 um 14:00 Uhr bestätigt.',
            datum: '2025-05-07T09:15:00',
            gelesen: false,
            prioritaet: 'mittel'
          }
        ];
        
        setBenachrichtigungen(mockBenachrichtigungen);
      }
    };

    fetchBenachrichtigungen();
  }, []);

  // Benachrichtigung als gelesen markieren
  const markAsRead = async (id) => {
    try {
      await benachrichtigungenService.markAsRead(id);
      
      setBenachrichtigungen(
        benachrichtigungen.map(benachrichtigung => 
          benachrichtigung.id === id 
            ? { ...benachrichtigung, gelesen: true } 
            : benachrichtigung
        )
      );
    } catch (error) {
      console.error('Fehler beim Markieren als gelesen:', error);
    }
  };

  // Benachrichtigung löschen
  const deleteNotification = async (id) => {
    try {
      await benachrichtigungenService.delete(id);
      
      setBenachrichtigungen(
        benachrichtigungen.filter(benachrichtigung => benachrichtigung.id !== id)
      );
    } catch (error) {
      console.error('Fehler beim Löschen der Benachrichtigung:', error);
    }
  };

  // Alle Benachrichtigungen als gelesen markieren
  const markAllAsRead = async () => {
    try {
      await benachrichtigungenService.markAllAsRead();
      
      setBenachrichtigungen(
        benachrichtigungen.map(benachrichtigung => ({ ...benachrichtigung, gelesen: true }))
      );
    } catch (error) {
      console.error('Fehler beim Markieren aller Benachrichtigungen als gelesen:', error);
    }
  };

  // Alle Benachrichtigungen löschen
  const deleteAllNotifications = async () => {
    try {
      await benachrichtigungenService.deleteAllRead();
      
      setBenachrichtigungen([]);
    } catch (error) {
      console.error('Fehler beim Löschen aller Benachrichtigungen:', error);
    }
  };

  // Formatiert das Datum der Benachrichtigung
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Heute, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Gestern, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Priorität als Badge anzeigen
  const PrioritaetBadge = ({ prioritaet }) => {
    let bgColor, textColor;
    
    switch (prioritaet) {
      case 'hoch':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
      case 'mittel':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'niedrig':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {prioritaet.charAt(0).toUpperCase() + prioritaet.slice(1)}
      </span>
    );
  };

  // Gefilterte Benachrichtigungen
  const filteredBenachrichtigungen = benachrichtigungen.filter(benachrichtigung => {
    // Filter nach Status
    if (filter === 'ungelesen' && benachrichtigung.gelesen) return false;
    if (filter === 'gelesen' && !benachrichtigung.gelesen) return false;
    
    // Filter nach Suchbegriff
    if (suchbegriff && !benachrichtigung.titel.toLowerCase().includes(suchbegriff.toLowerCase()) && 
        !benachrichtigung.nachricht.toLowerCase().includes(suchbegriff.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Benachrichtigungen</h1>
      
      {/* Filter und Aktionen */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <div className="relative sm:w-64">
            <input
              type="text"
              placeholder="Suchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="alle">Alle</option>
              <option value="ungelesen">Ungelesen</option>
              <option value="gelesen">Gelesen</option>
            </select>
          </div>
        </div>
        
        <div className="flex space-x-2 w-full md:w-auto">
          <button
            onClick={markAllAsRead}
            className="px-3 py-2 border rounded-lg flex items-center justify-center hover:bg-gray-50 w-full md:w-auto"
            disabled={!benachrichtigungen.some(b => !b.gelesen)}
          >
            <CheckCircle size={18} className="mr-2" />
            Alle als gelesen markieren
          </button>
          
          <button
            onClick={deleteAllNotifications}
            className="px-3 py-2 border rounded-lg flex items-center justify-center hover:bg-gray-50 text-red-600 w-full md:w-auto"
            disabled={benachrichtigungen.length === 0}
          >
            <Trash2 size={18} className="mr-2" />
            Alle löschen
          </button>
        </div>
      </div>
      
      {/* Benachrichtigungen Liste */}
      {filteredBenachrichtigungen.length > 0 ? (
        <div className="space-y-4">
          {filteredBenachrichtigungen.map((benachrichtigung) => (
            <div
              key={benachrichtigung.id}
              className={`p-4 rounded-lg shadow flex items-start ${benachrichtigung.gelesen ? 'bg-white' : 'bg-blue-50'}`}
            >
              <div className="flex-shrink-0 mt-1">
                <Bell size={20} className={`mr-4 ${benachrichtigung.gelesen ? 'text-gray-400' : 'text-blue-500'}`} />
              </div>
              
              <div className="flex-grow">
                <div className="flex flex-wrap justify-between items-start">
                  <h3 className={`text-lg ${benachrichtigung.gelesen ? 'font-medium' : 'font-semibold'}`}>
                    {benachrichtigung.titel}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <PrioritaetBadge prioritaet={benachrichtigung.prioritaet} />
                    <span className="text-sm text-gray-500 ml-2">
                      {formatDate(benachrichtigung.datum)}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mt-1">
                  {benachrichtigung.nachricht}
                </p>
              </div>
              
              <div className="flex-shrink-0 ml-4 flex space-x-1">
                {!benachrichtigung.gelesen && (
                  <button
                    onClick={() => markAsRead(benachrichtigung.id)}
                    className="p-1 rounded-full hover:bg-blue-100"
                    title="Als gelesen markieren"
                  >
                    <CheckCircle size={18} className="text-blue-600" />
                  </button>
                )}
                
                <button
                  onClick={() => deleteNotification(benachrichtigung.id)}
                  className="p-1 rounded-full hover:bg-red-100"
                  title="Löschen"
                >
                  <X size={18} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Keine Benachrichtigungen</h3>
          <p className="text-gray-500">
            Es sind keine Benachrichtigungen vorhanden, die den Filterkriterien entsprechen.
          </p>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, List, Grid } from 'lucide-react';
import api from '../../services/api';

export default function Zeitachse() {
  // State für Datum und Ansicht
  const [currentView, setCurrentView] = useState('month'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation für Datum
  const navigateNext = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (currentView === 'day') {
        next.setDate(next.getDate() + 1);
      } else if (currentView === 'week') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    });
  };
  
  const navigatePrev = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (currentView === 'day') {
        newDate.setDate(newDate.getDate() - 1);
      } else if (currentView === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      return newDate;
    });
  };
  
  const navigateToday = () => {
    setCurrentDate(new Date());
  };
  
  // Formatiert Datum für Anzeige
  const formatDate = () => {
    const options = { year: 'numeric', month: 'long' };
    if (currentView === 'day') {
      options.day = 'numeric';
      return currentDate.toLocaleDateString('de-DE', options);
    } else if (currentView === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.getDate()} - ${weekEnd.getDate()}. ${weekStart.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
      } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
        return `${weekStart.getDate()}. ${weekStart.toLocaleDateString('de-DE', { month: 'long' })} - ${weekEnd.getDate()}. ${weekEnd.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
      } else {
        return `${weekStart.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })} - ${weekEnd.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      }
    } else {
      return currentDate.toLocaleDateString('de-DE', options);
    }
  };
  
  // Lade Events vom Server
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // In einer echten Anwendung würde hier ein API-Aufruf stattfinden
        // const response = await api.get('/events', {
        //   params: {
        //     startDate: getStartDate(),
        //     endDate: getEndDate(),
        //     view: currentView
        //   }
        // });
        // setEvents(response.data);
        
        // Simuliere Daten für Demo
        const mockEvents = [
          {
            id: 1,
            title: 'Umzug Familie Müller',
            start: new Date(2025, 4, 10, 8, 0),
            end: new Date(2025, 4, 10, 16, 0),
            type: 'umzug',
            status: 'geplant',
            location: 'Berlin → München',
            color: '#4f46e5'
          },
          {
            id: 2,
            title: 'Umzugsaufnahme Schmidt',
            start: new Date(2025, 4, 12, 14, 0),
            end: new Date(2025, 4, 12, 15, 30),
            type: 'aufnahme',
            status: 'angefragt',
            location: 'Frankfurt',
            color: '#0891b2'
          },
          {
            id: 3,
            title: 'Firmenumzug Tech GmbH',
            start: new Date(2025, 4, 15, 7, 0),
            end: new Date(2025, 4, 16, 18, 0),
            type: 'umzug',
            status: 'geplant',
            location: 'Hamburg → Berlin',
            color: '#4f46e5'
          },
          {
            id: 4,
            title: 'Inventaraufnahme Weber',
            start: new Date(2025, 4, 18, 10, 0),
            end: new Date(2025, 4, 18, 11, 30),
            type: 'aufnahme',
            status: 'geplant',
            location: 'München',
            color: '#0891b2'
          },
          {
            id: 5,
            title: 'Teammeeting',
            start: new Date(2025, 4, 20, 9, 0),
            end: new Date(2025, 4, 20, 10, 0),
            type: 'meeting',
            status: 'geplant',
            location: 'Büro',
            color: '#a855f7'
          },
          {
            id: 6,
            title: 'Umzug Familie Bauer',
            start: new Date(2025, 4, 25, 8, 0),
            end: new Date(2025, 4, 25, 16, 0),
            type: 'umzug',
            status: 'geplant',
            location: 'München → Stuttgart',
            color: '#4f46e5'
          }
        ];
        
        setEvents(mockEvents);
        setLoading(false);
      } catch (error) {
        console.error('Fehler beim Laden der Events:', error);
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [currentDate, currentView]);
  
  // Hilfsfunktionen für Datumsberechnung
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay() || 7;
  };
  
  const getMonthGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const totalCells = 42; // 6 rows x 7 days
    
    const grid = [];
    let day = 1;
    
    // Vorheriger Monat
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthDays = getDaysInMonth(prevMonth);
    
    // Nächster Monat
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Grid erstellen
    for (let i = 1; i <= totalCells; i++) {
      if (i < firstDay) {
        // Tage aus dem vorherigen Monat
        const prevMonthDay = prevMonthDays - (firstDay - i - 1);
        const date = new Date(prevMonth);
        date.setDate(prevMonthDay);
        grid.push({
          date,
          day: prevMonthDay,
          isCurrentMonth: false,
          events: events.filter(event => 
            event.start.getDate() === date.getDate() &&
            event.start.getMonth() === date.getMonth() &&
            event.start.getFullYear() === date.getFullYear()
          )
        });
      } else if (i >= firstDay && day <= daysInMonth) {
        // Tage aus dem aktuellen Monat
        const date = new Date(currentDate);
        date.setDate(day);
        grid.push({
          date,
          day,
          isCurrentMonth: true,
          isToday: 
            date.getDate() === new Date().getDate() &&
            date.getMonth() === new Date().getMonth() &&
            date.getFullYear() === new Date().getFullYear(),
          events: events.filter(event => 
            event.start.getDate() === date.getDate() &&
            event.start.getMonth() === date.getMonth() &&
            event.start.getFullYear() === date.getFullYear()
          )
        });
        day++;
      } else {
        // Tage aus dem nächsten Monat
        const nextMonthDay = i - (firstDay + daysInMonth - 1);
        const date = new Date(nextMonth);
        date.setDate(nextMonthDay);
        grid.push({
          date,
          day: nextMonthDay,
          isCurrentMonth: false,
          events: events.filter(event => 
            event.start.getDate() === date.getDate() &&
            event.start.getMonth() === date.getMonth() &&
            event.start.getFullYear() === date.getFullYear()
          )
        });
      }
    }
    
    return grid;
  };
  
  // Ansicht rendern basierend auf currentView
  const renderView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (currentView === 'month') {
      const grid = getMonthGrid();
      const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      
      return (
        <div className="bg-white rounded-lg shadow">
          {/* Wochentage */}
          <div className="grid grid-cols-7 border-b">
            {weekdays.map((day, index) => (
              <div key={index} className="py-2 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>
          
          {/* Kalender-Grid */}
          <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr border-b">
            {grid.map((cell, index) => (
              <div
                key={index}
                className={`min-h-24 p-1 border-r border-b ${
                  cell.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${cell.isToday ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-end">
                  <span className={`inline-flex items-center justify-center w-6 h-6 text-sm ${
                    cell.isToday
                      ? 'bg-blue-600 text-white rounded-full'
                      : cell.isCurrentMonth
                        ? 'text-gray-700'
                        : 'text-gray-400'
                  }`}>
                    {cell.day}
                  </span>
                </div>
                
                <div className="mt-1 space-y-1 text-xs">
                  {cell.events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="px-1 py-0.5 rounded truncate"
                      style={{ backgroundColor: `${event.color}20`, color: event.color }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {cell.events.length > 3 && (
                    <div className="text-xs text-gray-500 pl-1">
                      +{cell.events.length - 3} mehr
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (currentView === 'week') {
      // Hier würde eine Wochenansicht implementiert werden
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-center text-gray-500">Wochenansicht wird noch implementiert...</p>
        </div>
      );
    } else {
      // Tagesansicht
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-center text-gray-500">Tagesansicht wird noch implementiert...</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Zeitachse</h1>
      
      {/* Navigation */}
      <div className="bg-white rounded-lg shadow flex flex-col sm:flex-row items-center p-4 space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <button
            onClick={navigatePrev}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={navigateToday}
            className="mx-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            Heute
          </button>
          
          <button
            onClick={navigateNext}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
          
          <h2 className="text-lg font-semibold ml-3">
            {formatDate()}
          </h2>
        </div>
        
        <div className="flex space-x-2 sm:ml-auto">
          <button
            onClick={() => setCurrentView('day')}
            className={`px-3 py-1 text-sm rounded-md ${
              currentView === 'day'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tag
          </button>
          
          <button
            onClick={() => setCurrentView('week')}
            className={`px-3 py-1 text-sm rounded-md ${
              currentView === 'week'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Woche
          </button>
          
          <button
            onClick={() => setCurrentView('month')}
            className={`px-3 py-1 text-sm rounded-md ${
              currentView === 'month'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monat
          </button>
        </div>
      </div>
      
      {/* Legende */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-[#4f46e5] mr-1"></span>
          <span className="text-sm text-gray-600">Umzug</span>
        </div>
        
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-[#0891b2] mr-1"></span>
          <span className="text-sm text-gray-600">Aufnahme</span>
        </div>
        
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-[#a855f7] mr-1"></span>
          <span className="text-sm text-gray-600">Meeting</span>
        </div>
      </div>
      
      {/* Kalenderansicht */}
      {renderView()}
    </div>
  );
}
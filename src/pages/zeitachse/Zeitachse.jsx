// src/pages/zeitachse/Zeitachse.jsx
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  TruckElectric, 
  ClipboardList, 
  Users, 
  Filter,
  List,
  Grid
} from 'lucide-react';

// Beispieldaten für den Kalender
const mockEvents = [
  { 
    id: 1, 
    title: 'Umzug Familie Becker', 
    typ: 'umzug', 
    startDate: new Date(2025, 4, 15, 8, 0), // Jahr, Monat (0-11), Tag, Stunde, Minute
    endDate: new Date(2025, 4, 15, 16, 0),
    kunde: 'Familie Becker',
    adresse: 'Rosenweg 8, 10115 Berlin',
    mitarbeiter: ['Max Mustermann', 'Anna Schmidt', 'Lukas Meyer', 'Julia Weber'],
    status: 'Geplant'
  },
  { 
    id: 2, 
    title: 'Umzug Technik GmbH', 
    typ: 'umzug', 
    startDate: new Date(2025, 4, 18, 8, 0),
    endDate: new Date(2025, 4, 18, 17, 0),
    kunde: 'Technik GmbH',
    adresse: 'Industrieweg 42, 70565 Stuttgart',
    mitarbeiter: ['Max Mustermann', 'Felix Schulz', 'Laura König', 'Anna Schmidt'],
    status: 'In Vorbereitung'
  },
  { 
    id: 3, 
    title: 'Aufnahme Dr. Heinrich', 
    typ: 'aufnahme', 
    startDate: new Date(2025, 4, 12, 10, 0),
    endDate: new Date(2025, 4, 12, 11, 30),
    kunde: 'Dr. Heinrich',
    adresse: 'Lindenweg 12, 10115 Berlin',
    mitarbeiter: ['Sarah Müller'],
    status: 'Geplant'
  },
  { 
    id: 4, 
    title: 'Aufnahme Elektronik GmbH', 
    typ: 'aufnahme', 
    startDate: new Date(2025, 4, 14, 14, 30),
    endDate: new Date(2025, 4, 14, 16, 0),
    kunde: 'Elektronik GmbH',
    adresse: 'Industrieweg 42, 70565 Stuttgart',
    mitarbeiter: ['Markus Wolf'],
    status: 'Geplant'
  },
  { 
    id: 5, 
    title: 'Aufnahme Familie Krämer', 
    typ: 'aufnahme', 
    startDate: new Date(2025, 4, 8, 9, 15),
    endDate: new Date(2025, 4, 8, 10, 45),
    kunde: 'Familie Krämer',
    adresse: 'Sonnenallee 8, 20095 Hamburg',
    mitarbeiter: ['Sarah Müller'],
    status: 'Abgeschlossen'
  },
  { 
    id: 6, 
    title: 'Teammeeting', 
    typ: 'meeting', 
    startDate: new Date(2025, 4, 10, 9, 0),
    endDate: new Date(2025, 4, 10, 10, 30),
    mitarbeiter: ['Max Mustermann', 'Anna Schmidt', 'Lukas Meyer', 'Sarah Müller', 'Markus Wolf'],
    status: 'Geplant'
  },
];

// Hilfsfunktionen für Datum und Zeit
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const formatTime = (date) => date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
const formatDate = (date) => date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatDateShort = (date) => date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
const formatMonthYear = (date) => date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

const Zeitachse = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('monat'); // 'monat', 'woche', 'tag', 'liste'
  const [typeFilter, setTypeFilter] = useState('alle');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [events, setEvents] = useState([]);

  // Simuliere API-Aufruf
  useEffect(() => {
    const fetchEvents = () => {
      setEvents(mockEvents);
    };

    fetchEvents();
  }, []);

  // Filtert Events basierend auf Typ und aktuellem Zeitraum
  useEffect(() => {
    let filtered = [...events];
    
    // Filter nach Typ
    if (typeFilter !== 'alle') {
      filtered = filtered.filter((event) => event.typ === typeFilter);
    }
    
    setFilteredEvents(filtered);
  }, [events, typeFilter]);

  // Navigation zum vorherigen Zeitraum
  const prevPeriod = () => {
    setCurrentDate(prevDate => {
      const date = new Date(prevDate);
      
      if (currentView === 'monat') {
        date.setMonth(date.getMonth() - 1);
      } else if (currentView === 'woche') {
        date.setDate(date.getDate() - 7);
      } else if (currentView === 'tag') {
        date.setDate(date.getDate() - 1);
      }
      
      return date;
    });
  };

  // Navigation zum nächsten Zeitraum
  const nextPeriod = () => {
    setCurrentDate(prevDate => {
      const date = new Date(prevDate);
      
      if (currentView === 'monat') {
        date.setMonth(date.getMonth() + 1);
      } else if (currentView === 'woche') {
        date.setDate(date.getDate() + 7);
      } else if (currentView === 'tag') {
        date.setDate(date.getDate() + 1);
      }
      
      return date;
    });
  };

  // Navigation zum aktuellen Datum
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // DropdownMenu-Komponente für Event-Details
  const EventDetailMenu = ({ event }) => {
    return (
      <div className="absolute z-10 w-64 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-1">{event.title}</h3>
        <div className="text-sm text-gray-600 space-y-1 mb-2">
          <p>{formatDate(event.startDate)}</p>
          <p>{formatTime(event.startDate)} - {formatTime(event.endDate)}</p>
          {event.kunde && <p><span className="font-medium">Kunde:</span> {event.kunde}</p>}
          {event.adresse && <p><span className="font-medium">Adresse:</span> {event.adresse}</p>}
        </div>
        <div className="text-xs text-gray-500">
          <p><span className="font-medium">Team:</span> {event.mitarbeiter.join(', ')}</p>
          <p><span className="font-medium">Status:</span> {event.status}</p>
        </div>
        <div className="mt-3 flex justify-end">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Details
          </button>
        </div>
      </div>
    );
  };

  // Kalender im Monatsformat
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    // Anpassen des Wochenstarts von Sonntag (0) auf Montag (1)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Alle Tage des Monats erstellen
    const days = [];
    
    // Vorherige Monatstage für die erste Woche
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - adjustedFirstDay + i + 1),
        currentMonth: false
      });
    }
    
    // Aktuelle Monatstage
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        currentMonth: true
      });
    }
    
    // Nächste Monatstage für die letzte Woche
    const remainingCells = 42 - days.length; // 6 Wochen * 7 Tage = 42 Zellen insgesamt
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        currentMonth: false
      });
    }
    
    // Events für jeden Tag finden
    days.forEach(day => {
      day.events = filteredEvents.filter(event => isSameDay(event.startDate, day.date));
    });
    
    // Gruppiere Tage in Wochen
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Wochentage Header */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 text-center font-medium text-gray-700 border-b">
          <div className="py-2">Mo</div>
          <div className="py-2">Di</div>
          <div className="py-2">Mi</div>
          <div className="py-2">Do</div>
          <div className="py-2">Fr</div>
          <div className="py-2">Sa</div>
          <div className="py-2">So</div>
        </div>
        
        {/* Kalender-Grid */}
        <div className="grid grid-cols-7 grid-rows-6 gap-px bg-gray-200">
          {weeks.map((week, weekIndex) => (
            week.map((day, dayIndex) => {
              const isToday = isSameDay(day.date, new Date());
              
              return (
                <div 
                  key={`${weekIndex}-${dayIndex}`}
                  className={`relative min-h-32 bg-white ${
                    day.currentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`p-1 text-right ${isToday ? 'font-bold text-blue-600' : ''}`}>
                    {day.date.getDate()}
                  </div>
                  
                  <div className="p-1 space-y-1 overflow-y-auto max-h-24">
                    {day.events.map((event) => {
                      const getEventColor = (typ) => {
                        switch (typ) {
                          case 'umzug':
                            return 'bg-blue-100 text-blue-800 border-blue-200';
                          case 'aufnahme':
                            return 'bg-green-100 text-green-800 border-green-200';
                          case 'meeting':
                            return 'bg-purple-100 text-purple-800 border-purple-200';
                          default:
                            return 'bg-gray-100 text-gray-800 border-gray-200';
                        }
                      };
                      
                      const getEventIcon = (typ) => {
                        switch (typ) {
                          case 'umzug':
                            return <TruckElectric size={12} />;
                          case 'aufnahme':
                            return <ClipboardList size={12} />;
                          case 'meeting':
                            return <Users size={12} />;
                          default:
                            return null;
                        }
                      };
                      
                      return (
                        <div
                          key={event.id}
                          className={`${getEventColor(event.typ)} text-xs p-1 rounded border truncate relative cursor-pointer group`}
                        >
                          <div className="flex items-center">
                            <span className="mr-1">{getEventIcon(event.typ)}</span>
                            <span className="truncate">{event.title}</span>
                          </div>
                          
                          <div className="hidden group-hover:block">
                            <EventDetailMenu event={event} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ))}
        </div>
      </div>
    );
  };

  // Kalender im Wochenformat
  const renderWeekView = () => {
    // Wochentage ausgehend vom aktuellen Datum berechnen
    const currentDay = currentDate.getDay(); // 0 = Sonntag, 1 = Montag, ...
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // Anpassung für Montag als Wochenanfang
    
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - daysToMonday);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      // Events für diesen Tag finden
      const dayEvents = filteredEvents.filter(event => isSameDay(event.startDate, day));
      
      weekDays.push({
        date: day,
        events: dayEvents
      });
    }
    
    // Stunden für die Zeitanzeige
    const hours = [];
    for (let i = 6; i < 22; i++) {
      hours.push(i);
    }
    
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Header mit Wochentagen */}
        <div className="grid grid-cols-8 text-center border-b">
          <div className="py-2 border-r"></div>
          {weekDays.map((day, index) => {
            const isToday = isSameDay(day.date, new Date());
            
            return (
              <div 
                key={index} 
                className={`py-2 font-medium ${isToday ? 'bg-blue-50 text-blue-600' : ''}`}
              >
                <div>{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][index]}</div>
                <div className={`text-lg ${isToday ? 'font-bold' : ''}`}>{day.date.getDate()}</div>
              </div>
            );
          })}
        </div>
        
        {/* Zeitleiste */}
        <div className="grid grid-cols-8">
          {/* Zeitslots */}
          <div className="col-span-1 border-r">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b text-xs text-right pr-1 text-gray-500">
                {hour}:00
              </div>
            ))}
          </div>
          
          {/* Tagesansichten */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="col-span-1 relative">
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-b border-r border-gray-200"></div>
              ))}
              
              {/* Events für den Tag positionieren */}
              {day.events.map((event) => {
                const startHour = event.startDate.getHours();
                const startMinutes = event.startDate.getMinutes();
                const endHour = event.endDate.getHours();
                const endMinutes = event.endDate.getMinutes();
                
                // Position und Höhe basierend auf Zeiten berechnen
                const startFromTop = (startHour - 6) * 64 + (startMinutes / 60) * 64; // 64px pro Stunde (16px * 4)
                const durationInMinutes = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
                const height = (durationInMinutes / 60) * 64;
                
                // Event-Farbe basierend auf Typ
                const getEventColor = (typ) => {
                  switch (typ) {
                    case 'umzug':
                      return 'bg-blue-100 text-blue-800 border-blue-200';
                    case 'aufnahme':
                      return 'bg-green-100 text-green-800 border-green-200';
                    case 'meeting':
                      return 'bg-purple-100 text-purple-800 border-purple-200';
                    default:
                      return 'bg-gray-100 text-gray-800 border-gray-200';
                  }
                };
                
                // Event-Icon basierend auf Typ
                const getEventIcon = (typ) => {
                  switch (typ) {
                    case 'umzug':
                      return <TruckElectric size={12} />;
                    case 'aufnahme':
                      return <ClipboardList size={12} />;
                    case 'meeting':
                      return <Users size={12} />;
                    default:
                      return null;
                  }
                };
                
                return (
                  <div
                    key={event.id}
                    className={`absolute left-0 right-0 mx-1 rounded-md border overflow-hidden text-xs group cursor-pointer ${getEventColor(event.typ)}`}
                    style={{
                      top: `${startFromTop}px`,
                      height: `${height}px`,
                      minHeight: '24px',
                      zIndex: 10
                    }}
                  >
                    <div className="p-1">
                      <div className="flex items-center mb-1">
                        <span className="mr-1">{getEventIcon(event.typ)}</span>
                        <span className="font-medium truncate">{event.title}</span>
                      </div>
                      <div className="text-xs">{formatTime(event.startDate)} - {formatTime(event.endDate)}</div>
                    </div>
                    
                    <div className="hidden group-hover:block absolute top-full left-0 z-50">
                      <EventDetailMenu event={event} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Kalender im Tagesformat
  const renderDayView = () => {
    // Stunden für die Zeitanzeige
    const hours = [];
    for (let i = 6; i < 22; i++) {
      hours.push(i);
    }
    
    // Events für den aktuellen Tag finden
    const dayEvents = filteredEvents.filter(event => isSameDay(event.startDate, currentDate));
    
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Header mit Tagesdatum */}
        <div className="p-4 border-b flex justify-center items-center">
          <h2 className="text-xl font-semibold">{formatDate(currentDate)}</h2>
        </div>
        
        {/* Zeitleiste */}
        <div className="grid grid-cols-12">
          {/* Zeitspalte */}
          <div className="col-span-1 border-r">
            {hours.map((hour) => (
              <div key={hour} className="h-20 border-b text-xs text-right pr-1 text-gray-500">
                {hour}:00
              </div>
            ))}
          </div>
          
          {/* Terminansicht */}
          <div className="col-span-11 relative">
            {hours.map((hour) => (
              <div key={hour} className="h-20 border-b border-gray-200"></div>
            ))}
            
            {/* Events positionieren */}
            {dayEvents.map((event) => {
              const startHour = event.startDate.getHours();
              const startMinutes = event.startDate.getMinutes();
              const endHour = event.endDate.getHours();
              const endMinutes = event.endDate.getMinutes();
              
              // Position und Höhe basierend auf Zeiten berechnen
              const startFromTop = (startHour - 6) * 80 + (startMinutes / 60) * 80; // 80px pro Stunde (20px * 4)
              const durationInMinutes = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
              const height = (durationInMinutes / 60) * 80;
              
              // Event-Farbe basierend auf Typ
              const getEventColor = (typ) => {
                switch (typ) {
                  case 'umzug':
                    return 'bg-blue-100 text-blue-800 border-blue-200';
                  case 'aufnahme':
                    return 'bg-green-100 text-green-800 border-green-200';
                  case 'meeting':
                    return 'bg-purple-100 text-purple-800 border-purple-200';
                  default:
                    return 'bg-gray-100 text-gray-800 border-gray-200';
                }
              };
              
              // Event-Icon basierend auf Typ
              const getEventIcon = (typ) => {
                switch (typ) {
                  case 'umzug':
                    return <TruckElectric size={16} />;
                  case 'aufnahme':
                    return <ClipboardList size={16} />;
                  case 'meeting':
                    return <Users size={16} />;
                  default:
                    return null;
                }
              };
              
              return (
                <div
                  key={event.id}
                  className={`absolute left-4 right-4 rounded-md border ${getEventColor(event.typ)}`}
                  style={{
                    top: `${startFromTop}px`,
                    height: `${height}px`,
                    minHeight: '32px',
                    zIndex: 10
                  }}
                >
                  <div className="p-2">
                    <div className="flex items-center mb-1">
                      <span className="mr-2">{getEventIcon(event.typ)}</span>
                      <span className="font-medium">{event.title}</span>
                    </div>
                    <div className="text-sm">{formatTime(event.startDate)} - {formatTime(event.endDate)}</div>
                    
                    {height >= 80 && (
                      <>
                        {event.kunde && <div className="text-sm mt-1">Kunde: {event.kunde}</div>}
                        {event.adresse && <div className="text-sm">Adresse: {event.adresse}</div>}
                        {event.mitarbeiter && <div className="text-sm">Team: {event.mitarbeiter.join(', ')}</div>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Listen-Ansicht
  const renderListView = () => {
    // Events für den aktuellen Monat filtern
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const filteredMonthEvents = filteredEvents.filter(event => 
      event.startDate.getFullYear() === year &&
      event.startDate.getMonth() === month
    );
    
    // Nach Datum sortieren
    filteredMonthEvents.sort((a, b) => a.startDate - b.startDate);
    
    // Gruppieren nach Datum
    const groupedEvents = {};
    filteredMonthEvents.forEach(event => {
      const dateKey = formatDate(event.startDate);
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });
    
    return (
      <div className="bg-white rounded-lg shadow divide-y">
        {Object.keys(groupedEvents).length > 0 ? (
          Object.keys(groupedEvents).map(dateKey => (
            <div key={dateKey} className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{dateKey}</h3>
              
              <div className="space-y-3">
                {groupedEvents[dateKey].map(event => {
                  // Event-Farbe basierend auf Typ
                  const getEventBgColor = (typ) => {
                    switch (typ) {
                      case 'umzug':
                        return 'bg-blue-50';
                      case 'aufnahme':
                        return 'bg-green-50';
                      case 'meeting':
                        return 'bg-purple-50';
                      default:
                        return 'bg-gray-50';
                    }
                  };
                  
                  // Event-Icon basierend auf Typ
                  const getEventIcon = (typ) => {
                    switch (typ) {
                      case 'umzug':
                        return <TruckElectric size={20} className="text-blue-600" />;
                      case 'aufnahme':
                        return <ClipboardList size={20} className="text-green-600" />;
                      case 'meeting':
                        return <Users size={20} className="text-purple-600" />;
                      default:
                        return null;
                    }
                  };
                  
                  return (
                    <div 
                      key={event.id} 
                      className={`${getEventBgColor(event.typ)} p-4 rounded-lg border border-gray-200`}
                    >
                      <div className="flex items-start">
                        <div className="mr-3">
                          {getEventIcon(event.typ)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
                            <span className="text-sm text-gray-500">
                              {formatTime(event.startDate)} - {formatTime(event.endDate)}
                            </span>
                          </div>
                          
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            {event.kunde && <p>Kunde: {event.kunde}</p>}
                            {event.adresse && <p>Adresse: {event.adresse}</p>}
                            {event.mitarbeiter && (
                              <p className="flex items-center">
                                <Users size={14} className="mr-1" />
                                <span>Team: {event.mitarbeiter.join(', ')}</span>
                              </p>
                            )}
                          </div>
                          
                          <div className="mt-3 flex justify-end">
                            <button className="text-sm text-blue-600 hover:text-blue-800">
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>Keine Termine für diesen Zeitraum gefunden.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Zeitachse</h1>
      </div>
      
      {/* Filter und Ansichtssteuerung */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
          {/* Steuerelemente für Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={prevPeriod}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Heute
            </button>
            
            <button
              onClick={nextPeriod}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-800">
              {currentView === 'monat' ? formatMonthYear(currentDate) : 
               currentView === 'woche' ? `Woche vom ${formatDateShort(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 1))}` :
               currentView === 'tag' ? formatDate(currentDate) : formatMonthYear(currentDate)}
            </h2>
          </div>
          
          <div className="flex space-x-4">
            {/* Ansichtsumschalter */}
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setCurrentView('monat')}
                className={`px-3 py-1 ${
                  currentView === 'monat' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="hidden md:inline">Monat</span>
                <CalendarIcon size={16} className="md:hidden" />
              </button>
              <button
                onClick={() => setCurrentView('woche')}
                className={`px-3 py-1 ${
                  currentView === 'woche' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="hidden md:inline">Woche</span>
                <Grid size={16} className="md:hidden" />
              </button>
              <button
                onClick={() => setCurrentView('tag')}
                className={`px-3 py-1 ${
                  currentView === 'tag' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="hidden md:inline">Tag</span>
                <CalendarIcon size={16} className="md:hidden" />
              </button>
              <button
                onClick={() => setCurrentView('liste')}
                className={`px-3 py-1 ${
                  currentView === 'liste' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="hidden md:inline">Liste</span>
                <List size={16} className="md:hidden" />
              </button>
            </div>
            
            {/* Typfilter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={16} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="alle">Alle Typen</option>
                <option value="umzug">Umzüge</option>
                <option value="aufnahme">Aufnahmen</option>
                <option value="meeting">Meetings</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Kalenderansicht basierend auf ausgewählter Ansicht */}
      {currentView === 'monat' && renderMonthView()}
      {currentView === 'woche' && renderWeekView()}
      {currentView === 'tag' && renderDayView()}
      {currentView === 'liste' && renderListView()}
    </div>
  );
};

export default Zeitachse;
// Import-Statements ändern
import { zeitachseService } from '../../services/api';

// useEffect-Hook für das Laden der Events ändern
useEffect(() => {
  const fetchEvents = async () => {
    try {
      // Je nach aktuellem View den passenden API-Aufruf machen
      let response;
      
      if (currentView === 'monat') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        response = await zeitachseService.getByMonat(month, year);
      } else if (currentView === 'woche') {
        // Start- und Enddatum für Woche berechnen
        const currentDay = currentDate.getDay(); // 0 = Sonntag, 1 = Montag, ...
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // Anpassung für Montag als Wochenanfang
        
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - daysToMonday);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        response = await zeitachseService.getEvents(
          startOfWeek.toISOString(), 
          endOfWeek.toISOString()
        );
      } else if (currentView === 'tag') {
        response = await zeitachseService.getByTag(currentDate.toISOString().split('T')[0]);
      } else {
        // Liste - ganzer Monat
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        response = await zeitachseService.getByMonat(month, year);
      }
      
      // API-Daten in das von der Komponente verwendete Format transformieren
      const transformierteEvents = response.data.map(event => ({
        id: event._id,
        title: event.title,
        typ: event.type, // Beachten Sie den möglichen Unterschied zwischen "typ" und "type"
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        kunde: event.kunde?.name,
        adresse: event.adresse,
        mitarbeiter: event.mitarbeiter || [],
        status: event.status
      }));
      
      setEvents(transformierteEvents);
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error);
      // Fallback zu Mock-Daten
      setEvents(mockEvents);
    }
  };

  fetchEvents();
}, [currentDate, currentView]);
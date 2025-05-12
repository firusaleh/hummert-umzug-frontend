// Import-Statements ändern
import { benachrichtigungenService } from '../../services/api';

// useEffect-Hook für das Laden der Benachrichtigungen ändern
useEffect(() => {
  const fetchBenachrichtigungen = async () => {
    try {
      const response = await benachrichtigungenService.getAll();
      setBenachrichtigungen(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Benachrichtigungen:', error);
      // Fallback zu Mock-Daten
      setBenachrichtigungen(mockBenachrichtigungen);
    }
  };

  fetchBenachrichtigungen();
}, []);

// Markiert eine Benachrichtigung als gelesen - mit API-Aufruf
const markAsRead = async (id) => {
  try {
    await benachrichtigungenService.markAsRead(id);
    setBenachrichtigungen(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, gelesen: true } 
          : notification
      )
    );
  } catch (error) {
    console.error('Fehler beim Markieren als gelesen:', error);
  }
};

// Markiert alle Benachrichtigungen als gelesen - mit API-Aufruf
const markAllAsRead = async () => {
  try {
    await benachrichtigungenService.markAllAsRead();
    setBenachrichtigungen(prev => 
      prev.map(notification => ({ ...notification, gelesen: true }))
    );
  } catch (error) {
    console.error('Fehler beim Markieren aller als gelesen:', error);
  }
};

// Löscht eine Benachrichtigung - mit API-Aufruf
const deleteNotification = async (id) => {
  try {
    await benachrichtigungenService.delete(id);
    setBenachrichtigungen(prev => 
      prev.filter(notification => notification.id !== id)
    );
  } catch (error) {
    console.error('Fehler beim Löschen der Benachrichtigung:', error);
  }
};

// Löscht alle gelesenen Benachrichtigungen - mit API-Aufruf
const deleteAllRead = async () => {
  try {
    await benachrichtigungenService.deleteAllRead();
    setBenachrichtigungen(prev => 
      prev.filter(notification => !notification.gelesen)
    );
  } catch (error) {
    console.error('Fehler beim Löschen aller gelesenen Benachrichtigungen:', error);
  }
};
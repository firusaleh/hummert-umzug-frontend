// src/services/api.js - Korrigierte Version
import axios from 'axios';

// Konfiguriere die API-Basis-URL mit Fallback
const API_URL = process.env.REACT_APP_API_URL || 'https://meine-app-backend.onrender.com/api';

// Logging für API-URL um Probleme zu diagnostizieren
console.log('API URL verwendet:', API_URL);

// Für Entwicklungszwecke kann hier zwischen lokaler und Produktionsumgebung unterschieden werden
const getBaseURL = () => {
  // Im Browser, verwende relative URLs, wenn keine explizite URL konfiguriert ist
  if (typeof window !== 'undefined' && !process.env.REACT_APP_API_URL) {
    return '/api';
  }
  return API_URL;
};

// Axios-Instanz mit verbesserten Einstellungen
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // 15 Sekunden Timeout für alle Anfragen
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Ermöglicht das Senden von Cookies
  withCredentials: false
});

// Request-Interceptor für Token mit zusätzlicher Fehlerbehandlung
api.interceptors.request.use(
  (config) => {
    // Token aus localStorage oder Cookies holen
    let token = localStorage.getItem('token');
    
    // Wenn Token existiert, zum Header hinzufügen
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Für Debug-Zwecke - besser verstehen, was gesendet wird
    const requestData = config.data || config.params || {};
    // Passwörter in Logs ausblenden
    const safeData = { ...requestData };
    if (safeData.password) safeData.password = '***';
    if (safeData.newPassword) safeData.newPassword = '***';
    
    console.log(`${config.method.toUpperCase()} Request zu ${config.baseURL}${config.url}`, safeData);
    return config;
  },
  (error) => {
    console.error('Request-Interceptor-Fehler:', error);
    return Promise.reject(error);
  }
);

// Response-Interceptor für Token-Ablauf und Fehlerbehandlung
api.interceptors.response.use(
  (response) => {
    // Erfolgreiche Response loggen (ohne sensible Daten)
    console.log('API-Antwort erfolgreich:', response.status, response.config.url);
    return response;
  },
  (error) => {
    // Hier findet eine genauere Fehleranalyse statt
    if (error.response) {
      const { status, data, config } = error.response;
      
      console.error(`API-Fehler ${status} bei ${config.method.toUpperCase()} ${config.url}:`, data);
      
      // Token-Ablauf-Behandlung
      if (status === 401) {
        // Schauen, ob der Fehler 'Token ist ungültig oder abgelaufen' lautet
        const isTokenExpired = 
          data?.message?.includes('Token') && 
          (data?.message?.includes('ungültig') || data?.message?.includes('abgelaufen'));
        
        console.warn('Authentifizierungsfehler: Token möglicherweise abgelaufen', isTokenExpired);
        
        if (isTokenExpired) {
          // Token aus dem localStorage entfernen
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Nur umleiten, wenn nicht bereits auf Login-Seite (vermeidet Endlosschleife)
          if (!window.location.pathname.includes('/login')) {
            // WICHTIG: Wir verwenden hier location.replace statt history.push, um Probleme zu vermeiden
            window.location.replace('/login');
            return new Promise(() => {}); // Verhindert weitere Fehlerbehandlung
          }
        }
      }
      
      // Network/Connection errors
      if ((status === 0 || status === 502 || status === 503 || status === 504)) {
        console.error('Netzwerkfehler. Der Server ist möglicherweise nicht erreichbar.');
      }
      
    } else if (error.request) {
      console.error('Keine Antwort vom Server erhalten:', error.request);
      console.error('Request URL:', error.config?.url);
      console.error('Request Methode:', error.config?.method);
    } else {
      console.error('Fehler beim Einrichten der Anfrage:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Hilfs-Funktion zur Fehlerbehandlung in Services
const handleApiError = (error, customMessage = 'Ein Fehler ist aufgetreten') => {
  if (error.response && error.response.data) {
    console.log('Server-Antwort:', error.response.data);
    return { 
      success: false, 
      message: error.response.data.message || customMessage,
      errors: error.response.data.errors || null,
      status: error.response.status
    };
  }
  return { success: false, message: customMessage };
};

// Auth-Services
export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Registrierungsfehler:', error);
      throw error;
    }
  },
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response;
    } catch (error) {
      console.error('Login-Fehler:', error);
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
    // Umleitung zur Login-Seite hinzugefügt
    window.location.href = '/login';
  },
  checkAuth: async () => {
    try {
      return await api.get('/auth/check');
    } catch (error) {
      console.error('Auth-Check-Fehler:', error);
      throw error;
    }
  },
  // Korrigierte Version: Service zum Prüfen der API-Verfügbarkeit
  checkApiHealth: async () => {
    try {
      // Versuche mehrere Endpunkte in einer bestimmten Reihenfolge
      try {
        // Versuch 1: Dedizierten Health-Endpunkt nutzen
        const response = await api.get('/health');
        return response;
      } catch (healthError) {
        console.warn('Health-Endpunkt nicht erreichbar, versuche Auth-Check...', healthError);
        
        try {
          // Versuch 2: Auth-Check ohne Token
          const response = await axios.get(`${getBaseURL()}/`, { 
            timeout: 5000, 
            validateStatus: (status) => status < 500 // Akzeptiere alle Nicht-500er Statuscodes
          });
          return response;
        } catch (authError) {
          console.warn('Auth-Check fehlgeschlagen, versuche Root-Endpunkt...', authError);
          
          // Versuch 3: Root-Endpunkt der API
          const response = await axios.get(getBaseURL(), { 
            timeout: 5000,
            validateStatus: (status) => status < 500 
          });
          return response;
        }
      }
    } catch (error) {
      console.error('API-Health-Check-Fehler, alle Fallbacks fehlgeschlagen:', error);
      throw error;
    }
  }
};

// Benutzer-Services
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData)
};

// Umzugs-Services mit verbesserter Fehlerbehandlung
export const umzuegeService = {
  getAll: async (params) => {
    try {
      return await api.get('/umzuege', { params });
    } catch (error) {
      console.error('Fehler beim Abrufen der Umzüge:', error);
      return { success: false, message: 'Fehler beim Laden der Umzüge', error };
    }
  },
  getById: async (id) => {
    try {
      return await api.get(`/umzuege/${id}`);
    } catch (error) {
      console.error(`Fehler beim Abrufen des Umzugs mit ID ${id}:`, error);
      return { success: false, message: 'Fehler beim Laden des Umzugs', error };
    }
  },
  create: async (umzugData) => {
    try {
      return await api.post('/umzuege', umzugData);
    } catch (error) {
      console.error('Fehler beim Erstellen des Umzugs:', error);
      return { success: false, message: 'Fehler beim Erstellen des Umzugs', error };
    }
  },
  update: async (id, umzugData) => {
    try {
      return await api.put(`/umzuege/${id}`, umzugData);
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Umzugs mit ID ${id}:`, error);
      return { success: false, message: 'Fehler beim Aktualisieren des Umzugs', error };
    }
  },
  delete: async (id) => {
    try {
      return await api.delete(`/umzuege/${id}`);
    } catch (error) {
      console.error(`Fehler beim Löschen des Umzugs mit ID ${id}:`, error);
      return { success: false, message: 'Fehler beim Löschen des Umzugs', error };
    }
  },
  updateStatus: async (id, status) => {
    try {
      return await api.put(`/umzuege/${id}/status`, { status });
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Status für Umzug mit ID ${id}:`, error);
      return { success: false, message: 'Fehler beim Aktualisieren des Status', error };
    }
  },
  getByMonat: async (monat, jahr) => {
    try {
      return await api.get(`/umzuege/monat/${monat}/${jahr}`);
    } catch (error) {
      console.error(`Fehler beim Abrufen der Umzüge für ${monat}/${jahr}:`, error);
      return { success: false, message: 'Fehler beim Laden der Umzüge nach Monat', error };
    }
  }
};

// Mitarbeiter-Services
export const mitarbeiterService = {
  getAll: () => api.get('/mitarbeiter'),
  getById: (id) => api.get(`/mitarbeiter/${id}`),
  create: (mitarbeiterData) => api.post('/mitarbeiter', mitarbeiterData),
  update: (id, mitarbeiterData) => api.put(`/mitarbeiter/${id}`, mitarbeiterData),
  delete: (id) => api.delete(`/mitarbeiter/${id}`),
  
  // Methode zum Hochladen eines Profilbilds
  uploadImage: (id, imageFormData) => {
    return api.post(`/mitarbeiter/${id}/profilbild`, imageFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Methode zum Aktualisieren des Mitarbeiterstatus
  updateStatus: (id, status) => {
    return api.put(`/mitarbeiter/${id}/status`, { status });
  },
  
  // Methode zum Hinzufügen von Fähigkeiten
  addSkill: (id, skill) => {
    return api.post(`/mitarbeiter/${id}/faehigkeiten`, { faehigkeit: skill });
  },
  
  // Methode zum Entfernen von Fähigkeiten
  removeSkill: (id, skill) => {
    return api.delete(`/mitarbeiter/${id}/faehigkeiten/${encodeURIComponent(skill)}`);
  }
};

// Fahrzeug-Services
export const fahrzeugeService = {
  getAll: () => api.get('/fahrzeuge'),
  getById: (id) => api.get(`/fahrzeuge/${id}`),
  create: (fahrzeugData) => api.post('/fahrzeuge', fahrzeugData),
  update: (id, fahrzeugData) => api.put(`/fahrzeuge/${id}`, fahrzeugData),
  delete: (id) => api.delete(`/fahrzeuge/${id}`)
};

// Aufnahme-Services
export const aufnahmenService = {
  getAll: () => api.get('/aufnahmen'),
  getById: (id) => api.get(`/aufnahmen/${id}`),
  create: (aufnahmeData) => api.post('/aufnahmen', aufnahmeData),
  update: (id, aufnahmeData) => api.put(`/aufnahmen/${id}`, aufnahmeData),
  delete: (id) => api.delete(`/aufnahmen/${id}`),
  uploadFiles: (id, files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return api.post(`/aufnahmen/${id}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getFiles: (id) => api.get(`/aufnahmen/${id}/files`)
};

// Umzugsaufnahmeformular-Services
export const umzugsaufnahmeService = {
  save: (formularData) => api.post('/umzugsaufnahmen', formularData),
  getById: (id) => api.get(`/umzugsaufnahmen/${id}`),
  update: (id, formularData) => api.put(`/umzugsaufnahmen/${id}`, formularData),
  uploadBilder: (id, itemId, bilder) => {
    const formData = new FormData();
    bilder.forEach(bild => {
      formData.append('bilder', bild);
    });
    return api.post(`/umzugsaufnahmen/${id}/items/${itemId}/bilder`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Benachrichtigungen-Services
export const benachrichtigungenService = {
  getAll: () => api.get('/benachrichtigungen'),
  markAsRead: (id) => api.put(`/benachrichtigungen/${id}/read`),
  markAllAsRead: () => api.put('/benachrichtigungen/read-all'),
  delete: (id) => api.delete(`/benachrichtigungen/${id}`),
  deleteAllRead: () => api.delete('/benachrichtigungen/read')
};

// Zeitachse-Services
export const zeitachseService = {
  getEvents: (startDatum, endDatum) => api.get('/events', {
    params: { startDatum, endDatum }
  }),
  getByMonat: (monat, jahr) => api.get(`/events/monat/${monat}/${jahr}`),
  getByTag: (datum) => api.get(`/events/tag/${datum}`)
};

// Finanzen-Services
export const finanzenService = {
  // Übersicht
  getUebersicht: () => api.get('/finanzen/uebersicht'),
  getMonatsuebersicht: (jahr) => api.get(`/finanzen/monatsübersicht/${jahr}`),
  getMonatsdetails: (monat, jahr) => api.get(`/finanzen/monat/${monat}/${jahr}`),
  
  // Angebote
  getAngebote: () => api.get('/finanzen/angebote'),
  getAngebotById: (id) => api.get(`/finanzen/angebote/${id}`),
  createAngebot: (angebotData) => api.post('/finanzen/angebote', angebotData),
  updateAngebot: (id, angebotData) => api.put(`/finanzen/angebote/${id}`, angebotData),
  deleteAngebot: (id) => api.delete(`/finanzen/angebote/${id}`),
  
  // Rechnungen
  getRechnungen: () => api.get('/finanzen/rechnungen'),
  getRechnungById: (id) => api.get(`/finanzen/rechnungen/${id}`),
  createRechnung: (rechnungData) => api.post('/finanzen/rechnungen', rechnungData),
  updateRechnung: (id, rechnungData) => api.put(`/finanzen/rechnungen/${id}`, rechnungData),
  deleteRechnung: (id) => api.delete(`/finanzen/rechnungen/${id}`),
  markRechnungAsBezahlt: (id) => api.put(`/finanzen/rechnungen/${id}/bezahlt`),
  
  // Projektkosten
  getProjektkosten: () => api.get('/finanzen/projektkosten'),
  getProjektkostenById: (id) => api.get(`/finanzen/projektkosten/${id}`),
  createProjektkosten: (kostenData) => api.post('/finanzen/projektkosten', kostenData),
  updateProjektkosten: (id, kostenData) => api.put(`/finanzen/projektkosten/${id}`, kostenData),
  deleteProjektkosten: (id) => api.delete(`/finanzen/projektkosten/${id}`)
};

// Zeiterfassung-Services
export const zeiterfassungService = {
  getMitarbeiter: () => api.get('/zeiterfassung/mitarbeiter'),
  getUmzugsprojekte: () => api.get('/zeiterfassung/projekte'),
  getZeiterfassungen: (projektId) => api.get(`/zeiterfassung/projekt/${projektId}`),
  addZeiterfassung: (zeiterfassungData) => api.post('/zeiterfassung', zeiterfassungData),
  updateZeiterfassung: (id, zeiterfassungData) => api.put(`/zeiterfassung/${id}`, zeiterfassungData),
  deleteZeiterfassung: (id) => api.delete(`/zeiterfassung/${id}`),
  addMitarbeiter: (mitarbeiterData) => api.post('/zeiterfassung/mitarbeiter', mitarbeiterData),
  deleteMitarbeiter: (id) => api.delete(`/zeiterfassung/mitarbeiter/${id}`)
};

// File-Services mit verbesserter Fehlerbehandlung
export const fileService = {
  uploadFile: async (fileData) => {
    try {
      const formData = new FormData();
      
      if (fileData.file) {
        formData.append('file', fileData.file);
      }
      
      if (fileData.project) {
        formData.append('project', fileData.project);
      }
      
      if (fileData.category) {
        formData.append('category', fileData.category);
      }
      
      if (fileData.task) {
        formData.append('task', fileData.task);
      }
      
      // Weitere Metadaten hinzufügen, falls vorhanden
      if (fileData.description) {
        formData.append('description', fileData.description);
      }
      
      if (fileData.tags) {
        // Bei Arrays müssen wir sicherstellen, dass der Server diese verarbeiten kann
        if (Array.isArray(fileData.tags)) {
          fileData.tags.forEach(tag => formData.append('tags[]', tag));
        } else {
          formData.append('tags', fileData.tags);
        }
      }
      
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // Upload-Fortschritt überwachen
        onUploadProgress: progressEvent => {
          if (fileData.onProgress && typeof fileData.onProgress === 'function') {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            fileData.onProgress(percentCompleted);
          }
        }
      });
      
      return response;
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler beim Hochladen der Datei',
        error
      };
    }
  },
  getFiles: async (params) => {
    try {
      return await api.get('/files', { params });
    } catch (error) {
      console.error('Fehler beim Abrufen der Dateien:', error);
      return {
        success: false,
        message: 'Fehler beim Laden der Dateien',
        error
      };
    }
  },
  deleteFile: async (id) => {
    try {
      return await api.delete(`/files/${id}`);
    } catch (error) {
      console.error(`Fehler beim Löschen der Datei mit ID ${id}:`, error);
      return {
        success: false,
        message: 'Fehler beim Löschen der Datei',
        error
      };
    }
  },
  downloadFile: async (id) => {
    try {
      const response = await api.get(`/files/download/${id}`, { responseType: 'blob' });
      
      // Dateiname aus Header extrahieren oder generischen Namen verwenden
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Blob-URL erstellen und Download starten
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Download gestartet' };
    } catch (error) {
      console.error(`Fehler beim Herunterladen der Datei mit ID ${id}:`, error);
      return {
        success: false,
        message: 'Fehler beim Herunterladen der Datei',
        error
      };
    }
  },
  updateFile: async (id, updateData) => {
    try {
      return await api.put(`/files/${id}`, updateData);
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Datei mit ID ${id}:`, error);
      return {
        success: false,
        message: 'Fehler beim Aktualisieren der Datei',
        error
      };
    }
  }
};

export default api;
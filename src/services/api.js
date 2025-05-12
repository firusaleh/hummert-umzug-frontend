import axios from 'axios';

// Konfiguriere die API-Basis-URL mit Fallback
const API_URL = process.env.REACT_APP_API_URL || 'https://meine-app-backend.onrender.com/api';

// Für Entwicklungszwecke kann hier zwischen lokaler und Produktionsumgebung unterschieden werden
const getBaseURL = () => {
  // Wenn Sie zwischen Environments wechseln wollen, können Sie das hier tun
  if (process.env.NODE_ENV === 'development') {
    return API_URL;
  }
  return API_URL;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000 // 10 Sekunden Timeout für alle Anfragen
});

// Request-Interceptor für Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
    return response;
  },
  (error) => {
    console.error('API-Fehler:', error);
    
    // Detaillierte Fehlerprotokollierung
    if (error.response) {
      console.error('Statuscode:', error.response.status);
      console.error('Antwortdaten:', error.response.data);
      console.error('Headers:', error.response.headers);
      
      // Token-Ablauf-Behandlung
      if (error.response.status === 401) {
        console.warn('Authentifizierungsfehler: Token möglicherweise abgelaufen');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Nur umleiten, wenn nicht bereits auf Login-Seite (vermeidet Endlosschleife)
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      console.error('Keine Antwort vom Server erhalten:', error.request);
    } else {
      console.error('Fehler beim Einrichten der Anfrage:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Hilfs-Funktion zur Fehlerbehandlung in Services
const handleApiError = (error, customMessage = 'Ein Fehler ist aufgetreten') => {
  if (error.response && error.response.data && error.response.data.message) {
    return { success: false, message: error.response.data.message };
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
      // Versuche zuerst den dedizierten Health-Endpunkt
      try {
        return await api.get('/health');
      } catch (healthError) {
        // Falls /health nicht verfügbar ist, versuchen wir es mit einem anderen Endpunkt
        try {
          // Verwende den bereits bekannten Auth-Check-Endpunkt
          return await api.get('/auth/check');
        } catch (authError) {
          // Letzter Fallback: Versuche den Root-Endpunkt der API
          return await api.get('/');
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

// Umzugs-Services
export const umzuegeService = {
  getAll: () => api.get('/umzuege'),
  getById: (id) => api.get(`/umzuege/${id}`),
  create: (umzugData) => api.post('/umzuege', umzugData),
  update: (id, umzugData) => api.put(`/umzuege/${id}`, umzugData),
  delete: (id) => api.delete(`/umzuege/${id}`),
  updateStatus: (id, status) => api.put(`/umzuege/${id}/status`, { status }),
  getByMonat: (monat, jahr) => api.get(`/umzuege/monat/${monat}/${jahr}`)
};

// Mitarbeiter-Services
export const mitarbeiterService = {
  getAll: () => api.get('/mitarbeiter'),
  getById: (id) => api.get(`/mitarbeiter/${id}`),
  create: (mitarbeiterData) => api.post('/mitarbeiter', mitarbeiterData),
  update: (id, mitarbeiterData) => api.put(`/mitarbeiter/${id}`, mitarbeiterData),
  delete: (id) => api.delete(`/mitarbeiter/${id}`)
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

// File-Services
export const fileService = {
  uploadFile: (fileData) => {
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
    
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getFiles: (params) => api.get('/files', { params }),
  deleteFile: (id) => api.delete(`/files/${id}`),
  downloadFile: (id) => api.get(`/files/download/${id}`, { responseType: 'blob' }),
  updateFile: (id, updateData) => api.put(`/files/${id}`, updateData)
};

export default api;
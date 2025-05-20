// src/services/api.js - Enhanced with standardized error handling
import axios from 'axios';
import { logError, formatApiError } from '../utils/errorHandler';

// Configure API URL without hardcoded fallback
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Get base URL safely
const getBaseURL = () => API_URL;

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

// Token management utilities
const tokenManager = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  removeToken: () => localStorage.removeItem('token'),
  getUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('user')
};

// Request interceptor - no logging of sensitive data
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiration and error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      const isTokenExpired = error.response.data?.message?.includes('Token') ||
                            error.response.data?.message?.includes('abgelaufen') ||
                            error.response.data?.message?.includes('Sitzung');
      
      if (isTokenExpired) {
        // Clear auth data and redirect to login
        tokenManager.removeToken();
        tokenManager.removeUser();
        
        if (!window.location.pathname.includes('/login')) {
          window.location.replace('/login');
          return new Promise(() => {});
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Base service creator for standardized API interaction
const createService = (basePath) => {
  return {
    getAll: async (params) => {
      try {
        const response = await api.get(basePath, { params });
        return response.data;
      } catch (error) {
        logError(`getAll ${basePath}`, error);
        return formatApiError(error, `Fehler beim Laden der Daten`);
      }
    },
    
    getById: async (id) => {
      try {
        const response = await api.get(`${basePath}/${id}`);
        return response.data;
      } catch (error) {
        logError(`getById ${basePath}/${id}`, error);
        return formatApiError(error, `Fehler beim Laden der Daten`);
      }
    },
    
    create: async (data) => {
      try {
        const response = await api.post(basePath, data);
        return response.data;
      } catch (error) {
        logError(`create ${basePath}`, error);
        return formatApiError(error, `Fehler beim Erstellen`);
      }
    },
    
    update: async (id, data) => {
      try {
        const response = await api.put(`${basePath}/${id}`, data);
        return response.data;
      } catch (error) {
        logError(`update ${basePath}/${id}`, error);
        return formatApiError(error, `Fehler beim Aktualisieren`);
      }
    },
    
    delete: async (id) => {
      try {
        const response = await api.delete(`${basePath}/${id}`);
        return response.data;
      } catch (error) {
        logError(`delete ${basePath}/${id}`, error);
        return formatApiError(error, `Fehler beim Löschen`);
      }
    }
  };
};

// Auth-Services with standardized error handling
export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      logError('auth:register', error, { email: userData.email });
      throw formatApiError(error, 'Registrierung fehlgeschlagen');
    }
  },
  
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      logError('auth:login', error, { email: credentials.email });
      throw formatApiError(error, 'Login fehlgeschlagen');
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
    window.location.href = '/login';
  },
  
  checkAuth: async () => {
    try {
      return await api.get('/auth/check');
    } catch (error) {
      logError('auth:checkAuth', error);
      throw formatApiError(error, 'Authentifizierungsprüfung fehlgeschlagen');
    }
  },
  
  checkApiHealth: async () => {
    try {
      // Try multiple endpoints in order
      try {
        const response = await api.get('/health');
        return response;
      } catch (healthError) {
        try {
          const response = await axios.get(`${getBaseURL()}/`, { 
            timeout: 5000, 
            validateStatus: (status) => status < 500
          });
          return response;
        } catch (authError) {
          const response = await axios.get(getBaseURL(), { 
            timeout: 5000,
            validateStatus: (status) => status < 500 
          });
          return response;
        }
      }
    } catch (error) {
      logError('auth:checkApiHealth', error);
      throw formatApiError(error, 'API nicht erreichbar');
    }
  }
};

// Services using the standardized approach
export const userService = createService('/users');
export const umzuegeService = createService('/umzuege');
export const mitarbeiterService = createService('/mitarbeiter');
export const fahrzeugeService = createService('/fahrzeuge');
export const aufnahmenService = createService('/aufnahmen');

// Add the missing services
export const finanzenService = {
  ...createService('/finanzen'),

  // Angebote-bezogene Methoden
  getAngebote: async (params) => {
    try {
      const response = await api.get('/finanzen/angebote', { params });
      return response.data;
    } catch (error) {
      logError('finanzen:getAngebote', error);
      return formatApiError(error, 'Fehler beim Laden der Angebote');
    }
  },
  
  getAngebotById: async (id) => {
    try {
      const response = await api.get(`/finanzen/angebote/${id}`);
      return response.data;
    } catch (error) {
      logError(`finanzen:getAngebotById/${id}`, error);
      return formatApiError(error, 'Fehler beim Laden des Angebots');
    }
  },
  
  createAngebot: async (data) => {
    try {
      const response = await api.post('/finanzen/angebote', data);
      return response.data;
    } catch (error) {
      logError('finanzen:createAngebot', error);
      return formatApiError(error, 'Fehler beim Erstellen des Angebots');
    }
  },
  
  updateAngebot: async (id, data) => {
    try {
      const response = await api.put(`/finanzen/angebote/${id}`, data);
      return response.data;
    } catch (error) {
      logError(`finanzen:updateAngebot/${id}`, error);
      return formatApiError(error, 'Fehler beim Aktualisieren des Angebots');
    }
  },
  
  deleteAngebot: async (id) => {
    try {
      const response = await api.delete(`/finanzen/angebote/${id}`);
      return response.data;
    } catch (error) {
      logError(`finanzen:deleteAngebot/${id}`, error);
      return formatApiError(error, 'Fehler beim Löschen des Angebots');
    }
  },
  
  // Rechnungen-bezogene Methoden
  getRechnungen: async (params) => {
    try {
      const response = await api.get('/finanzen/rechnungen', { params });
      return response.data;
    } catch (error) {
      logError('finanzen:getRechnungen', error);
      return formatApiError(error, 'Fehler beim Laden der Rechnungen');
    }
  },
  
  getRechnungById: async (id) => {
    try {
      const response = await api.get(`/finanzen/rechnungen/${id}`);
      return response.data;
    } catch (error) {
      logError(`finanzen:getRechnungById/${id}`, error);
      return formatApiError(error, 'Fehler beim Laden der Rechnung');
    }
  },
  
  createRechnung: async (data) => {
    try {
      const response = await api.post('/finanzen/rechnungen', data);
      return response.data;
    } catch (error) {
      logError('finanzen:createRechnung', error);
      return formatApiError(error, 'Fehler beim Erstellen der Rechnung');
    }
  },
  
  updateRechnung: async (id, data) => {
    try {
      const response = await api.put(`/finanzen/rechnungen/${id}`, data);
      return response.data;
    } catch (error) {
      logError(`finanzen:updateRechnung/${id}`, error);
      return formatApiError(error, 'Fehler beim Aktualisieren der Rechnung');
    }
  },
  
  deleteRechnung: async (id) => {
    try {
      const response = await api.delete(`/finanzen/rechnungen/${id}`);
      return response.data;
    } catch (error) {
      logError(`finanzen:deleteRechnung/${id}`, error);
      return formatApiError(error, 'Fehler beim Löschen der Rechnung');
    }
  },
  
  markRechnungAsBezahlt: async (id, data) => {
    try {
      const response = await api.put(`/finanzen/rechnungen/${id}/bezahlt`, data);
      return response.data;
    } catch (error) {
      logError(`finanzen:markRechnungAsBezahlt/${id}`, error);
      return formatApiError(error, 'Fehler beim Markieren der Rechnung als bezahlt');
    }
  },
  
  // Projektkosten-bezogene Methoden
  getProjektkosten: async (params) => {
    try {
      const response = await api.get('/finanzen/projektkosten', { params });
      return response.data;
    } catch (error) {
      logError('finanzen:getProjektkosten', error);
      return formatApiError(error, 'Fehler beim Laden der Projektkosten');
    }
  },
  
  getProjektkostenById: async (id) => {
    try {
      const response = await api.get(`/finanzen/projektkosten/${id}`);
      return response.data;
    } catch (error) {
      logError(`finanzen:getProjektkostenById/${id}`, error);
      return formatApiError(error, 'Fehler beim Laden der Projektkosten');
    }
  },
  
  createProjektkosten: async (data) => {
    try {
      const response = await api.post('/finanzen/projektkosten', data);
      return response.data;
    } catch (error) {
      logError('finanzen:createProjektkosten', error);
      return formatApiError(error, 'Fehler beim Erstellen der Projektkosten');
    }
  },
  
  updateProjektkosten: async (id, data) => {
    try {
      const response = await api.put(`/finanzen/projektkosten/${id}`, data);
      return response.data;
    } catch (error) {
      logError(`finanzen:updateProjektkosten/${id}`, error);
      return formatApiError(error, 'Fehler beim Aktualisieren der Projektkosten');
    }
  },
  
  deleteProjektkosten: async (id) => {
    try {
      const response = await api.delete(`/finanzen/projektkosten/${id}`);
      return response.data;
    } catch (error) {
      logError(`finanzen:deleteProjektkosten/${id}`, error);
      return formatApiError(error, 'Fehler beim Löschen der Projektkosten');
    }
  },
  
  // Finanzübersicht-bezogene Methoden
  getFinanzuebersicht: async () => {
    try {
      const response = await api.get('/finanzen/uebersicht');
      return response.data;
    } catch (error) {
      logError('finanzen:getFinanzuebersicht', error);
      return formatApiError(error, 'Fehler beim Laden der Finanzübersicht');
    }
  },
  
  getMonatsUebersicht: async (jahr) => {
    try {
      const response = await api.get(`/finanzen/uebersicht/${jahr}`);
      return response.data;
    } catch (error) {
      logError(`finanzen:getMonatsUebersicht/${jahr}`, error);
      return formatApiError(error, 'Fehler beim Laden der Monatsübersicht');
    }
  },
  
  getMonatsDetails: async (jahr, monat) => {
    try {
      const response = await api.get(`/finanzen/uebersicht/${jahr}/${monat}`);
      return response.data;
    } catch (error) {
      logError(`finanzen:getMonatsDetails/${jahr}/${monat}`, error);
      return formatApiError(error, 'Fehler beim Laden der Monatsdetails');
    }
  }
};

export const zeiterfassungService = {
  ...createService('/zeiterfassung'),
  
  getEintraege: async (params) => {
    try {
      const response = await api.get('/zeiterfassung/eintraege', { params });
      return response.data;
    } catch (error) {
      logError('zeiterfassung:getEintraege', error);
      return formatApiError(error, 'Fehler beim Laden der Zeiterfassungseinträge');
    }
  },
  
  getEintragById: async (id) => {
    try {
      const response = await api.get(`/zeiterfassung/eintraege/${id}`);
      return response.data;
    } catch (error) {
      logError(`zeiterfassung:getEintragById/${id}`, error);
      return formatApiError(error, 'Fehler beim Laden des Zeiterfassungseintrags');
    }
  },
  
  startZeiterfassung: async (data) => {
    try {
      const response = await api.post('/zeiterfassung/start', data);
      return response.data;
    } catch (error) {
      logError('zeiterfassung:startZeiterfassung', error);
      return formatApiError(error, 'Fehler beim Starten der Zeiterfassung');
    }
  },
  
  stopZeiterfassung: async (id, data) => {
    try {
      const response = await api.post(`/zeiterfassung/stop/${id}`, data);
      return response.data;
    } catch (error) {
      logError(`zeiterfassung:stopZeiterfassung/${id}`, error);
      return formatApiError(error, 'Fehler beim Stoppen der Zeiterfassung');
    }
  },
  
  createEintrag: async (data) => {
    try {
      const response = await api.post('/zeiterfassung/eintraege', data);
      return response.data;
    } catch (error) {
      logError('zeiterfassung:createEintrag', error);
      return formatApiError(error, 'Fehler beim Erstellen des Zeiterfassungseintrags');
    }
  },
  
  updateEintrag: async (id, data) => {
    try {
      const response = await api.put(`/zeiterfassung/eintraege/${id}`, data);
      return response.data;
    } catch (error) {
      logError(`zeiterfassung:updateEintrag/${id}`, error);
      return formatApiError(error, 'Fehler beim Aktualisieren des Zeiterfassungseintrags');
    }
  },
  
  deleteEintrag: async (id) => {
    try {
      const response = await api.delete(`/zeiterfassung/eintraege/${id}`);
      return response.data;
    } catch (error) {
      logError(`zeiterfassung:deleteEintrag/${id}`, error);
      return formatApiError(error, 'Fehler beim Löschen des Zeiterfassungseintrags');
    }
  },
  
  getBericht: async (params) => {
    try {
      const response = await api.get('/zeiterfassung/bericht', { params });
      return response.data;
    } catch (error) {
      logError('zeiterfassung:getBericht', error);
      return formatApiError(error, 'Fehler beim Laden des Zeiterfassungsberichts');
    }
  },
  
  getMitarbeiterBericht: async (mitarbeiterId, params) => {
    try {
      const response = await api.get(`/zeiterfassung/bericht/mitarbeiter/${mitarbeiterId}`, { params });
      return response.data;
    } catch (error) {
      logError(`zeiterfassung:getMitarbeiterBericht/${mitarbeiterId}`, error);
      return formatApiError(error, 'Fehler beim Laden des Mitarbeiter-Zeiterfassungsberichts');
    }
  },
  
  getProjektBericht: async (projektId, params) => {
    try {
      const response = await api.get(`/zeiterfassung/bericht/projekt/${projektId}`, { params });
      return response.data;
    } catch (error) {
      logError(`zeiterfassung:getProjektBericht/${projektId}`, error);
      return formatApiError(error, 'Fehler beim Laden des Projekt-Zeiterfassungsberichts');
    }
  }
};

// Services with custom methods in addition to standard CRUD
export const benachrichtigungenService = {
  ...createService('/benachrichtigungen'),
  
  markAsRead: async (id) => {
    try {
      const response = await api.put(`/benachrichtigungen/${id}/read`);
      return response.data;
    } catch (error) {
      logError(`markAsRead /benachrichtigungen/${id}/read`, error);
      return formatApiError(error, 'Fehler beim Markieren als gelesen');
    }
  },
  
  markAllAsRead: async () => {
    try {
      const response = await api.put('/benachrichtigungen/read-all');
      return response.data;
    } catch (error) {
      logError('markAllAsRead /benachrichtigungen/read-all', error);
      return formatApiError(error, 'Fehler beim Markieren aller Benachrichtigungen als gelesen');
    }
  },
  
  deleteAllRead: async () => {
    try {
      const response = await api.delete('/benachrichtigungen/read');
      return response.data;
    } catch (error) {
      logError('deleteAllRead /benachrichtigungen/read', error);
      return formatApiError(error, 'Fehler beim Löschen gelesener Benachrichtigungen');
    }
  }
};

// Custom umzugsaufnahme service
export const umzugsaufnahmeService = {
  ...createService('/umzugsaufnahmen'),
  
  uploadBilder: async (id, itemId, bilder) => {
    try {
      const formData = new FormData();
      bilder.forEach(bild => {
        formData.append('bilder', bild);
      });
      
      const response = await api.post(`/umzugsaufnahmen/${id}/items/${itemId}/bilder`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      logError(`uploadBilder /umzugsaufnahmen/${id}/items/${itemId}/bilder`, error);
      return formatApiError(error, 'Fehler beim Hochladen der Bilder');
    }
  }
};

// Specialized file service with upload progress
export const fileService = {
  ...createService('/files'),
  
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
      
      // Add additional metadata
      if (fileData.description) {
        formData.append('description', fileData.description);
      }
      
      if (fileData.tags) {
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
        onUploadProgress: progressEvent => {
          if (fileData.onProgress && typeof fileData.onProgress === 'function') {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            fileData.onProgress(percentCompleted);
          }
        }
      });
      
      return response.data;
    } catch (error) {
      logError('files:upload', error, { fileName: fileData.file?.name });
      return formatApiError(error, 'Fehler beim Hochladen der Datei');
    }
  },
  
  downloadFile: async (id) => {
    try {
      const response = await api.get(`/files/download/${id}`, { responseType: 'blob' });
      
      // Extract filename or use generic name
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/, '');
        }
      }
      
      // Create download link
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
      logError(`files:download/${id}`, error);
      return formatApiError(error, 'Fehler beim Herunterladen der Datei');
    }
  }
};

export default api;
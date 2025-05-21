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
  removeUser: () => localStorage.removeItem('user'),
  
  getTokenTimestamp: () => {
    const timestamp = localStorage.getItem('tokenTimestamp');
    return timestamp ? parseInt(timestamp, 10) : null;
  },
  
  setTokenTimestamp: () => localStorage.setItem('tokenTimestamp', Date.now().toString()),
  
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
  },
  
  isTokenExpired: () => {
    const timestamp = tokenManager.getTokenTimestamp();
    if (!timestamp) return true;
    
    // Token lifetime in milliseconds (e.g., 2 hours)
    const tokenLifetime = 2 * 60 * 60 * 1000; 
    
    // Check if token is expired
    return Date.now() - timestamp > tokenLifetime;
  },
  
  isTokenExpiringSoon: () => {
    const timestamp = tokenManager.getTokenTimestamp();
    if (!timestamp) return true;
    
    // Token lifetime in milliseconds (e.g., 2 hours)
    const tokenLifetime = 2 * 60 * 60 * 1000;
    
    // Check if token will expire in the next 10 minutes
    const expirationBuffer = 10 * 60 * 1000; // 10 minutes
    return Date.now() - timestamp > tokenLifetime - expirationBuffer;
  },
  
  refreshTokenIfNeeded: async () => {
    // Check if token is about to expire
    if (tokenManager.isTokenExpiringSoon() && !tokenManager.isTokenExpired()) {
      try {
        // Try to refresh the token
        const response = await api.get('/auth/refresh');
        if (response.data && response.data.token) {
          tokenManager.setToken(response.data.token);
          tokenManager.setTokenTimestamp();
          console.log('Token refreshed successfully');
          return true;
        }
      } catch (error) {
        console.warn('Failed to refresh token:', error);
        // Don't clear auth data here, let the interceptor handle actual expiration
      }
    }
    return false;
  }
};

// Request interceptor with token refresh capability
api.interceptors.request.use(
  async (config) => {
    // Skip token handling for auth endpoints
    const isAuthEndpoint = config.url && (
      config.url.includes('/auth/login') || 
      config.url.includes('/auth/register') ||
      config.url.includes('/auth/refresh')
    );
    
    if (isAuthEndpoint) {
      return config;
    }
    
    // For non-auth endpoints, handle token
    const token = tokenManager.getToken();
    
    if (token) {
      // Check if token needs refreshing before making the request
      if (tokenManager.isTokenExpiringSoon() && !tokenManager.isTokenExpired()) {
        try {
          await tokenManager.refreshTokenIfNeeded();
          // Get the fresh token after refresh
          const freshToken = tokenManager.getToken();
          if (freshToken) {
            config.headers.Authorization = `Bearer ${freshToken}`;
          }
        } catch (error) {
          console.warn('Token refresh failed in request interceptor:', error);
          // Use the existing token as fallback
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        // Use existing token
        config.headers.Authorization = `Bearer ${token}`;
      }
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
      // More comprehensive check for token issues
      const isTokenExpired = error.response.data?.message?.includes('Token') ||
                          error.response.data?.message?.includes('abgelaufen') ||
                          error.response.data?.message?.includes('expired') ||
                          error.response.data?.message?.includes('Sitzung') ||
                          error.response.data?.message?.includes('session') ||
                          error.response.data?.message?.includes('nicht authentifiziert') ||
                          error.response.data?.message?.includes('not authenticated') ||
                          error.response.data?.message?.includes('invalid token') ||
                          error.response.data?.message?.includes('jwt') ||
                          error.response.data?.message?.includes('unauthorized') ||
                          error.response.data?.message?.includes('unautorisiert');
      
      // Also check for specific response codes used in some APIs
      const isAuthError = isTokenExpired || 
                          error.response.data?.code === 'invalid_token' ||
                          error.response.data?.code === 'token_expired' ||
                          error.response.data?.status === 'unauthorized';
      
      if (isAuthError) {
        // Log the auth error for debugging
        console.warn('Authentication error detected:', error.response.data?.message);
        
        // Clear auth data
        tokenManager.clearAuthData();
        
        // Store the attempted URL to redirect back after login
        const currentPath = window.location.pathname + window.location.search;
        if (!currentPath.includes('/login')) {
          try {
            localStorage.setItem('auth_redirect', currentPath);
          } catch (e) {
            console.error('Error storing auth redirect path:', e);
          }
        }
        
        // Only redirect to login if we're not already on the login page or other public pages
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        const isPublicPath = publicPaths.some(path => window.location.pathname.includes(path));
        
        if (!isPublicPath) {
          // Add a query parameter to indicate session expiration
          window.location.href = `/login?session=expired&redirect=${encodeURIComponent(currentPath)}`;
          
          // Return an empty promise that never resolves to prevent further error handling
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
        // Enhanced logging for debugging validation errors
        console.log(`Sending POST to ${basePath} with data:`, JSON.stringify(data, null, 2));
        
        // Special validation logging for complex data structures that often cause issues
        if (basePath.includes('umzuege')) {
          console.group('Pre-validation check for Umzug data:');
          // Check required fields
          const requiredFields = [
            'auftraggeber.name', 'auftraggeber.telefon', 
            'auszugsadresse.strasse', 'auszugsadresse.hausnummer', 'auszugsadresse.plz', 'auszugsadresse.ort',
            'einzugsadresse.strasse', 'einzugsadresse.hausnummer', 'einzugsadresse.plz', 'einzugsadresse.ort',
            'startDatum', 'endDatum'
          ];
          
          const missingFields = [];
          for (const field of requiredFields) {
            const [parent, child] = field.includes('.') ? field.split('.') : [field, null];
            if (child) {
              if (!data[parent] || !data[parent][child] || data[parent][child] === '') {
                missingFields.push(field);
              }
            } else if (!data[parent] || data[parent] === '') {
              missingFields.push(field);
            }
          }
          
          if (missingFields.length > 0) {
            console.warn('Missing required fields:', missingFields);
          }
          
          // Log specific properties that often cause issues
          console.log('auftraggeber:', data.auftraggeber);
          console.log('auszugsadresse:', data.auszugsadresse);
          console.log('einzugsadresse:', data.einzugsadresse);
          console.log('mitarbeiter:', data.mitarbeiter);
          console.log('fahrzeuge:', data.fahrzeuge);
          console.log('dates:', {
            startDatum: data.startDatum,
            endDatum: data.endDatum,
            isStartValid: data.startDatum && !isNaN(new Date(data.startDatum).getTime()),
            isEndValid: data.endDatum && !isNaN(new Date(data.endDatum).getTime())
          });
          console.groupEnd();
        }
        
        const response = await api.post(basePath, data);
        return response.data;
      } catch (error) {
        logError(`create ${basePath}`, error);
        
        // Log full error response for debugging
        console.group('API Error Details:');
        console.error('Complete error response:', error);
        
        if (error.response) {
          console.log('Status:', error.response.status);
          console.log('Status Text:', error.response.statusText);
          
          if (error.response.data) {
            console.log('Server response data:', error.response.data);
            
            // Handle validation errors
            if (error.response.data.errors) {
              console.group('Validation Errors:');
              console.table(error.response.data.errors);
              
              // Group errors by field for easier debugging
              const errorsByField = {};
              if (Array.isArray(error.response.data.errors)) {
                error.response.data.errors.forEach(err => {
                  if (err.field || err.param) {
                    const fieldName = err.field || err.param;
                    errorsByField[fieldName] = err.message || err.msg;
                  }
                });
                console.log('Grouped by field:', errorsByField);
              }
              console.groupEnd();
            }
            
            // Check for message property
            if (error.response.data.message) {
              console.error('Error message:', error.response.data.message);
            }
          }
        } else if (error.request) {
          console.error('No response received. Network issue?');
        } else {
          console.error('Error before request completion:', error.message);
        }
        
        console.groupEnd();
        
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
      if (response.data.token) {
        tokenManager.setToken(response.data.token);
        tokenManager.setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      logError('auth:register', error, { email: userData.email });
      throw formatApiError(error, 'Registrierung fehlgeschlagen');
    }
  },
  
  login: async (credentials) => {
    try {
      console.log('Sending login request to API...');
      const response = await api.post('/auth/login', credentials);
      console.log('Login response received:', { success: !!response.data.success, hasToken: !!response.data.token });
      
      if (response.data.token) {
        // Store token with proper timestamp
        tokenManager.setToken(response.data.token);
        tokenManager.setTokenTimestamp(); // Set current timestamp
        tokenManager.setUser(response.data.user);
        console.log('Auth data stored in localStorage');
      } else {
        console.warn('No token received in login response');
      }
      
      // Check for redirect info from previous session expiration
      const redirectUrl = localStorage.getItem('auth_redirect');
      if (redirectUrl) {
        // Store redirect URL in the response for the component to handle
        response.data.redirectUrl = redirectUrl;
        // Clear after retrieval
        localStorage.removeItem('auth_redirect');
      }
      
      return response.data;
    } catch (error) {
      // Enhanced error logging
      logError('auth:login', error, { email: credentials.email });
      
      // More specific error message based on the error
      let errorMessage = 'Login fehlgeschlagen';
      
      if (error.response) {
        const status = error.response.status;
        
        if (status === 401) {
          errorMessage = 'Ungültige E-Mail oder Passwort';
        } else if (status === 400) {
          errorMessage = error.response.data?.message || 'Ungültige Eingabe';
        } else if (status === 403) {
          errorMessage = 'Ihr Konto wurde gesperrt. Bitte kontaktieren Sie den Administrator.';
        } else if (status === 429) {
          errorMessage = 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.';
        } else if (status >= 500) {
          errorMessage = 'Serverfehler. Bitte versuchen Sie es später erneut.';
        }
      } else if (error.request) {
        errorMessage = 'Keine Antwort vom Server erhalten. Bitte überprüfen Sie Ihre Internetverbindung.';
      }
      
      throw formatApiError(error, errorMessage);
    }
  },
  
  logout: () => {
    tokenManager.clearAuthData();
    // Only redirect if not already on login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  },
  
  checkAuth: async () => {
    try {
      const response = await api.get('/auth/check');
      return response.data;
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
export const clientService = createService('/clients');

// Umzuege service with additional methods
export const umzuegeService = {
  ...createService('/umzuege'),
  
  // Method to update the status of a move
  updateStatus: async (id, statusData) => {
    try {
      const response = await api.post(`/umzuege/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error(`updateStatus /umzuege/${id}/status`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Fehler beim Aktualisieren des Status'
      };
    }
  }
};

export const mitarbeiterService = {
  ...createService('/mitarbeiter'),
  
  // Method to upload a profile image
  uploadImage: async (id, formData) => {
    try {
      const response = await api.post(`/mitarbeiter/${id}/profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: progressEvent => {
          if (formData.onProgress && typeof formData.onProgress === 'function') {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            formData.onProgress(percentCompleted);
          }
        }
      });
      return response.data;
    } catch (error) {
      logError(`uploadImage /mitarbeiter/${id}/profile-image`, error);
      return formatApiError(error, 'Fehler beim Hochladen des Profilbilds');
    }
  }
};
export const fahrzeugeService = {
  ...createService('/fahrzeuge'),
  
  // Method to update vehicle status
  updateStatus: async (id, statusData) => {
    try {
      const response = await api.patch(`/fahrzeuge/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      logError(`updateStatus /fahrzeuge/${id}/status`, error);
      return formatApiError(error, 'Fehler beim Aktualisieren des Status');
    }
  },
  
  // Method to update odometer reading
  updateKilometerstand: async (id, kilometerstand) => {
    try {
      const response = await api.patch(`/fahrzeuge/${id}/kilometerstand`, { kilometerstand });
      return response.data;
    } catch (error) {
      logError(`updateKilometerstand /fahrzeuge/${id}/kilometerstand`, error);
      return formatApiError(error, 'Fehler beim Aktualisieren des Kilometerstands');
    }
  },
  
  // Method to upload a vehicle image
  uploadImage: async (id, formData) => {
    try {
      const response = await api.post(`/fahrzeuge/${id}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: progressEvent => {
          if (formData.onProgress && typeof formData.onProgress === 'function') {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            formData.onProgress(percentCompleted);
          }
        }
      });
      return response.data;
    } catch (error) {
      logError(`uploadImage /fahrzeuge/${id}/image`, error);
      return formatApiError(error, 'Fehler beim Hochladen des Fahrzeugbilds');
    }
  }
};
export const aufnahmenService = createService('/aufnahmen');

// Financial services with correct backend endpoints
export const finanzenService = {
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
      // Die Backend-Route erwartet '/finanzen/monatsuebersicht/:jahr'
      const response = await api.get(`/finanzen/monatsuebersicht/${jahr}`);
      return response.data;
    } catch (error) {
      logError(`finanzen:getMonatsUebersicht/${jahr}`, error);
      return formatApiError(error, 'Fehler beim Laden der Monatsübersicht');
    }
  },
  
  getMonatsDetails: async (jahr, monat) => {
    try {
      // Die Backend-Route erwartet '/finanzen/monat/:monat/:jahr'
      const response = await api.get(`/finanzen/monat/${monat}/${jahr}`);
      return response.data;
    } catch (error) {
      logError(`finanzen:getMonatsDetails/${jahr}/${monat}`, error);
      return formatApiError(error, 'Fehler beim Laden der Monatsdetails');
    }
  }
};

export const zeiterfassungService = {
  ...createService('/zeiterfassung'),
  
  // Get all available employees for time tracking
  getMitarbeiter: async () => {
    try {
      console.log('Fetching mitarbeiter data for zeiterfassung...');
      
      // Try both endpoints - first try zeiterfassung specific endpoint
      let response;
      try {
        response = await api.get('/zeiterfassung/mitarbeiter');
        console.log('Successfully fetched from /zeiterfassung/mitarbeiter');
      } catch (error) {
        console.log('Failed to fetch from /zeiterfassung/mitarbeiter, trying fallback to /mitarbeiter');
        // If that fails, try the general mitarbeiter endpoint
        response = await api.get('/mitarbeiter');
        console.log('Successfully fetched from /mitarbeiter');
      }
      
      // Debug log raw response
      console.log('Raw mitarbeiter API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataType: typeof response.data,
        dataIsArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'not an array'
      });
      
      // Return data directly, not wrapped in success/data object
      return response.data;
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error);
      console.error('Error details:', error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response');
      
      logError('zeiterfassung:getMitarbeiter', error);
      return formatApiError(error, 'Fehler beim Laden der Mitarbeiterdaten');
    }
  },
  
  // Get all available projects for time tracking
  getUmzugsprojekte: async () => {
    try {
      console.log('Fetching projekt data for zeiterfassung...');
      
      // Try both endpoints - first try zeiterfassung specific endpoint
      let response;
      try {
        response = await api.get('/zeiterfassung/projekte');
        console.log('Successfully fetched from /zeiterfassung/projekte');
      } catch (error) {
        console.log('Failed to fetch from /zeiterfassung/projekte, trying fallback to /umzuege');
        // If that fails, try the general umzuege endpoint
        response = await api.get('/umzuege');
        console.log('Successfully fetched from /umzuege');
      }
      
      // Debug log raw response
      console.log('Raw projekte API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataType: typeof response.data,
        dataIsArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'not an array'
      });
      
      // Return data directly, not wrapped in success/data object
      return response.data;
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error);
      console.error('Error details:', error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response');
      
      logError('zeiterfassung:getUmzugsprojekte', error);
      return formatApiError(error, 'Fehler beim Laden der Projektdaten');
    }
  },
  
  // Get time entries for a specific project
  getZeiterfassungen: async (projektId) => {
    try {
      const response = await api.get(`/zeiterfassung/projekt/${projektId}`);
      console.log('Raw zeiterfassungen API response:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataIsArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'not an array'
      });
      
      // Return data directly, not wrapped in success/data object
      return response.data;
    } catch (error) {
      logError(`zeiterfassung:getZeiterfassungen/${projektId}`, error);
      return formatApiError(error, 'Fehler beim Laden der Zeiterfassungen für das Projekt');
    }
  },
  
  // Add a new time entry
  addZeiterfassung: async (data) => {
    try {
      // Using the correct endpoint from zeiterfassung.routes.js
      const response = await api.post('/zeiterfassung', data);
      console.log('Add zeiterfassung API response:', {
        status: response.status,
        statusText: response.statusText
      });
      
      // Return data directly, not wrapped in success/data object
      return response.data;
    } catch (error) {
      logError('zeiterfassung:addZeiterfassung', error);
      return formatApiError(error, 'Fehler beim Hinzufügen der Zeiterfassung');
    }
  },
  
  // Update an existing time entry
  updateZeiterfassung: async (id, data) => {
    try {
      // Using the correct endpoint from zeiterfassung.routes.js
      const response = await api.put(`/zeiterfassung/${id}`, data);
      console.log('Update zeiterfassung API response:', {
        status: response.status,
        statusText: response.statusText
      });
      
      // Return data directly, not wrapped in success/data object
      return response.data;
    } catch (error) {
      logError(`zeiterfassung:updateZeiterfassung/${id}`, error);
      return formatApiError(error, 'Fehler beim Aktualisieren der Zeiterfassung');
    }
  },
  
  // Delete a time entry
  deleteZeiterfassung: async (id) => {
    try {
      // Using the correct endpoint from zeiterfassung.routes.js
      const response = await api.delete(`/zeiterfassung/${id}`);
      console.log('Delete zeiterfassung API response:', {
        status: response.status,
        statusText: response.statusText
      });
      
      // Return data directly, not wrapped in success/data object
      return response.data;
    } catch (error) {
      logError(`zeiterfassung:deleteZeiterfassung/${id}`, error);
      return formatApiError(error, 'Fehler beim Löschen der Zeiterfassung');
    }
  },
  
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
  },
  
  getUnread: async () => {
    try {
      const response = await api.get('/benachrichtigungen/unread');
      return response.data;
    } catch (error) {
      logError('getUnread /benachrichtigungen/unread', error);
      return formatApiError(error, 'Fehler beim Laden ungelesener Benachrichtigungen');
    }
  },
  
  getCount: async () => {
    try {
      const response = await api.get('/benachrichtigungen/count');
      return response.data;
    } catch (error) {
      logError('getCount /benachrichtigungen/count', error);
      return formatApiError(error, 'Fehler beim Abrufen der Benachrichtigungsanzahl');
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
          // Fix: Use global replace to remove all quotes
          filename = filenameMatch[1].replace(/['"]/g, '');
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
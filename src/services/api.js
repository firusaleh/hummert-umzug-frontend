// src/services/api.fixed.js
import axios from 'axios';
import configService from './configService';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// Token storage keys
const TOKEN_KEYS = {
  access: 'auth_token',
  refresh: 'refresh_token',
  timestamp: 'token_timestamp',
  user: 'auth_user',
};

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// Token management utilities
const tokenManager = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEYS.access),
  getRefreshToken: () => localStorage.getItem(TOKEN_KEYS.refresh),
  
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEYS.access, accessToken);
    localStorage.setItem(TOKEN_KEYS.refresh, refreshToken);
    localStorage.setItem(TOKEN_KEYS.timestamp, Date.now().toString());
  },
  
  clearTokens: () => {
    Object.values(TOKEN_KEYS).forEach(key => localStorage.removeItem(key));
  },
  
  isTokenExpired: () => {
    const timestamp = localStorage.getItem(TOKEN_KEYS.timestamp);
    if (!timestamp) return true;
    
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return tokenAge > maxAge;
  },
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request (without sensitive data)
    if (process.env.NODE_ENV === 'development') {
      const { data = {}, params = {} } = config;
      const safeData = { ...data, ...params };
      
      // Hide sensitive fields
      const sensitiveFields = ['password', 'newPassword', 'currentPassword', 'token'];
      sensitiveFields.forEach(field => {
        if (safeData[field]) safeData[field] = '***';
      });
      
      console.log(`${config.method?.toUpperCase()} ${config.url}`, safeData);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Response ${response.status}:`, response.config.url);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details
    if (error.response) {
      console.error(`API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('No response:', error.request);
    } else {
      console.error('Request error:', error.message);
    }
    
    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await api.post('/auth/refresh', { refreshToken });
          if (response.data?.token) {
            tokenManager.setTokens(response.data.token, refreshToken);
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Token error handled silently;
      }
      
      // Clear tokens and redirect to login
      tokenManager.clearTokens();
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/login');
      }
    }
    
    // Retry logic for network errors
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }
    
    const shouldRetry = 
      originalRequest._retryCount < API_CONFIG.retryAttempts &&
      (error.code === 'ECONNABORTED' || 
       error.code === 'ENOTFOUND' ||
       error.response?.status >= 500);
    
    if (shouldRetry) {
      originalRequest._retryCount++;
      
      // Wait before retry
      await new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.retryDelay * originalRequest._retryCount)
      );
      
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Base service class
class BaseService {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }
  
  async handleResponse(promise) {
    try {
      const response = await promise;
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  handleError(error) {
    let message = 'Ein Fehler ist aufgetreten';
    let status = null;
    let errors = null;
    
    if (error.response) {
      status = error.response.status;
      message = error.response.data?.message || this.getErrorMessage(status);
      errors = error.response.data?.errors;
    } else if (error.request) {
      message = 'Keine Verbindung zum Server';
    } else {
      message = error.message;
    }
    
    return { success: false, message, status, errors };
  }
  
  getErrorMessage(status) {
    const errorMessages = {
      400: 'Ungültige Anfrage',
      401: 'Nicht autorisiert',
      403: 'Zugriff verweigert',
      404: 'Nicht gefunden',
      409: 'Konflikt - Ressource existiert bereits',
      422: 'Validierungsfehler',
      429: 'Zu viele Anfragen',
      500: 'Serverfehler',
      503: 'Service nicht verfügbar',
    };
    
    return errorMessages[status] || 'Ein Fehler ist aufgetreten';
  }
  
  // CRUD operations
  async getAll(params = {}) {
    return this.handleResponse(api.get(this.endpoint, { params }));
  }
  
  async getById(id) {
    return this.handleResponse(api.get(`${this.endpoint}/${id}`));
  }
  
  async create(data) {
    return this.handleResponse(api.post(this.endpoint, data));
  }
  
  async update(id, data) {
    return this.handleResponse(api.put(`${this.endpoint}/${id}`, data));
  }
  
  async patch(id, data) {
    return this.handleResponse(api.patch(`${this.endpoint}/${id}`, data));
  }
  
  async delete(id) {
    return this.handleResponse(api.delete(`${this.endpoint}/${id}`));
  }
}


// User Service
class UserService extends BaseService {
  constructor() {
    super('/users');
  }
  
  async getProfile() {
    return this.handleResponse(api.get('/users/me'));
  }
  
  async updateProfile(profileData) {
    return this.handleResponse(api.put('/users/me', profileData));
  }
  
  async changePassword(passwordData) {
    return this.handleResponse(api.post('/users/change-password', passwordData));
  }
  
  async updateAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.handleResponse(
      api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
  }
}

// Umzug Service
class UmzugService extends BaseService {
  constructor() {
    super('/umzuege');
  }
  
  async updateStatus(id, status, reason) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/status`, { status, reason })
    );
  }
  
  async addTask(id, taskData) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/tasks`, taskData)
    );
  }
  
  async updateTask(id, taskId, updates) {
    return this.handleResponse(
      api.put(`${this.endpoint}/${id}/tasks/${taskId}`, updates)
    );
  }
  
  async deleteTask(id, taskId) {
    return this.handleResponse(
      api.delete(`${this.endpoint}/${id}/tasks/${taskId}`)
    );
  }
  
  async addNote(id, noteData) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/notes`, noteData)
    );
  }
  
  async uploadDocument(id, file) {
    const formData = new FormData();
    formData.append('document', file);
    
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
  }
  
  async generateInvoice(id) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/invoice`)
    );
  }
  
  async export(id, format = 'pdf') {
    return this.handleResponse(
      api.get(`${this.endpoint}/${id}/export`, {
        params: { format },
        responseType: 'blob'
      })
    );
  }
}

// Mitarbeiter Service
class MitarbeiterService extends BaseService {
  constructor() {
    super('/mitarbeiter');
  }
  
  async addArbeitszeit(id, arbeitszeitData) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/arbeitszeiten`, arbeitszeitData)
    );
  }
  
  async getArbeitszeiten(id, params) {
    return this.handleResponse(
      api.get(`${this.endpoint}/${id}/arbeitszeiten`, { params })
    );
  }
  
  async updateArbeitszeit(id, arbeitszeitId, updates) {
    return this.handleResponse(
      api.put(`${this.endpoint}/${id}/arbeitszeiten/${arbeitszeitId}`, updates)
    );
  }
  
  async deleteArbeitszeit(id, arbeitszeitId) {
    return this.handleResponse(
      api.delete(`${this.endpoint}/${id}/arbeitszeiten/${arbeitszeitId}`)
    );
  }
  
  async addQualifikation(id, qualifikationData) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/qualifikationen`, qualifikationData)
    );
  }
  
  async deleteQualifikation(id, qualifikationId) {
    return this.handleResponse(
      api.delete(`${this.endpoint}/${id}/qualifikationen/${qualifikationId}`)
    );
  }
  
  async uploadDokument(id, file) {
    const formData = new FormData();
    formData.append('dokument', file);
    
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/dokumente`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
  }
  
  async getMonatsbericht(id, year, month) {
    return this.handleResponse(
      api.get(`${this.endpoint}/${id}/monatsbericht`, {
        params: { year, month }
      })
    );
  }
}

// Aufnahme Service
class AufnahmeService extends BaseService {
  constructor() {
    super('/aufnahmen');
  }
  
  async addRaum(id, raumData) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/raeume`, raumData)
    );
  }
  
  async updateRaum(id, raumId, updates) {
    return this.handleResponse(
      api.put(`${this.endpoint}/${id}/raeume/${raumId}`, updates)
    );
  }
  
  async deleteRaum(id, raumId) {
    return this.handleResponse(
      api.delete(`${this.endpoint}/${id}/raeume/${raumId}`)
    );
  }
  
  async addMoebel(id, raumId, moebelData) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/raeume/${raumId}/moebel`, moebelData)
    );
  }
  
  async updateMoebel(id, raumId, moebelId, updates) {
    return this.handleResponse(
      api.put(`${this.endpoint}/${id}/raeume/${raumId}/moebel/${moebelId}`, updates)
    );
  }
  
  async deleteMoebel(id, raumId, moebelId) {
    return this.handleResponse(
      api.delete(`${this.endpoint}/${id}/raeume/${raumId}/moebel/${moebelId}`)
    );
  }
  
  async uploadFotos(id, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('fotos', file));
    
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/fotos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
  }
  
  async generateAngebot(id, angebotData = {}) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/angebot`, angebotData)
    );
  }
  
  async exportToPDF(id) {
    return this.handleResponse(
      api.get(`${this.endpoint}/${id}/export`, { responseType: 'blob' })
    );
  }
}

// Finance Service
class FinanceService extends BaseService {
  constructor() {
    super('/finanzen');
  }
  
  // Angebote (Quotes)
  async getAngebote(params) {
    return this.handleResponse(api.get('/finanzen/angebote', { params }));
  }
  
  async getAngebotById(id) {
    return this.handleResponse(api.get(`/finanzen/angebote/${id}`));
  }
  
  async createAngebot(angebotData) {
    return this.handleResponse(api.post('/finanzen/angebote', angebotData));
  }
  
  async updateAngebot(id, updates) {
    return this.handleResponse(api.put(`/finanzen/angebote/${id}`, updates));
  }
  
  async deleteAngebot(id) {
    return this.handleResponse(api.delete(`/finanzen/angebote/${id}`));
  }
  
  async versendenAngebot(id, empfaenger) {
    return this.handleResponse(
      api.post(`/finanzen/angebote/${id}/versenden`, empfaenger)
    );
  }
  
  // Rechnungen (Invoices)
  async getRechnungen(params) {
    return this.handleResponse(api.get('/finanzen/rechnungen', { params }));
  }
  
  async getRechnungById(id) {
    return this.handleResponse(api.get(`/finanzen/rechnungen/${id}`));
  }
  
  async createRechnung(rechnungData) {
    return this.handleResponse(api.post('/finanzen/rechnungen', rechnungData));
  }
  
  async updateRechnung(id, updates) {
    return this.handleResponse(api.put(`/finanzen/rechnungen/${id}`, updates));
  }
  
  async deleteRechnung(id) {
    return this.handleResponse(api.delete(`/finanzen/rechnungen/${id}`));
  }
  
  async addZahlung(id, zahlungData) {
    return this.handleResponse(
      api.post(`/finanzen/rechnungen/${id}/zahlungen`, zahlungData)
    );
  }
  
  async createMahnung(id, mahnungData = {}) {
    return this.handleResponse(
      api.post(`/finanzen/rechnungen/${id}/mahnungen`, mahnungData)
    );
  }
  
  async stornieren(id, grund) {
    return this.handleResponse(
      api.post(`/finanzen/rechnungen/${id}/stornieren`, { grund })
    );
  }
  
  // Projektkosten (Project Costs)
  async getProjektkosten(params) {
    return this.handleResponse(api.get('/finanzen/projektkosten', { params }));
  }
  
  async getProjektkostenById(id) {
    return this.handleResponse(api.get(`/finanzen/projektkosten/${id}`));
  }
  
  async createProjektkosten(kostenData) {
    return this.handleResponse(api.post('/finanzen/projektkosten', kostenData));
  }
  
  async updateProjektkosten(id, updates) {
    return this.handleResponse(api.put(`/finanzen/projektkosten/${id}`, updates));
  }
  
  async deleteProjektkosten(id) {
    return this.handleResponse(api.delete(`/finanzen/projektkosten/${id}`));
  }
  
  async genehmigenKosten(id, genehmigung) {
    return this.handleResponse(
      api.post(`/finanzen/projektkosten/${id}/genehmigung`, genehmigung)
    );
  }
  
  async markAsBezahlt(id, zahlungData) {
    return this.handleResponse(
      api.post(`/finanzen/projektkosten/${id}/bezahlung`, zahlungData)
    );
  }
  
  // Finanzübersicht (Financial Overview)
  async getUebersicht(year, month) {
    return this.handleResponse(
      api.get('/finanzen/uebersicht', { params: { year, month } })
    );
  }
  
  // Alias for getUebersicht to match Dashboard usage
  async getFinanzuebersicht(year, month) {
    return this.getUebersicht(year, month);
  }
  
  // Get monthly overview for a specific year
  async getMonatsUebersicht(year) {
    return this.handleResponse(
      api.get(`/finanzen/monatsuebersicht/${year}`)
    );
  }
  
  async generateUebersicht(year, month) {
    return this.handleResponse(
      api.post('/finanzen/uebersicht/generieren', { year, month })
    );
  }
  
  async finalizeUebersicht(year, month) {
    return this.handleResponse(
      api.post(`/finanzen/uebersicht/${year}/${month}/finalisieren`)
    );
  }
  
  // Reports
  async getUmsatzbericht(von, bis, gruppierung = 'monat') {
    return this.handleResponse(
      api.get('/finanzen/berichte/umsatz', {
        params: { von, bis, gruppierung }
      })
    );
  }
  
  async getKostenbericht(von, bis, kategorie = null) {
    return this.handleResponse(
      api.get('/finanzen/berichte/kosten', {
        params: { von, bis, kategorie }
      })
    );
  }
  
  async getOffeneForderungen() {
    return this.handleResponse(api.get('/finanzen/berichte/forderungen'));
  }
  
  // Export
  async exportRechnungen(format, von, bis) {
    return this.handleResponse(
      api.get('/finanzen/export/rechnungen', {
        params: { format, von, bis },
        responseType: format === 'pdf' ? 'blob' : 'json'
      })
    );
  }
  
  async exportKosten(format, von, bis) {
    return this.handleResponse(
      api.get('/finanzen/export/kosten', {
        params: { format, von, bis },
        responseType: format === 'pdf' ? 'blob' : 'json'
      })
    );
  }
}

// Notification Service
class NotificationService extends BaseService {
  constructor() {
    super('/benachrichtigungen');
  }
  
  async markAsRead(id, gelesen = true) {
    return this.handleResponse(
      api.put(`${this.endpoint}/${id}/read`, { gelesen })
    );
  }
  
  async markAllAsRead() {
    return this.handleResponse(api.put(`${this.endpoint}/mark-all-read`));
  }
  
  async deleteAllRead() {
    return this.handleResponse(api.delete(`${this.endpoint}/delete-all-read`));
  }
  
  async getPreferences() {
    return this.handleResponse(api.get(`${this.endpoint}/preferences`));
  }
  
  async updatePreferences(preferences) {
    return this.handleResponse(
      api.put(`${this.endpoint}/preferences`, preferences)
    );
  }
  
  async subscribeToPush(subscription) {
    return this.handleResponse(
      api.post(`${this.endpoint}/subscribe`, { subscription })
    );
  }
  
  async unsubscribeFromPush() {
    return this.handleResponse(api.post(`${this.endpoint}/unsubscribe`));
  }
}

// Time Tracking Service
class TimeTrackingService extends BaseService {
  constructor() {
    super('/zeiterfassung');
  }
  
  async checkIn(zeiterfassungData) {
    return this.handleResponse(api.post(this.endpoint, zeiterfassungData));
  }
  
  async checkOut(id, endzeit) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/checkout`, { endzeit })
    );
  }
  
  async addPause(id, pauseData) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/pause`, pauseData)
    );
  }
  
  async approve(id, genehmigung) {
    return this.handleResponse(
      api.post(`${this.endpoint}/${id}/approve`, genehmigung)
    );
  }
  
  async bulkApprove(ids, genehmigt) {
    return this.handleResponse(
      api.post(`${this.endpoint}/bulk-approve`, { ids, genehmigt })
    );
  }
  
  async getMonthlyReport(year, month, mitarbeiterId = null) {
    return this.handleResponse(
      api.get(`${this.endpoint}/report/monthly`, {
        params: { year, month, mitarbeiterId }
      })
    );
  }
  
  async getProjectReport(projektId, vonDatum, bisDatum) {
    return this.handleResponse(
      api.get(`${this.endpoint}/report/project`, {
        params: { projektId, vonDatum, bisDatum }
      })
    );
  }
  
  async getOvertimeReport(year, month = null, mitarbeiterId = null) {
    return this.handleResponse(
      api.get(`${this.endpoint}/report/overtime`, {
        params: { year, month, mitarbeiterId }
      })
    );
  }
  
  async export(format, vonDatum, bisDatum, mitarbeiterId = null) {
    return this.handleResponse(
      api.get(`${this.endpoint}/export`, {
        params: { format, vonDatum, bisDatum, mitarbeiterId },
        responseType: format === 'pdf' ? 'blob' : 'json'
      })
    );
  }
}

// Project Service
class ProjectService extends BaseService {
  async getAll(params = {}) {
    return this.handleResponse(api.get('/projects', { params }));
  }
  
  async getById(id) {
    return this.handleResponse(api.get(`/projects/${id}`));
  }
  
  async create(projectData) {
    return this.handleResponse(api.post('/projects', projectData));
  }
  
  async update(id, updates) {
    return this.handleResponse(api.put(`/projects/${id}`, updates));
  }
  
  async delete(id) {
    return this.handleResponse(api.delete(`/projects/${id}`));
  }
}

// Task Service
class TaskService extends BaseService {
  async getAll(params = {}) {
    return this.handleResponse(api.get('/tasks', { params }));
  }
  
  async getById(id) {
    return this.handleResponse(api.get(`/tasks/${id}`));
  }
  
  async create(taskData) {
    return this.handleResponse(api.post('/tasks', taskData));
  }
  
  async update(id, updates) {
    return this.handleResponse(api.put(`/tasks/${id}`, updates));
  }
  
  async delete(id) {
    return this.handleResponse(api.delete(`/tasks/${id}`));
  }
}

// Vehicle Service
class VehicleService extends BaseService {
  async getAll(params = {}) {
    return this.handleResponse(api.get('/fahrzeuge', { params }));
  }
  
  async getById(id) {
    return this.handleResponse(api.get(`/fahrzeuge/${id}`));
  }
  
  async create(vehicleData) {
    return this.handleResponse(api.post('/fahrzeuge', vehicleData));
  }
  
  async update(id, updates) {
    return this.handleResponse(api.put(`/fahrzeuge/${id}`, updates));
  }
  
  async delete(id) {
    return this.handleResponse(api.delete(`/fahrzeuge/${id}`));
  }
  
  async updateMileage(id, mileageData) {
    return this.handleResponse(api.post(`/fahrzeuge/${id}/kilometerstand`, mileageData));
  }
}

// Auth Service
class AuthService extends BaseService {
  async login(credentials) {
    // Direct API call to match backend response format
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data && response.data.token) {
        // Store tokens and user data
        tokenManager.setTokens(response.data.token, response.data.refreshToken || '');
        
        if (response.data.user) {
          localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(response.data.user));
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data && response.data.token) {
        // Store tokens and user data
        tokenManager.setTokens(response.data.token, response.data.refreshToken || '');
        
        if (response.data.user) {
          localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(response.data.user));
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local tokens
      tokenManager.clearTokens();
    }
  }
  
  async refreshToken() {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.data && response.data.token) {
        tokenManager.setTokens(response.data.token, response.data.refreshToken);
      }
      
      return response;
    } catch (error) {
      tokenManager.clearTokens();
      throw error;
    }
  }
  
  async checkAuth() {
    return api.get('/auth/check');
  }
  
  async getMe() {
    return api.get('/auth/me');
  }
  
  async updateProfile(profileData) {
    return api.put('/users/me', profileData);
  }
  
  async changePassword(passwordData) {
    return api.post('/users/change-password', passwordData);
  }
  
  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  }
  
  async resetPassword(token, newPassword) {
    return api.post('/auth/reset-password', { token, newPassword });
  }
  
  async checkApiHealth() {
    try {
      const response = await api.get('/health', { timeout: 5000 });
      return response.data;
    } catch (error) {
      throw new Error('API not available');
    }
  }
}

// Client Service
class ClientService extends BaseService {
  async getAll(params = {}) {
    return this.handleResponse(api.get('/clients', { params }));
  }
  
  async getById(id) {
    return this.handleResponse(api.get(`/clients/${id}`));
  }
  
  async create(clientData) {
    return this.handleResponse(api.post('/clients', clientData));
  }
  
  async update(id, updates) {
    return this.handleResponse(api.put(`/clients/${id}`, updates));
  }
  
  async delete(id) {
    return this.handleResponse(api.delete(`/clients/${id}`));
  }
  
  async getUmzuege(clientId, params = {}) {
    return this.handleResponse(api.get(`/clients/${clientId}/umzuege`, { params }));
  }
  
  async getStatistics(clientId) {
    return this.handleResponse(api.get(`/clients/${clientId}/statistics`));
  }
}

// File Service
class FileService {
  async upload(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata
    Object.entries(metadata).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => formData.append(`${key}[]`, item));
      } else {
        formData.append(key, value);
      }
    });
    
    try {
      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: metadata.onProgress || null,
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return new BaseService().handleError(error);
    }
  }
  
  async download(id) {
    try {
      const response = await api.get(`/files/download/${id}`, {
        responseType: 'blob'
      });
      
      // Extract filename from headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
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
      
      return { success: true };
    } catch (error) {
      return new BaseService().handleError(error);
    }
  }
  
  async getAll(params = {}) {
    return new BaseService().handleResponse(api.get('/files', { params }));
  }
  
  async getById(id) {
    return new BaseService().handleResponse(api.get(`/files/${id}`));
  }
  
  async update(id, updates) {
    return new BaseService().handleResponse(api.put(`/files/${id}`, updates));
  }
  
  async delete(id) {
    return new BaseService().handleResponse(api.delete(`/files/${id}`));
  }
}

// Initialize services
export const userService = new UserService();
export const umzugService = new UmzugService();
export const mitarbeiterService = new MitarbeiterService();
export const aufnahmeService = new AufnahmeService();
export const financeService = new FinanceService();
export const notificationService = new NotificationService();
export const timeTrackingService = new TimeTrackingService();
export const clientService = new ClientService();
export const fileService = new FileService();
export const projectService = new ProjectService();
export const taskService = new TaskService();
export const vehicleService = new VehicleService();
export const authService = new AuthService();

// Aliases for backward compatibility
export const umzuegeService = umzugService;
export const finanzenService = financeService;
export const aufnahmenService = aufnahmeService;
export const fahrzeugeService = vehicleService;
export const zeiterfassungService = timeTrackingService;

// Export API instance for custom requests
export default api;

// Export configuration for testing
export { API_CONFIG, tokenManager, configService };
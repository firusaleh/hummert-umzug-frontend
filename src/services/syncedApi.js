// Enhanced API service with data synchronization
import axios from 'axios';
import dataSyncService from './dataSyncService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Token management
let authToken = null;
let refreshToken = null;
let isRefreshing = false;
let refreshSubscribers = [];

// Set auth tokens
export const setAuthTokens = (access, refresh) => {
  authToken = access;
  refreshToken = refresh;
  if (access) {
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    localStorage.setItem('token', access);
  }
  if (refresh) {
    localStorage.setItem('refreshToken', refresh);
  }
};

// Clear auth tokens
export const clearAuthTokens = () => {
  authToken = null;
  refreshToken = null;
  delete api.defaults.headers.common['Authorization'];
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

// Initialize tokens from localStorage
const initializeTokens = () => {
  const token = localStorage.getItem('token');
  const refresh = localStorage.getItem('refreshToken');
  if (token) {
    setAuthTokens(token, refresh);
  }
};

// Subscribe to refresh
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

// Notify subscribers
const onRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Ensure auth header is set
    if (authToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      if (isRefreshing) {
        // Wait for token refresh
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        
        setAuthTokens(newToken, newRefreshToken);
        onRefreshed(newToken);
        isRefreshing = false;
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        clearAuthTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Base service with data sync integration
class SyncedService {
  constructor(endpoint, entityType) {
    this.endpoint = endpoint;
    this.entityType = entityType;
  }

  // Get all with sync
  async getAll(params = {}) {
    try {
      const response = await api.get(this.endpoint, { params });
      
      // Update cache
      if (response.data.data || response.data[this.entityType]) {
        const entities = response.data.data || response.data[this.entityType];
        entities.forEach(entity => {
          dataSyncService.updateCache(this.entityType, entity._id, entity);
        });
      }
      
      return response.data;
    } catch (error) {
      // Try to return cached data on error
      if (error.response?.status >= 500 || !navigator.onLine) {
        const cached = dataSyncService.getCachedByType(this.entityType);
        if (cached.length > 0) {
          console.log(`Returning cached ${this.entityType} data`);
          return { data: cached, fromCache: true };
        }
      }
      throw error;
    }
  }

  // Get by ID with sync
  async getById(id) {
    try {
      const response = await api.get(`${this.endpoint}/${id}`);
      
      // Update cache
      dataSyncService.updateCache(this.entityType, id, response.data);
      
      return response.data;
    } catch (error) {
      // Try to return cached data on error
      if (error.response?.status >= 500 || !navigator.onLine) {
        const cached = dataSyncService.getCached(this.entityType, id);
        if (cached) {
          console.log(`Returning cached ${this.entityType} data for ID: ${id}`);
          return { ...cached, fromCache: true };
        }
      }
      throw error;
    }
  }

  // Create with sync
  async create(data) {
    try {
      const response = await api.post(this.endpoint, data);
      
      // Notify data sync service
      if (dataSyncService.connected) {
        await dataSyncService.createEntity(this.entityType, response.data);
      } else {
        // Update local cache
        dataSyncService.updateCache(this.entityType, response.data._id, response.data);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update with sync
  async update(id, data) {
    try {
      const response = await api.put(`${this.endpoint}/${id}`, data);
      
      // Notify data sync service
      if (dataSyncService.connected) {
        await dataSyncService.updateEntity(this.entityType, id, data);
      } else {
        // Update local cache
        dataSyncService.updateCache(this.entityType, id, response.data);
      }
      
      return response.data;
    } catch (error) {
      // If offline, queue update
      if (!navigator.onLine) {
        dataSyncService.queueUpdate({
          entityType: this.entityType,
          entityId: id,
          updates: data,
          operation: 'update'
        });
        
        // Update local cache optimistically
        const cached = dataSyncService.getCached(this.entityType, id);
        if (cached) {
          const updated = { ...cached, ...data, _pending: true };
          dataSyncService.updateCache(this.entityType, id, updated);
          return updated;
        }
      }
      throw error;
    }
  }

  // Delete with sync
  async delete(id) {
    try {
      const response = await api.delete(`${this.endpoint}/${id}`);
      
      // Notify data sync service
      if (dataSyncService.connected) {
        await dataSyncService.deleteEntity(this.entityType, id);
      } else {
        // Remove from cache
        dataSyncService.dataCache.delete(`${this.entityType}:${id}`);
      }
      
      return response.data;
    } catch (error) {
      // If offline, queue deletion
      if (!navigator.onLine) {
        dataSyncService.queueUpdate({
          entityType: this.entityType,
          entityId: id,
          operation: 'delete'
        });
        
        // Remove from cache optimistically
        dataSyncService.dataCache.delete(`${this.entityType}:${id}`);
        return { success: true, _pending: true };
      }
      throw error;
    }
  }

  // Batch operations
  async batchUpdate(updates) {
    try {
      const response = await api.post(`${this.endpoint}/batch`, { updates });
      
      // Update cache for each item
      updates.forEach(update => {
        if (update.id && update.data) {
          dataSyncService.updateCache(this.entityType, update.id, update.data);
        }
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Initialize tokens on load
initializeTokens();

// Create service instances
export const umzugService = new SyncedService('/umzuege', 'umzug');
export const mitarbeiterService = new SyncedService('/mitarbeiter', 'mitarbeiter');
export const fahrzeugService = new SyncedService('/fahrzeuge', 'fahrzeug');
export const benachrichtigungService = new SyncedService('/benachrichtigungen', 'benachrichtigung');
export const zeiterfassungService = new SyncedService('/zeiterfassung', 'zeiterfassung');
export const aufnahmeService = new SyncedService('/aufnahmen', 'aufnahme');
export const finanzService = new SyncedService('/finanzen', 'finanz');

// Auth service (special case)
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { token, refreshToken, user } = response.data;
    setAuthTokens(token, refreshToken);
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    clearAuthTokens();
    dataSyncService.disconnect();
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  refresh: async () => {
    if (!refreshToken) throw new Error('No refresh token');
    const response = await api.post('/auth/refresh', { refreshToken });
    const { token: newToken, refreshToken: newRefreshToken } = response.data;
    setAuthTokens(newToken, newRefreshToken);
    return response.data;
  }
};

export default api;
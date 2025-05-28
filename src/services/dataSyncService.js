// Data Synchronization Service
// Handles real-time data updates across all components

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import EventEmitter from 'events';

class DataSyncService extends EventEmitter {
  constructor() {
    super();
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.subscribers = new Map();
    this.dataCache = new Map();
    this.pendingUpdates = new Map();
    this.syncInterval = null;
  }

  // Initialize WebSocket connection
  initialize(apiUrl, authToken) {
    if (this.socket) {
      console.warn('DataSyncService already initialized');
      return;
    }

    const wsUrl = apiUrl.replace(/^http/, 'ws');
    
    this.socket = io(wsUrl, {
      auth: { token: authToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    });

    this.setupEventHandlers();
    this.startSyncInterval();
  }

  // Setup WebSocket event handlers
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('DataSync connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      this.syncPendingUpdates();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('DataSync disconnected:', reason);
      this.connected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('error', (error) => {
      console.error('DataSync error:', error);
      this.emit('error', error);
    });

    // Data update events
    this.socket.on('data:update', this.handleDataUpdate.bind(this));
    this.socket.on('data:create', this.handleDataCreate.bind(this));
    this.socket.on('data:delete', this.handleDataDelete.bind(this));
    this.socket.on('data:batch', this.handleBatchUpdate.bind(this));

    // Sync response
    this.socket.on('sync:response', this.handleSyncResponse.bind(this));
  }

  // Subscribe to data changes for a specific entity type
  subscribe(entityType, callback, options = {}) {
    const subscriptionId = `${entityType}_${Date.now()}`;
    
    if (!this.subscribers.has(entityType)) {
      this.subscribers.set(entityType, new Map());
    }
    
    this.subscribers.get(entityType).set(subscriptionId, {
      callback,
      options
    });

    // Join room for this entity type
    if (this.connected) {
      this.socket.emit('subscribe', { entityType, options });
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(entityType, subscriptionId);
    };
  }

  // Unsubscribe from data changes
  unsubscribe(entityType, subscriptionId) {
    const entitySubscribers = this.subscribers.get(entityType);
    if (entitySubscribers) {
      entitySubscribers.delete(subscriptionId);
      
      // If no more subscribers for this entity type, leave room
      if (entitySubscribers.size === 0) {
        this.subscribers.delete(entityType);
        if (this.connected) {
          this.socket.emit('unsubscribe', { entityType });
        }
      }
    }
  }

  // Handle data update from server
  handleDataUpdate(data) {
    const { entityType, entityId, updates, timestamp } = data;
    
    // Update cache
    const cacheKey = `${entityType}:${entityId}`;
    const cached = this.dataCache.get(cacheKey) || {};
    this.dataCache.set(cacheKey, {
      ...cached,
      ...updates,
      _lastUpdated: timestamp
    });

    // Notify subscribers
    this.notifySubscribers(entityType, 'update', {
      entityId,
      updates,
      timestamp
    });
  }

  // Handle data creation from server
  handleDataCreate(data) {
    const { entityType, entity, timestamp } = data;
    
    // Add to cache
    const cacheKey = `${entityType}:${entity._id}`;
    this.dataCache.set(cacheKey, {
      ...entity,
      _lastUpdated: timestamp
    });

    // Notify subscribers
    this.notifySubscribers(entityType, 'create', {
      entity,
      timestamp
    });
  }

  // Handle data deletion from server
  handleDataDelete(data) {
    const { entityType, entityId, timestamp } = data;
    
    // Remove from cache
    const cacheKey = `${entityType}:${entityId}`;
    this.dataCache.delete(cacheKey);

    // Notify subscribers
    this.notifySubscribers(entityType, 'delete', {
      entityId,
      timestamp
    });
  }

  // Handle batch updates
  handleBatchUpdate(data) {
    const { updates } = data;
    
    updates.forEach(update => {
      switch (update.operation) {
        case 'update':
          this.handleDataUpdate(update);
          break;
        case 'create':
          this.handleDataCreate(update);
          break;
        case 'delete':
          this.handleDataDelete(update);
          break;
      }
    });
  }

  // Handle sync response from server
  handleSyncResponse(data) {
    const { entityType, entities, timestamp } = data;
    
    // Update cache with synced data
    entities.forEach(entity => {
      const cacheKey = `${entityType}:${entity._id}`;
      this.dataCache.set(cacheKey, {
        ...entity,
        _lastUpdated: timestamp
      });
    });

    // Notify subscribers of sync completion
    this.notifySubscribers(entityType, 'sync', {
      entities,
      timestamp
    });
  }

  // Notify all subscribers for an entity type
  notifySubscribers(entityType, eventType, data) {
    const entitySubscribers = this.subscribers.get(entityType);
    if (entitySubscribers) {
      entitySubscribers.forEach(({ callback, options }) => {
        // Apply filters if specified
        if (options.filter && !options.filter(data)) {
          return;
        }
        
        try {
          callback(eventType, data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }

    // Emit global event
    this.emit(`${entityType}:${eventType}`, data);
  }

  // Send update to server
  async updateEntity(entityType, entityId, updates) {
    const updateData = {
      entityType,
      entityId,
      updates,
      timestamp: new Date().toISOString()
    };

    if (this.connected) {
      return new Promise((resolve, reject) => {
        this.socket.emit('data:update', updateData, (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Update failed'));
          }
        });
      });
    } else {
      // Queue update for later
      this.queueUpdate(updateData);
      return Promise.resolve({ queued: true });
    }
  }

  // Create new entity
  async createEntity(entityType, entityData) {
    const createData = {
      entityType,
      entity: entityData,
      timestamp: new Date().toISOString()
    };

    if (this.connected) {
      return new Promise((resolve, reject) => {
        this.socket.emit('data:create', createData, (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Create failed'));
          }
        });
      });
    } else {
      // Queue creation for later
      this.queueUpdate(createData);
      return Promise.resolve({ queued: true });
    }
  }

  // Delete entity
  async deleteEntity(entityType, entityId) {
    const deleteData = {
      entityType,
      entityId,
      timestamp: new Date().toISOString()
    };

    if (this.connected) {
      return new Promise((resolve, reject) => {
        this.socket.emit('data:delete', deleteData, (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Delete failed'));
          }
        });
      });
    } else {
      // Queue deletion for later
      this.queueUpdate(deleteData);
      return Promise.resolve({ queued: true });
    }
  }

  // Queue update for later synchronization
  queueUpdate(update) {
    const key = `${update.entityType}:${update.entityId || 'new'}`;
    this.pendingUpdates.set(key, update);
  }

  // Sync pending updates when reconnected
  async syncPendingUpdates() {
    if (this.pendingUpdates.size === 0) return;

    console.log(`Syncing ${this.pendingUpdates.size} pending updates`);
    
    const updates = Array.from(this.pendingUpdates.values());
    this.pendingUpdates.clear();

    try {
      await new Promise((resolve, reject) => {
        this.socket.emit('data:batch', { updates }, (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Batch sync failed'));
          }
        });
      });
    } catch (error) {
      console.error('Failed to sync pending updates:', error);
      // Re-queue failed updates
      updates.forEach(update => this.queueUpdate(update));
    }
  }

  // Request full sync for entity type
  async requestSync(entityType, options = {}) {
    if (!this.connected) {
      throw new Error('Not connected to sync service');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('sync:request', { entityType, options }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Sync request failed'));
        }
      });
    });
  }

  // Get cached data
  getCached(entityType, entityId) {
    const cacheKey = `${entityType}:${entityId}`;
    return this.dataCache.get(cacheKey);
  }

  // Get all cached entities of a type
  getCachedByType(entityType) {
    const entities = [];
    for (const [key, value] of this.dataCache.entries()) {
      if (key.startsWith(`${entityType}:`)) {
        entities.push(value);
      }
    }
    return entities;
  }

  // Clear cache for entity type
  clearCache(entityType) {
    if (entityType) {
      for (const key of this.dataCache.keys()) {
        if (key.startsWith(`${entityType}:`)) {
          this.dataCache.delete(key);
        }
      }
    } else {
      this.dataCache.clear();
    }
  }

  // Start periodic sync interval
  startSyncInterval() {
    this.syncInterval = setInterval(() => {
      if (this.connected) {
        // Emit heartbeat
        this.socket.emit('ping');
      }
    }, 30000); // Every 30 seconds
  }

  // Cleanup and disconnect
  disconnect() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connected = false;
    this.subscribers.clear();
    this.dataCache.clear();
    this.pendingUpdates.clear();
    this.removeAllListeners();
  }
}

// Create singleton instance
const dataSyncService = new DataSyncService();

// Helper hooks for React components
export const useDataSync = (entityType, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const handleUpdate = (eventType, eventData) => {
      switch (eventType) {
        case 'sync':
          setData(eventData.entities);
          setLoading(false);
          break;
        case 'create':
          setData(prev => [eventData.entity, ...prev]);
          break;
        case 'update':
          setData(prev => prev.map(item => 
            item._id === eventData.entityId 
              ? { ...item, ...eventData.updates }
              : item
          ));
          break;
        case 'delete':
          setData(prev => prev.filter(item => item._id !== eventData.entityId));
          break;
      }
    };

    const setupSync = async () => {
      try {
        // Subscribe to updates
        unsubscribe = dataSyncService.subscribe(entityType, handleUpdate, options);
        
        // Request initial sync
        await dataSyncService.requestSync(entityType, options);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    setupSync();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [entityType, JSON.stringify(options)]);

  return { data, loading, error, refetch: () => dataSyncService.requestSync(entityType, options) };
};

export default dataSyncService;
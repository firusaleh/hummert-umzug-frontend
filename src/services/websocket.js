// src/services/websocket.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
  }

  connect() {
    if (this.connected) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token, skipping WebSocket connection');
      return;
    }

    const wsUrl = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(wsUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Re-attach all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    if (this.socket && this.connected) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      if (callback) {
        this.listeners.get(event).delete(callback);
      } else {
        this.listeners.delete(event);
      }
    }
    
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit:', event);
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new WebSocketService();

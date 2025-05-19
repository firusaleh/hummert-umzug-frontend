// src/services/websocket.js
import { io } from 'socket.io-client';
import { tokenManager } from './api.fixed';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
  }
  
  // Connect to WebSocket server
  connect(url = process.env.REACT_APP_WS_URL || 'http://localhost:5000') {
    if (this.socket && this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }
    
    const token = tokenManager.getAccessToken();
    
    this.socket = io(url, {
      transports: ['websocket'],
      auth: {
        token
      },
      query: {
        token
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });
    
    this.setupEventHandlers();
  }
  
  // Setup default event handlers
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('ws:connected');
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('ws:disconnected', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('ws:max_reconnect_failed');
      }
    });
    
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('ws:error', error);
    });
    
    // Authentication events
    this.socket.on('authenticated', () => {
      console.log('WebSocket authenticated');
      this.emit('ws:authenticated');
    });
    
    this.socket.on('unauthorized', (error) => {
      console.error('WebSocket unauthorized:', error);
      this.emit('ws:unauthorized', error);
      this.disconnect();
    });
    
    // Setup application-specific event handlers
    this.setupAppEventHandlers();
  }
  
  // Setup application-specific event handlers
  setupAppEventHandlers() {
    // Notification events
    this.socket.on('notification:new', (notification) => {
      this.emit('notification:new', notification);
    });
    
    this.socket.on('notification:updated', (notification) => {
      this.emit('notification:updated', notification);
    });
    
    // Umzug events
    this.socket.on('umzug:created', (umzug) => {
      this.emit('umzug:created', umzug);
    });
    
    this.socket.on('umzug:updated', (umzug) => {
      this.emit('umzug:updated', umzug);
    });
    
    this.socket.on('umzug:deleted', (umzugId) => {
      this.emit('umzug:deleted', umzugId);
    });
    
    this.socket.on('umzug:status_changed', (data) => {
      this.emit('umzug:status_changed', data);
    });
    
    // Task events
    this.socket.on('task:created', (task) => {
      this.emit('task:created', task);
    });
    
    this.socket.on('task:updated', (task) => {
      this.emit('task:updated', task);
    });
    
    this.socket.on('task:completed', (task) => {
      this.emit('task:completed', task);
    });
    
    // Team events
    this.socket.on('team:member_assigned', (data) => {
      this.emit('team:member_assigned', data);
    });
    
    this.socket.on('team:member_removed', (data) => {
      this.emit('team:member_removed', data);
    });
    
    // Time tracking events
    this.socket.on('time:check_in', (data) => {
      this.emit('time:check_in', data);
    });
    
    this.socket.on('time:check_out', (data) => {
      this.emit('time:check_out', data);
    });
    
    // Chat/messaging events
    this.socket.on('message:new', (message) => {
      this.emit('message:new', message);
    });
    
    this.socket.on('message:typing', (data) => {
      this.emit('message:typing', data);
    });
    
    this.socket.on('message:read', (data) => {
      this.emit('message:read', data);
    });
    
    // System events
    this.socket.on('system:maintenance', (data) => {
      this.emit('system:maintenance', data);
    });
    
    this.socket.on('system:update', (data) => {
      this.emit('system:update', data);
    });
  }
  
  // Emit event to server
  send(event, data, callback) {
    if (!this.isConnected) {
      console.warn('WebSocket not connected');
      return;
    }
    
    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }
  
  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }
  
  // Unsubscribe from events
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.delete(callback);
    
    if (callbacks.size === 0) {
      this.listeners.delete(event);
    }
  }
  
  // Emit event to local listeners
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in WebSocket listener for ${event}:`, error);
      }
    });
  }
  
  // Join room
  joinRoom(room) {
    this.send('join:room', { room });
  }
  
  // Leave room
  leaveRoom(room) {
    this.send('leave:room', { room });
  }
  
  // Join project room
  joinProject(projectId) {
    this.joinRoom(`project:${projectId}`);
  }
  
  // Leave project room
  leaveProject(projectId) {
    this.leaveRoom(`project:${projectId}`);
  }
  
  // Join team room
  joinTeam(teamId) {
    this.joinRoom(`team:${teamId}`);
  }
  
  // Leave team room
  leaveTeam(teamId) {
    this.leaveRoom(`team:${teamId}`);
  }
  
  // Send typing indicator
  sendTyping(room, isTyping) {
    this.send('message:typing', { room, isTyping });
  }
  
  // Send message
  sendMessage(room, message) {
    this.send('message:send', { room, message });
  }
  
  // Mark message as read
  markMessageRead(messageId) {
    this.send('message:read', { messageId });
  }
  
  // Request current online users
  getOnlineUsers(callback) {
    this.send('users:online', null, callback);
  }
  
  // Update user status
  updateUserStatus(status) {
    this.send('user:status', { status });
  }
  
  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }
  
  // Check if connected
  isConnected() {
    return this.isConnected && this.socket?.connected;
  }
  
  // Get socket ID
  getSocketId() {
    return this.socket?.id;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

// React Hook for WebSocket
export const useWebSocket = () => {
  const [connected, setConnected] = React.useState(websocketService.isConnected);
  
  React.useEffect(() => {
    const unsubscribeConnected = websocketService.on('ws:connected', () => {
      setConnected(true);
    });
    
    const unsubscribeDisconnected = websocketService.on('ws:disconnected', () => {
      setConnected(false);
    });
    
    // Cleanup
    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
    };
  }, []);
  
  return {
    connected,
    service: websocketService,
    on: websocketService.on.bind(websocketService),
    send: websocketService.send.bind(websocketService),
    joinRoom: websocketService.joinRoom.bind(websocketService),
    leaveRoom: websocketService.leaveRoom.bind(websocketService),
  };
};

// Export service
export default websocketService;
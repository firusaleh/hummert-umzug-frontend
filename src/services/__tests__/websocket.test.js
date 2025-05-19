import WebSocketService from '../websocket';

describe('WebSocketService', () => {
  let mockSocket;
  let service;

  beforeEach(() => {
    // Mock WebSocket
    mockSocket = {
      readyState: WebSocket.CONNECTING,
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    global.WebSocket = jest.fn(() => mockSocket);
    
    // Clear singleton instance
    WebSocketService.instance = null;
    service = WebSocketService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = WebSocketService.getInstance();
      const instance2 = WebSocketService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('connect', () => {
    it('should create WebSocket connection', async () => {
      const token = 'test-token';
      service.connect(token);

      expect(global.WebSocket).toHaveBeenCalledWith(`ws://localhost:5001?token=${token}`);
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should not reconnect if already connected', () => {
      service.socket = mockSocket;
      mockSocket.readyState = WebSocket.OPEN;
      
      service.connect('token');
      
      expect(global.WebSocket).not.toHaveBeenCalled();
    });

    it('should handle connection open', () => {
      service.connect('token');
      const openHandler = mockSocket.addEventListener.mock.calls.find(call => call[0] === 'open')[1];
      
      console.log = jest.fn();
      openHandler();
      
      expect(console.log).toHaveBeenCalledWith('WebSocket verbunden');
      expect(service.reconnectAttempts).toBe(0);
    });

    it('should handle incoming messages', () => {
      const listener = jest.fn();
      service.on('test-event', listener);
      
      service.connect('token');
      const messageHandler = mockSocket.addEventListener.mock.calls.find(call => call[0] === 'message')[1];
      
      const testData = { type: 'test-event', data: { foo: 'bar' } };
      messageHandler({ data: JSON.stringify(testData) });
      
      expect(listener).toHaveBeenCalledWith(testData.data);
    });

    it('should handle connection errors', () => {
      service.connect('token');
      const errorHandler = mockSocket.addEventListener.mock.calls.find(call => call[0] === 'error')[1];
      
      console.error = jest.fn();
      const error = new Error('Connection failed');
      errorHandler(error);
      
      expect(console.error).toHaveBeenCalledWith('WebSocket Fehler:', error);
    });

    it('should handle connection close and reconnect', () => {
      jest.useFakeTimers();
      service.connect('token');
      const closeHandler = mockSocket.addEventListener.mock.calls.find(call => call[0] === 'close')[1];
      
      console.log = jest.fn();
      service.reconnect = jest.fn();
      closeHandler();
      
      expect(console.log).toHaveBeenCalledWith('WebSocket Verbindung geschlossen');
      expect(service.reconnect).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(3000);
      expect(service.reconnect).toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('disconnect', () => {
    it('should close WebSocket connection', () => {
      service.socket = mockSocket;
      service.disconnect();
      
      expect(mockSocket.close).toHaveBeenCalled();
      expect(service.socket).toBeNull();
    });

    it('should handle missing socket', () => {
      service.socket = null;
      expect(() => service.disconnect()).not.toThrow();
    });
  });

  describe('emit', () => {
    it('should send message through WebSocket', () => {
      service.socket = mockSocket;
      mockSocket.readyState = WebSocket.OPEN;
      
      const eventType = 'test-event';
      const data = { foo: 'bar' };
      
      service.emit(eventType, data);
      
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: eventType,
        data
      }));
    });

    it('should throw error if not connected', () => {
      service.socket = null;
      
      expect(() => service.emit('test', {})).toThrow('WebSocket ist nicht verbunden');
    });

    it('should throw error if connection not open', () => {
      service.socket = mockSocket;
      mockSocket.readyState = WebSocket.CONNECTING;
      
      expect(() => service.emit('test', {})).toThrow('WebSocket ist nicht bereit');
    });
  });

  describe('on/off', () => {
    it('should register event listener', () => {
      const listener = jest.fn();
      service.on('test-event', listener);
      
      const listeners = service.listeners.get('test-event');
      expect(listeners).toContain(listener);
    });

    it('should handle multiple listeners for same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      service.on('test-event', listener1);
      service.on('test-event', listener2);
      
      const listeners = service.listeners.get('test-event');
      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(listener1);
      expect(listeners).toContain(listener2);
    });

    it('should remove event listener', () => {
      const listener = jest.fn();
      service.on('test-event', listener);
      service.off('test-event', listener);
      
      const listeners = service.listeners.get('test-event');
      expect(listeners).toEqual([]);
    });

    it('should handle removing non-existent listener', () => {
      const listener = jest.fn();
      expect(() => service.off('test-event', listener)).not.toThrow();
    });
  });

  describe('reconnect', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should attempt to reconnect with backoff', () => {
      service.reconnectAttempts = 0;
      service.connect = jest.fn();
      console.log = jest.fn();
      
      service.reconnect();
      
      expect(console.log).toHaveBeenCalledWith('Versuche Wiederverbindung... (Versuch 1)');
      expect(service.reconnectAttempts).toBe(1);
      
      jest.advanceTimersByTime(1000);
      expect(service.connect).toHaveBeenCalled();
    });

    it('should increase backoff time with attempts', () => {
      service.reconnectAttempts = 2;
      service.connect = jest.fn();
      
      service.reconnect();
      
      jest.advanceTimersByTime(3999);
      expect(service.connect).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(1);
      expect(service.connect).toHaveBeenCalled();
    });

    it('should stop after max attempts', () => {
      service.reconnectAttempts = 5;
      console.error = jest.fn();
      
      service.reconnect();
      
      expect(console.error).toHaveBeenCalledWith('Maximale Anzahl von Wiederverbindungsversuchen erreicht');
      expect(service.connect).not.toHaveBeenCalled();
    });
  });

  describe('rooms', () => {
    beforeEach(() => {
      service.socket = mockSocket;
      mockSocket.readyState = WebSocket.OPEN;
    });

    it('should join room', () => {
      const room = 'project-123';
      service.joinRoom(room);
      
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'join_room',
        data: { room }
      }));
    });

    it('should leave room', () => {
      const room = 'project-123';
      service.leaveRoom(room);
      
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'leave_room',
        data: { room }
      }));
    });
  });

  describe('notifications', () => {
    beforeEach(() => {
      service.socket = mockSocket;
      mockSocket.readyState = WebSocket.OPEN;
    });

    it('should send notification', () => {
      const userId = 'user-123';
      const notification = { title: 'Test', message: 'Test notification' };
      
      service.sendNotification(userId, notification);
      
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'send_notification',
        data: { userId, notification }
      }));
    });

    it('should broadcast notification', () => {
      const userIds = ['user-1', 'user-2'];
      const notification = { title: 'Test', message: 'Test broadcast' };
      
      service.broadcastNotification(userIds, notification);
      
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'broadcast_notification',
        data: { userIds, notification }
      }));
    });
  });

  describe('typing indicators', () => {
    beforeEach(() => {
      service.socket = mockSocket;
      mockSocket.readyState = WebSocket.OPEN;
    });

    it('should send typing start', () => {
      const roomId = 'room-123';
      service.startTyping(roomId);
      
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'typing_start',
        data: { roomId }
      }));
    });

    it('should send typing stop', () => {
      const roomId = 'room-123';
      service.stopTyping(roomId);
      
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'typing_stop',
        data: { roomId }
      }));
    });
  });

  describe('useWebSocket hook', () => {
    // Note: This would require a more complex testing setup with React Testing Library
    // For now, we'll just test that the export exists
    it('should export useWebSocket hook', () => {
      expect(service.useWebSocket).toBeDefined();
      expect(typeof service.useWebSocket).toBe('function');
    });
  });
});
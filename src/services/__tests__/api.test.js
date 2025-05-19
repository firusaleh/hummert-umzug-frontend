// src/services/__tests__/api.test.js
import axios from 'axios';
import api, { 
  authService, 
  userService, 
  umzugService,
  mitarbeiterService,
  tokenManager,
  API_CONFIG 
} from '../api.fixed';

// Mock axios
jest.mock('axios');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
delete window.location;
window.location = { 
  href: jest.fn(),
  replace: jest.fn(),
  pathname: '/'
};

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Setup axios create mock
    const axiosInstance = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    
    axios.create.mockReturnValue(axiosInstance);
  });

  describe('Token Manager', () => {
    it('should get access token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      
      const token = tokenManager.getAccessToken();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
      expect(token).toBe('test-token');
    });
    
    it('should set tokens in localStorage', () => {
      tokenManager.setTokens('access-token', 'refresh-token');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token_timestamp', expect.any(String));
    });
    
    it('should clear all tokens', () => {
      tokenManager.clearTokens();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token_timestamp');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
    });
    
    it('should check if token is expired', () => {
      // Mock current time
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      // Token is fresh
      localStorageMock.getItem.mockReturnValue((now - 1000).toString());
      expect(tokenManager.isTokenExpired()).toBe(false);
      
      // Token is expired (older than 24 hours)
      localStorageMock.getItem.mockReturnValue((now - 25 * 60 * 60 * 1000).toString());
      expect(tokenManager.isTokenExpired()).toBe(true);
      
      // No timestamp
      localStorageMock.getItem.mockReturnValue(null);
      expect(tokenManager.isTokenExpired()).toBe(true);
    });
  });

  describe('Auth Service', () => {
    let axiosInstance;
    
    beforeEach(() => {
      axiosInstance = axios.create();
    });
    
    it('should handle successful login', async () => {
      const mockResponse = {
        data: {
          token: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1', name: 'Test User' }
        }
      };
      
      axiosInstance.post.mockResolvedValue(mockResponse);
      
      const result = await authService.login({ email: 'test@example.com', password: 'password' });
      
      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      
      // Check tokens were saved
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockResponse.data.user));
    });
    
    it('should handle login error', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      };
      
      axiosInstance.post.mockRejectedValue(mockError);
      
      const result = await authService.login({ email: 'test@example.com', password: 'wrong' });
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
      expect(result.status).toBe(401);
    });
    
    it('should handle successful registration', async () => {
      const mockResponse = {
        data: {
          token: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1', name: 'New User' }
        }
      };
      
      axiosInstance.post.mockResolvedValue(mockResponse);
      
      const result = await authService.register({
        name: 'New User',
        email: 'new@example.com',
        password: 'password'
      });
      
      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/register', {
        name: 'New User',
        email: 'new@example.com',
        password: 'password'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });
    
    it('should handle logout', async () => {
      await authService.logout();
      
      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/logout');
      expect(tokenManager.clearTokens).toBeDefined();
      expect(window.location.href).toBe('/login');
    });
    
    it('should check API health', async () => {
      const mockResponse = { data: { status: 'ok' } };
      axiosInstance.get.mockResolvedValue(mockResponse);
      
      const result = await authService.checkApiHealth();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });
    
    it('should handle API health check failure with fallback', async () => {
      axiosInstance.get.mockRejectedValue(new Error('Network error'));
      axios.get.mockResolvedValue({ data: {} });
      
      const result = await authService.checkApiHealth();
      
      expect(result.success).toBe(true);
    });
  });

  describe('Base Service', () => {
    let axiosInstance;
    
    beforeEach(() => {
      axiosInstance = axios.create();
    });
    
    it('should handle successful response', async () => {
      const mockResponse = { data: { id: '1', name: 'Test' } };
      axiosInstance.get.mockResolvedValue(mockResponse);
      
      const result = await userService.getAll();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
    });
    
    it('should handle error response', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Not found' }
        }
      };
      
      axiosInstance.get.mockRejectedValue(mockError);
      
      const result = await userService.getAll();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Not found');
      expect(result.status).toBe(404);
    });
    
    it('should handle network error', async () => {
      const mockError = {
        request: {}
      };
      
      axiosInstance.get.mockRejectedValue(mockError);
      
      const result = await userService.getAll();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Keine Verbindung zum Server');
    });
    
    it('should handle generic error', async () => {
      const mockError = new Error('Something went wrong');
      
      axiosInstance.get.mockRejectedValue(mockError);
      
      const result = await userService.getAll();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Something went wrong');
    });
  });

  describe('CRUD Operations', () => {
    let axiosInstance;
    
    beforeEach(() => {
      axiosInstance = axios.create();
    });
    
    it('should perform GET request', async () => {
      const mockData = [{ id: '1' }, { id: '2' }];
      axiosInstance.get.mockResolvedValue({ data: mockData });
      
      const result = await umzugService.getAll({ page: 1, limit: 10 });
      
      expect(axiosInstance.get).toHaveBeenCalledWith('/umzuege', {
        params: { page: 1, limit: 10 }
      });
      expect(result.data).toEqual(mockData);
    });
    
    it('should perform GET by ID request', async () => {
      const mockData = { id: '1', name: 'Test' };
      axiosInstance.get.mockResolvedValue({ data: mockData });
      
      const result = await umzugService.getById('1');
      
      expect(axiosInstance.get).toHaveBeenCalledWith('/umzuege/1');
      expect(result.data).toEqual(mockData);
    });
    
    it('should perform POST request', async () => {
      const newData = { name: 'New Item' };
      const mockResponse = { id: '1', ...newData };
      axiosInstance.post.mockResolvedValue({ data: mockResponse });
      
      const result = await umzugService.create(newData);
      
      expect(axiosInstance.post).toHaveBeenCalledWith('/umzuege', newData);
      expect(result.data).toEqual(mockResponse);
    });
    
    it('should perform PUT request', async () => {
      const updates = { name: 'Updated' };
      const mockResponse = { id: '1', ...updates };
      axiosInstance.put.mockResolvedValue({ data: mockResponse });
      
      const result = await umzugService.update('1', updates);
      
      expect(axiosInstance.put).toHaveBeenCalledWith('/umzuege/1', updates);
      expect(result.data).toEqual(mockResponse);
    });
    
    it('should perform DELETE request', async () => {
      axiosInstance.delete.mockResolvedValue({ data: {} });
      
      const result = await umzugService.delete('1');
      
      expect(axiosInstance.delete).toHaveBeenCalledWith('/umzuege/1');
      expect(result.success).toBe(true);
    });
  });

  describe('Specialized Services', () => {
    let axiosInstance;
    
    beforeEach(() => {
      axiosInstance = axios.create();
    });
    
    describe('Umzug Service', () => {
      it('should update status', async () => {
        axiosInstance.post.mockResolvedValue({ data: { success: true } });
        
        const result = await umzugService.updateStatus('1', 'in_progress', 'Starting work');
        
        expect(axiosInstance.post).toHaveBeenCalledWith('/umzuege/1/status', {
          status: 'in_progress',
          reason: 'Starting work'
        });
        expect(result.success).toBe(true);
      });
      
      it('should add task', async () => {
        const taskData = { description: 'New task' };
        axiosInstance.post.mockResolvedValue({ data: taskData });
        
        const result = await umzugService.addTask('1', taskData);
        
        expect(axiosInstance.post).toHaveBeenCalledWith('/umzuege/1/tasks', taskData);
        expect(result.data).toEqual(taskData);
      });
      
      it('should upload document', async () => {
        const file = new File(['content'], 'document.pdf');
        axiosInstance.post.mockResolvedValue({ data: { id: 'doc1' } });
        
        const result = await umzugService.uploadDocument('1', file);
        
        expect(axiosInstance.post).toHaveBeenCalledWith(
          '/umzuege/1/documents',
          expect.any(FormData),
          expect.objectContaining({
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        );
        expect(result.success).toBe(true);
      });
    });
    
    describe('Mitarbeiter Service', () => {
      it('should add working time', async () => {
        const arbeitszeitData = {
          datum: '2024-01-01',
          startzeit: '08:00',
          endzeit: '17:00'
        };
        
        axiosInstance.post.mockResolvedValue({ data: arbeitszeitData });
        
        const result = await mitarbeiterService.addArbeitszeit('1', arbeitszeitData);
        
        expect(axiosInstance.post).toHaveBeenCalledWith(
          '/mitarbeiter/1/arbeitszeiten',
          arbeitszeitData
        );
        expect(result.data).toEqual(arbeitszeitData);
      });
      
      it('should get monthly report', async () => {
        const reportData = { totalHours: 160 };
        axiosInstance.get.mockResolvedValue({ data: reportData });
        
        const result = await mitarbeiterService.getMonatsbericht('1', 2024, 1);
        
        expect(axiosInstance.get).toHaveBeenCalledWith(
          '/mitarbeiter/1/monatsbericht',
          { params: { year: 2024, month: 1 } }
        );
        expect(result.data).toEqual(reportData);
      });
    });
  });

  describe('Error Handling', () => {
    let axiosInstance;
    
    beforeEach(() => {
      axiosInstance = axios.create();
    });
    
    it('should include proper error messages for different status codes', async () => {
      const testCases = [
        { status: 400, expectedMessage: 'Ungültige Anfrage' },
        { status: 401, expectedMessage: 'Nicht autorisiert' },
        { status: 403, expectedMessage: 'Zugriff verweigert' },
        { status: 404, expectedMessage: 'Nicht gefunden' },
        { status: 409, expectedMessage: 'Konflikt - Ressource existiert bereits' },
        { status: 422, expectedMessage: 'Validierungsfehler' },
        { status: 429, expectedMessage: 'Zu viele Anfragen' },
        { status: 500, expectedMessage: 'Serverfehler' },
        { status: 503, expectedMessage: 'Service nicht verfügbar' },
        { status: 418, expectedMessage: 'Ein Fehler ist aufgetreten' }, // Unknown status
      ];
      
      for (const testCase of testCases) {
        axiosInstance.get.mockRejectedValue({
          response: { status: testCase.status, data: {} }
        });
        
        const result = await userService.getAll();
        
        expect(result.success).toBe(false);
        expect(result.message).toBe(testCase.expectedMessage);
        expect(result.status).toBe(testCase.status);
      }
    });
  });
});
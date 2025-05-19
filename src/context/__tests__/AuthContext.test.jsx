// src/context/__tests__/AuthContext.test.jsx
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext.fixed';
import { authService } from '../../services/api';

// Mock the auth service
jest.mock('../../services/api', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    checkAuth: jest.fn(),
    checkApiHealth: jest.fn(),
    refreshToken: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Test component that uses the auth context
const TestComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="user">{auth.user ? auth.user.name : 'No user'}</div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'Yes' : 'No'}</div>
      <div data-testid="error">{auth.error || 'No error'}</div>
      <button onClick={() => auth.login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button onClick={() => auth.register({ name: 'Test', email: 'test@example.com', password: 'password' })}>
        Register
      </button>
    </div>
  );
};

const renderWithAuth = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should provide initial state', async () => {
    authService.checkApiHealth.mockResolvedValue({ status: 'ok' });
    
    renderWithAuth(<TestComponent />);
    
    expect(screen.getByTestId('loading').textContent).toBe('Loading');
    expect(screen.getByTestId('user').textContent).toBe('No user');
    expect(screen.getByTestId('authenticated').textContent).toBe('No');
    
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('Loaded');
    });
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    
    authService.checkApiHealth.mockResolvedValue({ status: 'ok' });
    authService.login.mockResolvedValue({
      data: {
        token: 'test-token',
        refreshToken: 'refresh-token',
        user: mockUser
      }
    });
    
    renderWithAuth(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('Loaded');
    });
    
    await user.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test User');
      expect(screen.getByTestId('authenticated').textContent).toBe('Yes');
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockUser));
  });

  it('should handle login error', async () => {
    const user = userEvent.setup();
    
    authService.checkApiHealth.mockResolvedValue({ status: 'ok' });
    authService.login.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Invalid credentials' }
      }
    });
    
    renderWithAuth(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('Loaded');
    });
    
    await user.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Ungültige Anmeldedaten');
      expect(screen.getByTestId('authenticated').textContent).toBe('No');
    });
  });

  it('should handle logout', async () => {
    const user = userEvent.setup();
    const mockUser = { id: '1', name: 'Test User' };
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return 'test-token';
      if (key === 'auth_user') return JSON.stringify(mockUser);
      return null;
    });
    
    authService.checkApiHealth.mockResolvedValue({ status: 'ok' });
    authService.checkAuth.mockResolvedValue({ data: { user: mockUser } });
    authService.logout.mockResolvedValue({});
    
    renderWithAuth(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test User');
    });
    
    await user.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  it('should handle registration', async () => {
    const user = userEvent.setup();
    const mockUser = { id: '1', name: 'Test', email: 'test@example.com' };
    
    authService.checkApiHealth.mockResolvedValue({ status: 'ok' });
    authService.register.mockResolvedValue({
      data: {
        token: 'test-token',
        refreshToken: 'refresh-token',
        user: mockUser
      }
    });
    
    renderWithAuth(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('Loaded');
    });
    
    await user.click(screen.getByText('Register'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test');
      expect(screen.getByTestId('authenticated').textContent).toBe('Yes');
    });
  });

  it('should restore session from localStorage', async () => {
    const mockUser = { id: '1', name: 'Test User' };
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return 'test-token';
      if (key === 'auth_user') return JSON.stringify(mockUser);
      if (key === 'token_timestamp') return Date.now().toString();
      return null;
    });
    
    authService.checkApiHealth.mockResolvedValue({ status: 'ok' });
    authService.checkAuth.mockResolvedValue({ data: { user: mockUser } });
    
    renderWithAuth(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test User');
      expect(screen.getByTestId('authenticated').textContent).toBe('Yes');
    });
  });

  it('should handle API unavailability', async () => {
    authService.checkApiHealth.mockRejectedValue(new Error('Network error'));
    
    renderWithAuth(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('Loaded');
      expect(screen.getByTestId('user').textContent).toBe('No user');
    });
  });

  it('should refresh token when expired', async () => {
    const mockUser = { id: '1', name: 'Test User' };
    const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return 'old-token';
      if (key === 'refresh_token') return 'refresh-token';
      if (key === 'auth_user') return JSON.stringify(mockUser);
      if (key === 'token_timestamp') return oldTimestamp.toString();
      return null;
    });
    
    authService.checkApiHealth.mockResolvedValue({ status: 'ok' });
    authService.refreshToken.mockResolvedValue({
      data: { token: 'new-token', user: mockUser }
    });
    
    renderWithAuth(<TestComponent />);
    
    await waitFor(() => {
      expect(authService.refreshToken).toHaveBeenCalledWith('refresh-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
    });
  });

  it('should throw error when useAuth is used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      const auth = useAuth();
      return <div>{auth.user}</div>;
    };
    
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    console.error = originalError;
  });
});
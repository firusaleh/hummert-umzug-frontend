// src/pages/__tests__/Login.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Login from '../auth/Login.fixed';
import { AuthContext } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const MockProviders = ({ children, authValue, appValue }) => {
  const defaultAuthValue = {
    login: jest.fn(),
    isAuthenticated: false,
    loading: false,
    ...authValue
  };
  
  const defaultAppValue = {
    isApiAvailable: true,
    checkApiAvailability: jest.fn(),
    ...appValue
  };
  
  return (
    <AuthContext.Provider value={defaultAuthValue}>
      <AppContext.Provider value={defaultAppValue}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AppContext.Provider>
    </AuthContext.Provider>
  );
};

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <MockProviders>
        <Login />
      </MockProviders>
    );

    expect(screen.getByText('Willkommen zurück')).toBeInTheDocument();
    expect(screen.getByLabelText('E-Mail-Adresse')).toBeInTheDocument();
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
    expect(screen.getByLabelText('Angemeldet bleiben')).toBeInTheDocument();
    expect(screen.getByText('Anmelden')).toBeInTheDocument();
  });

  it('shows API unavailable warning when API is down', () => {
    render(
      <MockProviders appValue={{ isApiAvailable: false }}>
        <Login />
      </MockProviders>
    );

    expect(screen.getByText(/Der Backend-Server ist nicht erreichbar/)).toBeInTheDocument();
  });

  it('validates email field', async () => {
    render(
      <MockProviders>
        <Login />
      </MockProviders>
    );

    const emailInput = screen.getByLabelText('E-Mail-Adresse');
    const submitButton = screen.getByText('Anmelden');

    // Empty email
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('E-Mail ist erforderlich')).toBeInTheDocument();
    });

    // Invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('E-Mail ist ungültig')).toBeInTheDocument();
    });

    // Valid email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText('E-Mail ist ungültig')).not.toBeInTheDocument();
    });
  });

  it('validates password field', async () => {
    render(
      <MockProviders>
        <Login />
      </MockProviders>
    );

    const passwordInput = screen.getByLabelText('Passwort');
    const submitButton = screen.getByText('Anmelden');

    // Empty password
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('Passwort ist erforderlich')).toBeInTheDocument();
    });

    // Short password
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('Passwort muss mindestens 6 Zeichen lang sein')).toBeInTheDocument();
    });

    // Valid password
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText('Passwort muss mindestens 6 Zeichen lang sein')).not.toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(
      <MockProviders>
        <Login />
      </MockProviders>
    );

    const passwordInput = screen.getByLabelText('Passwort');
    const toggleButton = screen.getByLabelText('Passwort anzeigen');

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Passwort verbergen')).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('handles successful login', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    
    render(
      <MockProviders authValue={{ login: mockLogin }}>
        <Login />
      </MockProviders>
    );

    const emailInput = screen.getByLabelText('E-Mail-Adresse');
    const passwordInput = screen.getByLabelText('Passwort');
    const rememberMeCheckbox = screen.getByLabelText('Angemeldet bleiben');
    const submitButton = screen.getByText('Anmelden');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(rememberMeCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('handles login failure', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ 
      success: false, 
      error: 'Invalid credentials' 
    });
    
    render(
      <MockProviders authValue={{ login: mockLogin }}>
        <Login />
      </MockProviders>
    );

    const emailInput = screen.getByLabelText('E-Mail-Adresse');
    const passwordInput = screen.getByLabelText('Passwort');
    const submitButton = screen.getByText('Anmelden');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('redirects authenticated users to dashboard', () => {
    render(
      <MockProviders authValue={{ isAuthenticated: true }}>
        <Login />
      </MockProviders>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('redirects to original location after login', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/umzuege' } } }]}>
        <AuthContext.Provider value={{ login: mockLogin, isAuthenticated: false, loading: false }}>
          <AppContext.Provider value={{ isApiAvailable: true, checkApiAvailability: jest.fn() }}>
            <Login />
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText('E-Mail-Adresse');
    const passwordInput = screen.getByLabelText('Passwort');
    const submitButton = screen.getByText('Anmelden');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/umzuege', { replace: true });
    });
  });

  it('shows loading state while authenticating', () => {
    render(
      <MockProviders authValue={{ loading: true }}>
        <Login />
      </MockProviders>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('disables submit button when API is unavailable', () => {
    render(
      <MockProviders appValue={{ isApiAvailable: false }}>
        <Login />
      </MockProviders>
    );

    const submitButton = screen.getByText('Anmelden');
    expect(submitButton).toBeDisabled();
  });

  it('shows demo credentials in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <MockProviders>
        <Login />
      </MockProviders>
    );

    expect(screen.getByText('Demo-Zugangsdaten:')).toBeInTheDocument();
    expect(screen.getByText(/admin@example.com/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('clears field errors when user types', async () => {
    render(
      <MockProviders>
        <Login />
      </MockProviders>
    );

    const emailInput = screen.getByLabelText('E-Mail-Adresse');
    const submitButton = screen.getByText('Anmelden');

    // Generate error
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('E-Mail ist erforderlich')).toBeInTheDocument();
    });

    // Error should clear when typing
    fireEvent.change(emailInput, { target: { value: 't' } });
    await waitFor(() => {
      expect(screen.queryByText('E-Mail ist erforderlich')).not.toBeInTheDocument();
    });
  });

  it('handles unexpected errors gracefully', async () => {
    const mockLogin = jest.fn().mockRejectedValue(new Error('Network error'));
    
    render(
      <MockProviders authValue={{ login: mockLogin }}>
        <Login />
      </MockProviders>
    );

    const emailInput = screen.getByLabelText('E-Mail-Adresse');
    const passwordInput = screen.getByLabelText('Passwort');
    const submitButton = screen.getByText('Anmelden');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Ein unerwarteter Fehler ist aufgetreten/)).toBeInTheDocument();
    });
  });
});
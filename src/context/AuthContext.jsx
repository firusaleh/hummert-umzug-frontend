// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

// AuthContext erstellen
const AuthContext = createContext();

// Zusätzlich als benannten Export anbieten (damit sowohl Default- als auch benannter Import funktionieren)
export { AuthContext };

// Custom Hook zum einfachen Zugriff auf den AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Beim Laden der Anwendung prüfen, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          
          // Optional: Token-Gültigkeit überprüfen
          try {
            await authService.checkAuth();
          } catch (error) {
            console.error('Token ist nicht mehr gültig:', error);
            // Token ist ungültig, ausloggen
            logout();
          }
        } catch (error) {
          console.error('Fehler beim Initialisieren der Authentifizierung:', error);
          logout();
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []);

  // Login-Funktion
  const login = async (credentials) => {
    setError(null);
    
    try {
      console.log('Login-Versuch:', { email: credentials.email, password: '***' });
      
      const response = await authService.login(credentials);
      
      console.log('Login-Antwort:', response);
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        return { success: true };
      } else {
        throw new Error('Token nicht in der Antwort enthalten');
      }
    } catch (error) {
      console.error('Login fehlgeschlagen:', error);
      
      // Detaillierte Fehlerinformationen erfassen
      let errorMessage = 'Login fehlgeschlagen';
      
      if (error.response) {
        // Der Server hat mit einem Fehlerstatuscode geantwortet
        console.error('Server-Fehler:', error.response.status, error.response.data);
        errorMessage = error.response.data.message || `Server-Fehler: ${error.response.status}`;
      } else if (error.request) {
        // Die Anfrage wurde gesendet, aber keine Antwort erhalten
        console.error('Keine Antwort vom Server');
        errorMessage = 'Keine Antwort vom Server';
      } else {
        // Bei der Anfrageerstellung ist ein Fehler aufgetreten
        console.error('Anfragefehler:', error.message);
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Logout-Funktion
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  // Registrierungs-Funktion
  const register = async (userData) => {
    setError(null);
    
    try {
      const response = await authService.register(userData);
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        return { success: true };
      } else {
        throw new Error('Token nicht in der Antwort enthalten');
      }
    } catch (error) {
      console.error('Registrierung fehlgeschlagen:', error);
      
      // Detaillierte Fehlerinformationen erfassen
      let errorMessage = 'Registrierung fehlgeschlagen';
      
      if (error.response) {
        errorMessage = error.response.data.message || `Server-Fehler: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Keine Antwort vom Server';
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Bereitgestellter Wert für den Context
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
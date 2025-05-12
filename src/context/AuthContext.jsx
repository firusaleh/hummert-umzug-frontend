// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

// AuthContext erstellen
const AuthContext = createContext();

// Zusätzlich als benannten Export anbieten
export { AuthContext };

// Custom Hook zum einfachen Zugriff auf den AuthContext
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApiAvailable, setIsApiAvailable] = useState(false); // Standardmäßig als nicht verfügbar markieren

  // Funktion zum Prüfen der API-Verfügbarkeit als useCallback für Stabilität
  const checkApiAvailability = useCallback(async () => {
    try {
      console.log("Prüfe API-Verfügbarkeit...");
      await authService.checkApiHealth();
      console.log("API ist verfügbar!");
      setIsApiAvailable(true);
      return true;
    } catch (error) {
      console.warn('API nicht erreichbar:', error);
      setIsApiAvailable(false);
      return false;
    }
  }, []);

  // Logout-Funktion
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
    setUser(null);
    setError(null);
  }, []);

  // Beim Laden der Anwendung prüfen, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Zuerst API-Verfügbarkeit prüfen
        const apiAvailable = await checkApiAvailability();
        if (!apiAvailable) {
          console.warn('API nicht erreichbar, Authentifizierung wird übersprungen');
          setLoading(false);
          return; // Weitere Initialisierung abbrechen, wenn API nicht verfügbar
        }

        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            // Token-Gültigkeit überprüfen
            try {
              await authService.checkAuth();
              console.log('Token gültig, Benutzer bereits angemeldet');
            } catch (error) {
              console.warn('Token ist nicht mehr gültig:', error);
              // Token ist ungültig, ausloggen
              logout();
            }
          } catch (parseError) {
            console.error('Fehler beim Parsen der Benutzerdaten:', parseError);
            logout();
          }
        }
      } catch (error) {
        console.error('Fehler beim Initialisieren der Authentifizierung:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [checkApiAvailability, logout]);

  // Login-Funktion
  const login = async (credentials) => {
    setError(null);
    
    if (!isApiAvailable) {
      console.error('Login nicht möglich: API nicht erreichbar');
      return { 
        success: false, 
        message: 'Der Server ist derzeit nicht erreichbar. Bitte versuchen Sie es später erneut.'
      };
    }
    
    try {
      console.log('Login-Versuch mit:', { email: credentials.email });
      
      const response = await authService.login(credentials);
      console.log('Login-Antwort erhalten:', response);
      
      if (response && response.data && response.data.token) {
        // Token und Benutzer im localStorage speichern
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('tokenTimestamp', Date.now().toString());
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        return { success: true };
      } else {
        console.error('Ungültiges Antwortformat:', response);
        throw new Error('Token nicht in der Antwort enthalten');
      }
    } catch (error) {
      console.error('Login fehlgeschlagen:', error);
      
      // Detaillierte Fehlerinformationen erfassen
      let errorMessage = 'Login fehlgeschlagen';
      
      if (error.response) {
        console.error('Server-Fehler:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server-Fehler: ${error.response.status}`;
        
        // Spezifische Fehlerbehandlung
        if (error.response.status === 401) {
          errorMessage = 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.';
        } else if (error.response.status === 404) {
          errorMessage = 'Der Login-Dienst ist nicht erreichbar. Bitte versuchen Sie es später erneut.';
        }
      } else if (error.request) {
        console.error('Keine Antwort vom Server');
        errorMessage = 'Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung.';
      } else {
        console.error('Anfragefehler:', error.message);
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Registrierungs-Funktion
  const register = async (userData) => {
    setError(null);
    
    if (!isApiAvailable) {
      console.error('Registrierung nicht möglich: API nicht erreichbar');
      return { 
        success: false, 
        message: 'Der Server ist derzeit nicht erreichbar. Bitte versuchen Sie es später erneut.'
      };
    }
    
    try {
      console.log('Registrierungsversuch mit:', { email: userData.email, name: userData.name });
      
      const response = await authService.register(userData);
      
      if (response && response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('tokenTimestamp', Date.now().toString());
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
        errorMessage = error.response.data?.message || `Server-Fehler: ${error.response.status}`;
        
        // Spezifische Fehlerbehandlung für häufige Registrierungsfehler
        if (error.response.status === 409) {
          errorMessage = 'Diese E-Mail-Adresse wird bereits verwendet.';
        } else if (error.response.status === 400) {
          errorMessage = 'Ungültige Eingabedaten. Bitte überprüfen Sie alle Felder.';
        } else if (error.response.status === 500) {
          errorMessage = 'Serverfehler bei der Registrierung. Bitte versuchen Sie es später erneut.';
        }
      } else if (error.request) {
        errorMessage = 'Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung.';
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
    isApiAvailable,
    login,
    logout,
    register,
    checkApiAvailability
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
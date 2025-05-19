// src/context/AuthContext.jsx - Korrigierte Version
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
  const [isApiAvailable, setIsApiAvailable] = useState(false); 

  // Funktion zum Prüfen der API-Verfügbarkeit als useCallback für Stabilität
  const checkApiAvailability = useCallback(async () => {
    try {
      console.log("Prüfe API-Verfügbarkeit...");
      const response = await authService.checkApiHealth();
      console.log("API ist verfügbar!", response);
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
    // Die Weiterleitung zur Login-Seite erfolgt jetzt direkt hier
    window.location.href = '/login';
  }, []);

  // Beim Laden der Anwendung prüfen, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Zuerst API-Verfügbarkeit prüfen
        const apiAvailable = await checkApiAvailability();
        
        // Token und Benutzerdaten aus localStorage holen
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (!apiAvailable) {
          console.warn('API nicht erreichbar, Authentifizierung wird übersprungen');
          // Wenn die API nicht verfügbar ist, aber ein Token und Benutzerdaten existieren,
          // setzen wir den Benutzer trotzdem, aber markieren den Loading-Status als abgeschlossen
          if (token && storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
            } catch (parseError) {
              console.error('Fehler beim Parsen der Benutzerdaten:', parseError);
              localStorage.removeItem('user'); // Ungültige Daten entfernen
            }
          }
          setLoading(false);
          return;
        }

        // Wenn API verfügbar ist und Token existiert, Authentifizierung prüfen
        if (token && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            
            // Token-Gültigkeit überprüfen
            try {
              await authService.checkAuth();
              console.log('Token gültig, Benutzer bereits angemeldet');
              setUser(userData);
            } catch (tokenError) {
              console.warn('Token ist nicht mehr gültig:', tokenError);
              // Token ist ungültig, ausloggen aber keine Weiterleitung
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('tokenTimestamp');
              setUser(null);
            }
          } catch (parseError) {
            console.error('Fehler beim Parsen der Benutzerdaten:', parseError);
            localStorage.removeItem('user'); // Ungültige Daten entfernen
          }
        }
      } catch (error) {
        console.error('Fehler beim Initialisieren der Authentifizierung:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [checkApiAvailability]);

  // Login-Funktion
  const login = async (credentials) => {
    setError(null);
    setLoading(true);
    
    try {
      // Prüfe API-Verfügbarkeit direkt vor dem Login-Versuch
      const apiAvailable = await checkApiAvailability();
      
      if (!apiAvailable) {
        console.error('Login nicht möglich: API nicht erreichbar');
        setLoading(false);
        return { 
          success: false, 
          message: 'Der Server ist derzeit nicht erreichbar. Bitte versuchen Sie es später erneut.'
        };
      }
      
      console.log('Login-Versuch mit:', { email: credentials.email });
      
      const response = await authService.login(credentials);
      console.log('Login-Antwort erhalten:', response);
      
      if (response && response.data && response.data.token) {
        // Token und Benutzer im localStorage speichern
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('tokenTimestamp', Date.now().toString());
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        setLoading(false);
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
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  // Registrierungs-Funktion
  const register = async (userData) => {
    setError(null);
    setLoading(true);
    
    try {
      // Prüfe API-Verfügbarkeit direkt vor dem Registrierungsversuch
      const apiAvailable = await checkApiAvailability();
      
      if (!apiAvailable) {
        console.error('Registrierung nicht möglich: API nicht erreichbar');
        setLoading(false);
        return { 
          success: false, 
          message: 'Der Server ist derzeit nicht erreichbar. Bitte versuchen Sie es später erneut.'
        };
      }
      
      console.log('Registrierungsversuch mit:', { email: userData.email, name: userData.name });
      
      const response = await authService.register(userData);
      
      if (response && response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('tokenTimestamp', Date.now().toString());
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        setLoading(false);
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
        if (error.response.status === 409 || 
            (error.response.status === 400 && error.response.data?.message?.includes('existiert bereits'))) {
          errorMessage = 'Diese E-Mail-Adresse wird bereits verwendet.';
        } else if (error.response.status === 400) {
          if (error.response.data?.errors) {
            // Sammle alle Validierungsfehler
            errorMessage = error.response.data.errors.map(err => err.msg || err.message).join(', ');
          } else {
            errorMessage = 'Ungültige Eingabedaten. Bitte überprüfen Sie alle Felder.';
          }
        } else if (error.response.status === 500) {
          errorMessage = 'Serverfehler bei der Registrierung. Bitte versuchen Sie es später erneut.';
        }
      } else if (error.request) {
        errorMessage = 'Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung.';
      } else {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoading(false);
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
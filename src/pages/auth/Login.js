// src/pages/auth/Login.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Überprüfen, ob der Benutzer bereits eingeloggt ist
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    
    // Überprüfen Sie, ob die API erreichbar ist
    const checkApiStatus = async () => {
      try {
        await fetch('http://localhost:5000/api/health', { method: 'GET' });
        setIsApiAvailable(true);
      } catch (error) {
        console.error('API nicht erreichbar:', error);
        setIsApiAvailable(false);
      }
    };
    
    checkApiStatus();
  }, [user, navigate]);

  // Handler für direkten API-Aufruf (falls der Context-Login nicht funktioniert)
  const handleDirectLogin = async (credentials) => {
    try {
      console.log('Direkter API-Aufruf mit:', { email: credentials.email });
      
      // Prüfen Sie den API-Endpunkt
      console.log('API-Endpunkt:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
      
      const response = await authService.login(credentials);
      console.log('API-Antwort:', response.data);
      
      // Token und Benutzerdaten speichern
      if (response.data.token) {
        // Speichern Sie nicht nur den Token, sondern auch den Zeitpunkt
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('tokenTimestamp', Date.now().toString());
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Zur Dashboard-Seite weiterleiten
        console.log('Login erfolgreich, Weiterleitung zum Dashboard');
        navigate('/dashboard');
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Unbekannter Fehler beim Login'
        };
      }
    } catch (error) {
      console.error('API-Fehler:', error);
      
      // Detaillierte Fehlerdiagnose
      if (error.response) {
        // Der Server hat mit einem Fehlerstatuscode geantwortet
        console.error('Status:', error.response.status);
        console.error('Daten:', error.response.data);
        console.error('Header:', error.response.headers);
        
        // Spezifische Fehlerbehandlung je nach Statuscode
        if (error.response.status === 401) {
          return {
            success: false,
            message: 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.'
          };
        } else if (error.response.status === 404) {
          return {
            success: false,
            message: 'Der Login-Dienst ist nicht erreichbar. Bitte versuchen Sie es später erneut.'
          };
        } else {
          return {
            success: false,
            message: error.response.data.message || `Server-Fehler: ${error.response.status}`
          };
        }
      } else if (error.request) {
        // Die Anfrage wurde gesendet, aber keine Antwort erhalten
        console.error('Keine Antwort vom Server. Ist der Server online?');
        return {
          success: false,
          message: 'Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung.'
        };
      } else {
        // Ein Fehler ist beim Einrichten der Anfrage aufgetreten
        console.error('Fehler beim Einrichten der Anfrage:', error.message);
        return {
          success: false,
          message: `Fehler: ${error.message}`
        };
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Formular abgesendet');
    setLoading(true);
    setError('');
    
    // Einfache Client-seitige Validierung
    if (!email || !password) {
      setError('Bitte füllen Sie alle Felder aus.');
      setLoading(false);
      return;
    }
    
    const credentials = { email, password };
    console.log('Login-Versuch mit:', { email, password: '***' });
    
    try {
      // Zuerst mit dem useAuth-Hook versuchen
      console.log('Versuche Login über Context...');
      let result = await login(credentials);
      console.log('Context-Login-Ergebnis:', result);
      
      // Wenn der Context-Login fehlschlägt, direkten API-Aufruf versuchen
      if (!result.success) {
        console.log('Context-Login fehlgeschlagen, versuche direkte API...');
        result = await handleDirectLogin(credentials);
        console.log('Direkter Login-Ergebnis:', result);
      }
      
      if (!result.success) {
        console.error('Login fehlgeschlagen:', result.message);
        setError(result.message || 'Login fehlgeschlagen');
      } else {
        console.log('Login erfolgreich!');
      }
    } catch (err) {
      console.error('Login-Fehler:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Einfacher Debug-Button zum Testen der API-Verbindung
  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/check', { 
        method: 'GET',
        // Timeout für die Anfrage hinzufügen
        signal: AbortSignal.timeout(5000) // 5 Sekunden Timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Backend-Verbindung: ${data.message || 'OK'}`);
        setIsApiAvailable(true);
      } else {
        alert(`Backend nicht erreichbar: ${response.status} ${response.statusText}`);
        setIsApiAvailable(false);
      }
    } catch (err) {
      console.error('API-Test fehlgeschlagen:', err);
      alert(`Backend nicht erreichbar: ${err.message}`);
      setIsApiAvailable(false);
    }
  };

  // Debug-Informationen zum Token anzeigen
  const showTokenInfo = () => {
    const token = localStorage.getItem('token');
    const timestamp = localStorage.getItem('tokenTimestamp');
    const user = localStorage.getItem('user');
    
    let message = 'Token-Information:\n';
    
    if (token) {
      message += `Token: ${token.substr(0, 15)}...\n`;
      
      if (timestamp) {
        const age = Math.round((Date.now() - parseInt(timestamp)) / 1000 / 60);
        message += `Alter: ca. ${age} Minuten\n`;
      }
      
      if (user) {
        try {
          const userData = JSON.parse(user);
          message += `Benutzer: ${userData.name || userData.email}\n`;
        } catch (e) {
          message += `Benutzer: [Ungültiges JSON]\n`;
        }
      }
    } else {
      message += 'Kein Token vorhanden.\n';
    }
    
    alert(message);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h1>Anmelden</h1>
      
      {!isApiAvailable && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <strong>Warnung:</strong> Der Backend-Server scheint nicht erreichbar zu sein. Bitte überprüfen Sie Ihre Verbindung.
        </div>
      )}
      
      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            E-Mail-Adresse
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Passwort
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            backgroundColor: '#3f51b5',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            width: '100%',
            marginBottom: '10px'
          }}
        >
          {loading ? 'Anmelden...' : 'Anmelden'}
        </button>

        {/* Debug-Buttons - nur in der Entwicklung anzeigen */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
            <button 
              type="button"
              onClick={testBackendConnection}
              style={{
                backgroundColor: '#f1f1f1',
                color: '#333',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                flex: 1
              }}
            >
              Backend-Verbindung testen
            </button>
            
            <button 
              type="button"
              onClick={showTokenInfo}
              style={{
                backgroundColor: '#f1f1f1',
                color: '#333',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                flex: 1
              }}
            >
              Token-Info
            </button>
          </div>
        )}
      </form>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/register" style={{ color: '#3f51b5', textDecoration: 'none' }}>
          Noch kein Konto? Registrieren
        </Link>
      </div>
    </div>
  );
};

export default Login;
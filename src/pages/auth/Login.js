import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Überprüfen, ob der Benutzer bereits eingeloggt ist
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Handler für direkten API-Aufruf (falls der Context-Login nicht funktioniert)
  const handleDirectLogin = async (credentials) => {
    try {
      console.log('Direkter API-Aufruf mit:', { email: credentials.email });
      
      const response = await axios.post('http://localhost:5000/api/auth/login', credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API-Antwort:', response.data);
      
      // Token und Benutzerdaten speichern
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
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
      console.error('API-Fehlerdetails:', error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Verbindungsfehler zum Server'
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Formular abgesendet');
    setLoading(true);
    setError('');
    
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
        method: 'GET'
      });
      const data = await response.json();
      alert(`Backend-Verbindung: ${data.message || 'OK'}`);
    } catch (err) {
      console.error('API-Test fehlgeschlagen:', err);
      alert(`Backend nicht erreichbar: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h1>Anmelden</h1>
      
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

        {/* Debug-Button - nur in der Entwicklung anzeigen */}
        {process.env.NODE_ENV === 'development' && (
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
              marginTop: '10px'
            }}
          >
            Backend-Verbindung testen
          </button>
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
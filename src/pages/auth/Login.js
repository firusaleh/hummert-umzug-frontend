// src/pages/auth/Login.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isApiAvailable, checkApiAvailability } = useAuth();
  const navigate = useNavigate();

  // Überprüfen, ob der Benutzer bereits eingeloggt ist und API verfügbar ist
  useEffect(() => {
    // Wenn bereits eingeloggt, zum Dashboard navigieren
    if (user) {
      navigate('/dashboard');
    }
    
    // API-Verfügbarkeit prüfen
    const checkApiStatus = async () => {
      await checkApiAvailability();
    };
    
    checkApiStatus();
  }, [user, navigate, checkApiAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login-Formular abgesendet');
    setLoading(true);
    setError('');
    
    // Einfache Client-seitige Validierung
    if (!email || !password) {
      setError('Bitte füllen Sie alle Felder aus.');
      setLoading(false);
      return;
    }
    
    try {
      // API-Verfügbarkeit erneut prüfen
      if (!isApiAvailable) {
        setError('Der Server ist derzeit nicht erreichbar. Bitte versuchen Sie es später erneut.');
        setLoading(false);
        return;
      }
      
      const credentials = { email, password };
      console.log('Login-Versuch mit:', { email, password: '***' });
      
      // Login-Versuch
      const result = await login(credentials);
      console.log('Login-Ergebnis:', result);
      
      if (result.success) {
        console.log('Login erfolgreich!');
        navigate('/dashboard');
      } else {
        console.error('Login fehlgeschlagen:', result.message);
        setError(result.message || 'Login fehlgeschlagen');
      }
    } catch (err) {
      console.error('Login-Fehler:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
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
          disabled={loading || !isApiAvailable}
          style={{
            backgroundColor: '#3f51b5',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: (loading || !isApiAvailable) ? 'not-allowed' : 'pointer',
            opacity: (loading || !isApiAvailable) ? 0.7 : 1,
            width: '100%',
            marginBottom: '10px'
          }}
        >
          {loading ? 'Anmelden...' : 'Anmelden'}
        </button>

        {/* Debug-Button nur in der Entwicklung anzeigen */}
        {process.env.NODE_ENV === 'development' && (
          <button 
            type="button"
            onClick={checkApiAvailability}
            style={{
              backgroundColor: '#f1f1f1',
              color: '#333',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%',
              marginTop: '10px'
            }}
          >
            API-Verbindung prüfen
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
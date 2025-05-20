import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user, isApiAvailable, checkApiAvailability } = useAuth();
  const navigate = useNavigate();

  // Überprüfen, ob der Benutzer bereits eingeloggt ist
  useEffect(() => {
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
    setError('');
    
    // Client-seitige Validierung
    if (!name || !email || !password || !confirmPassword) {
      setError('Bitte alle Felder ausfüllen');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    
    // Stärkere Passwortvalidierung
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(password)) {
      setError('Das Passwort muss mindestens 12 Zeichen lang sein und Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen enthalten');
      return;
    }
    
    setLoading(true);

    try {
      // Prüfen, ob API verfügbar ist
      if (!isApiAvailable) {
        setError('Der Server ist derzeit nicht erreichbar. Bitte versuchen Sie es später erneut.');
        setLoading(false);
        return;
      }
      
      const result = await register({ name, email, password });
      if (result.success) {
        // Bei erfolgreicher Registrierung zum Dashboard navigieren
        navigate('/dashboard');
      } else {
        setError(result.message || 'Registrierung fehlgeschlagen');
      }
    } catch (err) {
      // Fehlerbehandlung ohne sensitive Daten zu loggen
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h1>Registrieren</h1>
      
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
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            minLength="6"
          />
          <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
            Mindestens 12 Zeichen mit Groß-/Kleinbuchstaben, Zahlen und Sonderzeichen
          </small>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px' }}>
            Passwort bestätigen
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            width: '100%'
          }}
        >
          {loading ? 'Registrieren...' : 'Registrieren'}
        </button>
      </form>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/login" style={{ color: '#3f51b5', textDecoration: 'none' }}>
          Bereits ein Konto? Anmelden
        </Link>
      </div>
    </div>
  );
};

export default Register;
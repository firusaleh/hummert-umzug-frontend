// src/pages/auth/Login.js - Korrigierte Version
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const { login, user, loading, isApiAvailable, checkApiAvailability } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Überprüfen, ob der Benutzer bereits eingeloggt ist und API verfügbar ist
  useEffect(() => {
    // Weiterleitung zur ursprünglichen Seite oder zum Dashboard, falls der Benutzer bereits eingeloggt ist
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
    
    // API-Verfügbarkeit prüfen
    const checkApiStatus = async () => {
      try {
        await checkApiAvailability();
      } catch (err) {
        // Fehler wird intern behandelt
      }
    };
    
    checkApiStatus();
  }, [user, navigate, location, checkApiAvailability]);

  // Validierungsfunktion
  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-Mail ist ungültig';
    }
    
    if (!password) {
      newErrors.password = 'Passwort ist erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Formular validieren
    if (!validateForm()) {
      return;
    }
    
    try {
      setButtonLoading(true);
      
      // API-Verfügbarkeit erneut prüfen
      if (!isApiAvailable) {
        setErrors({
          general: 'Der Server ist derzeit nicht erreichbar. Bitte versuchen Sie es später erneut.'
        });
        return;
      }
      
      const credentials = { email, password };
      
      // Login-Versuch
      const result = await login(credentials);
      
      if (result && result.success) {
        // Weiterleitung zur ursprünglichen Seite oder zum Dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setErrors({
          general: result?.message || 'Login fehlgeschlagen'
        });
      }
    } catch (err) {
      // Fehlerbehandlung ohne sensitive Daten zu loggen
      setErrors({
        general: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Anmelden</h1>
          <p className="text-gray-600 mt-2">Melden Sie sich bei Ihrem Konto an</p>
        </div>
        
        {!isApiAvailable && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Der Backend-Server ist nicht erreichbar. Bitte überprüfen Sie Ihre Verbindung oder versuchen Sie es später erneut.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {errors.general && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {errors.general}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-Mail-Adresse
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Passwort
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`appearance-none block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10`}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600" id="password-error">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Angemeldet bleiben
              </label>
            </div>

            <div className="text-sm">
              <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Passwort vergessen?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={buttonLoading || !isApiAvailable}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (buttonLoading || !isApiAvailable) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {buttonLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Anmelden...
                </>
              ) : (
                "Anmelden"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Oder
              </span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Neues Konto erstellen
            </Link>
          </div>
        </div>
        
        {/* API-Status-Tester nur in der Entwicklung */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Entwickler-Tools</h3>
            <button
              type="button"
              onClick={async () => {
                const isAvailable = await checkApiAvailability();
                alert(isAvailable ? 'API ist erreichbar' : 'API ist nicht erreichbar');
              }}
              className="w-full text-sm py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
            >
              API-Verbindung testen
            </button>
            <div className="mt-2 text-xs text-gray-500">
              <p>API-Status: {isApiAvailable ? '✅ Verbunden' : '❌ Nicht verbunden'}</p>
              <p>Benutzer: {user ? '✅ Angemeldet' : '❌ Nicht angemeldet'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
// src/context/AuthContext.fixed.jsx
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Constants
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_TIMESTAMP_KEY = 'token_timestamp';
const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Create Context
export const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  isApiAvailable: false,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  checkApiAvailability: async () => {},
  clearError: () => {},
  refreshToken: async () => {}
});

// Custom Hook
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Axios interceptor setup
const setupAxiosInterceptors = (logout, refreshToken) => {
  // Request interceptor to add token
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle token expiry
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          logout();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check API availability
  const checkApiAvailability = useCallback(async () => {
    try {
      const response = await authService.checkApiHealth();
      setIsApiAvailable(true);
      return true;
    } catch (error) {
      console.warn('API not available:', error);
      setIsApiAvailable(false);
      return false;
    }
  }, []);

  // Token management
  const isTokenExpired = useCallback(() => {
    const timestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
    if (!timestamp) return true;
    
    const tokenAge = Date.now() - parseInt(timestamp);
    return tokenAge > TOKEN_EXPIRY_TIME;
  }, []);

  const saveAuthData = useCallback((token, refreshToken, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    setUser(null);
    setError(null);
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refresh) throw new Error('No refresh token');

      const response = await authService.refreshToken(refresh);
      const { token, user } = response.data;
      
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());
      setUser(user);
      
      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      navigate('/login');
    }
  }, [clearAuthData, navigate]);

  // Login
  const login = useCallback(async (credentials) => {
    setError(null);
    setLoading(true);

    try {
      const apiAvailable = await checkApiAvailability();
      if (!apiAvailable) {
        throw new Error('Server ist derzeit nicht erreichbar');
      }

      const response = await authService.login(credentials);
      const { token, refreshToken, user } = response.data;

      if (!token) {
        throw new Error('Kein Token in der Antwort erhalten');
      }

      saveAuthData(token, refreshToken, user);
      setUser(user);
      setError(null);

      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      
      let errorMessage = 'Login fehlgeschlagen';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Ungültige Anmeldedaten';
            break;
          case 404:
            errorMessage = 'Benutzer nicht gefunden';
            break;
          case 429:
            errorMessage = 'Zu viele Anmeldeversuche. Bitte später versuchen';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Keine Verbindung zum Server';
      } else {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [checkApiAvailability, saveAuthData]);

  // Register
  const register = useCallback(async (userData) => {
    setError(null);
    setLoading(true);

    try {
      const apiAvailable = await checkApiAvailability();
      if (!apiAvailable) {
        throw new Error('Server ist derzeit nicht erreichbar');
      }

      const response = await authService.register(userData);
      const { token, refreshToken, user } = response.data;

      if (!token) {
        throw new Error('Kein Token in der Antwort erhalten');
      }

      saveAuthData(token, refreshToken, user);
      setUser(user);
      setError(null);

      return { success: true, user };
    } catch (error) {
      console.error('Registration failed:', error);
      
      let errorMessage = 'Registrierung fehlgeschlagen';
      
      if (error.response) {
        switch (error.response.status) {
          case 409:
            errorMessage = 'E-Mail-Adresse bereits registriert';
            break;
          case 400:
            if (error.response.data?.errors) {
              errorMessage = error.response.data.errors
                .map(err => err.message || err.msg)
                .join(', ');
            } else {
              errorMessage = 'Ungültige Eingabedaten';
            }
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'Keine Verbindung zum Server';
      } else {
        errorMessage = error.message;
      }

      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [checkApiAvailability, saveAuthData]);

  // Update profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      const updatedUser = response.data.user;
      
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Profil-Update fehlgeschlagen' 
      };
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (passwordData) => {
    try {
      await authService.changePassword(passwordData);
      return { success: true };
    } catch (error) {
      console.error('Password change failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Passwortänderung fehlgeschlagen' 
      };
    }
  }, []);

  // Forgot password
  const forgotPassword = useCallback(async (email) => {
    try {
      await authService.forgotPassword(email);
      return { success: true };
    } catch (error) {
      console.error('Forgot password failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Anfrage fehlgeschlagen' 
      };
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (token, newPassword) => {
    try {
      await authService.resetPassword(token, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Password reset failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Passwort-Reset fehlgeschlagen' 
      };
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const apiAvailable = await checkApiAvailability();
        const token = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (!apiAvailable) {
          if (token && storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (parseError) {
              console.error('Failed to parse user data:', parseError);
              clearAuthData();
            }
          }
          return;
        }

        if (token && storedUser) {
          if (isTokenExpired()) {
            try {
              await refreshToken();
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              clearAuthData();
            }
          } else {
            try {
              const userData = JSON.parse(storedUser);
              await authService.checkAuth();
              setUser(userData);
            } catch (error) {
              console.error('Auth check failed:', error);
              clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [checkApiAvailability, isTokenExpired, refreshToken, clearAuthData]);

  // Setup axios interceptors
  useEffect(() => {
    setupAxiosInterceptors(logout, refreshToken);
  }, [logout, refreshToken]);

  // Auto refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const timestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
        if (timestamp) {
          const tokenAge = Date.now() - parseInt(timestamp);
          const timeUntilExpiry = TOKEN_EXPIRY_TIME - tokenAge;
          
          // Refresh 5 minutes before expiry
          if (timeUntilExpiry < 5 * 60 * 1000) {
            await refreshToken();
          }
        }
      } catch (error) {
        console.error('Auto refresh failed:', error);
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [user, refreshToken]);

  // Context value
  const value = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isApiAvailable,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    checkApiAvailability,
    clearError,
    refreshToken
  }), [
    user,
    loading,
    error,
    isApiAvailable,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    checkApiAvailability,
    clearError,
    refreshToken
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
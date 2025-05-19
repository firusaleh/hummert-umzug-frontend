// src/hooks/useAuth.js - Korrigierte Version für bessere Hook-Integration
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom Hook für den einfachen Zugriff auf den AuthContext
 * Bietet Zugriff auf alle Authentifizierungsfunktionen und den aktuellen Zustand
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden');
  }
  
  return context;
};

export default useAuth;
import React, { createContext, useState, useCallback } from 'react';
import api from '../services/api';


// Auth-Kontext erstellen
export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);
  // Benutzer authentifizieren
 const checkAuth = useCallback(async () => {
   const token = localStorage.getItem('token');
  
   if (!token) {
     setLoading(false);
     return;
   }
  
   try {
     const response = await api.get('/auth/me');
     setUser(response.data);
   } catch (error) {
     // Token ungültig oder abgelaufen
     localStorage.removeItem('token');
     setUser(null);
   } finally {
     setLoading(false);
   }
 }, []);
  // Benutzer anmelden
 const login = async (credentials) => {
   setLoading(true);
   try {
     const response = await api.post('/auth/login', credentials);
     const { token, user } = response.data;
    
     localStorage.setItem('token', token);
     setUser(user);
     setLoading(false);
    
     return { success: true };
   } catch (error) {
     setLoading(false);
     return {
       success: false,
       message: error.response?.data?.message || 'Anmeldefehler'
     };
   }
 };
  // Benutzer abmelden
 const logout = () => {
   localStorage.removeItem('token');
   setUser(null);
 };
  // Benutzer registrieren
 const register = async (userData) => {
   setLoading(true);
   try {
     const response = await api.post('/auth/register', userData);
     const { token, user } = response.data;
    
     localStorage.setItem('token', token);
     setUser(user);
     setLoading(false);
    
     return { success: true };
   } catch (error) {
     setLoading(false);
     return {
       success: false,
       message: error.response?.data?.message || 'Registrierungsfehler'
     };
   }
 };
  return (
   <AuthContext.Provider value={{
     user,
     loading,
     checkAuth,
     login,
     logout,
     register
   }}>
     {children}
   </AuthContext.Provider>
 );
};

// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';

// Auth-Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Main-Pages
import Dashboard from './pages/Dashboard';

// Umzüge-Pages
import UmzuegeList from './pages/umzuege/UmzuegeList';
import UmzugDetails from './pages/umzuege/UmzugDetails';
import UmzugForm from './pages/umzuege/UmzugForm';

// Aufnahmen-Pages
import AufnahmenList from './pages/aufnahmen/AufnahmenList';
import AufnahmeForm from './pages/aufnahmen/AufnahmeForm';

// Mitarbeiter-Pages
import MitarbeiterList from './pages/mitarbeiter/MitarbeiterList';
import MitarbeiterForm from './pages/mitarbeiter/MitarbeiterForm';

// Zeitachse
import Zeitachse from './pages/zeitachse/Zeitachse';

// Benachrichtigungen
import Benachrichtigungen from './pages/benachrichtigungen/Benachrichtigungen';

// Einstellungen
import Einstellungen from './pages/einstellungen/Einstellungen';

import ZeiterfassungSystem from './pages/zeiterfassung/ZeiterfassungSystem';

import Finanzverwaltung from './pages/finanzen/Finanzverwaltung';

import UmzuegeMonatsansicht from './pages/umzuege/UmzuegeMonatsansicht';

import FinanzenMonatsansicht from './pages/finanzen/FinanzenMonatsansicht';

// Auth-Prüfung (später durch echte Authentifizierung ersetzen)
const isAuthenticated = () => {
  // Hier später echte Auth-Prüfung implementieren
  return true;
};

// Protected Route Komponente
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  return (
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes mit MainLayout */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Umzüge Routes */}
        <Route path="/umzuege" element={
          <ProtectedRoute>
            <MainLayout>
              <UmzuegeMonatsansicht />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/umzuege/neu" element={
          <ProtectedRoute>
            <MainLayout>
              <UmzugForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/umzuege/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <UmzugDetails />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/umzuege/:id/bearbeiten" element={
          <ProtectedRoute>
            <MainLayout>
              <UmzugForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Aufnahmen Routes */}
        <Route path="/aufnahmen" element={
          <ProtectedRoute>
            <MainLayout>
              <AufnahmenList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/aufnahmen/neu" element={
          <ProtectedRoute>
            <MainLayout>
              <AufnahmeForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/aufnahmen/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <AufnahmeForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/aufnahmen/:id/bearbeiten" element={
          <ProtectedRoute>
            <MainLayout>
              <AufnahmeForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Mitarbeiter Routes */}
        <Route path="/mitarbeiter" element={
          <ProtectedRoute>
            <MainLayout>
              <MitarbeiterList />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/mitarbeiter/neu" element={
          <ProtectedRoute>
            <MainLayout>
              <MitarbeiterForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/mitarbeiter/:id" element={
          <ProtectedRoute>
            <MainLayout>
              <MitarbeiterForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/mitarbeiter/:id/bearbeiten" element={
          <ProtectedRoute>
            <MainLayout>
              <MitarbeiterForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Zeitachse Route */}
        <Route path="/zeitachse" element={
          <ProtectedRoute>
            <MainLayout>
              <Zeitachse />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Benachrichtigungen Route */}
        <Route path="/benachrichtigungen" element={
          <ProtectedRoute>
            <MainLayout>
              <Benachrichtigungen />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Einstellungen Route */}
        <Route path="/einstellungen" element={
          <ProtectedRoute>
            <MainLayout>
              <Einstellungen />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

        <Route path="/finanzen" element={
  <ProtectedRoute>
    <MainLayout>
      <Finanzverwaltung />
    </MainLayout>
  </ProtectedRoute>
} />

<Route path="/finanzen/monatsansicht" element={
  <ProtectedRoute>
    <MainLayout>
      <FinanzenMonatsansicht />
    </MainLayout>
  </ProtectedRoute>
} />
        
<Route path="/zeiterfassung" element={
  <ProtectedRoute>
    <MainLayout>
      <ZeiterfassungSystem />
    </MainLayout>
  </ProtectedRoute>
} />
      </Routes>
    
  );
};

export default App;
// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

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
import UmzuegeMonatsansicht from './pages/umzuege/UmzuegeMonatsansicht';

// Aufnahmen-Pages
import AufnahmenList from './pages/aufnahmen/AufnahmenList';
import AufnahmeForm from './pages/aufnahmen/AufnahmeForm';

// Mitarbeiter-Pages
import MitarbeiterList from './pages/mitarbeiter/MitarbeiterList';
import MitarbeiterForm from './pages/mitarbeiter/MitarbeiterForm';

// Fahrzeuge-Pages
import FahrzeugeList from './pages/fahrzeuge/FahrzeugeList';
import FahrzeugDetails from './pages/fahrzeuge/FahrzeugDetails';
import FahrzeugForm from './pages/fahrzeuge/FahrzeugForm';
import KilometerstandForm from './pages/fahrzeuge/KilometerstandForm';

// Zeitachse
import Zeitachse from './pages/zeitachse/Zeitachse';

// Benachrichtigungen
import Benachrichtigungen from './pages/benachrichtigungen/Benachrichtigungen';

// Einstellungen
import Einstellungen from './pages/einstellungen/Einstellungen';

// Zeiterfassung
import ZeiterfassungSystem from './pages/zeiterfassung/ZeiterfassungSystem';

// Finanzen-Pages
import Finanzverwaltung from './pages/finanzen/Finanzverwaltung';
import FinanzenMonatsansicht from './pages/finanzen/FinanzenMonatsansicht';
import AngebotForm from './components/finanzen/AngebotForm';
import RechnungForm from './components/finanzen/RechnungForm';
import ProjektkostenForm from './components/finanzen/ProjektkostenForm';

// 404 Seite
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/common/ErrorBoundary';

// Protected Route Komponente - verwendet den AuthContext
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Zeigt Ladeindikator während Authentifizierungsstatus geprüft wird
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Leitet zur Login-Seite weiter, wenn nicht authentifiziert
  if (!user) {
    // Speichern der ursprünglichen URL, um nach dem Login zurückzukehren
    return <Navigate to="/login" state={{ from: location }} replace />;
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
      
      <Route path="/umzuege/uebersicht" element={
        <ProtectedRoute>
          <MainLayout>
            <UmzuegeList />
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
      
      {/* Finanzen Routes */}
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

      {/* Angebote Routes */}
      <Route path="/finanzen/angebote/neu" element={
        <ProtectedRoute>
          <MainLayout>
            <AngebotForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finanzen/angebote/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <AngebotForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finanzen/angebote/:id/bearbeiten" element={
        <ProtectedRoute>
          <MainLayout>
            <AngebotForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Rechnungen Routes */}
      <Route path="/finanzen/rechnungen/neu" element={
        <ProtectedRoute>
          <MainLayout>
            <RechnungForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finanzen/rechnungen/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <RechnungForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finanzen/rechnungen/:id/bearbeiten" element={
        <ProtectedRoute>
          <MainLayout>
            <RechnungForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Projektkosten Routes */}
      <Route path="/finanzen/projektkosten/neu" element={
        <ProtectedRoute>
          <MainLayout>
            <ProjektkostenForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finanzen/projektkosten/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <ProjektkostenForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finanzen/projektkosten/:id/bearbeiten" element={
        <ProtectedRoute>
          <MainLayout>
            <ProjektkostenForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Zeiterfassung Routes */}
      <Route path="/zeiterfassung" element={
        <ProtectedRoute>
          <MainLayout>
            <ZeiterfassungSystem />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Fahrzeuge Routes */}
      <Route path="/fahrzeuge" element={
        <ProtectedRoute>
          <MainLayout>
            <FahrzeugeList />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/fahrzeuge/neu" element={
        <ProtectedRoute>
          <MainLayout>
            <FahrzeugForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/fahrzeuge/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <FahrzeugDetails />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/fahrzeuge/:id/bearbeiten" element={
        <ProtectedRoute>
          <MainLayout>
            <FahrzeugForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/fahrzeuge/:id/kilometerstand" element={
        <ProtectedRoute>
          <MainLayout>
            <KilometerstandForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* 404 Route */}
      <Route path="/404" element={
        <MainLayout>
          <NotFound />
        </MainLayout>
      } />
      
      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default App;
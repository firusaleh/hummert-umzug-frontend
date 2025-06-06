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
import AufnahmeDetails from './pages/aufnahmen/AufnahmeDetails';

// Mitarbeiter-Pages
import MitarbeiterList from './pages/mitarbeiter/MitarbeiterList';
import MitarbeiterForm from './pages/mitarbeiter/MitarbeiterForm';
import MitarbeiterDetails from './pages/mitarbeiter/MitarbeiterDetails';

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
import ZeiterfassungDashboard from './pages/zeiterfassung/ZeiterfassungDashboard';

// Finanzen-Pages
import FinanzenDashboard from './pages/finanzen/FinanzenDashboard';
import InvoiceForm from './pages/finanzen/components/InvoiceForm';
import InvoiceManagement from './pages/finanzen/components/InvoiceManagement';

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
            <AufnahmeDetails />
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
            <MitarbeiterDetails />
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
            <FinanzenDashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finanzen/rechnungen" element={
        <ProtectedRoute>
          <MainLayout>
            <InvoiceManagement />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finanzen/rechnungen/neu" element={
        <ProtectedRoute>
          <MainLayout>
            <InvoiceForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finanzen/rechnungen/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <InvoiceForm />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finanzen/rechnungen/:id/bearbeiten" element={
        <ProtectedRoute>
          <MainLayout>
            <InvoiceForm />
          </MainLayout>
        </ProtectedRoute>
      } />

      
      {/* Zeiterfassung Routes */}
      <Route path="/zeiterfassung" element={
        <ProtectedRoute>
          <MainLayout>
            <ZeiterfassungDashboard />
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
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { DataSyncProvider } from './context/DataSyncContext';
import { NotificationProvider } from './context/NotificationContext';
import { UmzugProvider } from './context/UmzugContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './assets/styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <DataSyncProvider>
              <NotificationProvider>
                <UmzugProvider>
                  <App />
                </UmzugProvider>
              </NotificationProvider>
            </DataSyncProvider>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
// src/pages/__tests__/Dashboard.integration.test.jsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Dashboard from '../Dashboard';
import { umzuegeService, mitarbeiterService, finanzenService, aufnahmenService } from '../../services/api';
import { toast } from 'react-toastify';

// Mock services
jest.mock('../../services/api');
jest.mock('react-toastify');
jest.mock('../../services/websocket', () => ({
  default: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }
}));

const mockData = {
  umzuege: {
    data: {
      umzuege: [
        { _id: '1', auftraggeber: { name: 'Test Kunde' }, status: 'geplant', startDatum: '2024-03-20' },
        { _id: '2', auftraggeber: { name: 'Test Kunde 2' }, status: 'geplant', startDatum: '2024-03-25' }
      ],
      total: 2
    }
  },
  mitarbeiter: {
    data: {
      mitarbeiter: [
        { _id: '1', name: 'Max Mustermann' },
        { _id: '2', name: 'Anna Schmidt' }
      ],
      total: 2
    }
  },
  aufnahmen: {
    data: {
      aufnahmen: [],
      total: 5
    }
  },
  finanzen: {
    data: {
      umsatzGesamt: 12500,
      aktuelleUebersicht: {
        gesamtEinnahmen: 12500,
        gesamtAusgaben: 8000
      }
    }
  },
  monatsUebersicht: {
    data: {
      monatsUebersichten: [
        { monat: 1, umzuege: 10, aufnahmen: 5, umsatz: 8000 },
        { monat: 2, umzuege: 12, aufnahmen: 8, umsatz: 10000 },
        { monat: 3, umzuege: 15, aufnahmen: 10, umsatz: 12500 }
      ]
    }
  }
};

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    umzuegeService.getAll.mockResolvedValue(mockData.umzuege);
    mitarbeiterService.getAll.mockResolvedValue(mockData.mitarbeiter);
    aufnahmenService.getAll.mockResolvedValue(mockData.aufnahmen);
    finanzenService.getFinanzuebersicht.mockResolvedValue(mockData.finanzen);
    finanzenService.getMonatsUebersicht.mockResolvedValue(mockData.monatsUebersicht);
  });

  test('renders dashboard with loading state initially', () => {
    renderDashboard();
    
    // Should show loading skeleton
    expect(screen.getAllByTestId('skeleton-loader')).toHaveLength(4);
  });

  test('displays all statistics after loading', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total moves
      expect(screen.getByText('5')).toBeInTheDocument(); // Total inspections
      expect(screen.getByText('2')).toBeInTheDocument(); // Total employees
      expect(screen.getByText('12.500€')).toBeInTheDocument(); // Revenue
    });
  });

  test('shows error message when API fails', async () => {
    umzuegeService.getAll.mockRejectedValue(new Error('API Error'));
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Laden/)).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Fehler beim Laden der Dashboard-Daten');
    });
  });

  test('handles manual refresh', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
    
    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(toast.info).toHaveBeenCalledWith('Dashboard wird aktualisiert...');
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Dashboard erfolgreich aktualisiert!');
    });
  });

  test('toggles real-time updates', async () => {
    renderDashboard();
    
    const realtimeToggle = screen.getByLabelText('Echtzeit-Updates');
    
    // Enable real-time
    fireEvent.click(realtimeToggle);
    
    await waitFor(() => {
      expect(realtimeToggle).toBeChecked();
    });
    
    // Should show real-time indicator
    expect(screen.getAllByTestId('realtime-indicator')).toHaveLength(4);
  });

  test('displays upcoming moves correctly', async () => {
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Kunde')).toBeInTheDocument();
      expect(screen.getByText('20.03.2024')).toBeInTheDocument();
    });
  });

  test('renders charts with data', async () => {
    renderDashboard();
    
    await waitFor(() => {
      // Check for chart containers
      expect(screen.getByText('Monatliche Entwicklung')).toBeInTheDocument();
      expect(screen.getByText('Umzüge nach Kategorie')).toBeInTheDocument();
    });
  });

  test('handles empty upcoming moves', async () => {
    umzuegeService.getAll.mockResolvedValueOnce({
      data: { umzuege: [], total: 0 }
    });
    
    renderDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Keine anstehenden Umzüge')).toBeInTheDocument();
    });
  });
});

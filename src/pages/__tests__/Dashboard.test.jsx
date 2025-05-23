// src/pages/__tests__/Dashboard.test.jsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard.fixed';
import api from '../../services/api';
import { AppContext } from '../../context/AppContext';
import { NotificationContext } from '../../context/NotificationContext';

jest.mock('../../services/api');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const MockProviders = ({ children }) => {
  const appValue = {
    loading: false,
    setLoading: jest.fn(),
    error: null,
    setError: jest.fn()
  };
  
  const notificationValue = {
    addNotification: jest.fn()
  };
  
  return (
    <AppContext.Provider value={appValue}>
      <NotificationContext.Provider value={notificationValue}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </NotificationContext.Provider>
    </AppContext.Provider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockApiData = {
    moves: {
      success: true,
      data: {
        items: [],
        pagination: { total: 156 }
      }
    },
    inspections: {
      success: true,
      data: {
        items: [],
        pagination: { total: 215 }
      }
    },
    employees: {
      success: true,
      data: {
        items: [],
        pagination: { total: 24 }
      }
    },
    finance: {
      success: true,
      data: {
        umsatzGesamt: 125000
      }
    },
    monthlyData: {
      success: true,
      data: {
        monatsUebersichten: [
          { monat: 1, umzuege: 20, aufnahmen: 15 },
          { monat: 2, umzuege: 25, aufnahmen: 18 }
        ]
      }
    },
    categoryData: {
      success: true,
      data: [
        { name: 'Privat', umzuege: 80 },
        { name: 'Gewerbe', umzuege: 60 }
      ]
    },
    upcomingMoves: {
      success: true,
      data: {
        items: [
          {
            _id: '1',
            auftraggeber: { name: 'Max Mustermann' },
            startDatum: '2024-01-20',
            typ: 'Privat',
            auszugsadresse: { ort: 'Berlin' },
            einzugsadresse: { ort: 'Hamburg' }
          }
        ]
      }
    }
  };

  it('renders dashboard with loading state', () => {
    render(
      <MockProviders>
        <Dashboard />
      </MockProviders>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays all stat cards when data is loaded', async () => {
    api.umzug.getAll.mockResolvedValueOnce(mockApiData.moves);
    api.aufnahme.getAll.mockResolvedValueOnce(mockApiData.inspections);
    api.mitarbeiter.getAll.mockResolvedValueOnce(mockApiData.employees);
    api.finanzen.getUebersicht.mockResolvedValueOnce(mockApiData.finance);
    api.finanzen.getMonatsuebersicht.mockResolvedValueOnce(mockApiData.monthlyData);
    api.umzug.getStatsByCategory.mockResolvedValueOnce(mockApiData.categoryData);
    api.umzug.getAll.mockResolvedValueOnce(mockApiData.upcomingMoves);

    render(
      <MockProviders>
        <Dashboard />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('156')).toBeInTheDocument(); // Total moves
      expect(screen.getByText('215')).toBeInTheDocument(); // Total inspections
      expect(screen.getByText('24')).toBeInTheDocument(); // Total employees
      expect(screen.getByText(/125\.000/)).toBeInTheDocument(); // Revenue
    });
  });

  it('handles API errors gracefully', async () => {
    api.umzug.getAll.mockRejectedValueOnce(new Error('API Error'));
    api.aufnahme.getAll.mockRejectedValueOnce(new Error('API Error'));
    api.mitarbeiter.getAll.mockRejectedValueOnce(new Error('API Error'));
    api.finanzen.getUebersicht.mockRejectedValueOnce(new Error('API Error'));

    render(
      <MockProviders>
        <Dashboard />
      </MockProviders>
    );

    await waitFor(() => {
      const errorElements = screen.getAllByText(/Fehler beim Laden/);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('navigates to correct pages when stat cards are clicked', async () => {
    api.umzug.getAll.mockResolvedValue(mockApiData.moves);
    api.aufnahme.getAll.mockResolvedValue(mockApiData.inspections);
    api.mitarbeiter.getAll.mockResolvedValue(mockApiData.employees);
    api.finanzen.getUebersicht.mockResolvedValue(mockApiData.finance);

    render(
      <MockProviders>
        <Dashboard />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Umzüge gesamt')).toBeInTheDocument();
    });

    const umzuegeCard = screen.getByText('Umzüge gesamt').closest('button');
    fireEvent.click(umzuegeCard);

    expect(mockNavigate).toHaveBeenCalledWith('/umzuege');
  });

  it('displays upcoming moves table', async () => {
    api.umzug.getAll
      .mockResolvedValueOnce(mockApiData.moves)
      .mockResolvedValueOnce(mockApiData.upcomingMoves);
    api.aufnahme.getAll.mockResolvedValue(mockApiData.inspections);
    api.mitarbeiter.getAll.mockResolvedValue(mockApiData.employees);
    api.finanzen.getUebersicht.mockResolvedValue(mockApiData.finance);

    render(
      <MockProviders>
        <Dashboard />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('Hamburg')).toBeInTheDocument();
    });
  });

  it('shows empty state for upcoming moves', async () => {
    const emptyUpcomingMoves = {
      success: true,
      data: { items: [] }
    };

    api.umzug.getAll
      .mockResolvedValueOnce(mockApiData.moves)
      .mockResolvedValueOnce(emptyUpcomingMoves);
    api.aufnahme.getAll.mockResolvedValue(mockApiData.inspections);
    api.mitarbeiter.getAll.mockResolvedValue(mockApiData.employees);
    api.finanzen.getUebersicht.mockResolvedValue(mockApiData.finance);

    render(
      <MockProviders>
        <Dashboard />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Keine bevorstehenden Umzüge')).toBeInTheDocument();
    });
  });

  it('refetches data when refresh button is clicked', async () => {
    api.umzug.getAll.mockResolvedValue(mockApiData.moves);
    api.aufnahme.getAll.mockResolvedValue(mockApiData.inspections);
    api.mitarbeiter.getAll.mockResolvedValue(mockApiData.employees);
    api.finanzen.getUebersicht.mockResolvedValue(mockApiData.finance);

    render(
      <MockProviders>
        <Dashboard />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('156')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle('Daten aktualisieren');
    fireEvent.click(refreshButton);

    expect(api.umzug.getAll).toHaveBeenCalledTimes(4); // Initial + refresh
  });

  it('calculates and displays change percentages', async () => {
    const lastMonthData = {
      success: true,
      data: {
        items: [],
        pagination: { total: 140 }
      }
    };

    api.umzug.getAll
      .mockResolvedValueOnce(mockApiData.moves)
      .mockResolvedValueOnce(lastMonthData);
    api.aufnahme.getAll.mockResolvedValue(mockApiData.inspections);
    api.mitarbeiter.getAll.mockResolvedValue(mockApiData.employees);
    api.finanzen.getUebersicht.mockResolvedValue(mockApiData.finance);
    api.finanzen.getMonatsuebersicht.mockResolvedValue({
      success: true,
      data: { umsatzGesamt: 120000 }
    });

    render(
      <MockProviders>
        <Dashboard />
      </MockProviders>
    );

    await waitFor(() => {
      // 156 current vs 140 last month = 11% increase
      const changeElements = screen.getAllByText(/11%/);
      expect(changeElements.length).toBeGreaterThan(0);
    });
  });

  it('renders charts when data is available', async () => {
    api.umzug.getAll.mockResolvedValue(mockApiData.moves);
    api.aufnahme.getAll.mockResolvedValue(mockApiData.inspections);
    api.mitarbeiter.getAll.mockResolvedValue(mockApiData.employees);
    api.finanzen.getUebersicht.mockResolvedValue(mockApiData.finance);
    api.finanzen.getMonatsuebersicht.mockResolvedValue(mockApiData.monthlyData);
    api.umzug.getStatsByCategory.mockResolvedValue(mockApiData.categoryData);

    render(
      <MockProviders>
        <Dashboard />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Monatliche Statistik')).toBeInTheDocument();
      expect(screen.getByText('Umzüge nach Kategorie')).toBeInTheDocument();
    });
  });

  it('uses fallback data when API fails for charts', async () => {
    api.umzug.getAll.mockResolvedValue(mockApiData.moves);
    api.aufnahme.getAll.mockResolvedValue(mockApiData.inspections);
    api.mitarbeiter.getAll.mockResolvedValue(mockApiData.employees);
    api.finanzen.getUebersicht.mockResolvedValue(mockApiData.finance);
    api.finanzen.getMonatsuebersicht.mockRejectedValue(new Error('API Error'));
    api.umzug.getStatsByCategory.mockRejectedValue(new Error('API Error'));

    render(
      <MockProviders>
        <Dashboard />
      </MockProviders>
    );

    await waitFor(() => {
      // Charts should still render with fallback data
      expect(screen.getByText('Monatliche Statistik')).toBeInTheDocument();
      expect(screen.getByText('Umzüge nach Kategorie')).toBeInTheDocument();
    });
  });
});
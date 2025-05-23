// src/pages/__tests__/UmzuegeList.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UmzuegeList from '../umzuege/UmzuegeList.fixed';
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
    setLoading: jest.fn(),
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

describe('UmzuegeList', () => {
  const mockUmzuege = {
    success: true,
    data: {
      items: [
        {
          _id: '1',
          kunde: 'Max Mustermann',
          typ: 'Privat',
          status: 'geplant',
          startDatum: '2024-01-20',
          auszugsadresse: { ort: 'Berlin', strasse: 'Hauptstr', hausnummer: '1' },
          einzugsadresse: { ort: 'Hamburg', strasse: 'Bahnhofstr', hausnummer: '10' },
          mitarbeiter: ['1', '2'],
          fahrzeuge: ['1']
        },
        {
          _id: '2',
          auftraggeber: { name: 'Firma ABC' },
          typ: 'Gewerbe',
          status: 'in_bearbeitung',
          startDatum: '2024-01-25',
          auszugsadresse: { ort: 'München' },
          einzugsadresse: { ort: 'Frankfurt' },
          mitarbeiter: ['3', '4', '5']
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders umzuege list with data', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      expect(screen.getByText('Firma ABC')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    api.umzug.getAll.mockImplementation(() => new Promise(() => {}));

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    expect(screen.getByText('Lade Umzüge...')).toBeInTheDocument();
  });

  it('shows empty state when no umzuege', async () => {
    api.umzug.getAll.mockResolvedValue({
      success: true,
      data: {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      }
    });

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Keine Umzüge gefunden')).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    api.umzug.getAll.mockRejectedValue(new Error('API Error'));

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden der Daten')).toBeInTheDocument();
    });
  });

  it('filters by search term', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    const searchInput = screen.getByPlaceholderText('Suche nach Kunde, Adresse...');
    fireEvent.change(searchInput, { target: { value: 'Max' } });

    await waitFor(() => {
      expect(api.umzug.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Max' })
      );
    });
  });

  it('filters by status', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    const statusSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(statusSelect, { target: { value: 'geplant' } });

    await waitFor(() => {
      expect(api.umzug.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'geplant' })
      );
    });
  });

  it('filters by type', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    const typeSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(typeSelect, { target: { value: 'Privat' } });

    await waitFor(() => {
      expect(api.umzug.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'Privat' })
      );
    });
  });

  it('sorts by column click', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
    });

    const kundeHeader = screen.getByText('Kunde');
    fireEvent.click(kundeHeader);

    await waitFor(() => {
      expect(api.umzug.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'kunde' })
      );
    });
  });

  it('navigates to detail page on row click', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
    });

    const row = screen.getByText('Max Mustermann').closest('tr');
    fireEvent.click(row);

    expect(mockNavigate).toHaveBeenCalledWith('/umzuege/1');
  });

  it('handles pagination', async () => {
    api.umzug.getAll.mockResolvedValue({
      ...mockUmzuege,
      data: {
        ...mockUmzuege.data,
        pagination: { page: 1, limit: 10, total: 20, totalPages: 2 }
      }
    });

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
    });

    const nextPageButton = screen.getByLabelText('Nächste Seite');
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(api.umzug.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('exports data', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);
    api.umzug.export.mockResolvedValue({
      success: true,
      data: 'csv,data,here'
    });

    const createObjectURL = jest.fn();
    const revokeObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(api.umzug.export).toHaveBeenCalled();
      expect(createObjectURL).toHaveBeenCalled();
    });
  });

  it('retries on error', async () => {
    api.umzug.getAll
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden der Daten')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Erneut versuchen');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
    });
  });

  it('displays correct status badges', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Geplant')).toBeInTheDocument();
      expect(screen.getByText('In Bearbeitung')).toBeInTheDocument();
    });
  });

  it('displays correct type badges', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Privat')).toBeInTheDocument();
      expect(screen.getByText('Gewerbe')).toBeInTheDocument();
    });
  });

  it('formats addresses correctly', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/Hauptstr 1/)).toBeInTheDocument();
      expect(screen.getByText(/München/)).toBeInTheDocument();
    });
  });

  it('displays team information', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('2 MA, 1 Fahrzeuge')).toBeInTheDocument();
      expect(screen.getByText('3 MA')).toBeInTheDocument();
    });
  });

  it('handles date range filtering', async () => {
    api.umzug.getAll.mockResolvedValue(mockUmzuege);

    render(
      <MockProviders>
        <UmzuegeList />
      </MockProviders>
    );

    const fromDateInput = screen.getByLabelText('Von Datum');
    const toDateInput = screen.getByLabelText('Bis Datum');

    fireEvent.change(fromDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(toDateInput, { target: { value: '2024-01-31' } });

    await waitFor(() => {
      expect(api.umzug.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31'
        })
      );
    });
  });
});
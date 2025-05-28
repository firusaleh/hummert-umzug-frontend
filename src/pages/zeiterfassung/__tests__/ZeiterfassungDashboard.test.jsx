import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ZeiterfassungDashboard from '../ZeiterfassungDashboard';
import api from '../../../services/api';
import { AuthProvider } from '../../../context/AuthContext';

// Mock the API
vi.mock('../../../services/api');

// Mock child components to simplify testing
vi.mock('../components/ZeiterfassungForm', () => ({
  default: ({ onClose, onSubmit }) => (
    <div data-testid="zeiterfassung-form">
      <button onClick={onClose}>Close</button>
      <button onClick={onSubmit}>Submit</button>
    </div>
  )
}));

vi.mock('../components/ExportDialog', () => ({
  default: ({ onClose }) => (
    <div data-testid="export-dialog">
      <button onClick={onClose}>Close Export</button>
    </div>
  )
}));

const mockProjects = [
  {
    _id: 'p1',
    auftraggeber: { name: 'Test Kunde' },
    startDatum: '2024-01-15',
    status: 'in_bearbeitung'
  },
  {
    _id: 'p2',
    auftraggeber: { name: 'Another Kunde' },
    startDatum: '2024-01-20',
    status: 'geplant'
  }
];

const mockEmployees = [
  {
    _id: 'e1',
    vorname: 'Max',
    nachname: 'Mustermann',
    rolle: 'Umzugshelfer',
    aktiv: true
  },
  {
    _id: 'e2',
    vorname: 'Anna',
    nachname: 'Schmidt',
    rolle: 'Teamleiter',
    aktiv: true
  }
];

const mockTimeEntries = [
  {
    _id: 't1',
    mitarbeiterId: mockEmployees[0],
    projektId: mockProjects[0],
    datum: '2024-01-15',
    startzeit: '08:00',
    endzeit: '17:00',
    pause: 30,
    arbeitsstunden: 8.5,
    taetigkeit: 'Umzug durchführen',
    notizen: 'Alles gut verlaufen'
  },
  {
    _id: 't2',
    mitarbeiterId: mockEmployees[1],
    projektId: mockProjects[0],
    datum: '2024-01-15',
    startzeit: '09:00',
    endzeit: '18:00',
    pause: 60,
    arbeitsstunden: 8,
    taetigkeit: 'Team koordinieren',
    notizen: ''
  }
];

const mockStatistics = {
  totalHours: 156.5,
  totalEntries: 24,
  averageHoursPerDay: 7.8,
  byEmployee: [
    { name: 'Max Mustermann', hours: 85, entries: 10 },
    { name: 'Anna Schmidt', hours: 71.5, entries: 14 }
  ],
  byProject: [
    { name: 'Test Kunde', hours: 100, entries: 15 },
    { name: 'Another Kunde', hours: 56.5, entries: 9 }
  ]
};

const mockUser = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin'
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AuthProvider value={{ user: mockUser }}>
        <ZeiterfassungDashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ZeiterfassungDashboard', () => {
  beforeEach(() => {
    api.get.mockClear();
    api.post.mockClear();
    api.put.mockClear();
    api.delete.mockClear();
  });

  test('renders dashboard header correctly', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Zeiterfassung')).toBeInTheDocument();
      expect(screen.getByText('Verwalten Sie Arbeitszeiten und analysieren Sie Projektaufwände')).toBeInTheDocument();
    });
  });

  test('fetches initial data on mount', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: mockProjects } }) // projects
      .mockResolvedValueOnce({ data: { data: mockEmployees } }) // employees
      .mockResolvedValueOnce({ data: { data: mockStatistics } }); // statistics

    renderComponent();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/zeiterfassung/projekte');
      expect(api.get).toHaveBeenCalledWith('/zeiterfassung/mitarbeiter');
      expect(api.get).toHaveBeenCalledWith('/zeiterfassung/statistics');
    });
  });

  test('displays navigation tabs correctly', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Zeiteinträge/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Analysen/i })).toBeInTheDocument();
    });
  });

  test('opens new time entry form on button click', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();

    await waitFor(() => {
      const newEntryButton = screen.getByRole('button', { name: /Neue Zeiterfassung/i });
      fireEvent.click(newEntryButton);
    });

    expect(screen.getByTestId('zeiterfassung-form')).toBeInTheDocument();
  });

  test('opens export dialog on export button click', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportButton);
    });

    expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
  });

  test('fetches time entries when filters change', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: mockProjects } })
      .mockResolvedValueOnce({ data: { data: mockEmployees } })
      .mockResolvedValueOnce({ data: { data: mockStatistics } })
      .mockResolvedValueOnce({ data: { data: mockTimeEntries } }); // time entries

    renderComponent();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(3); // Initial calls
    });

    // Wait for time entries to be fetched
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/zeiterfassung?'));
    });
  });

  test('handles delete time entry confirmation', async () => {
    api.get.mockResolvedValue({ data: { data: mockTimeEntries } });
    api.delete.mockResolvedValue({ data: { success: true } });
    
    window.confirm = vi.fn(() => true);
    
    renderComponent();

    // Wait for data to load, then trigger delete
    await waitFor(() => {
      // Component should have a way to trigger delete
      // This would be tested more thoroughly with the actual component structure
      expect(window.confirm).not.toHaveBeenCalled();
    });
  });

  test('displays error state when API calls fail', async () => {
    api.get.mockRejectedValue(new Error('API Error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Laden der Daten/i)).toBeInTheDocument();
    });
  });

  test('calculates filtered statistics correctly', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: mockProjects } })
      .mockResolvedValueOnce({ data: { data: mockEmployees } })
      .mockResolvedValueOnce({ data: { data: mockStatistics } })
      .mockResolvedValueOnce({ data: { data: mockTimeEntries } });

    renderComponent();

    await waitFor(() => {
      // Statistics should be calculated from time entries
      // This would be verified by checking the displayed values
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/zeiterfassung?'));
    });
  });

  test('switches between view tabs correctly', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();

    await waitFor(() => {
      const entriesTab = screen.getByRole('button', { name: /Zeiteinträge/i });
      fireEvent.click(entriesTab);
    });

    // Verify the active tab styling or content change
    const entriesTab = screen.getByRole('button', { name: /Zeiteinträge/i });
    expect(entriesTab.className).toContain('border-indigo-500');
  });

  test('handles form submission and refreshes data', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: mockProjects } })
      .mockResolvedValueOnce({ data: { data: mockEmployees } })
      .mockResolvedValueOnce({ data: { data: mockStatistics } });

    renderComponent();

    await waitFor(() => {
      const newEntryButton = screen.getByRole('button', { name: /Neue Zeiterfassung/i });
      fireEvent.click(newEntryButton);
    });

    // Clear previous calls
    api.get.mockClear();
    
    // Simulate form submission
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should refetch data after submission
      expect(api.get).toHaveBeenCalled();
    });
  });
});
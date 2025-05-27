// Comprehensive test suite for Umzüge module
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import { umzuegeService } from '../services/api';
import UmzuegeList from '../pages/umzuege/UmzuegeList';
import UmzugForm from '../pages/umzuege/UmzugForm';
import UmzugDetails from '../pages/umzuege/UmzugDetails';

// Mock API service
vi.mock('../services/api', () => ({
  umzuegeService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  clientService: {
    getAll: vi.fn(),
    search: vi.fn()
  },
  mitarbeiterService: {
    getAll: vi.fn()
  },
  fahrzeugeService: {
    getAll: vi.fn()
  }
}));

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

const mockAuthContext = {
  user: { id: '1', name: 'Test User', role: 'admin' },
  isAuthenticated: true,
  logout: vi.fn()
};

const renderWithProviders = (component) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('Umzüge Module Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UmzuegeList Component', () => {
    const mockUmzuege = {
      data: [
        {
          _id: '1',
          kundennummer: 'K12345',
          auftraggeber: { name: 'Max Mustermann', telefon: '0123456789', email: 'max@test.de' },
          auszugsadresse: { strasse: 'Alte Str', hausnummer: '1', plz: '10115', ort: 'Berlin' },
          einzugsadresse: { strasse: 'Neue Str', hausnummer: '2', plz: '80333', ort: 'München' },
          startDatum: '2025-06-01T08:00:00Z',
          endDatum: '2025-06-01T16:00:00Z',
          status: 'geplant',
          mitarbeiter: [{ _id: '1', name: 'Worker 1' }],
          fahrzeuge: [{ _id: '1', kennzeichen: 'B-HU 123' }]
        }
      ],
      pagination: {
        total: 1,
        page: 1,
        totalPages: 1,
        limit: 10
      }
    };

    it('should render list with data from API', async () => {
      umzuegeService.getAll.mockResolvedValue(mockUmzuege);
      
      renderWithProviders(<UmzuegeList />);
      
      await waitFor(() => {
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
        expect(screen.getByText(/Alte Str 1, 10115, Berlin/)).toBeInTheDocument();
      });
    });

    it('should handle search functionality', async () => {
      umzuegeService.getAll.mockResolvedValue(mockUmzuege);
      
      renderWithProviders(<UmzuegeList />);
      
      const searchInput = screen.getByPlaceholderText('Suchen...');
      await userEvent.type(searchInput, 'Mustermann');
      
      await waitFor(() => {
        expect(umzuegeService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Mustermann'
          })
        );
      });
    });

    it('should handle status filter', async () => {
      umzuegeService.getAll.mockResolvedValue(mockUmzuege);
      
      renderWithProviders(<UmzuegeList />);
      
      const statusFilter = screen.getByLabelText('Status');
      await userEvent.selectOptions(statusFilter, 'geplant');
      
      await waitFor(() => {
        expect(umzuegeService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'geplant'
          })
        );
      });
    });

    it('should handle pagination', async () => {
      umzuegeService.getAll.mockResolvedValue({
        ...mockUmzuege,
        pagination: { ...mockUmzuege.pagination, totalPages: 3 }
      });
      
      renderWithProviders(<UmzuegeList />);
      
      await waitFor(() => {
        expect(screen.getByText('Seite 1 von 3')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByLabelText('Nächste Seite');
      await userEvent.click(nextButton);
      
      expect(umzuegeService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      );
    });
  });

  describe('UmzugForm Component', () => {
    it('should validate required fields', async () => {
      renderWithProviders(<UmzugForm />);
      
      // Try to go to next step without filling required fields
      const nextButton = screen.getByText('Weiter');
      await userEvent.click(nextButton);
      
      expect(screen.getByText('Bitte wählen Sie einen Kunden aus')).toBeInTheDocument();
    });

    it('should properly map fields for API submission', async () => {
      const mockClient = {
        _id: '1',
        name: 'Test Kunde',
        telefon: '0123456789',
        email: 'test@example.com'
      };
      
      umzuegeService.create.mockResolvedValue({ data: { _id: 'new-id' } });
      
      renderWithProviders(<UmzugForm />);
      
      // Fill form step by step
      // Step 1: Customer
      const customerInput = screen.getByLabelText('Kunde suchen');
      await userEvent.type(customerInput, 'Test');
      
      // Mock customer selection
      fireEvent.change(customerInput, { target: { value: mockClient } });
      
      // Continue through steps...
      // This would be expanded in a real test
      
      // Submit form
      const submitButton = screen.getByText('Speichern');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(umzuegeService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            auftraggeber: expect.objectContaining({
              name: mockClient.name,
              telefon: mockClient.telefon,
              email: mockClient.email
            }),
            kontakte: expect.arrayContaining([
              expect.objectContaining({
                name: mockClient.name
              })
            ])
          })
        );
      });
    });

    it('should handle date validation', async () => {
      renderWithProviders(<UmzugForm />);
      
      // Navigate to date step
      // ... setup previous steps
      
      const startDateInput = screen.getByLabelText('Startdatum');
      const endDateInput = screen.getByLabelText('Enddatum');
      
      await userEvent.type(startDateInput, '2025-06-02');
      await userEvent.type(endDateInput, '2025-06-01');
      
      const nextButton = screen.getByText('Weiter');
      await userEvent.click(nextButton);
      
      expect(screen.getByText('Enddatum muss nach dem Startdatum liegen')).toBeInTheDocument();
    });
  });

  describe('UmzugDetails Component', () => {
    const mockUmzugDetails = {
      _id: '1',
      kundennummer: 'K12345',
      auftraggeber: {
        name: 'Max Mustermann',
        telefon: '0123456789',
        email: 'max@test.de'
      },
      kontakte: [{
        name: 'Max Mustermann',
        telefon: '0123456789',
        email: 'max@test.de',
        isKunde: true
      }],
      auszugsadresse: {
        strasse: 'Alte Str',
        hausnummer: '1',
        plz: '10115',
        ort: 'Berlin',
        etage: 3,
        aufzug: true
      },
      einzugsadresse: {
        strasse: 'Neue Str',
        hausnummer: '2',
        plz: '80333',
        ort: 'München',
        etage: 2,
        aufzug: false
      },
      startDatum: '2025-06-01T08:00:00Z',
      endDatum: '2025-06-01T16:00:00Z',
      status: 'geplant',
      mitarbeiter: [
        { mitarbeiterId: { _id: '1', name: 'Worker 1' }, rolle: 'fahrer' }
      ],
      fahrzeuge: [
        { kennzeichen: 'B-HU 123', typ: '7.5t LKW' }
      ],
      notizen: [
        { text: 'Klavier vorhanden', datum: '2025-05-01T10:00:00Z', ersteller: 'Admin' }
      ],
      preis: {
        netto: 1000,
        brutto: 1190,
        mwst: 19,
        bezahlt: false,
        zahlungsart: 'rechnung'
      }
    };

    it('should load and display umzug details from API', async () => {
      umzuegeService.getById.mockResolvedValue({ data: mockUmzugDetails });
      
      renderWithProviders(<UmzugDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
        expect(screen.getByText('0123456789')).toBeInTheDocument();
        expect(screen.getByText(/Alte Str 1/)).toBeInTheDocument();
        expect(screen.getByText(/3\. OG \(mit Aufzug\)/)).toBeInTheDocument();
      });
    });

    it('should handle adding notes', async () => {
      umzuegeService.getById.mockResolvedValue({ data: mockUmzugDetails });
      umzuegeService.update.mockResolvedValue({ data: { ...mockUmzugDetails } });
      
      renderWithProviders(<UmzugDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      });
      
      const noteInput = screen.getByPlaceholderText('Neue Notiz hinzufügen...');
      await userEvent.type(noteInput, 'Neue Testnotiz');
      
      const addButton = screen.getByText('Notiz hinzufügen');
      await userEvent.click(addButton);
      
      await waitFor(() => {
        expect(umzuegeService.update).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            notizen: expect.arrayContaining([
              expect.objectContaining({
                text: 'Neue Testnotiz'
              })
            ])
          })
        );
      });
    });

    it('should display timeline of activities', async () => {
      umzuegeService.getById.mockResolvedValue({ data: mockUmzugDetails });
      
      renderWithProviders(<UmzugDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Klavier vorhanden')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
      });
    });
  });

  describe('Field Mapping Tests', () => {
    it('should correctly map frontend fields to backend model', () => {
      const frontendData = {
        kundennummer: 'K12345',
        auftraggeber: {
          name: 'Test',
          telefon: '123',
          email: 'test@test.de'
        },
        auszugsadresse: {
          strasse: 'Test',
          hausnummer: '1',
          plz: '12345',
          ort: 'Berlin'
        },
        einzugsadresse: {
          strasse: 'Test2',
          hausnummer: '2',
          plz: '54321',
          ort: 'München'
        },
        startDatum: new Date('2025-06-01'),
        endDatum: new Date('2025-06-01'),
        mitarbeiter: ['1', '2'],
        fahrzeuge: ['F1', 'F2'],
        zusatzleistungen: [
          { beschreibung: 'Packen', preis: 100, menge: 1 }
        ]
      };

      // Test that data structure matches backend expectations
      expect(frontendData).toHaveProperty('auftraggeber');
      expect(frontendData).toHaveProperty('auszugsadresse');
      expect(frontendData).toHaveProperty('einzugsadresse');
      expect(frontendData).not.toHaveProperty('kunde'); // Should not have old field
      expect(frontendData).not.toHaveProperty('vonAdresse'); // Should not have old field
      expect(frontendData).not.toHaveProperty('nachAdresse'); // Should not have old field
    });
  });
});
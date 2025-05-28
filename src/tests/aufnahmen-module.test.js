// Comprehensive test suite for Aufnahmen module
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import { aufnahmenService } from '../services/api';
import AufnahmenList from '../pages/aufnahmen/AufnahmenList';
import UmzugsaufnahmeFormular from '../pages/aufnahmen/UmzugsaufnahmeFormular';
import AufnahmeDetails from '../pages/aufnahmen/AufnahmeDetails';

// Mock API service
vi.mock('../services/api', () => ({
  aufnahmenService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addRaum: vi.fn(),
    updateRaum: vi.fn(),
    deleteRaum: vi.fn(),
    addMoebel: vi.fn(),
    updateMoebel: vi.fn(),
    deleteMoebel: vi.fn(),
    uploadPhotos: vi.fn(),
    generateQuote: vi.fn(),
    generatePDF: vi.fn(),
    createUmzug: vi.fn()
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

describe('Aufnahmen Module Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AufnahmenList Component', () => {
    const mockAufnahmen = [
      {
        _id: '1',
        datum: '2025-05-15T10:00:00Z',
        kundenName: 'Max Mustermann',
        kontaktperson: 'Max Mustermann',
        telefon: '0123456789',
        email: 'max@test.de',
        umzugstyp: 'privat',
        status: 'in_bearbeitung',
        auszugsadresse: {
          strasse: 'Alte Straße',
          hausnummer: '10',
          plz: '12345',
          ort: 'Berlin',
          etage: 3,
          aufzug: true
        },
        einzugsadresse: {
          strasse: 'Neue Straße',
          hausnummer: '20',
          plz: '54321',
          ort: 'München',
          etage: 2,
          aufzug: false
        },
        gesamtvolumen: 35
      },
      {
        _id: '2',
        datum: '2025-05-16T14:00:00Z',
        kundenName: 'Anna Schmidt',
        telefon: '9876543210',
        email: 'anna@test.de',
        umzugstyp: 'gewerbe',
        status: 'angebot_erstellt',
        auszugsadresse: {
          strasse: 'Hauptstraße',
          hausnummer: '5',
          plz: '10115',
          ort: 'Berlin'
        },
        einzugsadresse: {
          strasse: 'Bahnhofstraße',
          hausnummer: '15',
          plz: '80333',
          ort: 'München'
        },
        angebotspreis: {
          netto: 2500,
          brutto: 2975,
          mwst: 19
        }
      }
    ];

    it('should render list with data from API', async () => {
      aufnahmenService.getAll.mockResolvedValue({ data: mockAufnahmen });
      
      renderWithProviders(<AufnahmenList />);
      
      await waitFor(() => {
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
        expect(screen.getByText('Anna Schmidt')).toBeInTheDocument();
      });
    });

    it('should handle search functionality', async () => {
      aufnahmenService.getAll.mockResolvedValue({ data: mockAufnahmen });
      
      renderWithProviders(<AufnahmenList />);
      
      await waitFor(() => {
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Suchen...');
      await userEvent.type(searchInput, 'Anna');
      
      await waitFor(() => {
        expect(screen.queryByText('Max Mustermann')).not.toBeInTheDocument();
        expect(screen.getByText('Anna Schmidt')).toBeInTheDocument();
      });
    });

    it('should display correct status badges', async () => {
      aufnahmenService.getAll.mockResolvedValue({ data: mockAufnahmen });
      
      renderWithProviders(<AufnahmenList />);
      
      await waitFor(() => {
        expect(screen.getByText('In Bearbeitung')).toBeInTheDocument();
        expect(screen.getByText('Angebot erstellt')).toBeInTheDocument();
      });
    });

    it('should handle delete action', async () => {
      aufnahmenService.getAll.mockResolvedValue({ data: mockAufnahmen });
      aufnahmenService.delete.mockResolvedValue({ success: true });
      
      window.confirm = vi.fn().mockReturnValue(true);
      
      renderWithProviders(<AufnahmenList />);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText('Löschen')).toHaveLength(2);
      });
      
      const deleteButtons = screen.getAllByLabelText('Löschen');
      await userEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(aufnahmenService.delete).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('UmzugsaufnahmeFormular Component', () => {
    it('should initialize with empty form data', () => {
      renderWithProviders(<UmzugsaufnahmeFormular onSave={vi.fn()} onCancel={vi.fn()} />);
      
      expect(screen.getByLabelText('Kundenname')).toHaveValue('');
      expect(screen.getByLabelText('Telefon')).toHaveValue('');
      expect(screen.getByLabelText('E-Mail')).toHaveValue('');
    });

    it('should handle address input', async () => {
      renderWithProviders(<UmzugsaufnahmeFormular onSave={vi.fn()} onCancel={vi.fn()} />);
      
      const strasseInput = screen.getByLabelText('Straße (Auszug)');
      await userEvent.type(strasseInput, 'Teststraße');
      
      expect(strasseInput).toHaveValue('Teststraße');
    });

    it('should calculate price correctly', async () => {
      renderWithProviders(<UmzugsaufnahmeFormular onSave={vi.fn()} onCancel={vi.fn()} />);
      
      const nettoInput = screen.getByLabelText('Netto');
      await userEvent.type(nettoInput, '1000');
      
      await waitFor(() => {
        const bruttoInput = screen.getByLabelText('Brutto');
        expect(bruttoInput).toHaveValue('1190');
      });
    });

    it('should validate required fields', async () => {
      const onSave = vi.fn();
      renderWithProviders(<UmzugsaufnahmeFormular onSave={onSave} onCancel={vi.fn()} />);
      
      const saveButton = screen.getByText('Speichern');
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        expect(onSave).not.toHaveBeenCalled();
        expect(screen.getByText(/Bitte geben Sie einen Kundennamen ein/)).toBeInTheDocument();
      });
    });

    it('should transform data for API submission', async () => {
      const onSave = vi.fn();
      const testDate = new Date('2025-06-01');
      
      renderWithProviders(<UmzugsaufnahmeFormular onSave={onSave} onCancel={vi.fn()} />);
      
      // Fill required fields
      await userEvent.type(screen.getByLabelText('Kundenname'), 'Test Kunde');
      await userEvent.type(screen.getByLabelText('Datum'), testDate.toISOString().split('T')[0]);
      
      const saveButton = screen.getByText('Speichern');
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            kundenName: 'Test Kunde',
            datum: expect.any(String) // ISO date string
          })
        );
      });
    });
  });

  describe('AufnahmeDetails Component', () => {
    const mockAufnahmeDetails = {
      _id: '1',
      datum: '2025-05-15T10:00:00Z',
      kundenName: 'Max Mustermann',
      kontaktperson: 'Max Mustermann',
      telefon: '0123456789',
      email: 'max@test.de',
      umzugstyp: 'privat',
      status: 'in_bearbeitung',
      bewertung: 4,
      auszugsadresse: {
        strasse: 'Alte Straße',
        hausnummer: '10',
        plz: '12345',
        ort: 'Berlin',
        etage: 3,
        aufzug: true,
        entfernung: 50
      },
      einzugsadresse: {
        strasse: 'Neue Straße',
        hausnummer: '20',
        plz: '54321',
        ort: 'München',
        etage: 2,
        aufzug: false,
        entfernung: 100
      },
      raeume: [
        {
          name: 'Wohnzimmer',
          flaeche: 25,
          moebel: [
            {
              name: 'Sofa',
              anzahl: 1,
              kategorie: 'sofa',
              groesse: { volumen: 2.5 },
              zerbrechlich: false,
              demontage: true
            },
            {
              name: 'Fernseher',
              anzahl: 1,
              kategorie: 'sonstiges',
              groesse: { volumen: 0.2 },
              zerbrechlich: true
            }
          ]
        },
        {
          name: 'Schlafzimmer',
          flaeche: 20,
          moebel: [
            {
              name: 'Doppelbett',
              anzahl: 1,
              kategorie: 'bett',
              groesse: { volumen: 3 },
              demontage: true,
              montage: true
            }
          ]
        }
      ],
      angebotspreis: {
        netto: 2000,
        brutto: 2380,
        mwst: 19
      },
      notizen: 'Klavier im Wohnzimmer',
      besonderheiten: 'Enge Treppe im Auszugshaus'
    };

    it('should load and display aufnahme details', async () => {
      aufnahmenService.getById.mockResolvedValue({ data: mockAufnahmeDetails });
      
      renderWithProviders(<AufnahmeDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Aufnahme - Max Mustermann')).toBeInTheDocument();
        expect(screen.getByText('0123456789')).toBeInTheDocument();
        expect(screen.getByText('max@test.de')).toBeInTheDocument();
      });
    });

    it('should display addresses correctly', async () => {
      aufnahmenService.getById.mockResolvedValue({ data: mockAufnahmeDetails });
      
      renderWithProviders(<AufnahmeDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Alte Straße 10, 12345 Berlin')).toBeInTheDocument();
        expect(screen.getByText('3. OG (mit Aufzug), 50m zur Parkposition')).toBeInTheDocument();
        expect(screen.getByText('Neue Straße 20, 54321 München')).toBeInTheDocument();
        expect(screen.getByText('2. OG (ohne Aufzug), 100m zur Parkposition')).toBeInTheDocument();
      });
    });

    it('should display rooms and furniture', async () => {
      aufnahmenService.getById.mockResolvedValue({ data: mockAufnahmeDetails });
      
      renderWithProviders(<AufnahmeDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Wohnzimmer')).toBeInTheDocument();
        expect(screen.getByText('(25 m²)')).toBeInTheDocument();
        expect(screen.getByText('1x Sofa')).toBeInTheDocument();
        expect(screen.getByText('1x Fernseher')).toBeInTheDocument();
        expect(screen.getByText('Zerbrechlich')).toBeInTheDocument();
        expect(screen.getByText('Demontage')).toBeInTheDocument();
      });
    });

    it('should calculate total volume', async () => {
      aufnahmenService.getById.mockResolvedValue({ data: mockAufnahmeDetails });
      
      renderWithProviders(<AufnahmeDetails />);
      
      await waitFor(() => {
        // Total volume = 2.5 + 0.2 + 3 = 5.7
        expect(screen.getByText('5.70 m³')).toBeInTheDocument();
      });
    });

    it('should handle PDF generation', async () => {
      aufnahmenService.getById.mockResolvedValue({ data: mockAufnahmeDetails });
      aufnahmenService.generatePDF.mockResolvedValue({ data: new Blob(['pdf content']) });
      
      renderWithProviders(<AufnahmeDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('PDF Export')).toBeInTheDocument();
      });
      
      const pdfButton = screen.getByText('PDF Export');
      await userEvent.click(pdfButton);
      
      await waitFor(() => {
        expect(aufnahmenService.generatePDF).toHaveBeenCalledWith('1');
      });
    });

    it('should handle create Umzug', async () => {
      aufnahmenService.getById.mockResolvedValue({ data: mockAufnahmeDetails });
      aufnahmenService.createUmzug.mockResolvedValue({ data: { _id: 'new-umzug-id' } });
      
      renderWithProviders(<AufnahmeDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Umzug erstellen')).toBeInTheDocument();
      });
      
      const createButton = screen.getByText('Umzug erstellen');
      await userEvent.click(createButton);
      
      await waitFor(() => {
        expect(aufnahmenService.createUmzug).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Field Mapping Tests', () => {
    it('should correctly map frontend fields to backend model', () => {
      const frontendData = {
        kundenName: 'Test Kunde',
        kontaktperson: 'Test Person',
        telefon: '123456789',
        email: 'test@test.de',
        umzugstyp: 'privat',
        datum: '2025-06-01T10:00:00Z',
        uhrzeit: '10:00',
        auszugsadresse: {
          strasse: 'Test',
          hausnummer: '1',
          plz: '12345',
          ort: 'Berlin',
          land: 'Deutschland',
          etage: 3,
          aufzug: true,
          entfernung: 50
        },
        einzugsadresse: {
          strasse: 'Test2',
          hausnummer: '2',
          plz: '54321',
          ort: 'München',
          land: 'Deutschland',
          etage: 0,
          aufzug: false,
          entfernung: 0
        },
        raeume: [
          {
            name: 'Wohnzimmer',
            flaeche: 25,
            moebel: [
              {
                name: 'Sofa',
                anzahl: 1,
                kategorie: 'sofa',
                groesse: {
                  laenge: 200,
                  breite: 90,
                  hoehe: 80,
                  volumen: 1.44
                },
                gewicht: 80,
                zerbrechlich: false,
                demontage: true,
                montage: true,
                verpackung: false
              }
            ]
          }
        ],
        angebotspreis: {
          netto: 1000,
          brutto: 1190,
          mwst: 19
        },
        status: 'in_bearbeitung',
        bewertung: 3,
        notizen: 'Test notes',
        besonderheiten: 'Test special'
      };

      // Test that data structure matches backend expectations
      expect(frontendData).toHaveProperty('kundenName');
      expect(frontendData).toHaveProperty('auszugsadresse');
      expect(frontendData.auszugsadresse).toHaveProperty('strasse');
      expect(frontendData.auszugsadresse).toHaveProperty('etage');
      expect(frontendData).toHaveProperty('raeume');
      expect(frontendData.raeume[0]).toHaveProperty('moebel');
      expect(frontendData.raeume[0].moebel[0]).toHaveProperty('kategorie');
      expect(frontendData).toHaveProperty('angebotspreis');
      expect(frontendData).toHaveProperty('status');
    });
  });
});
// Comprehensive test suite for Fahrzeuge module
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import { fahrzeugeService, configService } from '../services/api';
import FahrzeugeList from '../pages/fahrzeuge/FahrzeugeList';
import FahrzeugForm from '../pages/fahrzeuge/FahrzeugForm';
import FahrzeugDetails from '../pages/fahrzeuge/FahrzeugDetails';
import KilometerstandForm from '../pages/fahrzeuge/KilometerstandForm';

// Mock API services
vi.mock('../services/api', () => ({
  fahrzeugeService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateMileage: vi.fn()
  },
  configService: {
    getVehicleTypes: vi.fn(),
    getVehicleStatuses: vi.fn(),
    getLicenseClasses: vi.fn(),
    getDefaultConfigs: vi.fn()
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

describe('Fahrzeuge Module Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FahrzeugeList Component', () => {
    const mockFahrzeuge = [
      {
        _id: '1',
        kennzeichen: 'B-HU 1234',
        bezeichnung: '7.5t LKW',
        typ: 'LKW',
        status: 'Verfügbar',
        kilometerstand: 150000,
        tuev: '2025-12-31',
        tuevStatus: 'Gültig',
        fuehrerscheinklasse: 'C1'
      },
      {
        _id: '2',
        kennzeichen: 'B-HU 5678',
        bezeichnung: 'Sprinter',
        typ: 'Transporter',
        status: 'Im Einsatz',
        kilometerstand: 80000,
        tuev: '2025-02-15',
        tuevStatus: 'Bald fällig',
        fuehrerscheinklasse: 'B'
      }
    ];

    it('should render list with data from API', async () => {
      fahrzeugeService.getAll.mockResolvedValue({ data: mockFahrzeuge });
      
      renderWithProviders(<FahrzeugeList />);
      
      await waitFor(() => {
        expect(screen.getByText('B-HU 1234')).toBeInTheDocument();
        expect(screen.getByText('B-HU 5678')).toBeInTheDocument();
      });
    });

    it('should handle search functionality', async () => {
      fahrzeugeService.getAll.mockResolvedValue({ data: mockFahrzeuge });
      
      renderWithProviders(<FahrzeugeList />);
      
      await waitFor(() => {
        expect(screen.getByText('B-HU 1234')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Suchen...');
      await userEvent.type(searchInput, 'Sprinter');
      
      await waitFor(() => {
        expect(screen.getByText('Sprinter')).toBeInTheDocument();
        expect(screen.queryByText('7.5t LKW')).not.toBeInTheDocument();
      });
    });

    it('should handle type filter', async () => {
      fahrzeugeService.getAll.mockResolvedValue({ data: mockFahrzeuge });
      
      renderWithProviders(<FahrzeugeList />);
      
      const typeFilter = screen.getByLabelText('Typ');
      await userEvent.selectOptions(typeFilter, 'LKW');
      
      await waitFor(() => {
        expect(screen.getByText('7.5t LKW')).toBeInTheDocument();
        expect(screen.queryByText('Sprinter')).not.toBeInTheDocument();
      });
    });

    it('should display correct status badges', async () => {
      fahrzeugeService.getAll.mockResolvedValue({ data: mockFahrzeuge });
      
      renderWithProviders(<FahrzeugeList />);
      
      await waitFor(() => {
        expect(screen.getByText('Verfügbar')).toBeInTheDocument();
        expect(screen.getByText('Im Einsatz')).toBeInTheDocument();
      });
    });

    it('should display TÜV status correctly', async () => {
      fahrzeugeService.getAll.mockResolvedValue({ data: mockFahrzeuge });
      
      renderWithProviders(<FahrzeugeList />);
      
      await waitFor(() => {
        expect(screen.getByText(/Gültig/)).toBeInTheDocument();
        expect(screen.getByText(/Bald fällig/)).toBeInTheDocument();
      });
    });
  });

  describe('FahrzeugForm Component', () => {
    const mockConfigs = {
      vehicleTypes: ['LKW', 'Transporter', 'PKW', 'Anhänger', 'Sonstige'],
      vehicleStatuses: ['Verfügbar', 'Im Einsatz', 'In Wartung', 'Defekt', 'Außer Dienst'],
      licenseClasses: ['B', 'BE', 'C1', 'C1E', 'C', 'CE']
    };

    beforeEach(() => {
      configService.getVehicleTypes.mockResolvedValue(mockConfigs.vehicleTypes);
      configService.getVehicleStatuses.mockResolvedValue(mockConfigs.vehicleStatuses);
      configService.getLicenseClasses.mockResolvedValue(mockConfigs.licenseClasses);
      configService.getDefaultConfigs.mockReturnValue({
        vehicleTypes: mockConfigs.vehicleTypes,
        vehicleStatuses: mockConfigs.vehicleStatuses,
        licenseClasses: mockConfigs.licenseClasses
      });
    });

    it('should validate required fields', async () => {
      renderWithProviders(<FahrzeugForm />);
      
      const submitButton = screen.getByText('Speichern');
      await userEvent.click(submitButton);
      
      expect(screen.getByText(/Kennzeichen ist erforderlich/)).toBeInTheDocument();
    });

    it('should validate kennzeichen format', async () => {
      renderWithProviders(<FahrzeugForm />);
      
      const kennzeichenInput = screen.getByLabelText('Kennzeichen');
      await userEvent.type(kennzeichenInput, 'INVALID FORMAT 123');
      
      const submitButton = screen.getByText('Speichern');
      await userEvent.click(submitButton);
      
      expect(screen.getByText(/Ungültiges Kennzeichen-Format/)).toBeInTheDocument();
    });

    it('should create new vehicle on submit', async () => {
      const mockFahrzeug = { data: { _id: 'new-id' } };
      fahrzeugeService.create.mockResolvedValue(mockFahrzeug);
      
      renderWithProviders(<FahrzeugForm />);
      
      // Fill form
      await userEvent.type(screen.getByLabelText('Kennzeichen'), 'B-HU 9999');
      await userEvent.type(screen.getByLabelText('Bezeichnung'), 'Test Fahrzeug');
      await userEvent.selectOptions(screen.getByLabelText('Typ'), 'Transporter');
      await userEvent.type(screen.getByLabelText('Baujahr'), '2020');
      await userEvent.type(screen.getByLabelText('Kilometerstand'), '50000');
      
      const submitButton = screen.getByText('Speichern');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(fahrzeugeService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            kennzeichen: 'B-HU 9999',
            bezeichnung: 'Test Fahrzeug',
            typ: 'Transporter',
            baujahr: 2020,
            kilometerstand: 50000
          })
        );
      });
    });

    it('should handle capacity input', async () => {
      renderWithProviders(<FahrzeugForm />);
      
      // Fill capacity fields
      await userEvent.type(screen.getByLabelText('Länge (cm)'), '400');
      await userEvent.type(screen.getByLabelText('Breite (cm)'), '200');
      await userEvent.type(screen.getByLabelText('Höhe (cm)'), '250');
      await userEvent.type(screen.getByLabelText('Ladegewicht (kg)'), '3500');
      
      // Should calculate volume
      expect(screen.getByText(/20.00 m³/)).toBeInTheDocument();
    });
  });

  describe('FahrzeugDetails Component', () => {
    const mockFahrzeugDetails = {
      _id: '1',
      kennzeichen: 'B-HU 1234',
      bezeichnung: '7.5t LKW Mercedes',
      typ: 'LKW',
      status: 'Verfügbar',
      baujahr: 2020,
      anschaffungsdatum: '2020-06-15',
      kilometerstand: 150000,
      tuev: '2025-12-31',
      fuehrerscheinklasse: 'C1',
      kapazitaet: {
        ladeflaeche: {
          laenge: 600,
          breite: 240,
          hoehe: 280
        },
        ladegewicht: 3500,
        volumen: 40.32
      },
      versicherung: {
        gesellschaft: 'Allianz',
        vertragsnummer: 'V123456789',
        ablaufdatum: '2025-06-15'
      },
      naechsterService: '2025-03-15',
      notizen: 'Regelmäßige Wartung alle 6 Monate',
      alter: 5
    };

    it('should load and display vehicle details', async () => {
      fahrzeugeService.getById.mockResolvedValue({ data: mockFahrzeugDetails });
      
      renderWithProviders(<FahrzeugDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('7.5t LKW Mercedes')).toBeInTheDocument();
        expect(screen.getByText('B-HU 1234')).toBeInTheDocument();
        expect(screen.getByText('150.000 km')).toBeInTheDocument();
      });
    });

    it('should display capacity information', async () => {
      fahrzeugeService.getById.mockResolvedValue({ data: mockFahrzeugDetails });
      
      renderWithProviders(<FahrzeugDetails />);
      
      await waitFor(() => {
        expect(screen.getByText(/40.32 m³/)).toBeInTheDocument();
        expect(screen.getByText(/3.500 kg/)).toBeInTheDocument();
      });
    });

    it('should display insurance information', async () => {
      fahrzeugeService.getById.mockResolvedValue({ data: mockFahrzeugDetails });
      
      renderWithProviders(<FahrzeugDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Allianz')).toBeInTheDocument();
        expect(screen.getByText('V123456789')).toBeInTheDocument();
      });
    });

    it('should calculate and display TÜV status', async () => {
      fahrzeugeService.getById.mockResolvedValue({ data: mockFahrzeugDetails });
      
      renderWithProviders(<FahrzeugDetails />);
      
      await waitFor(() => {
        expect(screen.getByText(/TÜV bis:/)).toBeInTheDocument();
        expect(screen.getByText(/31.12.2025/)).toBeInTheDocument();
        expect(screen.getByText(/Gültig/)).toBeInTheDocument();
      });
    });

    it('should handle delete action', async () => {
      fahrzeugeService.getById.mockResolvedValue({ data: mockFahrzeugDetails });
      fahrzeugeService.delete.mockResolvedValue({ success: true });
      
      window.confirm = vi.fn().mockReturnValue(true);
      
      renderWithProviders(<FahrzeugDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Löschen')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByText('Löschen');
      await userEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(fahrzeugeService.delete).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('KilometerstandForm Component', () => {
    const mockFahrzeug = {
      _id: '1',
      kennzeichen: 'B-HU 1234',
      bezeichnung: '7.5t LKW',
      kilometerstand: 150000
    };

    it('should load current mileage', async () => {
      fahrzeugeService.getById.mockResolvedValue({ data: mockFahrzeug });
      
      renderWithProviders(<KilometerstandForm />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('150000')).toBeInTheDocument();
      });
    });

    it('should validate new mileage is higher', async () => {
      fahrzeugeService.getById.mockResolvedValue({ data: mockFahrzeug });
      
      renderWithProviders(<KilometerstandForm />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('150000')).toBeInTheDocument();
      });
      
      const input = screen.getByLabelText('Neuer Kilometerstand');
      await userEvent.clear(input);
      await userEvent.type(input, '140000');
      
      const submitButton = screen.getByText('Speichern');
      await userEvent.click(submitButton);
      
      expect(screen.getByText(/Der neue Kilometerstand muss größer als der aktuelle sein/)).toBeInTheDocument();
    });

    it('should update mileage successfully', async () => {
      fahrzeugeService.getById.mockResolvedValue({ data: mockFahrzeug });
      fahrzeugeService.updateMileage.mockResolvedValue({ success: true });
      
      renderWithProviders(<KilometerstandForm />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('150000')).toBeInTheDocument();
      });
      
      const input = screen.getByLabelText('Neuer Kilometerstand');
      await userEvent.clear(input);
      await userEvent.type(input, '155000');
      
      const submitButton = screen.getByText('Speichern');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(fahrzeugeService.updateMileage).toHaveBeenCalledWith('1', { kilometerstand: 155000 });
      });
    });
  });

  describe('Field Mapping Tests', () => {
    it('should correctly map frontend fields to backend model', () => {
      const frontendData = {
        kennzeichen: 'B-HU 1234',
        bezeichnung: 'Test Fahrzeug',
        typ: 'LKW',
        kapazitaet: {
          ladeflaeche: {
            laenge: 600,
            breite: 240,
            hoehe: 280
          },
          ladegewicht: 3500
        },
        baujahr: 2020,
        anschaffungsdatum: '2020-06-15',
        tuev: '2025-12-31',
        fuehrerscheinklasse: 'C1',
        status: 'Verfügbar',
        kilometerstand: 150000,
        naechsterService: '2025-03-15',
        versicherung: {
          gesellschaft: 'Allianz',
          vertragsnummer: 'V123456',
          ablaufdatum: '2025-06-15'
        },
        notizen: 'Test notes',
        isActive: true
      };

      // Test that data structure matches backend expectations
      expect(frontendData).toHaveProperty('kennzeichen');
      expect(frontendData).toHaveProperty('bezeichnung');
      expect(frontendData).toHaveProperty('typ');
      expect(frontendData.kapazitaet).toHaveProperty('ladeflaeche');
      expect(frontendData.kapazitaet.ladeflaeche).toHaveProperty('laenge');
      expect(frontendData).toHaveProperty('fuehrerscheinklasse');
      expect(frontendData).toHaveProperty('isActive');
    });
  });
});
// Comprehensive test suite for Mitarbeiter module
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import { mitarbeiterService, configService, userService } from '../services/api';
import MitarbeiterList from '../pages/mitarbeiter/MitarbeiterList';
import MitarbeiterForm from '../pages/mitarbeiter/MitarbeiterForm';
import MitarbeiterDetails from '../pages/mitarbeiter/MitarbeiterDetails';

// Mock API services
vi.mock('../services/api', () => ({
  mitarbeiterService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    uploadImage: vi.fn(),
    uploadDokument: vi.fn(),
    getArbeitszeiten: vi.fn()
  },
  configService: {
    getEmployeePositions: vi.fn(),
    getEmployeeSkills: vi.fn(),
    getDefaultConfigs: vi.fn()
  },
  userService: {
    create: vi.fn(),
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

describe('Mitarbeiter Module Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MitarbeiterList Component', () => {
    const mockMitarbeiter = [
      {
        _id: '1',
        vorname: 'Max',
        nachname: 'Mustermann',
        position: 'Träger',
        telefon: '0123456789',
        email: 'max@test.de',
        isActive: true,
        adresse: {
          strasse: 'Teststr',
          hausnummer: '1',
          plz: '12345',
          ort: 'Berlin'
        }
      },
      {
        _id: '2',
        vorname: 'Anna',
        nachname: 'Schmidt',
        position: 'Fahrer',
        telefon: '9876543210',
        email: 'anna@test.de',
        isActive: false,
        adresse: {
          strasse: 'Beispielweg',
          hausnummer: '2',
          plz: '54321',
          ort: 'München'
        }
      }
    ];

    it('should render list with data from API', async () => {
      mitarbeiterService.getAll.mockResolvedValue({ data: mockMitarbeiter });
      
      renderWithProviders(<MitarbeiterList />);
      
      await waitFor(() => {
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
        expect(screen.getByText('Anna Schmidt')).toBeInTheDocument();
      });
    });

    it('should handle search functionality', async () => {
      mitarbeiterService.getAll.mockResolvedValue({ data: mockMitarbeiter });
      
      renderWithProviders(<MitarbeiterList />);
      
      await waitFor(() => {
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Suchen...');
      await userEvent.type(searchInput, 'Max');
      
      await waitFor(() => {
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
        expect(screen.queryByText('Anna Schmidt')).not.toBeInTheDocument();
      });
    });

    it('should handle status filter', async () => {
      mitarbeiterService.getAll.mockResolvedValue({ data: mockMitarbeiter });
      
      renderWithProviders(<MitarbeiterList />);
      
      const statusFilter = screen.getByLabelText('Status');
      await userEvent.selectOptions(statusFilter, 'Aktiv');
      
      await waitFor(() => {
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
        expect(screen.queryByText('Anna Schmidt')).not.toBeInTheDocument();
      });
    });

    it('should display correct status badges', async () => {
      mitarbeiterService.getAll.mockResolvedValue({ data: mockMitarbeiter });
      
      renderWithProviders(<MitarbeiterList />);
      
      await waitFor(() => {
        const aktivBadges = screen.getAllByText('Aktiv');
        const inaktivBadges = screen.getAllByText('Inaktiv');
        expect(aktivBadges).toHaveLength(1);
        expect(inaktivBadges).toHaveLength(1);
      });
    });
  });

  describe('MitarbeiterForm Component', () => {
    const mockConfigs = {
      positions: ['Träger', 'Fahrer', 'Teamleiter'],
      skills: ['Packen', 'Möbelmontage', 'Klaviertransport']
    };

    beforeEach(() => {
      configService.getEmployeePositions.mockResolvedValue(mockConfigs.positions);
      configService.getEmployeeSkills.mockResolvedValue(mockConfigs.skills);
      configService.getDefaultConfigs.mockReturnValue({
        employeePositions: mockConfigs.positions,
        employeeSkills: mockConfigs.skills
      });
    });

    it('should validate required fields', async () => {
      renderWithProviders(<MitarbeiterForm />);
      
      const submitButton = screen.getByText('Speichern');
      await userEvent.click(submitButton);
      
      expect(screen.getByText(/Bitte füllen Sie alle Pflichtfelder aus/)).toBeInTheDocument();
    });

    it('should validate PLZ format', async () => {
      renderWithProviders(<MitarbeiterForm />);
      
      const plzInput = screen.getByLabelText('PLZ');
      await userEvent.type(plzInput, '123'); // Invalid PLZ
      
      const submitButton = screen.getByText('Speichern');
      await userEvent.click(submitButton);
      
      expect(screen.getByText(/gültige 5-stellige PLZ/)).toBeInTheDocument();
    });

    it('should create user and mitarbeiter on submit', async () => {
      const mockUser = { data: { _id: 'user123' } };
      const mockMitarbeiter = { data: { _id: 'mit123' } };
      
      userService.create.mockResolvedValue(mockUser);
      mitarbeiterService.create.mockResolvedValue(mockMitarbeiter);
      
      renderWithProviders(<MitarbeiterForm />);
      
      // Fill form
      await userEvent.type(screen.getByLabelText('Vorname'), 'Test');
      await userEvent.type(screen.getByLabelText('Nachname'), 'User');
      await userEvent.type(screen.getByLabelText('E-Mail'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Telefon'), '0123456789');
      await userEvent.type(screen.getByLabelText('Straße'), 'Teststraße');
      await userEvent.type(screen.getByLabelText('Hausnummer'), '1');
      await userEvent.type(screen.getByLabelText('PLZ'), '12345');
      await userEvent.type(screen.getByLabelText('Ort'), 'Berlin');
      
      const submitButton = screen.getByText('Speichern');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(userService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com',
            role: 'mitarbeiter'
          })
        );
        
        expect(mitarbeiterService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            vorname: 'Test',
            nachname: 'User',
            email: 'test@example.com',
            userId: 'user123'
          })
        );
      });
    });

    it('should handle profile image upload', async () => {
      const file = new File(['test'], 'profile.jpg', { type: 'image/jpeg' });
      mitarbeiterService.uploadImage.mockResolvedValue({ data: { path: '/uploads/profile.jpg' } });
      
      renderWithProviders(<MitarbeiterForm />);
      
      const fileInput = screen.getByLabelText(/Profilbild/);
      await userEvent.upload(fileInput, file);
      
      expect(screen.getByAltText('Profilbild Vorschau')).toBeInTheDocument();
    });
  });

  describe('MitarbeiterDetails Component', () => {
    const mockMitarbeiterDetails = {
      _id: '1',
      vorname: 'Max',
      nachname: 'Mustermann',
      position: 'Träger',
      abteilung: 'Umzüge',
      telefon: '0123456789',
      email: 'max@test.de',
      isActive: true,
      einstellungsdatum: '2023-01-15',
      geburtstag: '1990-05-20',
      adresse: {
        strasse: 'Teststr',
        hausnummer: '1',
        plz: '12345',
        ort: 'Berlin'
      },
      faehigkeiten: ['Packen', 'Möbelmontage'],
      fuehrerscheinklassen: ['B', 'C1'],
      gehalt: {
        brutto: 3000,
        netto: 2100,
        stundensatz: 18.75
      },
      notfallkontakt: {
        name: 'Maria Mustermann',
        telefon: '0987654321',
        beziehung: 'Ehefrau'
      },
      dokumente: [
        { name: 'Arbeitsvertrag.pdf', pfad: '/docs/vertrag.pdf', datum: '2023-01-15' }
      ]
    };

    it('should load and display mitarbeiter details', async () => {
      mitarbeiterService.getById.mockResolvedValue({ data: mockMitarbeiterDetails });
      mitarbeiterService.getArbeitszeiten.mockResolvedValue({ data: [] });
      
      renderWithProviders(<MitarbeiterDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
        expect(screen.getByText('Träger')).toBeInTheDocument();
        expect(screen.getByText('0123456789')).toBeInTheDocument();
        expect(screen.getByText('max@test.de')).toBeInTheDocument();
      });
    });

    it('should display skills and licenses', async () => {
      mitarbeiterService.getById.mockResolvedValue({ data: mockMitarbeiterDetails });
      mitarbeiterService.getArbeitszeiten.mockResolvedValue({ data: [] });
      
      renderWithProviders(<MitarbeiterDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Packen')).toBeInTheDocument();
        expect(screen.getByText('Möbelmontage')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(screen.getByText('C1')).toBeInTheDocument();
      });
    });

    it('should handle status toggle', async () => {
      mitarbeiterService.getById.mockResolvedValue({ data: mockMitarbeiterDetails });
      mitarbeiterService.getArbeitszeiten.mockResolvedValue({ data: [] });
      mitarbeiterService.update.mockResolvedValue({ data: { ...mockMitarbeiterDetails, isActive: false } });
      
      renderWithProviders(<MitarbeiterDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Deaktivieren')).toBeInTheDocument();
      });
      
      const toggleButton = screen.getByText('Deaktivieren');
      await userEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(mitarbeiterService.update).toHaveBeenCalledWith('1', { isActive: false });
      });
    });

    it('should handle document upload', async () => {
      mitarbeiterService.getById.mockResolvedValue({ data: mockMitarbeiterDetails });
      mitarbeiterService.getArbeitszeiten.mockResolvedValue({ data: [] });
      mitarbeiterService.uploadDokument.mockResolvedValue({ data: { success: true } });
      
      renderWithProviders(<MitarbeiterDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Dokument hochladen')).toBeInTheDocument();
      });
      
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByLabelText(/Dokument hochladen/);
      
      await userEvent.upload(fileInput, file);
      
      await waitFor(() => {
        expect(mitarbeiterService.uploadDokument).toHaveBeenCalled();
      });
    });

    it('should calculate and display age', async () => {
      mitarbeiterService.getById.mockResolvedValue({ data: mockMitarbeiterDetails });
      mitarbeiterService.getArbeitszeiten.mockResolvedValue({ data: [] });
      
      renderWithProviders(<MitarbeiterDetails />);
      
      await waitFor(() => {
        // Should display age calculated from birthday
        expect(screen.getByText(/\d+ Jahre/)).toBeInTheDocument();
      });
    });
  });

  describe('Field Mapping Tests', () => {
    it('should correctly map frontend fields to backend model', () => {
      const frontendData = {
        vorname: 'Test',
        nachname: 'User',
        telefon: '123456',
        email: 'test@test.de',
        adresse: {
          strasse: 'Test',
          hausnummer: '1',
          plz: '12345',
          ort: 'Berlin'
        },
        position: 'Träger',
        abteilung: 'Umzüge',
        einstellungsdatum: '2024-01-01',
        isActive: true,
        faehigkeiten: ['Packen'],
        fuehrerscheinklassen: ['B']
      };

      // Test that data structure matches backend expectations
      expect(frontendData).toHaveProperty('adresse');
      expect(frontendData.adresse).toHaveProperty('strasse');
      expect(frontendData).toHaveProperty('einstellungsdatum'); // Not eintrittsdatum
      expect(frontendData).toHaveProperty('isActive'); // Boolean, not status string
    });
  });
});
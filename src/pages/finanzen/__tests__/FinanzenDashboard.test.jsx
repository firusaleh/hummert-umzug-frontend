import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import FinanzenDashboard from '../FinanzenDashboard';
import api from '../../../services/api';

// Mock the API
vi.mock('../../../services/api');

// Mock child components
vi.mock('../components/InvoiceManagement', () => ({
  default: () => <div>Invoice Management Component</div>
}));

vi.mock('../components/AngebotManagement', () => ({
  default: () => <div>Angebot Management Component</div>
}));

vi.mock('../components/ProjektkostenManagement', () => ({
  default: () => <div>Projektkosten Management Component</div>
}));

vi.mock('../components/FinancialReports', () => ({
  default: () => <div>Financial Reports Component</div>
}));

vi.mock('../FinanzenMonatsansicht', () => ({
  default: () => <div>Monatsansicht Component</div>
}));

const mockInvoices = [
  {
    _id: '1',
    rechnungNummer: 'RE-2024-001',
    kunde: { name: 'Test Kunde' },
    ausstellungsdatum: '2024-01-15',
    faelligkeitsdatum: '2024-02-15',
    gesamtbetrag: 1500,
    status: 'Bezahlt'
  },
  {
    _id: '2',
    rechnungNummer: 'RE-2024-002',
    kunde: { name: 'Another Kunde' },
    ausstellungsdatum: '2024-01-20',
    faelligkeitsdatum: '2024-02-20',
    gesamtbetrag: 2500,
    status: 'Gesendet'
  }
];

const mockQuotes = [
  {
    _id: '1',
    angebotNummer: 'ANG-2024-001',
    status: 'Akzeptiert',
    gesamtbetrag: 3000
  }
];

const mockExpenses = [
  {
    _id: '1',
    kategorie: 'Personal',
    betrag: 500,
    datum: '2024-01-10'
  },
  {
    _id: '2',
    kategorie: 'Material',
    betrag: 300,
    datum: '2024-01-12'
  }
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <FinanzenDashboard />
    </BrowserRouter>
  );
};

describe('FinanzenDashboard', () => {
  beforeEach(() => {
    api.get.mockClear();
  });

  test('renders dashboard header correctly', () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();
    
    expect(screen.getByText('Finanzverwaltung')).toBeInTheDocument();
    expect(screen.getByText('Verwalten Sie Ihre Rechnungen, Angebote und Projektkosten')).toBeInTheDocument();
  });

  test('fetches and displays financial data on mount', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: mockInvoices } })
      .mockResolvedValueOnce({ data: { data: mockQuotes } })
      .mockResolvedValueOnce({ data: { data: mockExpenses } });

    renderComponent();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/finanzen/rechnungen');
      expect(api.get).toHaveBeenCalledWith('/finanzen/angebote');
      expect(api.get).toHaveBeenCalledWith('/finanzen/projektkosten');
    });
  });

  test('calculates and displays summary metrics correctly', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: mockInvoices } })
      .mockResolvedValueOnce({ data: { data: mockQuotes } })
      .mockResolvedValueOnce({ data: { data: mockExpenses } });

    renderComponent();

    await waitFor(() => {
      // Check revenue calculation (only paid invoices)
      expect(screen.getByText('1.500,00 €')).toBeInTheDocument();
      
      // Check expenses calculation
      expect(screen.getByText('800,00 €')).toBeInTheDocument();
    });
  });

  test('switches between tabs correctly', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();

    // Initially shows overview
    expect(screen.getByText('Übersicht')).toBeInTheDocument();

    // Click on Rechnungen tab
    const rechnungenTab = screen.getByRole('button', { name: /Rechnungen/i });
    fireEvent.click(rechnungenTab);

    await waitFor(() => {
      expect(screen.getByText('Invoice Management Component')).toBeInTheDocument();
    });

    // Click on Angebote tab
    const angeboteTab = screen.getByRole('button', { name: /Angebote/i });
    fireEvent.click(angeboteTab);

    await waitFor(() => {
      expect(screen.getByText('Angebot Management Component')).toBeInTheDocument();
    });
  });

  test('handles refresh button click', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();

    const refreshButton = screen.getByRole('button', { name: /Aktualisieren/i });
    
    // Clear mock calls
    api.get.mockClear();
    
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(3); // Should refetch all data
    });
  });

  test('displays error state when API calls fail', async () => {
    api.get.mockRejectedValue(new Error('API Error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Laden der Daten/i)).toBeInTheDocument();
    });
  });

  test('displays empty state when no data available', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Keine Daten verfügbar')).toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderComponent();

    expect(screen.getByRole('img', { hidden: true })).toHaveClass('animate-spin');
  });

  test('updates tab counts based on fetched data', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: mockInvoices } })
      .mockResolvedValueOnce({ data: { data: mockQuotes } })
      .mockResolvedValueOnce({ data: { data: mockExpenses } });

    renderComponent();

    await waitFor(() => {
      // Find the Rechnungen tab with count
      const rechnungenTab = screen.getByRole('button', { name: /Rechnungen/i });
      expect(rechnungenTab).toHaveTextContent('2'); // 2 invoices

      // Find the Angebote tab with count
      const angeboteTab = screen.getByRole('button', { name: /Angebote/i });
      expect(angeboteTab).toHaveTextContent('1'); // 1 quote

      // Find the Projektkosten tab with count
      const projektkostenTab = screen.getByRole('button', { name: /Projektkosten/i });
      expect(projektkostenTab).toHaveTextContent('2'); // 2 expenses
    });
  });
});
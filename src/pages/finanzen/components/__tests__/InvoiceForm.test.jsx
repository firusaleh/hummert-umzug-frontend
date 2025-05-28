import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import InvoiceForm from '../InvoiceForm';
import api from '../../../../services/api';

// Mock the API
vi.mock('../../../../services/api');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: null })
  };
});

const mockCustomers = [
  { _id: 'c1', name: 'Test Customer 1' },
  { _id: 'c2', name: 'Test Customer 2' }
];

const mockUmzuege = [
  { _id: 'u1', umzugsnummer: 'UMZ-2024-001', kundenname: 'Test Customer 1' },
  { _id: 'u2', umzugsnummer: 'UMZ-2024-002', kundenname: 'Test Customer 2' }
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <InvoiceForm />
    </BrowserRouter>
  );
};

describe('InvoiceForm', () => {
  beforeEach(() => {
    api.get.mockClear();
    api.post.mockClear();
    api.put.mockClear();
    mockNavigate.mockClear();
  });

  test('renders form with all required fields', async () => {
    api.get
      .mockResolvedValueOnce({ data: mockCustomers })
      .mockResolvedValueOnce({ data: { data: mockUmzuege } });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Neue Rechnung')).toBeInTheDocument();
      expect(screen.getByLabelText(/Rechnungsnummer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Kunde/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ausstellungsdatum/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fälligkeitsdatum/i)).toBeInTheDocument();
    });
  });

  test('loads customers and moves on mount', async () => {
    api.get
      .mockResolvedValueOnce({ data: mockCustomers })
      .mockResolvedValueOnce({ data: { data: mockUmzuege } });

    renderComponent();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/clients');
      expect(api.get).toHaveBeenCalledWith('/umzuege');
    });

    // Check if customers are loaded in select
    const customerSelect = screen.getByLabelText(/Kunde/i);
    expect(customerSelect).toContainHTML('Test Customer 1');
    expect(customerSelect).toContainHTML('Test Customer 2');
  });

  test('handles position addition and removal', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderComponent();

    // Initially has one position
    expect(screen.getAllByLabelText(/Bezeichnung/i)).toHaveLength(1);

    // Add a position
    const addButton = screen.getByRole('button', { name: /Position hinzufügen/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getAllByLabelText(/Bezeichnung/i)).toHaveLength(2);
    });

    // Remove button should appear when more than one position
    const removeButtons = screen.getAllByRole('button', { name: '' }).filter(
      button => button.querySelector('svg')
    );
    expect(removeButtons.length).toBeGreaterThan(0);

    // Remove a position
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByLabelText(/Bezeichnung/i)).toHaveLength(1);
    });
  });

  test('calculates totals correctly when position values change', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderComponent();

    const mengeInput = screen.getByLabelText(/Menge/i);
    const einzelpreisInput = screen.getByLabelText(/Einzelpreis/i);

    // Enter quantity and unit price
    fireEvent.change(mengeInput, { target: { value: '5' } });
    fireEvent.change(einzelpreisInput, { target: { value: '100' } });

    await waitFor(() => {
      // Check if line total is calculated (5 * 100 = 500)
      expect(screen.getByText(/500,00 €/)).toBeInTheDocument();
      
      // Check if subtotal is displayed
      expect(screen.getByText('Zwischensumme')).toBeInTheDocument();
      
      // Check if VAT is calculated (19% of 500 = 95)
      expect(screen.getByText(/MwSt \(19%\)/)).toBeInTheDocument();
      
      // Check if total is displayed (500 + 95 = 595)
      expect(screen.getByText(/595,00 €/)).toBeInTheDocument();
    });
  });

  test('submits form with correct data', async () => {
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({ data: { success: true } });

    renderComponent();

    // Fill form fields
    fireEvent.change(screen.getByLabelText(/Rechnungsnummer/i), {
      target: { value: 'RE-2024-001' }
    });

    const bezeichnungInput = screen.getByLabelText(/Bezeichnung/i);
    fireEvent.change(bezeichnungInput, {
      target: { value: 'Test Service' }
    });

    fireEvent.change(screen.getByLabelText(/Menge/i), {
      target: { value: '2' }
    });

    fireEvent.change(screen.getByLabelText(/Einzelpreis/i), {
      target: { value: '250' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Speichern/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/finanzen/rechnungen', expect.objectContaining({
        rechnungNummer: 'RE-2024-001',
        status: 'Entwurf',
        positionsliste: expect.arrayContaining([
          expect.objectContaining({
            bezeichnung: 'Test Service',
            menge: 2,
            einzelpreis: 250,
            gesamtpreis: 500
          })
        ])
      }));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/finanzen');
  });

  test('handles form submission errors', async () => {
    api.get.mockResolvedValue({ data: [] });
    api.post.mockRejectedValue(new Error('Server error'));

    renderComponent();

    // Fill minimum required fields
    fireEvent.change(screen.getByLabelText(/Rechnungsnummer/i), {
      target: { value: 'RE-2024-001' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Speichern/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Speichern der Rechnung/i)).toBeInTheDocument();
    });
  });

  test('navigates back on cancel', () => {
    api.get.mockResolvedValue({ data: [] });
    renderComponent();

    const cancelButton = screen.getByRole('button', { name: /Abbrechen/i });
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/finanzen');
  });

  test('handles status selection correctly', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderComponent();

    const statusSelect = screen.getByLabelText(/Status/i);
    
    // Check all status options are available
    expect(statusSelect).toContainHTML('Entwurf');
    expect(statusSelect).toContainHTML('Gesendet');
    expect(statusSelect).toContainHTML('Bezahlt');
    expect(statusSelect).toContainHTML('Überfällig');
    expect(statusSelect).toContainHTML('Teilbezahlt');
    expect(statusSelect).toContainHTML('Storniert');

    // Change status
    fireEvent.change(statusSelect, { target: { value: 'Gesendet' } });

    await waitFor(() => {
      expect(statusSelect.value).toBe('Gesendet');
    });
  });

  test('handles notes input', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderComponent();

    const notesTextarea = screen.getByPlaceholderText(/Zusätzliche Informationen/i);
    const testNotes = 'This is a test note for the invoice';

    fireEvent.change(notesTextarea, { target: { value: testNotes } });

    await waitFor(() => {
      expect(notesTextarea.value).toBe(testNotes);
    });
  });
});
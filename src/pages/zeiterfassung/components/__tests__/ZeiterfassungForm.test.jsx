import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ZeiterfassungForm from '../ZeiterfassungForm';
import api from '../../../../services/api';

// Mock the API
vi.mock('../../../../services/api');

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

const mockEntry = {
  _id: 't1',
  mitarbeiterId: 'e1',
  projektId: 'p1',
  datum: '2024-01-15',
  startzeit: '08:00',
  endzeit: '17:00',
  pause: 30,
  taetigkeit: 'Umzug durchführen',
  notizen: 'Test notes'
};

const mockOnClose = vi.fn();
const mockOnSubmit = vi.fn();

const renderComponent = (props = {}) => {
  return render(
    <ZeiterfassungForm
      entry={null}
      projects={mockProjects}
      employees={mockEmployees}
      onClose={mockOnClose}
      onSubmit={mockOnSubmit}
      {...props}
    />
  );
};

describe('ZeiterfassungForm', () => {
  beforeEach(() => {
    api.post.mockClear();
    api.put.mockClear();
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  test('renders form with all required fields', () => {
    renderComponent();
    
    expect(screen.getByText('Neuer Zeiteintrag')).toBeInTheDocument();
    expect(screen.getByLabelText(/Mitarbeiter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Projekt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Datum/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Startzeit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Endzeit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pause/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tätigkeit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notizen/i)).toBeInTheDocument();
  });

  test('loads entry data when editing', () => {
    renderComponent({ entry: mockEntry });
    
    expect(screen.getByText('Zeiteintrag bearbeiten')).toBeInTheDocument();
    expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('17:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Umzug durchführen')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
  });

  test('calculates working hours correctly', async () => {
    renderComponent();
    
    const startzeitInput = screen.getByLabelText(/Startzeit/i);
    const endzeitInput = screen.getByLabelText(/Endzeit/i);
    const pauseInput = screen.getByLabelText(/Pause/i);
    
    fireEvent.change(startzeitInput, { target: { value: '08:00' } });
    fireEvent.change(endzeitInput, { target: { value: '17:00' } });
    fireEvent.change(pauseInput, { target: { value: '60' } });
    
    await waitFor(() => {
      // 9 hours - 1 hour pause = 8 hours
      expect(screen.getByText(/8\.0 Stunden/)).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    renderComponent();
    
    const submitButton = screen.getByRole('button', { name: /Speichern/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Bitte wählen Sie einen Mitarbeiter aus/i)).toBeInTheDocument();
      expect(screen.getByText(/Bitte wählen Sie ein Projekt aus/i)).toBeInTheDocument();
      expect(screen.getByText(/Bitte geben Sie eine Startzeit an/i)).toBeInTheDocument();
      expect(screen.getByText(/Bitte geben Sie eine Endzeit an/i)).toBeInTheDocument();
      expect(screen.getByText(/Bitte beschreiben Sie die Tätigkeit/i)).toBeInTheDocument();
    });
  });

  test('validates that end time is after start time', async () => {
    renderComponent();
    
    const startzeitInput = screen.getByLabelText(/Startzeit/i);
    const endzeitInput = screen.getByLabelText(/Endzeit/i);
    
    fireEvent.change(startzeitInput, { target: { value: '17:00' } });
    fireEvent.change(endzeitInput, { target: { value: '08:00' } });
    
    const submitButton = screen.getByRole('button', { name: /Speichern/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Die Endzeit muss nach der Startzeit liegen/i)).toBeInTheDocument();
    });
  });

  test('submits form with correct data for new entry', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    renderComponent();
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/Mitarbeiter/i), { target: { value: 'e1' } });
    fireEvent.change(screen.getByLabelText(/Projekt/i), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText(/Startzeit/i), { target: { value: '08:00' } });
    fireEvent.change(screen.getByLabelText(/Endzeit/i), { target: { value: '17:00' } });
    fireEvent.change(screen.getByLabelText(/Pause/i), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/Tätigkeit/i), { target: { value: 'Test Tätigkeit' } });
    fireEvent.change(screen.getByLabelText(/Notizen/i), { target: { value: 'Test Notizen' } });
    
    const submitButton = screen.getByRole('button', { name: /Speichern/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/zeiterfassung', expect.objectContaining({
        mitarbeiterId: 'e1',
        projektId: 'p1',
        startzeit: '08:00',
        endzeit: '17:00',
        pause: 30,
        taetigkeit: 'Test Tätigkeit',
        notizen: 'Test Notizen',
        arbeitsstunden: 8.5
      }));
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  test('updates existing entry correctly', async () => {
    api.put.mockResolvedValue({ data: { success: true } });
    renderComponent({ entry: mockEntry });
    
    // Modify some fields
    fireEvent.change(screen.getByLabelText(/Endzeit/i), { target: { value: '18:00' } });
    fireEvent.change(screen.getByLabelText(/Tätigkeit/i), { target: { value: 'Updated Tätigkeit' } });
    
    const submitButton = screen.getByRole('button', { name: /Speichern/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/zeiterfassung/t1', expect.objectContaining({
        endzeit: '18:00',
        taetigkeit: 'Updated Tätigkeit',
        arbeitsstunden: 9.5 // Updated hours calculation
      }));
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  test('handles API errors gracefully', async () => {
    api.post.mockRejectedValue(new Error('API Error'));
    renderComponent();
    
    // Fill minimum required fields
    fireEvent.change(screen.getByLabelText(/Mitarbeiter/i), { target: { value: 'e1' } });
    fireEvent.change(screen.getByLabelText(/Projekt/i), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText(/Startzeit/i), { target: { value: '08:00' } });
    fireEvent.change(screen.getByLabelText(/Endzeit/i), { target: { value: '17:00' } });
    fireEvent.change(screen.getByLabelText(/Tätigkeit/i), { target: { value: 'Test' } });
    
    const submitButton = screen.getByRole('button', { name: /Speichern/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Fehler beim Speichern/i)).toBeInTheDocument();
    });
  });

  test('closes form on cancel', () => {
    renderComponent();
    
    const closeButton = screen.getByRole('button', { name: /Abbrechen/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes form on X button click', () => {
    renderComponent();
    
    const closeIcon = screen.getByRole('button', { name: '' }).closest('button');
    fireEvent.click(closeIcon);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('displays employee names in select options', () => {
    renderComponent();
    
    const mitarbeiterSelect = screen.getByLabelText(/Mitarbeiter/i);
    
    expect(mitarbeiterSelect).toContainHTML('Max Mustermann');
    expect(mitarbeiterSelect).toContainHTML('Anna Schmidt');
  });

  test('displays project names in select options', () => {
    renderComponent();
    
    const projektSelect = screen.getByLabelText(/Projekt/i);
    
    expect(projektSelect).toContainHTML('Test Kunde');
    expect(projektSelect).toContainHTML('Another Kunde');
  });

  test('shows loading state during submission', async () => {
    api.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderComponent();
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Mitarbeiter/i), { target: { value: 'e1' } });
    fireEvent.change(screen.getByLabelText(/Projekt/i), { target: { value: 'p1' } });
    fireEvent.change(screen.getByLabelText(/Startzeit/i), { target: { value: '08:00' } });
    fireEvent.change(screen.getByLabelText(/Endzeit/i), { target: { value: '17:00' } });
    fireEvent.change(screen.getByLabelText(/Tätigkeit/i), { target: { value: 'Test' } });
    
    const submitButton = screen.getByRole('button', { name: /Speichern/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/Speichern.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
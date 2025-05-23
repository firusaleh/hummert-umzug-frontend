// src/components/__tests__/ClientForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ClientForm from '../forms/ClientForm.fixed';
import api from '../../services/api';

jest.mock('../../services/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ClientForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    renderWithRouter(<ClientForm />);
    
    expect(screen.getByLabelText('Clientname *')).toBeInTheDocument();
    expect(screen.getByLabelText('Ansprechpartner')).toBeInTheDocument();
    expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Telefon')).toBeInTheDocument();
    expect(screen.getByLabelText('Straße')).toBeInTheDocument();
    expect(screen.getByLabelText('Stadt')).toBeInTheDocument();
    expect(screen.getByLabelText('PLZ')).toBeInTheDocument();
    expect(screen.getByLabelText('Land')).toBeInTheDocument();
  });

  it('shows validation errors', async () => {
    renderWithRouter(<ClientForm />);
    
    const nameInput = screen.getByLabelText('Clientname *');
    const submitButton = screen.getByText('Erstellen');
    
    // Submit empty form
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Clientname ist erforderlich')).toBeInTheDocument();
    });
    
    // Add invalid email
    const emailInput = screen.getByLabelText('E-Mail');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.getByText('Ungültige E-Mail-Adresse')).toBeInTheDocument();
    });
  });

  it('formats phone number as user types', () => {
    renderWithRouter(<ClientForm />);
    
    const phoneInput = screen.getByLabelText('Telefon');
    fireEvent.change(phoneInput, { target: { value: '0123456789' } });
    
    expect(phoneInput.value).toMatch(/\+49 123 456789/);
  });

  it('validates German zip code', async () => {
    renderWithRouter(<ClientForm />);
    
    const zipInput = screen.getByLabelText('PLZ');
    fireEvent.change(zipInput, { target: { value: '123' } });
    fireEvent.blur(zipInput);
    
    await waitFor(() => {
      expect(screen.getByText('Ungültige Postleitzahl (5 Ziffern)')).toBeInTheDocument();
    });
    
    fireEvent.change(zipInput, { target: { value: '12345' } });
    fireEvent.blur(zipInput);
    
    await waitFor(() => {
      expect(screen.queryByText('Ungültige Postleitzahl (5 Ziffern)')).not.toBeInTheDocument();
    });
  });

  it('loads client data when editing', () => {
    const mockClient = {
      _id: '123',
      name: 'Test Client',
      contactPerson: 'John Doe',
      email: 'test@example.com',
      phone: '+49 123 456789',
      address: {
        street: 'Test Street 1',
        city: 'Test City',
        zipCode: '12345',
        country: 'Deutschland'
      }
    };
    
    renderWithRouter(<ClientForm client={mockClient} isEditing={true} />);
    
    expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+49 123 456789')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Street 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test City')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument();
  });

  it('handles form submission for new client', async () => {
    api.client.create.mockResolvedValue({
      success: true,
      data: { _id: '123' }
    });
    
    const onSuccess = jest.fn();
    renderWithRouter(<ClientForm onSuccess={onSuccess} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Clientname *'), { 
      target: { value: 'New Client' } 
    });
    fireEvent.change(screen.getByLabelText('E-Mail'), { 
      target: { value: 'new@example.com' } 
    });
    
    // Submit
    fireEvent.click(screen.getByText('Erstellen'));
    
    await waitFor(() => {
      expect(api.client.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Client',
          email: 'new@example.com'
        })
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('handles form submission for editing', async () => {
    const mockClient = {
      _id: '123',
      name: 'Existing Client'
    };
    
    api.client.update.mockResolvedValue({
      success: true,
      data: mockClient
    });
    
    renderWithRouter(<ClientForm client={mockClient} isEditing={true} />);
    
    // Change name
    const nameInput = screen.getByLabelText('Clientname *');
    fireEvent.change(nameInput, { target: { value: 'Updated Client' } });
    
    // Submit
    fireEvent.click(screen.getByText('Aktualisieren'));
    
    await waitFor(() => {
      expect(api.client.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          name: 'Updated Client'
        })
      );
    });
  });

  it('displays error message on submission failure', async () => {
    api.client.create.mockResolvedValue({
      success: false,
      error: { message: 'Fehler beim Speichern' }
    });
    
    renderWithRouter(<ClientForm />);
    
    fireEvent.change(screen.getByLabelText('Clientname *'), { 
      target: { value: 'Test Client' } 
    });
    fireEvent.click(screen.getByText('Erstellen'));
    
    await waitFor(() => {
      expect(screen.getByText('Fehler beim Speichern')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    api.client.create.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<ClientForm />);
    
    fireEvent.change(screen.getByLabelText('Clientname *'), { 
      target: { value: 'Test Client' } 
    });
    
    const submitButton = screen.getByText('Erstellen');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Wird gespeichert...');
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    renderWithRouter(<ClientForm onCancel={onCancel} />);
    
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onCancel).toHaveBeenCalled();
  });
});
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Benachrichtigungen from '../Benachrichtigungen';
import api from '../../../services/api';

// Mock the API
vi.mock('../../../services/api');

// Mock the custom hooks
vi.mock('../../../hooks/useCursorPagination', () => ({
  default: () => ({
    items: mockNotifications,
    loading: false,
    error: null,
    hasMore: true,
    loadMore: vi.fn(),
    refresh: mockRefresh,
    changeFilters: mockChangeFilters
  })
}));

const mockNotifications = [
  {
    _id: '1',
    titel: 'Neue Umzugsanfrage',
    inhalt: 'Sie haben eine neue Umzugsanfrage erhalten',
    typ: 'info',
    gelesen: false,
    createdAt: new Date().toISOString(),
    bezug: { typ: 'umzug', id: 'u1' }
  },
  {
    _id: '2',
    titel: 'Zahlung eingegangen',
    inhalt: 'Die Zahlung für Rechnung RE-2024-001 ist eingegangen',
    typ: 'erfolg',
    gelesen: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    linkUrl: '/finanzen/rechnungen/1'
  },
  {
    _id: '3',
    titel: 'Dokument fehlt',
    inhalt: 'Bitte laden Sie die fehlenden Dokumente hoch',
    typ: 'warnung',
    gelesen: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    bezug: { typ: 'aufnahme', id: 'a1' }
  }
];

const mockRefresh = vi.fn();
const mockChangeFilters = vi.fn();

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <Benachrichtigungen />
    </BrowserRouter>
  );
};

describe('Benachrichtigungen', () => {
  beforeEach(() => {
    api.put.mockClear();
    api.delete.mockClear();
    mockRefresh.mockClear();
    mockChangeFilters.mockClear();
  });

  test('renders notification list with header', () => {
    renderComponent();
    
    expect(screen.getByText('Benachrichtigungen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Alle als gelesen markieren/i })).toBeInTheDocument();
  });

  test('displays notifications with correct styling', () => {
    renderComponent();
    
    // Check unread notification has blue background
    const unreadNotification = screen.getByText('Neue Umzugsanfrage').closest('div').parentElement.parentElement;
    expect(unreadNotification).toHaveClass('bg-blue-50');
    
    // Check read notification doesn't have blue background
    const readNotification = screen.getByText('Zahlung eingegangen').closest('div').parentElement.parentElement;
    expect(readNotification).not.toHaveClass('bg-blue-50');
  });

  test('displays correct icons for notification types', () => {
    renderComponent();
    
    // Info type should have Bell icon
    expect(screen.getByText('Neue Umzugsanfrage').closest('div').parentElement.querySelector('svg')).toBeInTheDocument();
    
    // Success type should have CheckCircle icon
    expect(screen.getByText('Zahlung eingegangen').closest('div').parentElement.querySelector('svg')).toBeInTheDocument();
    
    // Warning type should have AlertTriangle icon
    expect(screen.getByText('Dokument fehlt').closest('div').parentElement.querySelector('svg')).toBeInTheDocument();
  });

  test('formats dates correctly', () => {
    renderComponent();
    
    // Today's notification
    expect(screen.getByText(/Heute,/)).toBeInTheDocument();
    
    // Yesterday's notification
    expect(screen.getByText(/Gestern,/)).toBeInTheDocument();
  });

  test('shows link for notifications with linkUrl', () => {
    renderComponent();
    
    const detailsLink = screen.getByText('Details anzeigen →');
    expect(detailsLink).toBeInTheDocument();
    expect(detailsLink).toHaveAttribute('href', '/finanzen/rechnungen/1');
  });

  test('marks individual notification as read', async () => {
    api.put.mockResolvedValue({ data: { success: true } });
    renderComponent();
    
    // Find the mark as read button for the first unread notification
    const markAsReadButtons = screen.getAllByTitle('Als gelesen markieren');
    fireEvent.click(markAsReadButtons[0]);
    
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/benachrichtigungen/1/gelesen');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('marks all notifications as read', async () => {
    api.put.mockResolvedValue({ data: { success: true } });
    renderComponent();
    
    const markAllButton = screen.getByRole('button', { name: /Alle als gelesen markieren/i });
    fireEvent.click(markAllButton);
    
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/benachrichtigungen/alle-gelesen');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('deletes notification', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    renderComponent();
    
    const deleteButtons = screen.getAllByTitle('Löschen');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/benachrichtigungen/1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  test('filters notifications by search term', async () => {
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText('Suchen...');
    fireEvent.change(searchInput, { target: { value: 'Umzug' } });
    
    await waitFor(() => {
      expect(mockChangeFilters).toHaveBeenCalledWith(expect.objectContaining({
        search: 'Umzug'
      }));
    });
  });

  test('filters notifications by type', async () => {
    renderComponent();
    
    const typeSelect = screen.getByLabelText(/Typ filtern/i);
    fireEvent.change(typeSelect, { target: { value: 'info' } });
    
    await waitFor(() => {
      expect(mockChangeFilters).toHaveBeenCalledWith(expect.objectContaining({
        typ: 'info'
      }));
    });
  });

  test('filters notifications by status', async () => {
    renderComponent();
    
    const statusSelect = screen.getByLabelText(/Status filtern/i);
    fireEvent.change(statusSelect, { target: { value: 'ungelesen' } });
    
    await waitFor(() => {
      expect(mockChangeFilters).toHaveBeenCalledWith(expect.objectContaining({
        gelesen: false
      }));
    });
  });

  test('switches between view modes', () => {
    renderComponent();
    
    const viewModeSelect = screen.getByLabelText(/Anzeigemodus/i);
    expect(viewModeSelect.value).toBe('infinite');
    
    fireEvent.change(viewModeSelect, { target: { value: 'loadmore' } });
    expect(viewModeSelect.value).toBe('loadmore');
  });

  test('displays reference information when available', () => {
    renderComponent();
    
    expect(screen.getByText('Bezug: umzug')).toBeInTheDocument();
    expect(screen.getByText('Bezug: aufnahme')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    api.put.mockRejectedValue(new Error('API Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderComponent();
    
    const markAsReadButton = screen.getAllByTitle('Als gelesen markieren')[0];
    fireEvent.click(markAsReadButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error marking notification as read:',
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });
});
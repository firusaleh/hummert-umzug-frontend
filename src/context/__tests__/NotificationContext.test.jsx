import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import { AuthContext } from '../AuthContext';
import { notificationService } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  notificationService: {
    getAll: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
    deleteAllRead: vi.fn(),
    getSettings: vi.fn(),
    updateSettings: vi.fn()
  }
}));

const mockUser = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com'
};

const mockNotifications = [
  {
    _id: '1',
    titel: 'Test Notification 1',
    inhalt: 'Test content 1',
    typ: 'info',
    gelesen: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    titel: 'Test Notification 2',
    inhalt: 'Test content 2',
    typ: 'erfolg',
    gelesen: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: '3',
    titel: 'Test Notification 3',
    inhalt: 'Test content 3',
    typ: 'warnung',
    gelesen: false,
    createdAt: new Date().toISOString()
  }
];

// Test component that uses the notification context
const TestComponent = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refreshNotifications
  } = useNotifications();

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="notification-count">{notifications.length}</div>
      <button onClick={() => fetchNotifications()}>Fetch</button>
      <button onClick={() => markAsRead('1')}>Mark Read</button>
      <button onClick={() => markAllAsRead()}>Mark All Read</button>
      <button onClick={() => deleteNotification('1')}>Delete</button>
      <button onClick={() => deleteAllRead()}>Delete All Read</button>
      <button onClick={() => refreshNotifications()}>Refresh</button>
      {notifications.map(n => (
        <div key={n._id} data-testid={`notification-${n._id}`}>
          {n.titel} - {n.gelesen ? 'read' : 'unread'}
        </div>
      ))}
    </div>
  );
};

const renderWithProvider = (user = mockUser) => {
  return render(
    <AuthContext.Provider value={{ user }}>
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    </AuthContext.Provider>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('provides initial state', () => {
    renderWithProvider();
    
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    expect(screen.getByTestId('notification-count')).toHaveTextContent('0');
  });

  test('fetches notifications successfully', async () => {
    notificationService.getAll.mockResolvedValue({
      data: { notifications: mockNotifications }
    });

    renderWithProvider();
    
    const fetchButton = screen.getByText('Fetch');
    
    await act(async () => {
      fetchButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('3');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
      expect(screen.getByTestId('notification-1')).toHaveTextContent('Test Notification 1 - unread');
      expect(screen.getByTestId('notification-2')).toHaveTextContent('Test Notification 2 - read');
    });
  });

  test('handles fetch error', async () => {
    const errorMessage = 'Failed to fetch';
    notificationService.getAll.mockRejectedValue({
      response: { data: { message: errorMessage } }
    });

    renderWithProvider();
    
    const fetchButton = screen.getByText('Fetch');
    
    await act(async () => {
      fetchButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });
  });

  test('marks notification as read', async () => {
    notificationService.getAll.mockResolvedValue({
      data: { notifications: mockNotifications }
    });
    notificationService.markAsRead.mockResolvedValue({ data: { success: true } });

    renderWithProvider();
    
    // First fetch notifications
    await act(async () => {
      screen.getByText('Fetch').click();
    });

    // Then mark as read
    await act(async () => {
      screen.getByText('Mark Read').click();
    });

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith('1', true);
    });
  });

  test('marks all notifications as read', async () => {
    notificationService.getAll.mockResolvedValue({
      data: { notifications: mockNotifications }
    });
    notificationService.markAllAsRead.mockResolvedValue({ data: { success: true } });

    renderWithProvider();
    
    // First fetch notifications
    await act(async () => {
      screen.getByText('Fetch').click();
    });

    // Then mark all as read
    await act(async () => {
      screen.getByText('Mark All Read').click();
    });

    await waitFor(() => {
      expect(notificationService.markAllAsRead).toHaveBeenCalled();
    });
  });

  test('deletes notification', async () => {
    notificationService.getAll.mockResolvedValue({
      data: { notifications: mockNotifications }
    });
    notificationService.delete.mockResolvedValue({ data: { success: true } });

    renderWithProvider();
    
    // First fetch notifications
    await act(async () => {
      screen.getByText('Fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('3');
    });

    // Then delete
    await act(async () => {
      screen.getByText('Delete').click();
    });

    await waitFor(() => {
      expect(notificationService.delete).toHaveBeenCalledWith('1');
    });
  });

  test('deletes all read notifications', async () => {
    notificationService.getAll.mockResolvedValue({
      data: { notifications: mockNotifications }
    });
    notificationService.deleteAllRead.mockResolvedValue({ data: { success: true } });

    renderWithProvider();
    
    // First fetch notifications
    await act(async () => {
      screen.getByText('Fetch').click();
    });

    // Then delete all read
    await act(async () => {
      screen.getByText('Delete All Read').click();
    });

    await waitFor(() => {
      expect(notificationService.deleteAllRead).toHaveBeenCalled();
    });
  });

  test('does not fetch when no user is present', async () => {
    renderWithProvider(null);
    
    const fetchButton = screen.getByText('Fetch');
    
    await act(async () => {
      fetchButton.click();
    });

    expect(notificationService.getAll).not.toHaveBeenCalled();
  });

  test('refreshes notifications', async () => {
    notificationService.getAll.mockResolvedValue({
      data: { notifications: mockNotifications }
    });

    renderWithProvider();
    
    const refreshButton = screen.getByText('Refresh');
    
    await act(async () => {
      refreshButton.click();
    });

    await waitFor(() => {
      expect(notificationService.getAll).toHaveBeenCalled();
      expect(screen.getByTestId('notification-count')).toHaveTextContent('3');
    });
  });

  test('calculates unread count correctly', async () => {
    notificationService.getAll.mockResolvedValue({
      data: { notifications: mockNotifications }
    });

    renderWithProvider();
    
    await act(async () => {
      screen.getByText('Fetch').click();
    });

    await waitFor(() => {
      // 2 notifications are unread (id: 1 and 3)
      expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
    });
  });

  test('handles notification service errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    notificationService.getAll.mockRejectedValue(new Error('Network error'));

    renderWithProvider();
    
    await act(async () => {
      screen.getByText('Fetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Fehler beim Laden der Benachrichtigungen');
    });

    consoleErrorSpy.mockRestore();
  });

  test('throws error when used outside provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNotifications must be used within a NotificationProvider');

    consoleErrorSpy.mockRestore();
  });
});
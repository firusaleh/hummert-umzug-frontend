// src/components/__tests__/MainLayout.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.fixed';
import { AuthContext } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';
import { NotificationContext } from '../../context/NotificationContext';

const mockLogout = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const MockProviders = ({ children, authValue, appValue, notificationValue }) => (
  <AuthContext.Provider value={authValue}>
    <AppContext.Provider value={appValue}>
      <NotificationContext.Provider value={notificationValue}>
        <MemoryRouter initialEntries={['/dashboard']}>
          {children}
        </MemoryRouter>
      </NotificationContext.Provider>
    </AppContext.Provider>
  </AuthContext.Provider>
);

describe('MainLayout', () => {
  const defaultAuthValue = {
    user: { name: 'Test User', permissions: ['umzuege.view'] },
    logout: mockLogout
  };
  
  const defaultAppValue = {
    sidebarOpen: true,
    setSidebarOpen: jest.fn(),
    theme: 'light'
  };
  
  const defaultNotificationValue = {
    notifications: [],
    unreadCount: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation items based on permissions', () => {
    render(
      <MockProviders
        authValue={defaultAuthValue}
        appValue={defaultAppValue}
        notificationValue={defaultNotificationValue}
      >
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MockProviders>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Umzüge')).toBeInTheDocument();
    expect(screen.queryByText('Mitarbeiter')).not.toBeInTheDocument();
  });

  it('toggles sidebar on click', () => {
    const setSidebarOpen = jest.fn();
    render(
      <MockProviders
        authValue={defaultAuthValue}
        appValue={{ ...defaultAppValue, setSidebarOpen }}
        notificationValue={defaultNotificationValue}
      >
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MockProviders>
    );

    const toggleButton = screen.getByLabelText('Sidebar zuklappen');
    fireEvent.click(toggleButton);
    expect(setSidebarOpen).toHaveBeenCalledWith(false);
  });

  it('displays user initials in avatar', () => {
    render(
      <MockProviders
        authValue={defaultAuthValue}
        appValue={defaultAppValue}
        notificationValue={defaultNotificationValue}
      >
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MockProviders>
    );

    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('shows notification count', () => {
    render(
      <MockProviders
        authValue={defaultAuthValue}
        appValue={defaultAppValue}
        notificationValue={{ ...defaultNotificationValue, unreadCount: 5 }}
      >
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MockProviders>
    );

    expect(screen.getAllByText('5')).toHaveLength(2); // In nav and header
  });

  it('handles logout correctly', async () => {
    render(
      <MockProviders
        authValue={defaultAuthValue}
        appValue={defaultAppValue}
        notificationValue={defaultNotificationValue}
      >
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MockProviders>
    );

    const logoutButton = screen.getByLabelText('Abmelden');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('highlights active navigation item', () => {
    render(
      <MockProviders
        authValue={defaultAuthValue}
        appValue={defaultAppValue}
        notificationValue={defaultNotificationValue}
      >
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MockProviders>
    );

    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(dashboardLink).toHaveClass('bg-blue-800');
  });

  it('handles mobile view', () => {
    global.innerWidth = 500;
    global.dispatchEvent(new Event('resize'));

    render(
      <MockProviders
        authValue={defaultAuthValue}
        appValue={defaultAppValue}
        notificationValue={defaultNotificationValue}
      >
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MockProviders>
    );

    expect(screen.getByLabelText('Menü öffnen')).toBeInTheDocument();
  });

  it('shows all navigation items for admin user', () => {
    const adminUser = {
      ...defaultAuthValue,
      user: {
        name: 'Admin User',
        permissions: [
          'umzuege.view',
          'aufnahmen.view',
          'mitarbeiter.view',
          'zeitachse.view'
        ]
      }
    };

    render(
      <MockProviders
        authValue={adminUser}
        appValue={defaultAppValue}
        notificationValue={defaultNotificationValue}
      >
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MockProviders>
    );

    expect(screen.getByText('Umzüge')).toBeInTheDocument();
    expect(screen.getByText('Aufnahmen')).toBeInTheDocument();
    expect(screen.getByText('Mitarbeiter')).toBeInTheDocument();
    expect(screen.getByText('Zeitachse')).toBeInTheDocument();
  });

  it('applies dark theme when enabled', () => {
    render(
      <MockProviders
        authValue={defaultAuthValue}
        appValue={{ ...defaultAppValue, theme: 'dark' }}
        notificationValue={defaultNotificationValue}
      >
        <MainLayout>
          <div>Test Content</div>
        </MainLayout>
      </MockProviders>
    );

    const root = screen.getByText('Test Content').closest('.flex.h-screen');
    expect(root).toHaveClass('dark');
  });

  it('hides navigation when hideNavigation prop is true', () => {
    render(
      <MockProviders
        authValue={defaultAuthValue}
        appValue={defaultAppValue}
        notificationValue={defaultNotificationValue}
      >
        <MainLayout hideNavigation>
          <div>Test Content</div>
        </MainLayout>
      </MockProviders>
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
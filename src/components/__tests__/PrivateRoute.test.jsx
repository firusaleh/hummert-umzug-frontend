// src/components/__tests__/PrivateRoute.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from '../common/PrivateRoute.fixed';
import { AuthContext } from '../../context/AuthContext';

const MockAuthProvider = ({ children, value }) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;
const UnauthorizedComponent = () => <div>Unauthorized</div>;

describe('PrivateRoute', () => {
  const renderWithRouter = (authValue, privateRouteProps = {}) => {
    return render(
      <MockAuthProvider value={authValue}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<PrivateRoute {...privateRouteProps} />}>
              <Route path="/protected" element={<TestComponent />} />
            </Route>
            <Route path="/login" element={<LoginComponent />} />
            <Route path="/unauthorized" element={<UnauthorizedComponent />} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
  };

  it('shows loading state when auth is loading', () => {
    renderWithRouter({ loading: true, isAuthenticated: false });
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    renderWithRouter({ loading: false, isAuthenticated: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows protected content when authenticated', () => {
    renderWithRouter({ loading: false, isAuthenticated: true });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('uses custom redirect path', () => {
    render(
      <MockAuthProvider value={{ loading: false, isAuthenticated: false }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<PrivateRoute redirectTo="/custom-login" />}>
              <Route path="/protected" element={<TestComponent />} />
            </Route>
            <Route path="/custom-login" element={<div>Custom Login</div>} />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    expect(screen.getByText('Custom Login')).toBeInTheDocument();
  });

  it('shows custom fallback component while loading', () => {
    const fallback = <div>Custom Loading</div>;
    renderWithRouter({ loading: true }, { fallback });
    expect(screen.getByText('Custom Loading')).toBeInTheDocument();
  });

  it('checks role-based access', () => {
    const authWithAdminRole = {
      loading: false,
      isAuthenticated: true,
      user: { role: 'admin' }
    };
    renderWithRouter(authWithAdminRole, { roles: ['admin'] });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to unauthorized when user lacks required role', () => {
    const authWithUserRole = {
      loading: false,
      isAuthenticated: true,
      user: { role: 'user' }
    };
    renderWithRouter(authWithUserRole, { roles: ['admin'] });
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });

  it('checks multiple roles', () => {
    const authWithUserRole = {
      loading: false,
      isAuthenticated: true,
      user: { roles: ['user', 'editor'] }
    };
    renderWithRouter(authWithUserRole, { roles: ['admin', 'editor'] });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('checks permission-based access', () => {
    const authWithPermissions = {
      loading: false,
      isAuthenticated: true,
      user: { permissions: ['read', 'write'] }
    };
    renderWithRouter(authWithPermissions, { permissions: ['write'] });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when user lacks required permissions', () => {
    const authWithLimitedPermissions = {
      loading: false,
      isAuthenticated: true,
      user: { permissions: ['read'] }
    };
    renderWithRouter(authWithLimitedPermissions, { permissions: ['write', 'delete'] });
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });

  it('preserves location state on redirect', () => {
    const authValue = { loading: false, isAuthenticated: false };
    
    render(
      <MockAuthProvider value={authValue}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<PrivateRoute />}>
              <Route path="/protected" element={<TestComponent />} />
            </Route>
            <Route 
              path="/login" 
              element={
                <Route.Consumer>
                  {({ location }) => (
                    <div>
                      Login Page
                      {location.state?.from && (
                        <span>From: {location.state.from.pathname}</span>
                      )}
                    </div>
                  )}
                </Route.Consumer>
              } 
            />
          </Routes>
        </MemoryRouter>
      </MockAuthProvider>
    );
    
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
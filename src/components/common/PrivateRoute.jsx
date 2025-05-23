// src/components/common/PrivateRoute.fixed.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PropTypes from 'prop-types';

const PrivateRoute = ({ 
  redirectTo = '/login',
  fallback = null,
  roles = [],
  permissions = []
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Loading state
  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (roles.length > 0 && user) {
    const hasRequiredRole = roles.some(role => 
      user.roles?.includes(role) || user.role === role
    );
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission-based access
  if (permissions.length > 0 && user) {
    const hasRequiredPermission = permissions.some(permission => 
      user.permissions?.includes(permission)
    );
    
    if (!hasRequiredPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Render protected content
  return <Outlet />;
};

PrivateRoute.propTypes = {
  redirectTo: PropTypes.string,
  fallback: PropTypes.element,
  roles: PropTypes.arrayOf(PropTypes.string),
  permissions: PropTypes.arrayOf(PropTypes.string)
};

export default PrivateRoute;
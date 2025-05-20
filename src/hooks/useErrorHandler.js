import { useState, useCallback } from 'react';
import { formatApiError, groupErrorsByField, logError } from '../utils/errorHandler';

/**
 * Custom hook for standardized error handling in components
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.onAuthError - Callback for authentication errors
 * @returns {Object} - Error handling utilities
 */
const useErrorHandler = (options = {}) => {
  // General error message (for non-field-specific errors)
  const [error, setError] = useState(null);
  
  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Clear all errors
  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);
  
  // Clear a specific field error
  const clearFieldError = useCallback((field) => {
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);
  
  // Handle API errors with proper formatting
  const handleApiError = useCallback((operation, error, defaultMessage) => {
    // Log the error safely
    logError(operation, error);
    
    // Format the error consistently
    const formattedError = formatApiError(error, defaultMessage);
    
    // Check for authentication errors
    if (formattedError.status === 401 && options.onAuthError) {
      options.onAuthError(formattedError);
      return formattedError;
    }
    
    // Set general error message
    setError(formattedError.message);
    
    // Set field-specific errors if available
    if (formattedError.errors && Array.isArray(formattedError.errors)) {
      setFieldErrors(groupErrorsByField(formattedError.errors));
    }
    
    return formattedError;
  }, [options.onAuthError]);
  
  // Set a custom form field error
  const setFieldError = useCallback((field, message) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: message
    }));
  }, []);
  
  // Check if has any errors
  const hasErrors = error !== null || Object.keys(fieldErrors).length > 0;
  
  return {
    error,
    fieldErrors,
    setError,
    setFieldError,
    clearErrors,
    clearFieldError,
    handleApiError,
    hasErrors
  };
};

export default useErrorHandler;

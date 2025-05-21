/**
 * errorHandler.js - Standardized frontend error handling utilities
 * Provides consistent error handling throughout the frontend application
 */

/**
 * Safely log errors without exposing sensitive data
 * @param {String} operation - The operation that failed
 * @param {Error} error - The error object
 * @param {Object} context - Additional context (optional)
 */
export const logError = (operation, error, context = {}) => {
  // Create safe context object without sensitive data
  const safeContext = { ...context };
  
  // Remove potentially sensitive data
  if (safeContext.credentials) delete safeContext.credentials;
  if (safeContext.password) delete safeContext.password;
  if (safeContext.token) delete safeContext.token;
  if (safeContext.accessToken) delete safeContext.accessToken;
  
  // Construct safe error log
  const errorInfo = {
    operation,
    endpoint: error.config?.url || 'unknown',
    method: error.config?.method || 'unknown',
    status: error.response?.status || 0,
    statusText: error.response?.statusText || 'unknown',
    message: error.message || 'No error message',
    context: safeContext
  };
  
  // Log the safe error object
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error details:', errorInfo);
    // In development, also log the full error for debugging
    console.error('Full error:', error);
  } else {
    // In production, only log sanitized info
    console.error('Error:', errorInfo);
  }
};

/**
 * Format API error into a standardized structure
 * @param {Error} error - The axios error object
 * @param {String} defaultMessage - Default user-friendly message
 * @returns {Object} - Standardized error object
 */
export const formatApiError = (error, defaultMessage = 'Ein Fehler ist aufgetreten') => {
  // Log the complete error object for debugging
  console.error('Complete error object:', error);
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
  }

  // Default error response
  const formattedError = {
    success: false,
    message: defaultMessage,
    errors: null,
    status: 0,
    isNetworkError: !error.response
  };
  
  // If we have a response from the server
  if (error.response) {
    const { status, data } = error.response;
    formattedError.status = status;
    
    // Handle different status codes with appropriate messages
    if (status === 400) {
      formattedError.message = data?.message || 'Ungültige Anfrage';
      formattedError.errors = data?.errors || null;
      
      // For debugging validation errors
      console.error('400 Bad Request Details:', {
        message: data?.message,
        errors: data?.errors,
        validationError: data?.validationError,
        fullData: data
      });
    } else if (status === 401) {
      formattedError.message = 'Sitzung abgelaufen oder nicht angemeldet';
      // Don't pass auth errors back to component
    } else if (status === 403) {
      formattedError.message = 'Keine Berechtigung für diese Aktion';
    } else if (status === 404) {
      formattedError.message = data?.message || 'Ressource nicht gefunden';
    } else if (status === 422) {
      formattedError.message = 'Validierungsfehler';
      formattedError.errors = data?.errors || null;
    } else if (status >= 500) {
      formattedError.message = 'Serverfehler. Bitte versuchen Sie es später erneut.';
    } else {
      // For other status codes, use server message if available
      formattedError.message = data?.message || defaultMessage;
      formattedError.errors = data?.errors || null;
    }
  } else if (error.request) {
    // Request was made but no response received
    formattedError.message = 'Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung.';
    formattedError.isNetworkError = true;
  }
  
  return formattedError;
};

/**
 * Group validation errors by field for form display
 * @param {Array} errors - Array of error objects from the API
 * @returns {Object} - Errors grouped by field name
 */
export const groupErrorsByField = (errors) => {
  if (!errors || !Array.isArray(errors)) return {};
  
  return errors.reduce((grouped, error) => {
    if (error.field) {
      grouped[error.field] = error.message;
    } else if (error.param) {
      // Support express-validator format
      grouped[error.param] = error.msg || 'Ungültige Eingabe';
    }
    return grouped;
  }, {});
};

/**
 * Extract general (non-field) errors from error array
 * @param {Array} errors - Array of error objects from the API
 * @returns {Array} - Array of general error messages
 */
export const extractGeneralErrors = (errors) => {
  if (!errors || !Array.isArray(errors)) return [];
  
  return errors
    .filter(error => !error.field && !error.param)
    .map(error => error.message || error.msg || 'Ein Fehler ist aufgetreten');
};

/**
 * Check if an error is a network connectivity issue
 * @param {Error} error - The error to check
 * @returns {Boolean} - True if it's a network error
 */
export const isNetworkError = (error) => {
  return (
    (!error.response && error.request) || // No response received
    error.code === 'ECONNABORTED' || // Timeout
    error.message.includes('Network Error') // Explicit network error
  );
};

/**
 * Check if an error is an authentication error
 * @param {Error} error - The error to check
 * @returns {Boolean} - True if it's an authentication error
 */
export const isAuthError = (error) => {
  return error.response && error.response.status === 401;
};

const errorHandler = {
  logError,
  formatApiError,
  groupErrorsByField,
  extractGeneralErrors,
  isNetworkError,
  isAuthError
};

export default errorHandler;
/**
 * Utilities for handling API data in a consistent way
 */

/**
 * Extracts array data from various API response structures
 * @param {Object|Array} data - The response data to process
 * @param {Array<string>} possibleKeys - Possible object keys that might contain array data
 * @param {Array} defaultValue - Default value to return if no array data is found
 * @returns {Array} - The extracted array data or default value
 */
export const extractArrayData = (data, possibleKeys = [], defaultValue = []) => {
  // Handle null or undefined
  if (!data) return defaultValue;
  
  // Already an array
  if (Array.isArray(data)) return data;
  
  // Check if data is an error response
  if (data.success === false) {
    console.warn('Error response received:', data.message || 'Unknown error');
    return defaultValue;
  }
  
  // Common keys to check in data object
  const keysToCheck = [
    'data', 
    'items', 
    'results', 
    ...possibleKeys
  ];
  
  // Check each key in order
  for (const key of keysToCheck) {
    if (data[key]) {
      if (Array.isArray(data[key])) {
        return data[key];
      } else if (typeof data[key] === 'object') {
        // If the key exists but isn't an array, check one level deeper
        for (const nestedKey of keysToCheck) {
          if (data[key][nestedKey] && Array.isArray(data[key][nestedKey])) {
            return data[key][nestedKey];
          }
        }
      }
    }
  }
  
  console.warn('Could not extract array data from response:', data);
  return defaultValue;
};

/**
 * Checks if a response is an error response
 * @param {Object} response - The API response to check
 * @returns {boolean} - True if the response is an error
 */
export const isErrorResponse = (response) => {
  if (!response) return true;
  if (response.success === false) return true;
  if (response.error) return true;
  return false;
};

/**
 * Gets error message from a response
 * @param {Object} response - The API response
 * @param {string} defaultMessage - Default message if no error message is found
 * @returns {string} - The error message
 */
export const getErrorMessage = (response, defaultMessage = 'Ein unbekannter Fehler ist aufgetreten') => {
  if (!response) return defaultMessage;
  
  if (response.message) return response.message;
  if (response.error && typeof response.error === 'string') return response.error;
  if (response.error && response.error.message) return response.error.message;
  
  return defaultMessage;
};

/**
 * Standardizes an API response into a consistent format
 * @param {Object|Array} response - The API response to standardize
 * @param {Object} options - Options for standardization
 * @returns {Object} - Standardized response with { success, data, message, errors }
 */
export const standardizeResponse = (response, options = {}) => {
  const { defaultData = [], defaultMessage = '' } = options;
  
  // Handle null or undefined
  if (!response) {
    return {
      success: false,
      data: defaultData,
      message: 'Keine Daten erhalten',
      errors: null
    };
  }
  
  // Already standardized response
  if (response.hasOwnProperty('success') && 
      (response.hasOwnProperty('data') || response.hasOwnProperty('message'))) {
    return {
      success: !!response.success,
      data: response.data || defaultData,
      message: response.message || defaultMessage,
      errors: response.errors || null
    };
  }
  
  // Error object
  if (response instanceof Error) {
    return {
      success: false,
      data: defaultData,
      message: response.message || 'Ein Fehler ist aufgetreten',
      errors: null
    };
  }
  
  // Array data
  if (Array.isArray(response)) {
    return {
      success: true,
      data: response,
      message: defaultMessage,
      errors: null
    };
  }
  
  // Object data without success flag - assume success
  return {
    success: true,
    data: response,
    message: defaultMessage,
    errors: null
  };
};
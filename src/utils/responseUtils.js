// Utility functions for safely extracting data from API responses

/**
 * Safely extracts array data from various API response formats
 * @param {any} response - The API response
 * @returns {Array} - Always returns an array, empty if no data found
 */
export const extractArrayData = (response) => {
  // Handle null/undefined
  if (!response) {
    return [];
  }

  // Check for nested paginated response: { data: { data: [...], pagination: {...} } }
  if (response?.data?.data) {
    return Array.isArray(response.data.data) ? response.data.data : [];
  }

  // Check for simple data response: { data: [...] }
  if (response?.data) {
    return Array.isArray(response.data) ? response.data : [];
  }

  // Check for success wrapper: { success: true, data: [...] }
  if (response?.success && response?.data) {
    return Array.isArray(response.data) ? response.data : [];
  }

  // Check if response itself is an array
  if (Array.isArray(response)) {
    return response;
  }

  // Check for other common response patterns
  // Backend sometimes returns data in different fields
  const possibleFields = ['items', 'results', 'records', 'mitarbeiter', 'umzuege', 'aufnahmen'];
  
  for (const field of possibleFields) {
    if (response?.[field] && Array.isArray(response[field])) {
      return response[field];
    }
  }

  // If nothing matches, return empty array
  return [];
};

/**
 * Safely extracts pagination info from API response
 * @param {any} response - The API response
 * @returns {Object} - Pagination info with defaults
 */
export const extractPaginationInfo = (response) => {
  const defaults = {
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  };

  if (!response) {
    return defaults;
  }

  // Check for nested pagination
  if (response?.data?.pagination) {
    return { ...defaults, ...response.data.pagination };
  }

  // Check for direct pagination
  if (response?.pagination) {
    return { ...defaults, ...response.pagination };
  }

  // Check for meta field
  if (response?.meta) {
    return { ...defaults, ...response.meta };
  }

  return defaults;
};

/**
 * Ensures a value is an array
 * @param {any} value - The value to check
 * @returns {Array} - Always returns an array
 */
export const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
};

/**
 * Safely slices an array with validation
 * @param {any} array - The array to slice
 * @param {number} start - Start index
 * @param {number} end - End index
 * @returns {Array} - Sliced array or empty array
 */
export const safeSlice = (array, start, end) => {
  if (!Array.isArray(array)) {
    return [];
  }
  return array.slice(start, end);
};
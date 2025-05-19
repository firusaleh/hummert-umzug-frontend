// src/services/utils.js

// Date utilities
export const dateUtils = {
  // Format date to German format (DD.MM.YYYY)
  formatDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  },
  
  // Format date to ISO format for API
  toISOString: (date) => {
    if (!date) return null;
    return new Date(date).toISOString();
  },
  
  // Parse German date format to Date object
  parseGermanDate: (dateString) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split('.');
    return new Date(`${year}-${month}-${day}`);
  },
  
  // Format datetime to German format
  formatDateTime: (date) => {
    if (!date) return '';
    const d = new Date(date);
    const formattedDate = dateUtils.formatDate(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${formattedDate} ${hours}:${minutes}`;
  },
  
  // Get relative time (e.g., "vor 5 Minuten")
  getRelativeTime: (date) => {
    if (!date) return '';
    
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) {
      return 'gerade eben';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `vor ${diffInMinutes} ${diffInMinutes === 1 ? 'Minute' : 'Minuten'}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `vor ${diffInHours} ${diffInHours === 1 ? 'Stunde' : 'Stunden'}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `vor ${diffInDays} ${diffInDays === 1 ? 'Tag' : 'Tagen'}`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `vor ${diffInMonths} ${diffInMonths === 1 ? 'Monat' : 'Monaten'}`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `vor ${diffInYears} ${diffInYears === 1 ? 'Jahr' : 'Jahren'}`;
  },
  
  // Get days between two dates
  getDaysBetween: (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },
  
  // Check if date is in past
  isPast: (date) => {
    return new Date(date) < new Date();
  },
  
  // Check if date is today
  isToday: (date) => {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
  },
};

// Number utilities
export const numberUtils = {
  // Format number as currency (EUR)
  formatCurrency: (amount, decimals = 2) => {
    if (amount === null || amount === undefined) return '';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  },
  
  // Format number with thousands separator
  formatNumber: (number, decimals = 0) => {
    if (number === null || number === undefined) return '';
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(number);
  },
  
  // Parse German number format
  parseGermanNumber: (numberString) => {
    if (!numberString) return 0;
    return parseFloat(numberString.replace(/\./g, '').replace(',', '.'));
  },
  
  // Format percentage
  formatPercentage: (value, decimals = 1) => {
    if (value === null || value === undefined) return '';
    return `${value.toFixed(decimals)}%`;
  },
  
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};

// String utilities
export const stringUtils = {
  // Truncate string with ellipsis
  truncate: (str, maxLength = 50, suffix = '...') => {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  },
  
  // Capitalize first letter
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  
  // Convert to slug
  toSlug: (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
  
  // Remove HTML tags
  stripHtml: (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  },
  
  // Format phone number
  formatPhone: (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{2,5})(\d{3,4})(\d{4,})/, '$1 $2 $3');
  },
  
  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validate German phone
  isValidGermanPhone: (phone) => {
    const phoneRegex = /^(\+49|0)[1-9][0-9]{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
  },
  
  // Validate German postal code
  isValidGermanPostalCode: (plz) => {
    const plzRegex = /^\d{5}$/;
    return plzRegex.test(plz);
  },
};

// Array utilities
export const arrayUtils = {
  // Group array by key
  groupBy: (array, key) => {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  },
  
  // Sort array by multiple keys
  sortBy: (array, ...keys) => {
    return [...array].sort((a, b) => {
      for (const key of keys) {
        const aVal = typeof key === 'function' ? key(a) : a[key];
        const bVal = typeof key === 'function' ? key(b) : b[key];
        
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  },
  
  // Remove duplicates
  unique: (array, key) => {
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  },
  
  // Chunk array into smaller arrays
  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  // Find item by ID
  findById: (array, id) => {
    return array.find(item => item.id === id || item._id === id);
  },
  
  // Update item in array
  updateItem: (array, id, updates) => {
    return array.map(item => 
      (item.id === id || item._id === id) ? { ...item, ...updates } : item
    );
  },
  
  // Remove item from array
  removeItem: (array, id) => {
    return array.filter(item => item.id !== id && item._id !== id);
  },
};

// Object utilities
export const objectUtils = {
  // Deep clone object
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj));
  },
  
  // Merge objects deeply
  deepMerge: (target, source) => {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  },
  
  // Pick specific keys from object
  pick: (obj, keys) => {
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  },
  
  // Omit specific keys from object
  omit: (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  },
  
  // Check if object is empty
  isEmpty: (obj) => {
    return Object.keys(obj).length === 0;
  },
  
  // Clean undefined/null values
  clean: (obj) => {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== null && obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  },
};

// Validation utilities
export const validationUtils = {
  // Check if value is required
  required: (value, message = 'Dieses Feld ist erforderlich') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },
  
  // Validate minimum length
  minLength: (value, min, message) => {
    if (!value) return null;
    if (value.length < min) {
      return message || `Mindestens ${min} Zeichen erforderlich`;
    }
    return null;
  },
  
  // Validate maximum length
  maxLength: (value, max, message) => {
    if (!value) return null;
    if (value.length > max) {
      return message || `Maximal ${max} Zeichen erlaubt`;
    }
    return null;
  },
  
  // Validate email
  email: (value, message = 'Bitte geben Sie eine gültige E-Mail-Adresse ein') => {
    if (!value) return null;
    if (!stringUtils.isValidEmail(value)) {
      return message;
    }
    return null;
  },
  
  // Validate phone
  phone: (value, message = 'Bitte geben Sie eine gültige Telefonnummer ein') => {
    if (!value) return null;
    if (!stringUtils.isValidGermanPhone(value)) {
      return message;
    }
    return null;
  },
  
  // Validate postal code
  postalCode: (value, message = 'Bitte geben Sie eine gültige Postleitzahl ein') => {
    if (!value) return null;
    if (!stringUtils.isValidGermanPostalCode(value)) {
      return message;
    }
    return null;
  },
  
  // Validate number range
  range: (value, min, max, message) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      return message || `Wert muss zwischen ${min} und ${max} liegen`;
    }
    return null;
  },
  
  // Validate date
  date: (value, message = 'Bitte geben Sie ein gültiges Datum ein') => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return message;
    }
    return null;
  },
  
  // Validate future date
  futureDate: (value, message = 'Datum muss in der Zukunft liegen') => {
    if (!value) return null;
    const date = new Date(value);
    if (date <= new Date()) {
      return message;
    }
    return null;
  },
  
  // Combine validators
  combine: (...validators) => (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  },
};

// Storage utilities
export const storageUtils = {
  // Local storage with JSON support
  local: {
    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
      }
    },
    
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Error writing to localStorage:', error);
        return false;
      }
    },
    
    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
      }
    },
    
    clear: () => {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
      }
    },
  },
  
  // Session storage with JSON support
  session: {
    get: (key, defaultValue = null) => {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error('Error reading from sessionStorage:', error);
        return defaultValue;
      }
    },
    
    set: (key, value) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Error writing to sessionStorage:', error);
        return false;
      }
    },
    
    remove: (key) => {
      try {
        sessionStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Error removing from sessionStorage:', error);
        return false;
      }
    },
    
    clear: () => {
      try {
        sessionStorage.clear();
        return true;
      } catch (error) {
        console.error('Error clearing sessionStorage:', error);
        return false;
      }
    },
  },
};

// Helper functions
const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// Export all utilities
export default {
  date: dateUtils,
  number: numberUtils,
  string: stringUtils,
  array: arrayUtils,
  object: objectUtils,
  validation: validationUtils,
  storage: storageUtils,
};
import { format, formatDistance } from 'date-fns';
import { de } from 'date-fns/locale';
import DOMPurify from 'dompurify';

// Date utilities
export const dateUtils = {
  // Format date to German format (dd.MM.yyyy)
  formatDate: (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return format(d, 'dd.MM.yyyy', { locale: de });
    } catch (error) {
      return '';
    }
  },
  
  // Convert to ISO string
  toISOString: (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toISOString();
    } catch (error) {
      return '';
    }
  },
  
  // Parse German date format (dd.MM.yyyy) to Date object
  parseGermanDate: (dateString) => {
    if (!dateString) return null;
    try {
      const [day, month, year] = dateString.split('.');
      return new Date(year, month - 1, day);
    } catch (error) {
      return null;
    }
  },
  
  // Format date and time
  formatDateTime: (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return format(d, 'dd.MM.yyyy HH:mm', { locale: de });
    } catch (error) {
      return '';
    }
  },
  
  // Get relative time (e.g., "vor 2 Stunden")
  getRelativeTime: (date) => {
    if (!date) return '';
    try {
      return formatDistance(new Date(date), new Date(), { 
        addSuffix: true, 
        locale: de 
      });
    } catch (error) {
      return '';
    }
  },
  
  // Check if date is today
  isToday: (date) => {
    if (!date) return false;
    try {
      const d = new Date(date);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    } catch (error) {
      return false;
    }
  },
  
  // Check if date is in the past
  isPast: (date) => {
    if (!date) return false;
    try {
      return new Date(date) < new Date();
    } catch (error) {
      return false;
    }
  },
  
  // Check if date is in the future
  isFuture: (date) => {
    if (!date) return false;
    try {
      return new Date(date) > new Date();
    } catch (error) {
      return false;
    }
  },
  
  // Add days to date
  addDays: (date, days) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      d.setDate(d.getDate() + days);
      return d;
    } catch (error) {
      return null;
    }
  },
  
  // Get month name in German
  getMonthName: (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return format(d, 'MMMM', { locale: de });
    } catch (error) {
      return '';
    }
  },
};

// Number utilities
export const numberUtils = {
  // Format number as currency (EUR)
  formatCurrency: (amount) => {
    if (amount === null || amount === undefined) return '0,00 €';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  },
  
  // Format number with German decimal separator
  formatNumber: (number, decimals = 2) => {
    if (number === null || number === undefined) return '0';
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  },
  
  // Parse German number format to float
  parseGermanNumber: (str) => {
    if (!str) return 0;
    const cleaned = str.toString()
      .replace(/\./g, '')  // Remove thousand separators
      .replace(',', '.')   // Replace decimal comma with dot
      .replace(/[^0-9.-]/g, ''); // Remove other characters
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  },
  
  // Format percentage
  formatPercentage: (value, decimals = 0) => {
    if (value === null || value === undefined) return '0%';
    return `${numberUtils.formatNumber(value, decimals)}%`;
  },
  
  // Format file size
  formatFileSize: (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  },
  
  // Calculate percentage
  calculatePercentage: (partial, total) => {
    if (!total || total === 0) return 0;
    return (partial / total) * 100;
  },
  
  // Round to specified decimals
  round: (number, decimals = 2) => {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },
};

// String utilities
export const stringUtils = {
  // Truncate string with ellipsis
  truncate: (str, length = 50) => {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
  },
  
  // Capitalize first letter
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  
  // Convert to URL-friendly slug
  toSlug: (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[äöüß]/g, match => ({
        'ä': 'ae',
        'ö': 'oe',
        'ü': 'ue',
        'ß': 'ss'
      }[match]))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
  
  // Strip HTML tags
  stripHtml: (str) => {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
  },
  
  // Format phone number
  formatPhone: (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format German phone numbers
    if (cleaned.startsWith('49')) {
      // International format
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
    } else if (cleaned.startsWith('0')) {
      // National format
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }
    
    return phone;
  },
  
  // Sanitize HTML to prevent XSS
  sanitize: (html) => {
    if (!html) return '';
    return DOMPurify.sanitize(html);
  },
  
  // Check if string is valid email
  isValidEmail: (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  // Check if string is valid German phone number
  isValidGermanPhone: (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && (cleaned.startsWith('0') || cleaned.startsWith('49'));
  },
  
  // Check if string is valid German postal code
  isValidGermanPostalCode: (code) => {
    if (!code) return false;
    return /^\d{5}$/.test(code);
  },
  
  // Generate random string
  generateRandomString: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

// Array utilities
export const arrayUtils = {
  // Group array by property
  groupBy: (array, key) => {
    if (!Array.isArray(array)) return {};
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  },
  
  // Sort array by property
  sortBy: (array, key, order = 'asc') => {
    if (!Array.isArray(array)) return [];
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },
  
  // Get unique values
  unique: (array) => {
    if (!Array.isArray(array)) return [];
    return [...new Set(array)];
  },
  
  // Chunk array into smaller arrays
  chunk: (array, size) => {
    if (!Array.isArray(array) || size <= 0) return [];
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  // Find item by ID
  findById: (array, id) => {
    if (!Array.isArray(array)) return null;
    return array.find(item => item.id === id || item._id === id);
  },
  
  // Update item in array
  updateItem: (array, id, updates) => {
    if (!Array.isArray(array)) return [];
    return array.map(item => 
      (item.id === id || item._id === id) ? { ...item, ...updates } : item
    );
  },
  
  // Remove item from array
  removeItem: (array, id) => {
    if (!Array.isArray(array)) return [];
    return array.filter(item => item.id !== id && item._id !== id);
  },
};

// Object utilities
export const objectUtils = {
  // Deep clone object (handles circular references)
  deepClone: (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => objectUtils.deepClone(item));
    if (obj instanceof RegExp) return new RegExp(obj);
    
    const clonedObj = new obj.constructor();
    
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = objectUtils.deepClone(obj[key]);
      }
    }
    
    return clonedObj;
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
            output[key] = objectUtils.deepMerge(target[key], source[key]);
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
    if (!obj || typeof obj !== 'object') return {};
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  },
  
  // Omit specific keys from object
  omit: (obj, keys) => {
    if (!obj || typeof obj !== 'object') return {};
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  },
  
  // Check if object is empty
  isEmpty: (obj) => {
    if (!obj || typeof obj !== 'object') return true;
    return Object.keys(obj).length === 0;
  },
  
  // Clean undefined/null values
  clean: (obj) => {
    if (!obj || typeof obj !== 'object') return {};
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
        return defaultValue;
      }
    },
    
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        return false;
      }
    },
    
    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        return false;
      }
    },
    
    clear: () => {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
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
        return defaultValue;
      }
    },
    
    set: (key, value) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        return false;
      }
    },
    
    remove: (key) => {
      try {
        sessionStorage.removeItem(key);
        return true;
      } catch (error) {
        return false;
      }
    },
    
    clear: () => {
      try {
        sessionStorage.clear();
        return true;
      } catch (error) {
        return false;
      }
    },
  },
};

// Helper functions
const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// All utilities
const utils = {
  date: dateUtils,
  number: numberUtils,
  string: stringUtils,
  array: arrayUtils,
  object: objectUtils,
  validation: validationUtils,
  storage: storageUtils,
};

// Export all utilities
export default utils;
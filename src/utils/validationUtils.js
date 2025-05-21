/**
 * validationUtils.js - Standardized form validation utilities
 * Provides consistent validation patterns across all application forms
 */

/**
 * Create a validation schema with rules and error messages
 * @param {Object} rules - Validation rules configuration 
 * @returns {Object} - A validation schema object with validate method
 * 
 * @example
 * const schema = createValidationSchema({
 *   name: {
 *     required: true,
 *     minLength: 2,
 *     errorMessages: {
 *       required: 'Name ist erforderlich',
 *       minLength: 'Name muss mindestens 2 Zeichen lang sein'
 *     }
 *   },
 *   email: { 
 *     required: true, 
 *     pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 *     errorMessages: {
 *       required: 'E-Mail ist erforderlich',
 *       pattern: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
 *     }
 *   }
 * });
 */
export const createValidationSchema = (rules) => {
  return {
    /**
     * Validate data against schema rules
     * @param {Object} data - Data to validate
     * @param {Object} options - Validation options
     * @param {boolean} options.abortEarly - Stop at first error (default: false)
     * @param {Array<string>} options.fields - Only validate specific fields
     * @returns {Object} - { isValid, errors }
     */
    validate: (data, options = {}) => {
      const { abortEarly = false, fields = null } = options;
      const errors = {};
      
      // Determine which fields to validate
      const fieldsToValidate = fields ? 
        Object.keys(rules).filter(field => fields.includes(field)) : 
        Object.keys(rules);
      
      // Process each field according to its rules
      fieldsToValidate.forEach(field => {
        // Get nested value if field uses dot notation (e.g., 'user.name')
        const value = getNestedValue(data, field);
        const fieldRules = rules[field];
        const fieldErrors = validateField(value, fieldRules, field);
        
        // If field has errors, add them to the result
        if (fieldErrors.length > 0) {
          errors[field] = fieldErrors[0]; // Use first error message
          
          // Stop validation if abortEarly is true
          if (abortEarly) {
            return;
          }
        }
      });
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    }
  };
};

/**
 * Validate a single field against its rules
 * @param {any} value - The field value to validate
 * @param {Object} rules - The rules for this field
 * @param {string} fieldName - The field name (for error messages)
 * @returns {Array} - Array of error messages
 */
const validateField = (value, rules, fieldName) => {
  const errors = [];
  const errorMessages = rules.errorMessages || {};
  
  // Required check
  if (rules.required && isEmptyValue(value)) {
    errors.push(errorMessages.required || `${fieldName} ist erforderlich`);
    return errors; // Skip other validations if required fails
  }
  
  // Skip other validations if value is empty and not required
  if (isEmptyValue(value) && !rules.required) {
    return errors;
  }
  
  // Type validation
  if (rules.type && !validateType(value, rules.type)) {
    errors.push(errorMessages.type || `${fieldName} hat einen ungültigen Typ`);
  }
  
  // Min/max (for numbers)
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(errorMessages.min || `${fieldName} muss mindestens ${rules.min} sein`);
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(errorMessages.max || `${fieldName} darf maximal ${rules.max} sein`);
    }
  }
  
  // MinLength/maxLength (for strings)
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(errorMessages.minLength || `${fieldName} muss mindestens ${rules.minLength} Zeichen lang sein`);
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(errorMessages.maxLength || `${fieldName} darf maximal ${rules.maxLength} Zeichen lang sein`);
    }
  }
  
  // Pattern (regex)
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(errorMessages.pattern || `${fieldName} hat ein ungültiges Format`);
  }
  
  // Custom validation function
  if (rules.validate && typeof rules.validate === 'function') {
    try {
      const customResult = rules.validate(value);
      if (customResult !== true) {
        errors.push(customResult || errorMessages.validate || `${fieldName} ist ungültig`);
      }
    } catch (error) {
      console.error(`Error in custom validator for ${fieldName}:`, error);
      errors.push(`Validierungsfehler bei ${fieldName}`);
    }
  }
  
  return errors;
};

/**
 * Check if a value should be considered empty for validation
 * @param {any} value - The value to check
 * @returns {boolean} - True if the value is considered empty
 */
export const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Validate that a value is of the expected type
 * @param {any} value - The value to validate
 * @param {string} type - Expected type ('string', 'number', 'boolean', 'array', 'object', 'date')
 * @returns {boolean} - True if value matches the expected type
 */
const validateType = (value, type) => {
  switch (type.toLowerCase()) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && !Array.isArray(value) && value !== null;
    case 'date':
      return value instanceof Date && !isNaN(value);
    default:
      return true; // Unknown type, consider valid
  }
};

/**
 * Get a nested object value using dot notation
 * @param {Object} obj - The object to access
 * @param {string} path - The path to the nested property (e.g., 'user.address.street')
 * @returns {any} - The value at the path or undefined if not found
 */
export const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  
  // Handle simple case (no dots)
  if (!path.includes('.')) return obj[path];
  
  // Handle nested case
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
};

/**
 * Set a nested object value using dot notation
 * @param {Object} obj - The object to modify
 * @param {string} path - The path to the nested property (e.g., 'user.address.street')
 * @param {any} value - The value to set
 * @returns {Object} - The modified object
 */
export const setNestedValue = (obj, path, value) => {
  if (!obj || !path) return obj;
  
  // Create a copy to avoid mutation
  const result = { ...obj };
  
  // Handle simple case (no dots)
  if (!path.includes('.')) {
    result[path] = value;
    return result;
  }
  
  // Handle nested case
  const parts = path.split('.');
  let current = result;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  return result;
};

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[0-9\s\-\(\)]{8,20}$/,
  germanPostalCode: /^\d{5}$/,
  urlPattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  dateISOString: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?)?Z?$/
};

/**
 * Common validation rules that can be reused
 */
export const commonRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    errorMessages: {
      required: 'Name ist erforderlich',
      minLength: 'Name muss mindestens 2 Zeichen lang sein',
      maxLength: 'Name darf maximal 100 Zeichen lang sein'
    }
  },
  email: {
    required: true,
    pattern: patterns.email,
    errorMessages: {
      required: 'E-Mail ist erforderlich',
      pattern: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    }
  },
  phone: {
    required: true,
    pattern: patterns.phone,
    errorMessages: {
      required: 'Telefonnummer ist erforderlich',
      pattern: 'Telefonnummer hat ein ungültiges Format (erlaubt sind Zahlen, Leerzeichen, Klammern und Bindestriche)'
    }
  },
  postalCode: {
    required: true,
    pattern: patterns.germanPostalCode,
    errorMessages: {
      required: 'PLZ ist erforderlich',
      pattern: 'PLZ muss aus 5 Ziffern bestehen'
    }
  }
};

export default {
  createValidationSchema,
  patterns,
  commonRules,
  isEmptyValue,
  getNestedValue,
  setNestedValue
};
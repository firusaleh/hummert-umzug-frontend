// src/context/FormContext.jsx
import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

// Create Context
export const FormContext = createContext({
  values: {},
  errors: {},
  touched: {},
  isSubmitting: false,
  isValid: false,
  isDirty: false,
  setFieldValue: () => {},
  setFieldError: () => {},
  setFieldTouched: () => {},
  setValues: () => {},
  setErrors: () => {},
  validateField: () => {},
  validateForm: () => {},
  handleSubmit: () => {},
  resetForm: () => {},
  registerField: () => {},
  unregisterField: () => {}
});

// Custom Hook
export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};

export const FormProvider = ({ 
  children, 
  initialValues = {},
  validationSchema = {},
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true
}) => {
  // State
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredFields, setRegisteredFields] = useState(new Set());

  // Derived state
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && 
           registeredFields.size > 0 &&
           Array.from(registeredFields).every(field => touched[field]);
  }, [errors, touched, registeredFields]);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  // Field registration
  const registerField = useCallback((name) => {
    setRegisteredFields(prev => new Set([...prev, name]));
  }, []);

  const unregisterField = useCallback((name) => {
    setRegisteredFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(name);
      return newSet;
    });
  }, []);

  // Field value management
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error if exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate on change if enabled
    if (validateOnChange && validationSchema[name]) {
      validateField(name, value);
    }
  }, [errors, validateOnChange, validationSchema]);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [name]: isTouched
    }));

    // Validate on blur if enabled
    if (validateOnBlur && validationSchema[name] && !errors[name]) {
      validateField(name, values[name]);
    }
  }, [validateOnBlur, validationSchema, errors, values]);

  // Validation
  const validateField = useCallback((name, value) => {
    const validator = validationSchema[name];
    if (!validator) return true;

    try {
      const error = validator(value, values);
      if (error) {
        setFieldError(name, error);
        return false;
      } else {
        setFieldError(name, null);
        return true;
      }
    } catch (error) {
      setFieldError(name, error.message);
      return false;
    }
  }, [validationSchema, values, setFieldError]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    registeredFields.forEach(field => {
      const validator = validationSchema[field];
      if (validator) {
        const error = validator(values[field], values);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [registeredFields, validationSchema, values]);

  // Form submission
  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    setIsSubmitting(true);

    // Touch all fields
    const allTouched = {};
    registeredFields.forEach(field => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    // Validate all fields
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle server validation errors
      if (error.validationErrors) {
        setErrors(error.validationErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [registeredFields, validateForm, onSubmit, values]);

  // Reset form
  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Context value
  const value = useMemo(() => ({
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    validateField,
    validateForm,
    handleSubmit,
    resetForm,
    registerField,
    unregisterField
  }), [
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    handleSubmit,
    resetForm,
    registerField,
    unregisterField
  ]);

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};

// Form field component
export const FormField = ({ 
  name, 
  component: Component, 
  validate,
  ...props 
}) => {
  const {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    registerField,
    unregisterField
  } = useForm();

  // Register field on mount
  React.useEffect(() => {
    registerField(name);
    return () => unregisterField(name);
  }, [name, registerField, unregisterField]);

  const fieldProps = {
    name,
    value: values[name] || '',
    error: touched[name] && errors[name],
    onChange: (e) => {
      const value = e.target ? e.target.value : e;
      setFieldValue(name, value);
    },
    onBlur: () => {
      setFieldTouched(name, true);
    },
    ...props
  };

  return <Component {...fieldProps} />;
};

// Form validation utilities
export const validators = {
  required: (message = 'Dieses Feld ist erforderlich') => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },

  email: (message = 'Bitte geben Sie eine gültige E-Mail-Adresse ein') => (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return message;
    }
    return null;
  },

  minLength: (min, message) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return message || `Mindestens ${min} Zeichen erforderlich`;
    }
    return null;
  },

  maxLength: (max, message) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return message || `Maximal ${max} Zeichen erlaubt`;
    }
    return null;
  },

  pattern: (regex, message = 'Ungültiges Format') => (value) => {
    if (!value) return null;
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },

  germanPhone: (message = 'Bitte geben Sie eine gültige deutsche Telefonnummer ein') => (value) => {
    if (!value) return null;
    const phoneRegex = /^(\+49|0)[1-9][0-9]{1,14}$/;
    if (!phoneRegex.test(value.replace(/[\s\-]/g, ''))) {
      return message;
    }
    return null;
  },

  germanPostalCode: (message = 'Bitte geben Sie eine gültige deutsche Postleitzahl ein') => (value) => {
    if (!value) return null;
    const plzRegex = /^\d{5}$/;
    if (!plzRegex.test(value)) {
      return message;
    }
    return null;
  },

  combine: (...validators) => (value, values) => {
    for (const validator of validators) {
      const error = validator(value, values);
      if (error) return error;
    }
    return null;
  }
};

export default FormContext;
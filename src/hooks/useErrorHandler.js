import { useState, useCallback, useEffect } from 'react';
import { isNetworkError, isAuthError, formatApiError } from '../utils/errorHandler';
import { isErrorResponse, getErrorMessage } from '../utils/dataUtils';

/**
 * Custom Hook für zentralisierte Fehlerbehandlung in React-Komponenten
 * 
 * @param {Object} options - Konfigurationsoptionen für den Error Handler
 * @param {boolean} options.captureNetwork - Ob Netzwerkfehler erfasst werden sollen
 * @param {boolean} options.captureAuth - Ob Authentifizierungsfehler erfasst werden sollen
 * @param {Function} options.onAuthError - Callback für Authentifizierungsfehler
 * @param {number} options.clearErrorAfter - Zeit in ms, nach der Fehler automatisch gelöscht werden (0 = deaktiviert)
 * @param {Object} options.validationSchema - Schema für die Formularvalidierung
 * @param {Object} options.initialData - Initiale Daten für die Validierung
 * @returns {Object} Error Handler mit Methoden und State
 */
const useErrorHandler = (options = {}) => {
  const {
    captureNetwork = true,
    captureAuth = true,
    onAuthError,
    clearErrorAfter = 0,
    validationSchema = null,
    initialData = null,
    validateOnChange = false
  } = options;

  // Fehler-State
  const [errors, setErrors] = useState([]);
  // Genereller Fehlertext für die Anzeige
  const [errorMessage, setErrorMessage] = useState(null);
  // Status für Formularfehler (z.B. Validierung)
  const [formErrors, setFormErrors] = useState({});
  // Daten für die Validierung
  const [data, setData] = useState(initialData || {});
  // Verfolge berührte Felder für Live-Validierung
  const [touchedFields, setTouchedFields] = useState({});

  /**
   * Setze einen einfachen Fehlertext
   */
  const setError = useCallback((message) => {
    setErrorMessage(message);
    
    // Automatisches Löschen nach bestimmter Zeit
    if (clearErrorAfter > 0) {
      setTimeout(() => {
        setErrorMessage(null);
      }, clearErrorAfter);
    }
  }, [clearErrorAfter]);

  /**
   * Lösche alle Fehler
   */
  const clearErrors = useCallback(() => {
    setErrors([]);
    setErrorMessage(null);
    setFormErrors({});
  }, []);

  /**
   * Behandle API-Fehler
   */
  const handleApiError = useCallback((operation, error, defaultMessage = 'Ein Fehler ist aufgetreten') => {
    console.error(`API Error (${operation}):`, error);

    // Wenn die Fehlerantwort bereits formatiert ist (z.B. von formatApiError)
    if (isErrorResponse(error)) {
      const message = getErrorMessage(error, defaultMessage);
      setErrorMessage(message);
      
      // Wenn der Fehler Feldvalidierungen enthält
      if (error.errors && typeof error.errors === 'object') {
        setFormErrors(error.errors);
      }
      
      return message;
    }
    
    // Netzwerkfehler
    if (captureNetwork && isNetworkError(error)) {
      const message = 'Verbindungsfehler. Bitte überprüfe deine Internetverbindung.';
      setErrorMessage(message);
      return message;
    }
    
    // Authentifizierungsfehler
    if (captureAuth && isAuthError(error)) {
      const message = 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.';
      setErrorMessage(message);
      
      // Callback für Auth-Fehler aufrufen (z.B. für Redirect zum Login)
      if (onAuthError) {
        onAuthError(error);
      }
      
      return message;
    }
    
    // Standard-Fehlerbehandlung mit formatApiError
    const formattedError = formatApiError(error, defaultMessage);
    setErrorMessage(formattedError.message);
    
    // Wenn Validierungsfehler vorhanden sind
    if (formattedError.errors) {
      setFormErrors(formattedError.errors);
    }
    
    return formattedError.message;
  }, [captureNetwork, captureAuth, onAuthError]);

  /**
   * Fehler zu einem bestimmten Formularfeld hinzufügen
   */
  const setFieldError = useCallback((fieldName, errorMessage) => {
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));
  }, []);

  /**
   * Fehler für ein bestimmtes Formularfeld löschen
   */
  const clearFieldError = useCallback((fieldName) => {
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Prüfen, ob ein Feld einen Fehler hat
   */
  const hasFieldError = useCallback((fieldName) => {
    return Boolean(formErrors[fieldName]);
  }, [formErrors]);

  /**
   * Fehler für ein Formularfeld abrufen
   */
  const getFieldError = useCallback((fieldName) => {
    return formErrors[fieldName] || null;
  }, [formErrors]);

  /**
   * Daten für ein Feld aktualisieren und optionale sofortige Validierung
   */
  const updateField = useCallback((fieldName, value, validate = validateOnChange) => {
    // Aktualisiere das Feld als berührt
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
    
    // Aktualisiere den Wert
    setData(prev => {
      // Handle verschachtelte Objekte (z.B. "user.name")
      if (fieldName.includes('.')) {
        const [parent, child] = fieldName.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent] || {}),
            [child]: value
          }
        };
      }
      
      return {
        ...prev,
        [fieldName]: value
      };
    });
    
    // Lösche den vorhandenen Fehler für dieses Feld
    clearFieldError(fieldName);
    
    // Validiere das Feld sofort, wenn gewünscht und ein Schema vorhanden ist
    if (validate && validationSchema) {
      const result = validationSchema.validate(
        // Bei verschachtelten Werten müssen wir das aktuelle Elternobjekt mit dem neuen Wert kombinieren
        fieldName.includes('.') 
          ? { ...data, [fieldName.split('.')[0]]: { ...data[fieldName.split('.')[0]], [fieldName.split('.')[1]]: value } }
          : { ...data, [fieldName]: value },
        { fields: [fieldName] }
      );
      
      if (!result.isValid) {
        setFormErrors(prev => ({
          ...prev,
          ...result.errors
        }));
      }
    }
  }, [data, validateOnChange, validationSchema, clearFieldError]);

  /**
   * Mehrere Felder gleichzeitig aktualisieren
   */
  const updateFields = useCallback((fieldValues, validate = validateOnChange) => {
    // Aktualisiere Werte
    const newData = { ...data };
    const updatedFields = [];
    
    // Verarbeite jedes Feld einzeln, um verschachtelte Objekte zu unterstützen
    Object.entries(fieldValues).forEach(([fieldName, value]) => {
      if (fieldName.includes('.')) {
        const [parent, child] = fieldName.split('.');
        newData[parent] = {
          ...(newData[parent] || {}),
          [child]: value
        };
      } else {
        newData[fieldName] = value;
      }
      
      updatedFields.push(fieldName);
      
      // Markiere Feld als berührt
      setTouchedFields(prev => ({
        ...prev,
        [fieldName]: true
      }));
    });
    
    // Aktualisiere den Zustand
    setData(newData);
    
    // Lösche vorhandene Fehler für diese Felder
    const newFormErrors = { ...formErrors };
    updatedFields.forEach(field => {
      delete newFormErrors[field];
    });
    setFormErrors(newFormErrors);
    
    // Validiere die Felder sofort, wenn gewünscht und ein Schema vorhanden ist
    if (validate && validationSchema) {
      const result = validationSchema.validate(newData, { fields: updatedFields });
      
      if (!result.isValid) {
        setFormErrors(prev => ({
          ...prev,
          ...result.errors
        }));
      }
    }
  }, [data, formErrors, validateOnChange, validationSchema]);

  /**
   * Validiere das gesamte Formular oder bestimmte Felder
   */
  const validateForm = useCallback((options = {}) => {
    const { fields, abortEarly = false, markAllTouched = true } = options;
    
    if (!validationSchema) {
      console.warn('validateForm wurde aufgerufen, aber kein Validierungsschema angegeben');
      return { isValid: true, errors: {} };
    }
    
    const result = validationSchema.validate(data, { fields, abortEarly });
    
    // Aktualisiere Fehler im Zustand
    setFormErrors(result.errors);
    
    // Optional alle Felder als berührt markieren
    if (markAllTouched && fields) {
      const newTouched = { ...touchedFields };
      fields.forEach(field => {
        newTouched[field] = true;
      });
      setTouchedFields(newTouched);
    } else if (markAllTouched) {
      // Alle Felder im Schema als berührt markieren
      const schemaFields = Object.keys(validationSchema.fields || {});
      const newTouched = { ...touchedFields };
      schemaFields.forEach(field => {
        newTouched[field] = true;
      });
      setTouchedFields(newTouched);
    }
    
    return result;
  }, [data, validationSchema, touchedFields]);

  /**
   * Ein Feld als berührt markieren
   */
  const touchField = useCallback((fieldName) => {
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));
    
    // Validiere das Feld, wenn es als berührt markiert wird und wir ein Schema haben
    if (validationSchema && validateOnChange) {
      const result = validationSchema.validate(data, { fields: [fieldName] });
      
      if (!result.isValid) {
        setFormErrors(prev => ({
          ...prev,
          ...result.errors
        }));
      }
    }
  }, [data, validationSchema, validateOnChange]);

  /**
   * Alle Felder zurücksetzen (Werte, Fehler und Berührungszustand)
   */
  const resetForm = useCallback((newData = null) => {
    if (newData !== null) {
      setData(newData);
    } else {
      setData(initialData || {});
    }
    
    setFormErrors({});
    setErrors([]);
    setErrorMessage(null);
    setTouchedFields({});
  }, [initialData]);

  return {
    // State
    error: errorMessage,
    errors,
    formErrors,
    data,
    touchedFields,
    
    // Setter
    setError,
    setErrors: setErrors,
    setFormErrors,
    
    // API-Fehlerbehandlung
    handleApiError,
    
    // Feldspezifische Fehlerbehandlung
    setFieldError,
    clearFieldError,
    hasFieldError,
    getFieldError,
    
    // Formulardaten-Management
    updateField,
    updateFields,
    touchField,
    validateForm,
    resetForm,
    
    // Löschen
    clearErrors
  };
};

export default useErrorHandler;
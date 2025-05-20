import React, { useState } from 'react';
import { umzuegeService } from '../../services/api';
import useErrorHandler from '../../hooks/useErrorHandler';
import ErrorAlert from '../common/ErrorAlert';

/**
 * Example component demonstrating standardized error handling
 * Shows how to use the error handling utilities in a component
 */
const ErrorHandlingExample = () => {
  // Form state
  const [formData, setFormData] = useState({
    kunde: '',
    startDatum: '',
    endDatum: '',
    auszugsadresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: ''
    },
    einzugsadresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: ''
    }
  });
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Use the error handling hook
  const { 
    error,              // General error message
    fieldErrors,        // Field-specific errors
    handleApiError,     // Function to handle API errors
    setFieldError,      // Function to set a field error
    clearErrors,        // Function to clear all errors
    clearFieldError     // Function to clear a field error
  } = useErrorHandler();
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear field error when user types
    if (fieldErrors[name]) {
      clearFieldError(name);
    }
    
    // Handle nested objects (addresses)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    let isValid = true;
    
    // Clear all errors before validation
    clearErrors();
    
    // Check required fields
    if (!formData.kunde.trim()) {
      setFieldError('kunde', 'Kundenname ist erforderlich');
      isValid = false;
    }
    
    if (!formData.startDatum) {
      setFieldError('startDatum', 'Startdatum ist erforderlich');
      isValid = false;
    }
    
    if (!formData.endDatum) {
      setFieldError('endDatum', 'Enddatum ist erforderlich');
      isValid = false;
    }
    
    // Validate addresses
    if (!formData.auszugsadresse.strasse.trim()) {
      setFieldError('auszugsadresse.strasse', 'Straße ist erforderlich');
      isValid = false;
    }
    
    if (!formData.einzugsadresse.strasse.trim()) {
      setFieldError('einzugsadresse.strasse', 'Straße ist erforderlich');
      isValid = false;
    }
    
    return isValid;
  };
  
  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous state
    setSuccess(false);
    clearErrors();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Make API call
      const result = await umzuegeService.create(formData);
      
      // Check if there was an error
      if (!result.success) {
        handleApiError('create-umzug', { response: { data: result } }, 'Fehler beim Erstellen des Umzugs');
        setLoading(false);
        return;
      }
      
      // Success!
      setSuccess(true);
      setFormData({
        kunde: '',
        startDatum: '',
        endDatum: '',
        auszugsadresse: {
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: ''
        },
        einzugsadresse: {
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: ''
        }
      });
    } catch (err) {
      // Handle unexpected errors
      handleApiError('create-umzug', err, 'Fehler beim Erstellen des Umzugs');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Neuen Umzug erstellen</h2>
      
      {/* Error display */}
      <ErrorAlert 
        error={error} 
        severity="error" 
        onDismiss={clearErrors} 
        className="mb-4"
      />
      
      {/* Success message */}
      {success && (
        <ErrorAlert 
          error="Umzug wurde erfolgreich erstellt!" 
          severity="info" 
          onDismiss={() => setSuccess(false)} 
          className="mb-4"
        />
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kundenname</label>
          <input
            type="text"
            name="kunde"
            value={formData.kunde}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${fieldErrors.kunde ? 'border-red-500' : 'border-gray-300'}`}
          />
          {fieldErrors.kunde && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.kunde}</p>
          )}
        </div>
        
        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
            <input
              type="date"
              name="startDatum"
              value={formData.startDatum}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.startDatum ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.startDatum && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.startDatum}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum</label>
            <input
              type="date"
              name="endDatum"
              value={formData.endDatum}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.endDatum ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.endDatum && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.endDatum}</p>
            )}
          </div>
        </div>
        
        {/* Auszugsadresse */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Auszugsadresse</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Straße</label>
              <input
                type="text"
                name="auszugsadresse.strasse"
                value={formData.auszugsadresse.strasse}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${fieldErrors['auszugsadresse.strasse'] ? 'border-red-500' : 'border-gray-300'}`}
              />
              {fieldErrors['auszugsadresse.strasse'] && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors['auszugsadresse.strasse']}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hausnummer</label>
              <input
                type="text"
                name="auszugsadresse.hausnummer"
                value={formData.auszugsadresse.hausnummer}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
              <input
                type="text"
                name="auszugsadresse.plz"
                value={formData.auszugsadresse.plz}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
              <input
                type="text"
                name="auszugsadresse.ort"
                value={formData.auszugsadresse.ort}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Einzugsadresse */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Einzugsadresse</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Straße</label>
              <input
                type="text"
                name="einzugsadresse.strasse"
                value={formData.einzugsadresse.strasse}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${fieldErrors['einzugsadresse.strasse'] ? 'border-red-500' : 'border-gray-300'}`}
              />
              {fieldErrors['einzugsadresse.strasse'] && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors['einzugsadresse.strasse']}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hausnummer</label>
              <input
                type="text"
                name="einzugsadresse.hausnummer"
                value={formData.einzugsadresse.hausnummer}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
              <input
                type="text"
                name="einzugsadresse.plz"
                value={formData.einzugsadresse.plz}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
              <input
                type="text"
                name="einzugsadresse.ort"
                value={formData.einzugsadresse.ort}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        
        {/* Submit button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Wird gespeichert...' : 'Umzug erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ErrorHandlingExample;
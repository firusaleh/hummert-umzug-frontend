import React from 'react';
import PropTypes from 'prop-types';
import ErrorAlert from './ErrorAlert';

/**
 * Form Component - A reusable form component with integrated validation
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Submit handler function
 * @param {ReactNode} props.children - Form content
 * @param {Object} props.error - Form error from useErrorHandler
 * @param {Function} props.clearErrors - Function to clear form errors
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.submitLabel - Label for the submit button
 * @param {string} props.cancelLabel - Label for the cancel button
 * @param {Function} props.onCancel - Cancel handler function
 * @param {boolean} props.loading - Whether the form is in a loading state
 * @param {boolean} props.validateOnSubmit - Whether to validate on submit
 * @param {Function} props.validateForm - Function to validate the form manually
 */
const Form = ({
  onSubmit,
  children,
  error,
  clearErrors,
  className = '',
  submitLabel = 'Speichern',
  cancelLabel = 'Abbrechen',
  onCancel,
  loading = false,
  validateOnSubmit = true,
  validateForm
}) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form if requested
    if (validateOnSubmit && validateForm) {
      const validationResult = validateForm({ markAllTouched: true });
      if (!validationResult.isValid) {
        return; // Stop submission if validation fails
      }
    }
    
    // Clear any previous errors
    if (clearErrors) clearErrors();
    
    // Call the submit handler
    if (onSubmit) await onSubmit(e);
  };
  
  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`} noValidate>
      {/* Error display at form level */}
      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={clearErrors} 
          severity="error" 
          autoDismissAfter={8000}
        />
      )}
      
      {/* Form content */}
      {children}
      
      {/* Form actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2 border rounded hover:bg-gray-50 shadow-sm"
            disabled={loading}
          >
            {cancelLabel}
          </button>
        )}
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verarbeite...
            </span>
          ) : submitLabel}
        </button>
      </div>
    </form>
  );
};

Form.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  clearErrors: PropTypes.func,
  className: PropTypes.string,
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onCancel: PropTypes.func,
  loading: PropTypes.bool,
  validateOnSubmit: PropTypes.bool,
  validateForm: PropTypes.func
};

export default Form;
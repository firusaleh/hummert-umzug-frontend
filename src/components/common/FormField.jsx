import React from 'react';
import PropTypes from 'prop-types';

/**
 * FormField Component - A reusable form field with integrated validation
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - Field name (used for validation)
 * @param {string} props.label - Field label
 * @param {string} props.type - Input type (text, email, number, etc.)
 * @param {any} props.value - Field value
 * @param {Function} props.onChange - Change handler function
 * @param {Function} props.onBlur - Blur handler function (optional)
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.error - Error message to display
 * @param {boolean} props.touched - Whether the field has been touched
 * @param {string} props.placeholder - Placeholder text
 * @param {Object} props.inputProps - Additional props to pass to the input element
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.helpText - Help text to display below the field
 */
const FormField = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  required = false,
  error,
  touched = false,
  placeholder = '',
  inputProps = {},
  className = '',
  helpText = ''
}) => {
  // Determine if we should show error states
  const showError = error && (touched || error);
  
  // Handle regular input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    onChange(name, finalValue);
  };
  
  // Handle blur event for validation
  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(name);
    }
  };
  
  // Input classes based on validation state
  const inputClasses = `w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500 ${
    showError ? 'border-red-500 bg-red-50' : ''
  }`;
  
  // Render appropriate input type
  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      onChange: handleChange,
      onBlur: handleBlur,
      className: inputClasses,
      ...inputProps
    };
    
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            placeholder={placeholder}
            rows={inputProps.rows || 3}
            {...commonProps}
          />
        );
        
      case 'select':
        return (
          <select value={value || ''} {...commonProps}>
            {inputProps.options && inputProps.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              {...commonProps}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-700">{label}</span>
          </div>
        );
        
      case 'radio':
        return (
          <div className="space-y-2">
            {inputProps.options && inputProps.options.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`${name}-${option.value}`}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor={`${name}-${option.value}`} className="ml-2 text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        
      default:
        return (
          <input
            type={type}
            value={value || ''}
            placeholder={placeholder}
            {...commonProps}
          />
        );
    }
  };
  
  return (
    <div className={`mb-4 ${className}`}>
      {type !== 'checkbox' && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {renderInput()}
      
      {showError && (
        <div className="text-red-500 text-xs mt-1">{error}</div>
      )}
      
      {helpText && !showError && (
        <div className="text-gray-500 text-xs mt-1">{helpText}</div>
      )}
    </div>
  );
};

FormField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  required: PropTypes.bool,
  error: PropTypes.string,
  touched: PropTypes.bool,
  placeholder: PropTypes.string,
  inputProps: PropTypes.object,
  className: PropTypes.string,
  helpText: PropTypes.string
};

export default FormField;
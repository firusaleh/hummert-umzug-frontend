import React from 'react';
import { AlertTriangle, XCircle, Info } from 'lucide-react';

/**
 * Reusable error alert component for displaying error messages
 * Supports different severity levels with appropriate styling
 * 
 * @param {Object} props
 * @param {String|Array|null} props.error - Error message or array of messages
 * @param {String} props.severity - Error severity: 'error', 'warning', or 'info'
 * @param {Function} props.onDismiss - Optional callback for dismissing the error
 * @param {String} props.className - Additional CSS classes
 */
const ErrorAlert = ({ 
  error, 
  severity = 'error',
  onDismiss, 
  className = '' 
}) => {
  // Return null if no error
  if (!error) return null;
  
  // Convert error to array if it's a string
  const errorMessages = Array.isArray(error) ? error : [error];
  
  // Filter out empty messages
  const messages = errorMessages.filter(msg => msg && msg.trim());
  if (messages.length === 0) return null;
  
  // Configure styling based on severity
  const styles = {
    error: {
      container: 'bg-red-50 border-l-4 border-red-500',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      text: 'text-red-700'
    },
    warning: {
      container: 'bg-yellow-50 border-l-4 border-yellow-500',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      text: 'text-yellow-700'
    },
    info: {
      container: 'bg-blue-50 border-l-4 border-blue-500',
      icon: <Info className="h-5 w-5 text-blue-500" />,
      text: 'text-blue-700'
    }
  };
  
  const style = styles[severity] || styles.error;
  
  return (
    <div className={`p-4 rounded-md my-4 ${style.container} ${className}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          {style.icon}
        </div>
        <div className="ml-3 flex-1">
          {messages.length === 1 ? (
            <p className={`text-sm font-medium ${style.text}`}>{messages[0]}</p>
          ) : (
            <div className={`text-sm ${style.text}`}>
              <p className="font-medium mb-2">Es sind Fehler aufgetreten:</p>
              <ul className="list-disc pl-5 space-y-1">
                {messages.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
              aria-label="Schließen"
            >
              <XCircle className="h-5 w-5 text-gray-400 hover:text-gray-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;

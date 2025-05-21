import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * ErrorAlert Component zur Anzeige von Fehlermeldungen mit verschiedenen Schweregraden
 * 
 * @param {Object} props - Die Komponenten-Props
 * @param {string|Array} props.error - Fehlermeldung oder Array von Fehlermeldungen
 * @param {string} props.severity - Schweregrad des Fehlers: 'error', 'warning', 'info' (Standard: 'error')
 * @param {Function} props.onDismiss - Callback-Funktion zum Schließen der Fehlermeldung
 * @param {string} props.className - Zusätzliche CSS-Klassen
 * @param {boolean} props.dismissible - Ob die Fehlermeldung schließbar ist
 * @param {number} props.autoDismissAfter - Zeit in ms, nach der die Meldung automatisch verschwindet (0 = deaktiviert)
 */
const ErrorAlert = ({ 
  error, 
  severity = 'error', 
  onDismiss, 
  className = '',
  dismissible = true,
  autoDismissAfter = 0
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    // Wenn keine Fehlermeldung, nichts tun
    if (!error || error.length === 0 || !visible) {
      return;
    }
    // Auto-dismiss Timer
    let timer;
    if (autoDismissAfter > 0) {
      timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, autoDismissAfter);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoDismissAfter, onDismiss, error, visible]);

  // Fehler in Array umwandeln, wenn es kein Array ist
  const errorMessages = Array.isArray(error) ? error : [error];

  // Farben und Icons basierend auf dem Schweregrad
  const colorConfig = {
    error: {
      bg: 'bg-red-100',
      border: 'border-red-400',
      text: 'text-red-700',
      icon: <AlertCircle className="h-5 w-5 text-red-500" />
    },
    warning: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-400',
      text: 'text-yellow-700',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
    },
    info: {
      bg: 'bg-blue-100',
      border: 'border-blue-400',
      text: 'text-blue-700',
      icon: <Info className="h-5 w-5 text-blue-500" />
    }
  };

  // Standard-Konfiguration verwenden, wenn der Schweregrad nicht gültig ist
  const config = colorConfig[severity] || colorConfig.error;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  // Wenn keine Fehlermeldung oder nicht sichtbar, nichts anzeigen
  if (!error || error.length === 0 || !visible) {
    return null;
  }

  return (
    <div 
      className={`${config.bg} ${config.border} ${config.text} px-4 py-3 rounded relative mb-4 ${className}`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0 mr-3">
          {config.icon}
        </div>
        <div className="flex-grow">
          {errorMessages.length === 1 ? (
            <span className="block sm:inline">{errorMessages[0]}</span>
          ) : (
            <ul className="list-disc pl-5">
              {errorMessages.map((msg, index) => (
                <li key={index} className="mb-1 last:mb-0">{msg}</li>
              ))}
            </ul>
          )}
        </div>
        {dismissible && (
          <button 
            className="ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-lg p-1.5 inline-flex h-8 w-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
            aria-label="Schließen"
            onClick={handleDismiss}
          >
            <X className={`h-5 w-5 ${config.text}`} />
          </button>
        )}
      </div>
    </div>
  );
};

ErrorAlert.propTypes = {
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  severity: PropTypes.oneOf(['error', 'warning', 'info']),
  onDismiss: PropTypes.func,
  className: PropTypes.string,
  dismissible: PropTypes.bool,
  autoDismissAfter: PropTypes.number
};

export default ErrorAlert;
import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary Component zur Behandlung unerwarteter Fehler in React-Komponenten
 * Fängt JS Fehler in Kindkomponenten ab und zeigt einen Fallback-UI an
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Aktualisiert den State, wenn ein Fehler auftritt
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Wird aufgerufen, wenn ein Fehler während des Renderings auftritt
   */
  componentDidCatch(error, errorInfo) {
    // Speichere errorInfo für Debugging
    this.setState({ errorInfo });
    
    // Error caught by boundary
    
    // Wenn eine onError Funktion bereitgestellt wurde, rufe sie auf
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Setzt den Fehlerstatus zurück
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    // Wenn ein Fehler aufgetreten ist, zeige die Fallback-UI
    if (this.state.hasError) {
      // Wenn eine FallbackComponent bereitgestellt wurde, zeige sie an
      if (this.props.FallbackComponent) {
        return (
          <this.props.FallbackComponent 
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }
      
      // Standard-Fallback-UI
      return (
        <div className="p-4 border border-red-300 rounded bg-red-50 text-red-800">
          <h2 className="text-lg font-semibold mb-2">Ein unerwarteter Fehler ist aufgetreten</h2>
          <p className="mb-4">Bitte versuchen Sie, die Seite neu zu laden.</p>
          
          {/* Im Entwicklungsmodus: Zeige Fehlerdetails */}
          {process.env.NODE_ENV !== 'production' && (
            <details className="mt-2 border-t border-red-200 pt-2">
              <summary className="cursor-pointer text-sm">Technische Details</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <button
            onClick={this.resetError}
            className="mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Neu laden
          </button>
        </div>
      );
    }

    // Wenn kein Fehler aufgetreten ist, rendere die Kinder normal
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  FallbackComponent: PropTypes.elementType,
  onError: PropTypes.func
};

export default ErrorBoundary;
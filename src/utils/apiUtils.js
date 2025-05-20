/**
 * apiUtils.js - Gemeinsame Hilfsfunktionen für API-Antwortverarbeitung
 * Bietet standardisierte Methoden zur Verwaltung von API-Antworten in der gesamten Anwendung
 */

/**
 * Sicheres Extrahieren von Daten aus API-Antworten mit standardisierter Struktur
 * @param {Object} response - Die API-Antwort
 * @param {String} dataPath - Optionaler Pfad zum Datenfeld (z.B. 'angebot', 'rechnung')
 * @param {*} defaultValue - Standardwert, wenn keine Daten gefunden werden
 * @returns {*} - Extrahierte Daten oder Standardwert
 */
export const extractApiData = (response, dataPath = null, defaultValue = null) => {
  try {
    // Sicherstellen, dass eine response mit data-Feld vorhanden ist
    if (!response || !response.data) return defaultValue;
    
    // Wenn kein spezifischer Pfad angegeben ist, gib response.data zurück
    if (!dataPath) return response.data;
    
    // Daten aus verschachteltem Objekt extrahieren
    return response.data[dataPath] || response.data || defaultValue;
  } catch (error) {
    console.error('Fehler beim Extrahieren der API-Daten:', error);
    return defaultValue;
  }
};

/**
 * Sicherstellen, dass ein Wert ein Array ist
 * @param {*} value - Der zu prüfende Wert
 * @param {Array} defaultValue - Standardwert, wenn kein Array
 * @returns {Array} - Entweder das ursprüngliche Array oder der Standardwert
 */
export const ensureArray = (value, defaultValue = []) => {
  return Array.isArray(value) ? value : defaultValue;
};

/**
 * Sicheres Konvertieren von Werten in Zahlen
 * @param {*} value - Der zu konvertierende Wert
 * @param {Number} defaultValue - Standardwert bei Fehler
 * @returns {Number} - Konvertierter Wert oder Standardwert
 */
export const toNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Validiert und transformiert Positionslisten für die Formularbearbeitung
 * @param {Array|*} positions - Die zu validierende Positionsliste
 * @param {Function} calculateGesamtpreis - Funktion zur Berechnung des Gesamtpreises
 * @returns {Array} - Validierte und transformierte Positionsliste
 */
export const validatePositions = (positions, calculateGesamtpreis) => {
  // Standardposition für Fallback
  const defaultPosition = { 
    bezeichnung: '', 
    menge: 1, 
    einheit: 'Stück', 
    einzelpreis: 0, 
    gesamtpreis: 0 
  };
  
  // Wenn keine gültige Positionsliste, gib eine Standard-Position zurück
  if (!Array.isArray(positions) || positions.length === 0) {
    return [defaultPosition];
  }
  
  // Validiere und transformiere jede Position
  return positions.map(pos => {
    if (!pos || typeof pos !== 'object') return defaultPosition;
    
    const menge = toNumber(pos.menge, 1);
    const einzelpreis = toNumber(pos.einzelpreis, 0);
    const gesamtpreis = typeof calculateGesamtpreis === 'function' 
      ? calculateGesamtpreis(menge, einzelpreis)
      : (menge * einzelpreis).toFixed(2);
      
    return {
      ...pos,
      bezeichnung: pos.bezeichnung || '',
      menge,
      einzelpreis,
      gesamtpreis,
      einheit: pos.einheit || 'Stück'
    };
  });
};

/**
 * Berechnet Nettobetrag einer Positionsliste
 * @param {Array} positions - Positionsliste
 * @returns {Number} - Berechneter Nettobetrag
 */
export const calculateNettobetrag = (positions) => {
  if (!Array.isArray(positions)) return 0;
  
  return positions.reduce((sum, pos) => {
    const menge = toNumber(pos.menge);
    const einzelpreis = toNumber(pos.einzelpreis);
    return sum + (menge * einzelpreis);
  }, 0);
};

/**
 * Berechnet Mehrwertsteuer basierend auf Nettobetrag
 * @param {Number} nettobetrag - Nettobetrag
 * @param {Number} mwstRate - Mehrwertsteuersatz in Prozent
 * @returns {Number} - Berechnete Mehrwertsteuer
 */
export const calculateMwst = (nettobetrag, mwstRate) => {
  return nettobetrag * (toNumber(mwstRate) / 100);
};

/**
 * Sicheres Parsen von JSON-Daten mit Fehlerbehandlung
 * @param {String} jsonString - Zu parsender JSON-String
 * @param {*} defaultValue - Standardwert bei Parsing-Fehler
 * @returns {*} - Geparster Wert oder Standardwert
 */
export const safeJsonParse = (jsonString, defaultValue = {}) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON Parsing Fehler:', error);
    return defaultValue;
  }
};
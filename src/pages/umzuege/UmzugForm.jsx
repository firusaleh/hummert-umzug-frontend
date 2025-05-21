import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { umzuegeService, mitarbeiterService, fahrzeugeService } from '../../services/api';
import { toast } from 'react-toastify';
import { extractApiData, ensureArray } from '../../utils/apiUtils';

export default function UmzugForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNeueModus = !id;
  
  const [loading, setLoading] = useState(!!id);
  const [formData, setFormData] = useState({
    kundennummer: '',
    auftraggeber: {
      name: '',
      telefon: '',
      email: '',
      firma: '' // Adding firma field which is in the validator schema
    },
    kontakte: [],
    auszugsadresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: '',
      land: 'Deutschland',
      etage: 0,
      aufzug: false,
      entfernung: 0
    },
    einzugsadresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: '',
      land: 'Deutschland',
      etage: 0,
      aufzug: false,
      entfernung: 0
    },
    zwischenstopps: [],
    startDatum: '',
    endDatum: '',
    status: 'geplant',
    preis: {
      netto: '',
      brutto: '',
      mwst: 19,
      bezahlt: false,
      zahlungsart: 'rechnung'
    },
    aufnahmeId: '',
    fahrzeuge: [],
    mitarbeiter: [],
    extraLeistungen: []
  });
  
  const [verfuegbareMitarbeiter, setVerfuegbareMitarbeiter] = useState([]);
  const [verfuegbareFahrzeuge, setVerfuegbareFahrzeuge] = useState([]);
  const [showKontaktForm, setShowKontaktForm] = useState(false);
  const [neuerKontakt, setNeuerKontakt] = useState({ name: '', telefon: '', email: '', isKunde: false });

  // Transformationsfunktion für Umzugsdaten - wichtig für das korrekte Format zum Speichern
  const transformUmzugData = useCallback((data) => {
    // Kopie erstellen, um das Original nicht zu verändern
    const transformed = { ...data };
    
    // Datumsfelder korrekt formatieren
    if (transformed.startDatum) {
      try {
        // Make sure the date is valid before converting
        const date = new Date(transformed.startDatum);
        if (isNaN(date.getTime())) {
          console.error('Ungültiges Startdatum:', transformed.startDatum);
        } else {
          transformed.startDatum = date.toISOString();
        }
      } catch (error) {
        console.error('Fehler beim Formatieren des Startdatums:', error);
      }
    }
    
    if (transformed.endDatum) {
      try {
        // Make sure the date is valid before converting
        const date = new Date(transformed.endDatum);
        if (isNaN(date.getTime())) {
          console.error('Ungültiges Enddatum:', transformed.endDatum);
        } else {
          transformed.endDatum = date.toISOString();
        }
      } catch (error) {
        console.error('Fehler beim Formatieren des Enddatums:', error);
      }
    }
    
    // Sicherstellen, dass numerische Werte auch wirklich als Zahlen gespeichert werden
    if (transformed.preis) {
      transformed.preis = {
        ...transformed.preis,
        netto: transformed.preis.netto ? parseFloat(transformed.preis.netto) : 0,
        brutto: transformed.preis.brutto ? parseFloat(transformed.preis.brutto) : 0,
        mwst: transformed.preis.mwst ? parseFloat(transformed.preis.mwst) : 19
      };
    }
    
    // Sicherstellen, dass Auftraggeber alle erforderlichen Felder hat
    if (transformed.auftraggeber) {
      transformed.auftraggeber = {
        ...transformed.auftraggeber,
        // Sicherstellen, dass firma immer vorhanden ist, auch wenn leer
        firma: transformed.auftraggeber.firma || ''
      };
    }
    
    // Sicherstellen, dass auszugsadresse und einzugsadresse korrekt formatiert sind
    if (transformed.auszugsadresse) {
      transformed.auszugsadresse = {
        ...transformed.auszugsadresse,
        etage: parseInt(transformed.auszugsadresse.etage) || 0,
        entfernung: parseInt(transformed.auszugsadresse.entfernung) || 0,
        aufzug: Boolean(transformed.auszugsadresse.aufzug),
        // Sicherstellen, dass PLZ 5 Ziffern hat
        plz: transformed.auszugsadresse.plz.trim().padStart(5, '0')
      };
    }
    
    if (transformed.einzugsadresse) {
      transformed.einzugsadresse = {
        ...transformed.einzugsadresse,
        etage: parseInt(transformed.einzugsadresse.etage) || 0,
        entfernung: parseInt(transformed.einzugsadresse.entfernung) || 0,
        aufzug: Boolean(transformed.einzugsadresse.aufzug),
        // Sicherstellen, dass PLZ 5 Ziffern hat
        plz: transformed.einzugsadresse.plz.trim().padStart(5, '0')
      };
    }
    
    // Verarbeiten jedes Mitarbeiterobjekts um sicherzustellen, dass alle erforderlichen Felder vorhanden sind
    if (Array.isArray(transformed.mitarbeiter)) {
      transformed.mitarbeiter = transformed.mitarbeiter.map(mitarbeiter => ({
        mitarbeiterId: mitarbeiter.mitarbeiterId,
        rolle: mitarbeiter.rolle || 'Helfer'
      }));
    }

    // Stellen sicher, dass Fahrzeuge die erforderlichen Felder haben
    if (Array.isArray(transformed.fahrzeuge)) {
      transformed.fahrzeuge = transformed.fahrzeuge.map(fahrzeug => {
        // Entfernen _id um Konflikte zu vermeiden
        const { _id, ...rest } = fahrzeug;
        return rest;
      });
    }
    
    return transformed;
  }, []);

  // Lade Daten vom API
  useEffect(() => {
    // Implementation omitted for brevity (no changes here)
  }, [id, navigate]);

  // Handlers omitted for brevity (no changes here)

  // Formular absenden - mit standardisierter Fehlerbehandlung und Datenformatierung
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Erweiterte Validierung vor dem Senden
    const requiredFields = [
      'auftraggeber.name', 
      'auftraggeber.telefon',
      'auszugsadresse.strasse',
      'auszugsadresse.hausnummer',
      'auszugsadresse.plz',
      'auszugsadresse.ort',
      'einzugsadresse.strasse',
      'einzugsadresse.hausnummer',
      'einzugsadresse.plz',
      'einzugsadresse.ort',
      'startDatum',
      'endDatum'
    ];

    const missingFields = [];
    const validationErrors = [];
    
    // Prüfe verschachtelte Felder
    requiredFields.forEach(field => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (!formData[parent] || !formData[parent][child]) {
          missingFields.push(field);
        }
      } else if (!formData[field]) {
        missingFields.push(field);
      }
    });

    // PLZ-Validierung (deutsches Format)
    if (formData.auszugsadresse?.plz && !/^\d{5}$/.test(formData.auszugsadresse.plz)) {
      validationErrors.push('Auszugsadresse: PLZ muss 5 Ziffern haben');
    }
    if (formData.einzugsadresse?.plz && !/^\d{5}$/.test(formData.einzugsadresse.plz)) {
      validationErrors.push('Einzugsadresse: PLZ muss 5 Ziffern haben');
    }
    
    // Telefonnummer-Validierung (basierend auf Backend-Validator-Pattern)
    if (formData.auftraggeber?.telefon && !/^[+]?[0-9\s\-\(\)]{8,20}$/.test(formData.auftraggeber.telefon)) {
      validationErrors.push('Telefonnummer hat ein ungültiges Format (erlaubt sind Zahlen, Leerzeichen, Klammern und Bindestriche)');
    }

    // Prüfen, ob das Startdatum vor dem Enddatum liegt
    if (formData.startDatum && formData.endDatum) {
      const startDate = new Date(formData.startDatum);
      const endDate = new Date(formData.endDatum);
      if (startDate > endDate) {
        validationErrors.push('Startdatum muss vor dem Enddatum liegen');
      }
    }

    // Status-Validierung gegen gültige Werte vom Backend
    const validStatusValues = ['geplant', 'bestaetigt', 'in_bearbeitung', 'abgeschlossen', 'storniert'];
    if (formData.status && !validStatusValues.includes(formData.status)) {
      validationErrors.push('Ungültiger Status');
    }

    // Rollen-Validierung für Mitarbeiter gegen gültige Werte vom Backend
    const validRollen = ['Teamleiter', 'Träger', 'Fahrer', 'Helfer'];
    if (formData.mitarbeiter?.length) {
      const invalidRoles = formData.mitarbeiter.filter(m => m.rolle && !validRollen.includes(m.rolle));
      if (invalidRoles.length > 0) {
        validationErrors.push('Ungültige Mitarbeiterrolle festgestellt');
      }
    }

    if (missingFields.length > 0) {
      toast.error(`Folgende Pflichtfelder fehlen oder sind ungültig: ${missingFields.join(', ')}`);
      return;
    }

    if (validationErrors.length > 0) {
      toast.error(`Validierungsfehler: ${validationErrors.join('; ')}`);
      return;
    }
    
    try {
      // Daten transformieren für API
      const transformedData = transformUmzugData(formData);
      
      // Detailliertes Logging für Debugging
      console.log('Transformierte Daten zum Speichern:', JSON.stringify(transformedData, null, 2));
      
      if (isNeueModus) {
        // Neuen Umzug erstellen mit standardisierter API
        try {
          // Log the exact data being sent to the API for debugging
          console.log('Sending data to API:', JSON.stringify(transformedData, null, 2));
          
          const response = await umzuegeService.create(transformedData);
          console.log('API response:', response);
          
          // Check if response indicates an error
          if (response && !response.success) {
            console.error('API returned error:', response.message, response.errors);
            
            let errorMsg = response.message || 'Unbekannter Fehler vom Server';
            if (response.errors && Array.isArray(response.errors)) {
              const errorDetails = response.errors.map(err => `${err.field || ''}: ${err.message}`).join('; ');
              errorMsg += `. Details: ${errorDetails}`;
            }
            
            toast.error(errorMsg);
            return;
          }
          
          // Extract data from successful response
          const responseData = extractApiData(response);
          if (!responseData) {
            throw new Error('Keine gültige Antwort vom Server erhalten');
          }
          
          toast.success('Umzug erfolgreich erstellt');
          navigate('/umzuege');
        } catch (error) {
          console.error('Fehler beim Erstellen des Umzugs:', error);
          
          // Detaillierte Fehlerbehandlung
          let errorMessage = 'Der Umzug konnte nicht gespeichert werden.';
          
          // Prüfen auf API-Fehlerantwort mit formatApiError Format
          if (error.errors && Array.isArray(error.errors)) {
            // Validierungsfehler anzeigen
            const errorDetails = error.errors.map(err => `${err.field || ''}: ${err.message}`).join('; ');
            errorMessage += ` Validierungsfehler: ${errorDetails}`;
          } else if (error.response && error.response.data) {
            // Direct response error
            const data = error.response.data;
            if (data.message) errorMessage += ` ${data.message}`;
            
            if (data.errors && Array.isArray(data.errors)) {
              const errorDetails = data.errors.map(err => 
                `${err.field || err.param || ''}: ${err.message || err.msg || ''}`).join('; ');
              errorMessage += `. Details: ${errorDetails}`;
            }
          } else if (error.message) {
            errorMessage += ` ${error.message}`;
          }
          
          toast.error(errorMessage);
        }
      } else {
        // Bestehenden Umzug aktualisieren mit standardisierter API
        try {
          const response = await umzuegeService.update(id, transformedData);
          const responseData = extractApiData(response);
          
          if (!responseData) {
            throw new Error('Keine gültige Antwort vom Server erhalten');
          }
          
          toast.success('Umzug erfolgreich aktualisiert');
          navigate('/umzuege');
        } catch (error) {
          console.error('Fehler beim Aktualisieren des Umzugs:', error);
          
          // Fehlermeldung mit Toast statt Alert
          let errorMessage = 'Der Umzug konnte nicht aktualisiert werden. ';
          if (error.message) {
            errorMessage += error.message;
          }
          
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Umzugs:', error);
      toast.error('Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  };

  // Render UI (omitted for brevity)
  return <div>Form UI (omitted for brevity)</div>;
}
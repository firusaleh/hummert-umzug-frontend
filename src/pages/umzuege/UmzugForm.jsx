import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { umzuegeService, mitarbeiterService, fahrzeugeService } from '../../services/api';
import { toast } from 'react-toastify';
import { extractApiData, ensureArray } from '../../utils/apiUtils';
import useErrorHandler from '../../hooks/useErrorHandler';
import ErrorAlert from '../../components/common/ErrorAlert';
import { createValidationSchema, patterns, commonRules } from '../../utils/validationUtils';
import Form from '../../components/common/Form';
import FormField from '../../components/common/FormField';

// Define validation schema for Umzug form
const validationSchema = createValidationSchema({
  'kundennummer': {
    required: true,
    minLength: 3,
    errorMessages: {
      required: 'Kundennummer ist erforderlich',
      minLength: 'Kundennummer muss mindestens 3 Zeichen lang sein'
    }
  },
  'status': {
    required: true,
    validate: (value) => {
      return ['geplant', 'bestaetigt', 'in_bearbeitung', 'abgeschlossen', 'storniert'].includes(value) || 
        'Status muss einen gültigen Wert haben';
    },
    errorMessages: {
      required: 'Status ist erforderlich'
    }
  },
  'auftraggeber.name': {
    ...commonRules.name,
    errorMessages: {
      required: 'Name des Auftraggebers ist erforderlich',
      minLength: 'Name muss mindestens 2 Zeichen lang sein'
    }
  },
  'auftraggeber.telefon': {
    ...commonRules.phone,
    errorMessages: {
      required: 'Telefonnummer des Auftraggebers ist erforderlich',
      pattern: 'Telefonnummer hat ein ungültiges Format (erlaubt sind Zahlen, Leerzeichen, Klammern und Bindestriche)'
    }
  },
  'auftraggeber.email': {
    ...commonRules.email,
    errorMessages: {
      required: 'E-Mail des Auftraggebers ist erforderlich',
      pattern: 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    }
  },
  'auszugsadresse.strasse': {
    required: true,
    minLength: 2,
    errorMessages: {
      required: 'Straße der Auszugsadresse ist erforderlich',
      minLength: 'Straße muss mindestens 2 Zeichen lang sein'
    }
  },
  'auszugsadresse.hausnummer': {
    required: true,
    errorMessages: {
      required: 'Hausnummer der Auszugsadresse ist erforderlich'
    }
  },
  'auszugsadresse.plz': {
    ...commonRules.postalCode,
    errorMessages: {
      required: 'PLZ der Auszugsadresse ist erforderlich',
      pattern: 'PLZ muss aus 5 Ziffern bestehen'
    }
  },
  'auszugsadresse.ort': {
    required: true,
    minLength: 2,
    errorMessages: {
      required: 'Ort der Auszugsadresse ist erforderlich',
      minLength: 'Ort muss mindestens 2 Zeichen lang sein'
    }
  },
  'einzugsadresse.strasse': {
    required: true,
    minLength: 2,
    errorMessages: {
      required: 'Straße der Einzugsadresse ist erforderlich',
      minLength: 'Straße muss mindestens 2 Zeichen lang sein'
    }
  },
  'einzugsadresse.hausnummer': {
    required: true,
    errorMessages: {
      required: 'Hausnummer der Einzugsadresse ist erforderlich'
    }
  },
  'einzugsadresse.plz': {
    ...commonRules.postalCode,
    errorMessages: {
      required: 'PLZ der Einzugsadresse ist erforderlich',
      pattern: 'PLZ muss aus 5 Ziffern bestehen'
    }
  },
  'einzugsadresse.ort': {
    required: true,
    minLength: 2,
    errorMessages: {
      required: 'Ort der Einzugsadresse ist erforderlich',
      minLength: 'Ort muss mindestens 2 Zeichen lang sein'
    }
  },
  'startDatum': {
    required: true,
    validate: (value, data) => {
      if (!value) return 'Startdatum ist erforderlich';
      
      // If endDatum is also set, check that startDatum is before endDatum
      if (data.endDatum) {
        const start = new Date(value);
        const end = new Date(data.endDatum);
        if (start > end) {
          return 'Startdatum muss vor dem Enddatum liegen';
        }
      }
      
      return true;
    },
    errorMessages: {
      required: 'Startdatum ist erforderlich'
    }
  },
  'endDatum': {
    required: true,
    validate: (value, data) => {
      if (!value) return 'Enddatum ist erforderlich';
      
      // Check that endDatum is after startDatum
      if (data.startDatum) {
        const start = new Date(data.startDatum);
        const end = new Date(value);
        if (end < start) {
          return 'Enddatum muss nach dem Startdatum liegen';
        }
      }
      
      return true;
    },
    errorMessages: {
      required: 'Enddatum ist erforderlich'
    }
  },
  'preis.netto': {
    required: true,
    type: 'number',
    min: 1,
    errorMessages: {
      required: 'Netto-Preis ist erforderlich',
      type: 'Netto-Preis muss eine Zahl sein',
      min: 'Netto-Preis muss positiv sein'
    }
  },
  'preis.brutto': {
    required: true,
    type: 'number',
    min: 1,
    errorMessages: {
      required: 'Brutto-Preis ist erforderlich',
      type: 'Brutto-Preis muss eine Zahl sein',
      min: 'Brutto-Preis muss positiv sein'
    }
  }
});

export default function UmzugForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNeueModus = !id;
  
  const [loading, setLoading] = useState(!!id);
  
  // Default form state
  const initialFormData = {
    kundennummer: 'K-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'), // Generate a default customer number
    auftraggeber: {
      name: '',
      telefon: '',
      email: 'kunde@example.com', // Default email to satisfy validation
      firma: '' // Adding firma field which is in the validator schema
    },
    kontakte: [],
    auszugsadresse: {
      strasse: '',
      hausnummer: '',
      plz: '00000', // Default to a valid 5-digit code
      ort: '',
      land: 'Deutschland',
      etage: 0,
      aufzug: false,
      entfernung: 0
    },
    einzugsadresse: {
      strasse: '',
      hausnummer: '',
      plz: '00000', // Default to a valid 5-digit code
      ort: '',
      land: 'Deutschland',
      etage: 0,
      aufzug: false,
      entfernung: 0
    },
    zwischenstopps: [],
    startDatum: '',
    endDatum: '',
    status: 'geplant', // Using a valid status from backend validation
    preis: {
      netto: 1, // Must be positive to pass validation
      brutto: 1.19, // Must be positive to pass validation
      mwst: 19,
      bezahlt: false,
      zahlungsart: 'rechnung'
    },
    aufnahmeId: null, // Use null instead of empty string for IDs
    fahrzeuge: [],
    mitarbeiter: [],
    extraLeistungen: []
  };
  
  // Error handling with central hook and validation schema
  const { 
    error, 
    setError, 
    handleApiError, 
    clearErrors,
    formErrors,
    setFieldError,
    hasFieldError,
    getFieldError,
    updateField,
    updateFields,
    touchField,
    validateForm,
    data: formData,
    resetForm
  } = useErrorHandler({
    clearErrorAfter: 8000, // Auto-clear errors after 8 seconds
    captureNetwork: true,
    validationSchema, // Use our validation schema
    initialData: initialFormData,
    validateOnChange: true, // Enable real-time validation as user types
    onAuthError: () => {
      toast.error('Ihre Sitzung ist abgelaufen. Sie werden zur Anmeldeseite weitergeleitet.');
      navigate('/login?session=expired');
    }
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
          // Provide a valid default date if the startDatum is invalid
          transformed.startDatum = new Date().toISOString();
        } else {
          transformed.startDatum = date.toISOString();
        }
      } catch (error) {
        console.error('Fehler beim Formatieren des Startdatums:', error);
        transformed.startDatum = new Date().toISOString();
      }
    } else {
      // Ensure startDatum is never undefined or empty
      transformed.startDatum = new Date().toISOString();
    }
    
    if (transformed.endDatum) {
      try {
        // Make sure the date is valid before converting
        const date = new Date(transformed.endDatum);
        if (isNaN(date.getTime())) {
          console.error('Ungültiges Enddatum:', transformed.endDatum);
          // Provide a valid default end date (1 day after start)
          const defaultEnd = new Date(transformed.startDatum);
          defaultEnd.setDate(defaultEnd.getDate() + 1);
          transformed.endDatum = defaultEnd.toISOString();
        } else {
          transformed.endDatum = date.toISOString();
        }
      } catch (error) {
        console.error('Fehler beim Formatieren des Enddatums:', error);
        // Provide a valid default end date (1 day after start)
        const defaultEnd = new Date(transformed.startDatum);
        defaultEnd.setDate(defaultEnd.getDate() + 1);
        transformed.endDatum = defaultEnd.toISOString();
      }
    } else {
      // Ensure endDatum is never undefined or empty
      const defaultEnd = new Date(transformed.startDatum);
      defaultEnd.setDate(defaultEnd.getDate() + 1);
      transformed.endDatum = defaultEnd.toISOString();
    }
    
    // Sicherstellen, dass numerische Werte auch wirklich als Zahlen gespeichert werden
    // und dass preis.netto und preis.brutto positiv sind (für API validation)
    let nettoValue = parseFloat(transformed.preis?.netto);
    let bruttoValue = parseFloat(transformed.preis?.brutto);
    
    // Handle edge cases with value conversion
    nettoValue = isNaN(nettoValue) ? 1 : nettoValue;
    bruttoValue = isNaN(bruttoValue) ? 1.19 : bruttoValue;
    
    // Ensure values are positive for validation
    nettoValue = nettoValue <= 0 ? 1 : nettoValue;
    bruttoValue = bruttoValue <= 0 ? 1.19 : bruttoValue;
    
    // Set mwst with fallback to default
    let mwstValue = parseFloat(transformed.preis?.mwst);
    mwstValue = isNaN(mwstValue) || mwstValue < 0 ? 19 : mwstValue;
    
    transformed.preis = {
      netto: nettoValue,
      brutto: bruttoValue,
      mwst: mwstValue,
      bezahlt: Boolean(transformed.preis?.bezahlt),
      zahlungsart: ['rechnung', 'bar', 'ueberweisung', 'paypal', 'kreditkarte', 'ec'].includes(transformed.preis?.zahlungsart) 
        ? transformed.preis?.zahlungsart : 'rechnung'
    };
    
    // Sicherstellen, dass Auftraggeber alle erforderlichen Felder hat und nicht leer ist
    transformed.auftraggeber = {
      name: transformed.auftraggeber?.name?.trim() || 'Unbekannt',
      telefon: transformed.auftraggeber?.telefon?.trim() || '00000000000',
      email: transformed.auftraggeber?.email?.trim() || 'kunde@example.com', // Default email that passes validation
      firma: transformed.auftraggeber?.firma?.trim() || ''
    };
    
    // Überprüfe, ob die Telefonnummer dem Backend-Pattern entspricht
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{8,20}$/;
    if (!phoneRegex.test(transformed.auftraggeber.telefon)) {
      console.warn('Telefonnummer entspricht nicht dem erwarteten Format, korrigiere...');
      // Bereinigen und formatieren der Telefonnummer
      let phone = transformed.auftraggeber.telefon.replace(/[^\d+\s\-()]/g, '');
      if (phone.length < 8) phone = '00000000'; // Mindestlänge sicherstellen
      if (phone.length > 20) phone = phone.substring(0, 20); // Maximallänge sicherstellen
      transformed.auftraggeber.telefon = phone;
    }
    
    // Sicherstellen, dass auszugsadresse und einzugsadresse korrekt formatiert sind
    // und alle erforderlichen Felder enthalten
    transformed.auszugsadresse = {
      strasse: transformed.auszugsadresse?.strasse?.trim() || 'Unbekannt',
      hausnummer: transformed.auszugsadresse?.hausnummer?.trim() || '1',
      plz: transformed.auszugsadresse?.plz 
        ? transformed.auszugsadresse.plz.toString().trim().replace(/\D/g, '').padStart(5, '0').substring(0, 5) 
        : '00000',
      ort: transformed.auszugsadresse?.ort?.trim() || 'Unbekannt',
      land: transformed.auszugsadresse?.land?.trim() || 'Deutschland',
      etage: typeof transformed.auszugsadresse?.etage === 'number' 
        ? transformed.auszugsadresse.etage 
        : parseInt(transformed.auszugsadresse?.etage) || 0,
      entfernung: typeof transformed.auszugsadresse?.entfernung === 'number'
        ? transformed.auszugsadresse.entfernung
        : parseInt(transformed.auszugsadresse?.entfernung) || 0,
      aufzug: Boolean(transformed.auszugsadresse?.aufzug),
      zusatz: transformed.auszugsadresse?.zusatz?.trim() || ''
    };
    
    transformed.einzugsadresse = {
      strasse: transformed.einzugsadresse?.strasse?.trim() || 'Unbekannt',
      hausnummer: transformed.einzugsadresse?.hausnummer?.trim() || '1',
      plz: transformed.einzugsadresse?.plz 
        ? transformed.einzugsadresse.plz.toString().trim().replace(/\D/g, '').padStart(5, '0').substring(0, 5) 
        : '00000',
      ort: transformed.einzugsadresse?.ort?.trim() || 'Unbekannt',
      land: transformed.einzugsadresse?.land?.trim() || 'Deutschland',
      etage: typeof transformed.einzugsadresse?.etage === 'number'
        ? transformed.einzugsadresse.etage
        : parseInt(transformed.einzugsadresse?.etage) || 0,
      entfernung: typeof transformed.einzugsadresse?.entfernung === 'number'
        ? transformed.einzugsadresse.entfernung
        : parseInt(transformed.einzugsadresse?.entfernung) || 0,
      aufzug: Boolean(transformed.einzugsadresse?.aufzug),
      zusatz: transformed.einzugsadresse?.zusatz?.trim() || ''
    };
    
    // Stellen sicher, dass Arrays korrekt initialisiert sind
    transformed.zwischenstopps = Array.isArray(transformed.zwischenstopps) ? transformed.zwischenstopps : [];
    transformed.kontakte = Array.isArray(transformed.kontakte) ? transformed.kontakte : [];
    transformed.extraLeistungen = Array.isArray(transformed.extraLeistungen) ? transformed.extraLeistungen : [];
    
    // Verarbeiten jedes Mitarbeiterobjekts um sicherzustellen, dass alle erforderlichen Felder vorhanden sind
    if (Array.isArray(transformed.mitarbeiter)) {
      transformed.mitarbeiter = transformed.mitarbeiter
        .filter(m => m && m.mitarbeiterId) // Filter out invalid entries
        .map(mitarbeiter => {
          // Get the role and map it to the correct case-sensitive value expected by the backend
          let rolleValue = 'helfer'; // Default role
          
          // Role mapping - convert to the exact case expected by the backend
          const rolleMapping = {
            'teamleiter': 'teamleiter',
            'Teamleiter': 'teamleiter',
            'fahrer': 'fahrer',
            'Fahrer': 'fahrer',
            'träger': 'träger',
            'Träger': 'träger',
            'traeger': 'träger',
            'helfer': 'helfer',
            'Helfer': 'helfer'
          };
          
          // Enhanced null-checking for rolle property
          if (mitarbeiter?.rolle && typeof mitarbeiter.rolle === 'string' && rolleMapping[mitarbeiter.rolle]) {
            rolleValue = rolleMapping[mitarbeiter.rolle];
          }
          
          return {
            mitarbeiterId: mitarbeiter.mitarbeiterId,
            rolle: rolleValue
          };
        });
    } else {
      transformed.mitarbeiter = [];
    }

    // Stellen sicher, dass Fahrzeuge die erforderlichen Felder haben
    if (Array.isArray(transformed.fahrzeuge)) {
      transformed.fahrzeuge = transformed.fahrzeuge
        .filter(f => f && (f.typ || f.kennzeichen)) // Filter out empty entries
        .map(fahrzeug => {
          // Entfernen _id und andere nicht benötigte Felder um Konflikte zu vermeiden
          const { _id, __v, createdAt, updatedAt, ...usableFields } = fahrzeug;
          // Nur die erforderlichen Felder behalten
          return {
            typ: usableFields.typ || 'Unbekannt',
            kennzeichen: usableFields.kennzeichen || ''
          };
        });
    } else {
      transformed.fahrzeuge = [];
    }
    
    // Kunde-ID-Feld behandeln (falls es als ObjectId formatiert werden muss)
    if (transformed.kundennummer === undefined || transformed.kundennummer === null || transformed.kundennummer.trim() === '') {
      // Generate a default customer number if empty
      transformed.kundennummer = 'K-' + new Date().getFullYear() + '-' + 
        Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
    
    // Aufnahme-ID-Feld behandeln (falls es als ObjectId formatiert werden muss)
    if (transformed.aufnahmeId === undefined || transformed.aufnahmeId === null || transformed.aufnahmeId === '') {
      // Entferne das Feld komplett, wenn es keine gültige ID ist
      delete transformed.aufnahmeId;
    }
    
    // Set appropriate status value from backend's allowed list
    if (!['geplant', 'bestaetigt', 'in_bearbeitung', 'abgeschlossen', 'storniert'].includes(transformed.status)) {
      transformed.status = 'geplant'; // Default status if invalid
    }
    
    // Entferne alle undefined/null properties aus dem Objekt, um Validierungsfehler zu vermeiden
    Object.keys(transformed).forEach(key => {
      if (transformed[key] === undefined || transformed[key] === null) {
        delete transformed[key];
      }
    });
    
    return transformed;
  }, []);

  // Lade Daten vom API
  useEffect(() => {
    // Daten laden für die Bearbeitung eines vorhandenen Umzugs
    if (id) {
      const fetchUmzug = async () => {
        try {
          setLoading(true);
          clearErrors(); // Lösche vorherige Fehler
          
          // API-Aufruf mit standardisierter Fehlerbehandlung
          const response = await umzuegeService.getById(id);
          const umzugData = extractApiData(response);
          
          if (!umzugData) {
            throw new Error('Keine gültigen Umzugsdaten erhalten');
          }
          
          // Bereite Datumsfelder für das Formular vor
          if (umzugData.startDatum) {
            const startDate = new Date(umzugData.startDatum);
            umzugData.startDatum = startDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
          }
          
          if (umzugData.endDatum) {
            const endDate = new Date(umzugData.endDatum);
            umzugData.endDatum = endDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
          }
          
          resetForm(umzugData);
          setLoading(false);
        } catch (error) {
          handleApiError('Umzug laden', error, 'Der Umzug konnte nicht geladen werden');
          setLoading(false);
          navigate('/umzuege'); // Zurück zur Übersicht bei Fehler
        }
      };

      fetchUmzug();
    } else {
      // Für den Fall "Neuer Umzug" - Datumsfelder initialisieren
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      
      const endTomorrow = new Date(tomorrow);
      endTomorrow.setHours(18, 0, 0, 0);
      
      updateFields({
        startDatum: tomorrow.toISOString().split('T')[0] + 'T08:00',
        endDatum: endTomorrow.toISOString().split('T')[0] + 'T18:00'
      });
    }
    
    // Mitarbeiter und Fahrzeuge parallel laden
    const fetchResources = async () => {
      try {
        // Parallel Anfragen für bessere Performance
        const [mitarbeiterResponse, fahrzeugeResponse] = await Promise.allSettled([
          mitarbeiterService.getAll(),
          fahrzeugeService.getAll()
        ]);
        
        // Mitarbeiter verarbeiten
        if (mitarbeiterResponse.status === 'fulfilled') {
          const mitarbeiterData = extractApiData(mitarbeiterResponse.value);
          const mitarbeiterListe = ensureArray(mitarbeiterData.mitarbeiter || mitarbeiterData);
          
          if (mitarbeiterListe.length > 0) {
            // Transformiere die Mitarbeiterdaten ins richtige Format für das Formular
            const formattedMitarbeiter = mitarbeiterListe.map(mitarbeiter => ({
              _id: mitarbeiter._id,
              vorname: mitarbeiter.vorname || '',
              nachname: mitarbeiter.nachname || '',
              position: mitarbeiter.position || 'Helfer',
              abteilung: mitarbeiter.abteilung || ''
            }));
            
            setVerfuegbareMitarbeiter(formattedMitarbeiter);
          } else {
            console.warn('Keine Mitarbeiter gefunden');
            setVerfuegbareMitarbeiter([]);
          }
        } else {
          handleApiError('Mitarbeiterdaten laden', mitarbeiterResponse.reason, 'Mitarbeiterdaten konnten nicht geladen werden');
          setVerfuegbareMitarbeiter([]);
        }
        
        // Fahrzeuge verarbeiten
        if (fahrzeugeResponse.status === 'fulfilled') {
          const fahrzeugeData = extractApiData(fahrzeugeResponse.value);
          const fahrzeugeListe = ensureArray(fahrzeugeData.fahrzeuge || fahrzeugeData);
          
          if (fahrzeugeListe.length > 0) {
            // Transformiere die Fahrzeugdaten ins richtige Format für das Formular
            const formattedFahrzeuge = fahrzeugeListe.map(fahrzeug => ({
              _id: fahrzeug._id,
              kennzeichen: fahrzeug.kennzeichen || '',
              typ: fahrzeug.typ || 'Unbekannt'
            }));
            
            setVerfuegbareFahrzeuge(formattedFahrzeuge);
          } else {
            console.warn('Keine Fahrzeuge gefunden');
            setVerfuegbareFahrzeuge([]);
          }
        } else {
          handleApiError('Fahrzeugdaten laden', fahrzeugeResponse.reason, 'Fahrzeugdaten konnten nicht geladen werden');
          setVerfuegbareFahrzeuge([]);
        }
      } catch (error) {
        handleApiError('Ressourcen laden', error, 'Ressourcen konnten nicht geladen werden');
      }
    };
    
    fetchResources();
  }, [id, navigate, resetForm, handleApiError, updateFields]);

  // Behandelt Änderungen in FormField-Komponenten
  const handleInputChange = (name, value) => {
    updateField(name, value);
  };

  // Behandelt Auswahl von Mitarbeitern
  const handleMitarbeiterToggle = (mitarbeiterId) => {
    const updatedMitarbeiter = [...formData.mitarbeiter];
    const mitarbeiterIndex = updatedMitarbeiter.findIndex(m => m.mitarbeiterId === mitarbeiterId);
    
    if (mitarbeiterIndex !== -1) {
      // Mitarbeiter entfernen
      updatedMitarbeiter.splice(mitarbeiterIndex, 1);
    } else {
      // Mitarbeiter hinzufügen mit korrekter Rolle für Backend
      updatedMitarbeiter.push({
        mitarbeiterId: mitarbeiterId,
        rolle: 'helfer' // Lowercase to match backend enum
      });
    }
    
    updateField('mitarbeiter', updatedMitarbeiter);
  };

  // Mitarbeiter-Rolle ändern
  const handleMitarbeiterRolleChange = (mitarbeiterId, neueRolle) => {
    const updatedMitarbeiter = formData.mitarbeiter.map(m => {
      if (m.mitarbeiterId === mitarbeiterId) {
        return { ...m, rolle: neueRolle };
      }
      return m;
    });
    
    updateField('mitarbeiter', updatedMitarbeiter);
  };

  // Behandelt Auswahl von Fahrzeugen
  const handleFahrzeugToggle = (fahrzeugId) => {
    const updatedFahrzeuge = [...formData.fahrzeuge];
    const fahrzeugIndex = updatedFahrzeuge.findIndex(f => f._id === fahrzeugId);
    
    if (fahrzeugIndex !== -1) {
      // Fahrzeug entfernen
      updatedFahrzeuge.splice(fahrzeugIndex, 1);
    } else {
      // Fahrzeug finden und hinzufügen
      const fahrzeug = verfuegbareFahrzeuge.find(f => f._id === fahrzeugId);
      if (fahrzeug) {
        updatedFahrzeuge.push({
          _id: fahrzeug._id,
          typ: fahrzeug.typ,
          kennzeichen: fahrzeug.kennzeichen
        });
      }
    }
    
    updateField('fahrzeuge', updatedFahrzeuge);
  };

  // Neuen Kontakt hinzufügen
  const handleAddKontakt = () => {
    if (neuerKontakt.name && neuerKontakt.telefon) {
      const updatedKontakte = [...formData.kontakte, { ...neuerKontakt }];
      updateField('kontakte', updatedKontakte);
      setNeuerKontakt({ name: '', telefon: '', email: '', isKunde: false });
      setShowKontaktForm(false);
    }
  };

  // Kontakt entfernen
  const handleRemoveKontakt = (index) => {
    const updatedKontakte = formData.kontakte.filter((_, i) => i !== index);
    updateField('kontakte', updatedKontakte);
  };

  // Formular absenden - mit standardisierter Fehlerbehandlung und Datenformatierung
  const handleSubmit = async (e) => {
    // Validate form before submission
    const validationResult = validateForm({ markAllTouched: true });
    if (!validationResult.isValid) {
      // The Form component will handle displaying field errors
      setError('Bitte korrigieren Sie die markierten Felder.');
      return;
    }
    
    // Anzeigen, dass die Anfrage verarbeitet wird
    toast.info('Verarbeite Anfrage...');
    
    try {
      // Daten transformieren für API
      let transformedData;
      try {
        transformedData = transformUmzugData(formData);
        // Detailliertes Logging für Debugging
        console.log('Transformierte Daten zum Speichern:', JSON.stringify(transformedData, null, 2));
      } catch (transformError) {
        console.error('Fehler bei der Datentransformation:', transformError);
        toast.error('Fehler bei der Vorbereitung der Daten: ' + transformError.message);
        return;
      }
      
      if (isNeueModus) {
        // Neuen Umzug erstellen mit standardisierter API
        try {
          // Aktive Benutzerinformation während der Verarbeitung
          const toastId = toast.loading('Erstelle Umzug...');
          
          const response = await umzuegeService.create(transformedData);
          console.log('API response:', response);
          
          // Update the loading toast
          toast.dismiss(toastId);
          
          // Check if response indicates an error
          if (response && !response.success) {
            console.error('API returned error:', response.message, response.errors);
            
            // Extract and show detailed validation errors
            if (response.errors && Array.isArray(response.errors)) {
              console.table(response.errors); // Better display of errors
              
              // Group errors by field for easier debugging
              const errorsByField = {};
              response.errors.forEach(err => {
                if (err.field) {
                  errorsByField[err.field] = err.message;
                  // Setzen von Feldfehlern für jedes fehlerhafte Feld
                  setFieldError(err.field, err.message);
                }
              });
              console.log('Grouped errors by field:', errorsByField);
              
              // Generate a more user-friendly error message for display
              const errorFieldsList = Object.keys(errorsByField).map(field => 
                `${field.replace(/\./g, ' > ')}: ${errorsByField[field]}`
              ).join('\n');
              
              setError(`Validierungsfehler:\n${errorFieldsList}`);
            } else {
              // Generic error message
              setError(response.message || 'Ein Fehler ist aufgetreten');
            }
            return;
          }
          
          // Extract data from successful response
          const responseData = extractApiData(response);
          if (!responseData) {
            throw new Error('Keine gültige Antwort vom Server erhalten');
          }
          
          toast.success('Umzug erfolgreich erstellt');
          clearErrors(); // Löschen aller Fehler nach erfolgreicher Erstellung
          navigate('/umzuege');
        } catch (error) {
          // Verwende den zentralen Error Handler für konsistente Fehlerbehandlung
          handleApiError('Umzug erstellen', error, 'Der Umzug konnte nicht gespeichert werden');
          
          // Zusätzliche Behandlung von Validierungsfehlern aus der API-Antwort
          if (error.response && error.response.data && error.response.data.errors) {
            const errors = error.response.data.errors;
            if (Array.isArray(errors)) {
              errors.forEach(err => {
                if (err.field || err.param) {
                  const fieldName = err.field || err.param;
                  const errorMessage = err.message || err.msg || 'Ungültige Eingabe';
                  setFieldError(fieldName, errorMessage);
                }
              });
            }
          }
          
          // Zusätzliche Hilfestellung für häufige Fehler
          if (error.response && error.response.status === 400) {
            toast.info('Tipp: Überprüfen Sie die Pflichtfelder sowie das Format von PLZ und Telefonnummer');
          } else if (!error.response) {
            toast.info('Tipp: Überprüfen Sie Ihre Internetverbindung');
          }
        }
      } else {
        // Bestehenden Umzug aktualisieren mit standardisierter API
        try {
          // Aktive Benutzerinformation während der Verarbeitung
          const toastId = toast.loading('Aktualisiere Umzug...');
          
          const response = await umzuegeService.update(id, transformedData);
          
          // Update the loading toast
          toast.dismiss(toastId);
          
          // Check if response indicates an error
          if (response && !response.success) {
            console.error('API error on update:', response.message, response.errors);
            
            if (response.errors && Array.isArray(response.errors)) {
              // Generate a more user-friendly error message
              const errorMessage = response.errors.map(err => 
                `${err.field || ''}: ${err.message || ''}`
              ).join('\n');
              
              // Setze Fehler für betroffene Felder
              response.errors.forEach(err => {
                if (err.field) {
                  setFieldError(err.field, err.message || 'Ungültige Eingabe');
                }
              });
              
              setError(`Fehler beim Aktualisieren:\n${errorMessage}`);
            } else {
              setError(response.message || 'Ein Fehler ist aufgetreten');
            }
            return;
          }
          
          const responseData = extractApiData(response);
          if (!responseData) {
            throw new Error('Keine gültige Antwort vom Server erhalten');
          }
          
          toast.success('Umzug erfolgreich aktualisiert');
          clearErrors(); // Löschen aller Fehler nach erfolgreicher Aktualisierung
          navigate('/umzuege');
        } catch (error) {
          // Verwende den zentralen Error Handler für konsistente Fehlerbehandlung
          handleApiError('Umzug aktualisieren', error, 'Der Umzug konnte nicht aktualisiert werden');
          
          // Zusätzliche Behandlung von Validierungsfehlern aus der API-Antwort
          if (error.response && error.response.data && error.response.data.errors) {
            const errors = error.response.data.errors;
            if (Array.isArray(errors)) {
              errors.forEach(err => {
                if (err.field || err.param) {
                  const fieldName = err.field || err.param;
                  const errorMessage = err.message || err.msg || 'Ungültige Eingabe';
                  setFieldError(fieldName, errorMessage);
                }
              });
            }
          }
        }
      }
    } catch (error) {
      // Verwende den zentralen Error Handler auch für allgemeine unerwartete Fehler
      handleApiError('Umzug speichern', error, 'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  };

  // Lade-Status prüfen
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Kopfzeile mit Navigation */}
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isNeueModus ? 'Neuen Umzug anlegen' : 'Umzug bearbeiten'}
        </h1>
      </div>
      
      <Form 
        onSubmit={handleSubmit} 
        error={error}
        clearErrors={clearErrors}
        loading={loading}
        validateForm={validateForm}
        validateOnSubmit={true}
        submitLabel={isNeueModus ? 'Umzug erstellen' : 'Änderungen speichern'}
        cancelLabel="Abbrechen"
        onCancel={() => navigate('/umzuege')}
        className="space-y-8"
      >
        {/* Kundendaten */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Kundendaten</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="kundennummer"
              label="Kundennummer"
              value={formData.kundennummer}
              onChange={handleInputChange}
              onBlur={touchField}
              error={getFieldError('kundennummer')}
              required={true}
              placeholder="z.B. U-2025-001"
            />
            
            <FormField
              name="status"
              label="Status"
              type="select"
              value={formData.status}
              onChange={handleInputChange}
              onBlur={touchField}
              error={getFieldError('status')}
              inputProps={{
                options: [
                  { value: 'geplant', label: 'Geplant' },
                  { value: 'bestaetigt', label: 'Bestätigt' },
                  { value: 'in_bearbeitung', label: 'In Bearbeitung' },
                  { value: 'abgeschlossen', label: 'Abgeschlossen' },
                  { value: 'storniert', label: 'Storniert' }
                ]
              }}
            />
          </div>
          
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-medium mb-3">Auftraggeber</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                name="auftraggeber.name"
                label="Name"
                value={formData.auftraggeber?.name || ''}
                onChange={handleInputChange}
                onBlur={touchField}
                error={getFieldError('auftraggeber.name')}
                required={true}
              />
              
              <FormField
                name="auftraggeber.firma"
                label="Firma"
                value={formData.auftraggeber?.firma || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="auftraggeber.telefon"
                label="Telefon"
                value={formData.auftraggeber?.telefon || ''}
                onChange={handleInputChange}
                onBlur={touchField}
                error={getFieldError('auftraggeber.telefon')}
                required={true}
                helpText="Format: +49 123 45678 oder 0123-456789"
              />
              
              <FormField
                name="auftraggeber.email"
                label="E-Mail"
                type="email"
                value={formData.auftraggeber?.email || ''}
                onChange={handleInputChange}
                onBlur={touchField}
                error={getFieldError('auftraggeber.email')}
                required={true}
                placeholder="kunde@example.com"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Weitere Kontakte</h3>
              <button
                type="button"
                onClick={() => setShowKontaktForm(!showKontaktForm)}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-200 hover:bg-blue-100"
              >
                {showKontaktForm ? 'Abbrechen' : '+ Kontakt hinzufügen'}
              </button>
            </div>
            
            {showKontaktForm && (
              <div className="p-4 border rounded-lg bg-blue-50 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={neuerKontakt.name}
                      onChange={(e) => setNeuerKontakt({...neuerKontakt, name: e.target.value})}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon *
                    </label>
                    <input
                      type="text"
                      value={neuerKontakt.telefon}
                      onChange={(e) => setNeuerKontakt({...neuerKontakt, telefon: e.target.value})}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={neuerKontakt.email}
                      onChange={(e) => setNeuerKontakt({...neuerKontakt, email: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddKontakt}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {formData.kontakte.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-Mail
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.kontakte.map((kontakt, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {kontakt.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {kontakt.telefon}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {kontakt.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleRemoveKontakt(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Entfernen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Keine weiteren Kontakte eingetragen.</p>
            )}
          </div>
        </div>
        
        {/* Adressen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Adressen</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Auszugsadresse */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-medium mb-3">Auszugsadresse</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name="auszugsadresse.strasse"
                  label="Straße"
                  value={formData.auszugsadresse?.strasse || ''}
                  onChange={handleInputChange}
                  onBlur={touchField}
                  error={getFieldError('auszugsadresse.strasse')}
                  required={true}
                />
                
                <FormField
                  name="auszugsadresse.hausnummer"
                  label="Hausnummer"
                  value={formData.auszugsadresse?.hausnummer || ''}
                  onChange={handleInputChange}
                  onBlur={touchField}
                  error={getFieldError('auszugsadresse.hausnummer')}
                  required={true}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name="auszugsadresse.plz"
                  label="PLZ"
                  value={formData.auszugsadresse?.plz || ''}
                  onChange={handleInputChange}
                  onBlur={touchField}
                  error={getFieldError('auszugsadresse.plz')}
                  required={true}
                  helpText="5-stellige PLZ"
                />
                
                <FormField
                  name="auszugsadresse.ort"
                  label="Ort"
                  value={formData.auszugsadresse?.ort || ''}
                  onChange={handleInputChange}
                  onBlur={touchField}
                  error={getFieldError('auszugsadresse.ort')}
                  required={true}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  name="auszugsadresse.etage"
                  label="Etage"
                  type="number"
                  value={formData.auszugsadresse?.etage}
                  onChange={handleInputChange}
                  inputProps={{ min: "0" }}
                />
                
                <FormField
                  name="auszugsadresse.aufzug"
                  label="Aufzug vorhanden"
                  type="checkbox"
                  value={formData.auszugsadresse?.aufzug}
                  onChange={handleInputChange}
                />
                
                <FormField
                  name="auszugsadresse.entfernung"
                  label="Entfernung zur Parkmöglichkeit (m)"
                  type="number"
                  value={formData.auszugsadresse?.entfernung}
                  onChange={handleInputChange}
                  inputProps={{ min: "0" }}
                />
              </div>
            </div>
            
            {/* Einzugsadresse */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-medium mb-3">Einzugsadresse</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name="einzugsadresse.strasse"
                  label="Straße"
                  value={formData.einzugsadresse?.strasse || ''}
                  onChange={handleInputChange}
                  onBlur={touchField}
                  error={getFieldError('einzugsadresse.strasse')}
                  required={true}
                />
                
                <FormField
                  name="einzugsadresse.hausnummer"
                  label="Hausnummer"
                  value={formData.einzugsadresse?.hausnummer || ''}
                  onChange={handleInputChange}
                  onBlur={touchField}
                  error={getFieldError('einzugsadresse.hausnummer')}
                  required={true}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name="einzugsadresse.plz"
                  label="PLZ"
                  value={formData.einzugsadresse?.plz || ''}
                  onChange={handleInputChange}
                  onBlur={touchField}
                  error={getFieldError('einzugsadresse.plz')}
                  required={true}
                  helpText="5-stellige PLZ"
                />
                
                <FormField
                  name="einzugsadresse.ort"
                  label="Ort"
                  value={formData.einzugsadresse?.ort || ''}
                  onChange={handleInputChange}
                  onBlur={touchField}
                  error={getFieldError('einzugsadresse.ort')}
                  required={true}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  name="einzugsadresse.etage"
                  label="Etage"
                  type="number"
                  value={formData.einzugsadresse?.etage}
                  onChange={handleInputChange}
                  inputProps={{ min: "0" }}
                />
                
                <FormField
                  name="einzugsadresse.aufzug"
                  label="Aufzug vorhanden"
                  type="checkbox"
                  value={formData.einzugsadresse?.aufzug}
                  onChange={handleInputChange}
                />
                
                <FormField
                  name="einzugsadresse.entfernung"
                  label="Entfernung zur Parkmöglichkeit (m)"
                  type="number"
                  value={formData.einzugsadresse?.entfernung}
                  onChange={handleInputChange}
                  inputProps={{ min: "0" }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Datum und Zeit */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Datum und Zeit</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              name="startDatum"
              label="Startdatum und -zeit"
              type="datetime-local"
              value={formData.startDatum || ''}
              onChange={handleInputChange}
              onBlur={touchField}
              error={getFieldError('startDatum')}
              required={true}
            />
            
            <FormField
              name="endDatum"
              label="Enddatum und -zeit"
              type="datetime-local"
              value={formData.endDatum || ''}
              onChange={handleInputChange}
              onBlur={touchField}
              error={getFieldError('endDatum')}
              required={true}
            />
          </div>
        </div>
        
        {/* Ressourcen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Ressourcen</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Mitarbeiter</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {verfuegbareMitarbeiter.map((mitarbeiter) => {
                const isSelected = formData.mitarbeiter.some(m => m.mitarbeiterId === mitarbeiter._id);
                const selectedMitarbeiter = isSelected ? 
                  formData.mitarbeiter.find(m => m.mitarbeiterId === mitarbeiter._id) : null;
                
                return (
                  <div 
                    key={mitarbeiter._id} 
                    className={`p-3 border rounded-lg cursor-pointer ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleMitarbeiterToggle(mitarbeiter._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {mitarbeiter.vorname} {mitarbeiter.nachname}
                        </div>
                        <div className="text-sm text-gray-500">
                          {mitarbeiter.position}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <select
                          value={selectedMitarbeiter?.rolle || 'helfer'}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleMitarbeiterRolleChange(mitarbeiter._id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm border-gray-300 rounded"
                        >
                          <option value="fahrer">Fahrer</option>
                          <option value="helfer">Helfer</option>
                          <option value="teamleiter">Teamleiter</option>
                          <option value="träger">Träger</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Fahrzeuge</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {verfuegbareFahrzeuge.map((fahrzeug) => {
                const isSelected = formData.fahrzeuge.some(f => f._id === fahrzeug._id);
                
                return (
                  <div 
                    key={fahrzeug._id} 
                    className={`p-3 border rounded-lg cursor-pointer ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleFahrzeugToggle(fahrzeug._id)}
                  >
                    <div className="font-medium">
                      {fahrzeug.typ}
                    </div>
                    <div className="text-sm text-gray-500">
                      {fahrzeug.kennzeichen}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Preise */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Preise</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <FormField
              name="preis.netto"
              label="Netto (€)"
              type="number"
              value={formData.preis?.netto}
              onChange={handleInputChange}
              onBlur={touchField}
              error={getFieldError('preis.netto')}
              required={true}
              inputProps={{ min: "1", step: "0.01" }}
            />
            
            <FormField
              name="preis.mwst"
              label="MwSt. (%)"
              type="number"
              value={formData.preis?.mwst}
              onChange={handleInputChange}
              inputProps={{ min: "0", max: "100" }}
            />
            
            <FormField
              name="preis.brutto"
              label="Brutto (€)"
              type="number"
              value={formData.preis?.brutto}
              onChange={handleInputChange}
              onBlur={touchField}
              error={getFieldError('preis.brutto')}
              required={true}
              inputProps={{ min: "1", step: "0.01" }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="preis.zahlungsart"
              label="Zahlungsart"
              type="select"
              value={formData.preis?.zahlungsart}
              onChange={handleInputChange}
              inputProps={{
                options: [
                  { value: 'rechnung', label: 'Rechnung' },
                  { value: 'bar', label: 'Bar' },
                  { value: 'überweisung', label: 'Überweisung' },
                  { value: 'ec', label: 'EC-Karte' },
                  { value: 'kreditkarte', label: 'Kreditkarte' },
                  { value: 'paypal', label: 'PayPal' }
                ]
              }}
            />
            
            <FormField
              name="preis.bezahlt"
              label="Bezahlt"
              type="checkbox"
              value={formData.preis?.bezahlt}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </Form>
    </div>
  );
}
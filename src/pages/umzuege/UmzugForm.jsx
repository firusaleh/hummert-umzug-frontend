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
      netto: 0, // Use numbers instead of empty strings
      brutto: 0, // Use numbers instead of empty strings
      mwst: 19,
      bezahlt: false,
      zahlungsart: 'rechnung'
    },
    aufnahmeId: null, // Use null instead of empty string for IDs
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
    transformed.preis = {
      netto: typeof transformed.preis?.netto === 'number' || parseFloat(transformed.preis?.netto) >= 0 
        ? parseFloat(transformed.preis?.netto) : 0,
      brutto: typeof transformed.preis?.brutto === 'number' || parseFloat(transformed.preis?.brutto) >= 0 
        ? parseFloat(transformed.preis?.brutto) : 0,
      mwst: typeof transformed.preis?.mwst === 'number' || parseFloat(transformed.preis?.mwst) >= 0 
        ? parseFloat(transformed.preis?.mwst) : 19,
      bezahlt: Boolean(transformed.preis?.bezahlt),
      zahlungsart: ['rechnung', 'bar', 'ueberweisung', 'paypal', 'kreditkarte', 'ec'].includes(transformed.preis?.zahlungsart) 
        ? transformed.preis?.zahlungsart : 'rechnung'
    };
    
    // Sicherstellen, dass Auftraggeber alle erforderlichen Felder hat und nicht leer ist
    transformed.auftraggeber = {
      name: transformed.auftraggeber?.name?.trim() || 'Unbekannt',
      telefon: transformed.auftraggeber?.telefon?.trim() || '00000000000',
      email: transformed.auftraggeber?.email?.trim() || '',
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
        .map(mitarbeiter => ({
          mitarbeiterId: mitarbeiter.mitarbeiterId,
          // Ensure rolle is one of the allowed backend values
          rolle: ['Teamleiter', 'Fahrer', 'Träger', 'Helfer'].includes(mitarbeiter.rolle) 
            ? mitarbeiter.rolle : 'Helfer'
        }));
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
    if (transformed.kundennummer === undefined || transformed.kundennummer === null) {
      transformed.kundennummer = '';
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
          
          setFormData(umzugData);
          setLoading(false);
        } catch (error) {
          console.error('Fehler beim Laden des Umzugs:', error);
          toast.error('Der Umzug konnte nicht geladen werden: ' + (error.message || 'Unbekannter Fehler'));
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
      
      setFormData(prev => ({
        ...prev,
        startDatum: tomorrow.toISOString().split('T')[0] + 'T08:00',
        endDatum: endTomorrow.toISOString().split('T')[0] + 'T18:00'
      }));
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
          console.error('Fehler beim Laden der Mitarbeiter:', mitarbeiterResponse.reason);
          toast.error('Mitarbeiterdaten konnten nicht geladen werden');
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
          console.error('Fehler beim Laden der Fahrzeuge:', fahrzeugeResponse.reason);
          toast.error('Fahrzeugdaten konnten nicht geladen werden');
          setVerfuegbareFahrzeuge([]);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Ressourcen:', error);
        toast.error('Ressourcen konnten nicht geladen werden');
      }
    };
    
    fetchResources();
  }, [id, navigate]);

  // Behandelt Änderungen in Input-Feldern
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Für verschachtelte Objekte wie kunde.name
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Für normale Felder
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Behandelt Auswahl von Mitarbeitern
  const handleMitarbeiterToggle = (mitarbeiterId) => {
    setFormData(prev => {
      const mitarbeiterIndex = prev.mitarbeiter.findIndex(m => m.mitarbeiterId === mitarbeiterId);
      let neueMitarbeiter = [...prev.mitarbeiter];
      
      if (mitarbeiterIndex !== -1) {
        // Mitarbeiter entfernen
        neueMitarbeiter.splice(mitarbeiterIndex, 1);
      } else {
        // Mitarbeiter hinzufügen
        neueMitarbeiter.push({
          mitarbeiterId: mitarbeiterId,
          rolle: 'Helfer'
        });
      }
      
      return {
        ...prev,
        mitarbeiter: neueMitarbeiter
      };
    });
  };

  // Mitarbeiter-Rolle ändern
  const handleMitarbeiterRolleChange = (mitarbeiterId, neueRolle) => {
    setFormData(prev => {
      const neueMitarbeiter = prev.mitarbeiter.map(m => {
        if (m.mitarbeiterId === mitarbeiterId) {
          return { ...m, rolle: neueRolle };
        }
        return m;
      });
      
      return {
        ...prev,
        mitarbeiter: neueMitarbeiter
      };
    });
  };

  // Behandelt Auswahl von Fahrzeugen
  const handleFahrzeugToggle = (fahrzeugId) => {
    setFormData(prev => {
      // Prüfen, ob das Fahrzeug bereits ausgewählt ist
      const fahrzeugIndex = prev.fahrzeuge.findIndex(f => f._id === fahrzeugId);
      let neueFahrzeuge = [...prev.fahrzeuge];
      
      if (fahrzeugIndex !== -1) {
        // Fahrzeug entfernen
        neueFahrzeuge.splice(fahrzeugIndex, 1);
      } else {
        // Fahrzeug finden und hinzufügen
        const fahrzeug = verfuegbareFahrzeuge.find(f => f._id === fahrzeugId);
        if (fahrzeug) {
          neueFahrzeuge.push({
            _id: fahrzeug._id,
            typ: fahrzeug.typ,
            kennzeichen: fahrzeug.kennzeichen
          });
        }
      }
      
      return {
        ...prev,
        fahrzeuge: neueFahrzeuge
      };
    });
  };

  // Neuen Kontakt hinzufügen
  const handleAddKontakt = () => {
    if (neuerKontakt.name && neuerKontakt.telefon) {
      setFormData(prev => ({
        ...prev,
        kontakte: [...prev.kontakte, { ...neuerKontakt }]
      }));
      setNeuerKontakt({ name: '', telefon: '', email: '', isKunde: false });
      setShowKontaktForm(false);
    }
  };

  // Kontakt entfernen
  const handleRemoveKontakt = (index) => {
    setFormData(prev => ({
      ...prev,
      kontakte: prev.kontakte.filter((_, i) => i !== index)
    }));
  };

  // Formular absenden - mit standardisierter Fehlerbehandlung und Datenformatierung
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Anzeigen, dass die Anfrage verarbeitet wird
    toast.info('Verarbeite Anfrage...');
    
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
    
    // Prüfe verschachtelte Felder - striktere Validierung
    requiredFields.forEach(field => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        // Prüfen auf leere Strings und Whitespace
        if (!formData[parent] || 
            !formData[parent][child] || 
            (typeof formData[parent][child] === 'string' && formData[parent][child].trim() === '')) {
          missingFields.push(field);
        }
      } else if (!formData[field] || 
                (typeof formData[field] === 'string' && formData[field].trim() === '')) {
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
      
      // Felder nochmals validieren
      if (!transformedData.auftraggeber.name || transformedData.auftraggeber.name.trim() === '') {
        toast.error('Der Name des Auftraggebers darf nicht leer sein');
        return;
      }
      
      if (!transformedData.auftraggeber.telefon || !/^[+]?[0-9\s\-\(\)]{8,20}$/.test(transformedData.auftraggeber.telefon)) {
        toast.error('Die Telefonnummer des Auftraggebers ist ungültig');
        return;
      }
      
      if (!transformedData.auszugsadresse.plz || !/^\d{5}$/.test(transformedData.auszugsadresse.plz)) {
        toast.error('Die PLZ der Auszugsadresse muss 5 Ziffern haben');
        return;
      }
      
      if (!transformedData.einzugsadresse.plz || !/^\d{5}$/.test(transformedData.einzugsadresse.plz)) {
        toast.error('Die PLZ der Einzugsadresse muss 5 Ziffern haben');
        return;
      }
      
      if (isNeueModus) {
        // Neuen Umzug erstellen mit standardisierter API
        try {
          // Log the exact data being sent to the API for debugging
          console.log('Sending data to API:', JSON.stringify(transformedData, null, 2));
          
          // Special debug for mitarbeiter and fahrzeuge arrays which often cause issues
          console.log('Mitarbeiter:', JSON.stringify(transformedData.mitarbeiter, null, 2));
          console.log('Fahrzeuge:', JSON.stringify(transformedData.fahrzeuge, null, 2));
          console.log('Adresses:', {
            auszug: JSON.stringify(transformedData.auszugsadresse, null, 2),
            einzug: JSON.stringify(transformedData.einzugsadresse, null, 2)
          });
          
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
                }
              });
              console.log('Grouped errors by field:', errorsByField);
              
              // Generate a more user-friendly error message for display
              const errorFieldsList = Object.keys(errorsByField).map(field => 
                `${field.replace(/\./g, ' > ')}: ${errorsByField[field]}`
              ).join('\n');
              
              toast.error(`Validierungsfehler:\n${errorFieldsList}`);
            } else {
              // Generic error message
              toast.error(response.message || 'Ein Fehler ist aufgetreten');
            }
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
          let errorDetails = [];
          
          // Behandlung verschiedener Fehlertypen
          if (error.errors && Array.isArray(error.errors)) {
            // Validierungsfehler aus dem formatApiError Format
            errorDetails = error.errors.map(err => `${err.field || ''}: ${err.message}`);
          } else if (error.response && error.response.data) {
            // Direkte Response-Fehler
            const data = error.response.data;
            
            if (data.message) {
              errorMessage = data.message;
            }
            
            if (data.errors && Array.isArray(data.errors)) {
              errorDetails = data.errors.map(err => 
                `${err.field || err.param || ''}: ${err.message || err.msg || ''}`);
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          // Anzeigen der detaillierten Fehlermeldung
          if (errorDetails.length > 0) {
            toast.error(`${errorMessage}\n\nDetails:\n${errorDetails.join('\n')}`);
          } else {
            toast.error(errorMessage);
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
              
              toast.error(`Fehler beim Aktualisieren:\n${errorMessage}`);
            } else {
              toast.error(response.message || 'Ein Fehler ist aufgetreten');
            }
            return;
          }
          
          const responseData = extractApiData(response);
          if (!responseData) {
            throw new Error('Keine gültige Antwort vom Server erhalten');
          }
          
          toast.success('Umzug erfolgreich aktualisiert');
          navigate('/umzuege');
        } catch (error) {
          console.error('Fehler beim Aktualisieren des Umzugs:', error);
          
          // Fehlermeldung mit Toast
          let errorMessage = 'Der Umzug konnte nicht aktualisiert werden. ';
          
          if (error.response && error.response.data) {
            if (error.response.data.message) {
              errorMessage += error.response.data.message;
            }
            
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              const details = error.response.data.errors.map(err => 
                `${err.field || err.param || ''}: ${err.message || err.msg || ''}`
              ).join('\n');
              
              errorMessage += `\n\nDetails:\n${details}`;
            }
          } else if (error.message) {
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
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Kundendaten */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Kundendaten</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kundennummer
              </label>
              <input
                type="text"
                name="kundennummer"
                value={formData.kundennummer}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                placeholder="z.B. U-2025-001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
              >
                <option value="geplant">Geplant</option>
                <option value="bestaetigt">Bestätigt</option>
                <option value="in_bearbeitung">In Bearbeitung</option>
                <option value="abgeschlossen">Abgeschlossen</option>
                <option value="storniert">Storniert</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-medium mb-3">Auftraggeber</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="auftraggeber.name"
                  value={formData.auftraggeber.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firma
                </label>
                <input
                  type="text"
                  name="auftraggeber.firma"
                  value={formData.auftraggeber.firma}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon *
                </label>
                <input
                  type="text"
                  name="auftraggeber.telefon"
                  value={formData.auftraggeber.telefon}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  name="auftraggeber.email"
                  value={formData.auftraggeber.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Straße *
                  </label>
                  <input
                    type="text"
                    name="auszugsadresse.strasse"
                    value={formData.auszugsadresse.strasse}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hausnummer *
                  </label>
                  <input
                    type="text"
                    name="auszugsadresse.hausnummer"
                    value={formData.auszugsadresse.hausnummer}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    name="auszugsadresse.plz"
                    value={formData.auszugsadresse.plz}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ort *
                  </label>
                  <input
                    type="text"
                    name="auszugsadresse.ort"
                    value={formData.auszugsadresse.ort}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etage
                  </label>
                  <input
                    type="number"
                    name="auszugsadresse.etage"
                    value={formData.auszugsadresse.etage}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    name="auszugsadresse.aufzug"
                    checked={formData.auszugsadresse.aufzug}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Aufzug vorhanden
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entfernung zur Parkmöglichkeit (m)
                  </label>
                  <input
                    type="number"
                    name="auszugsadresse.entfernung"
                    value={formData.auszugsadresse.entfernung}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            {/* Einzugsadresse */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-medium mb-3">Einzugsadresse</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Straße *
                  </label>
                  <input
                    type="text"
                    name="einzugsadresse.strasse"
                    value={formData.einzugsadresse.strasse}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hausnummer *
                  </label>
                  <input
                    type="text"
                    name="einzugsadresse.hausnummer"
                    value={formData.einzugsadresse.hausnummer}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    name="einzugsadresse.plz"
                    value={formData.einzugsadresse.plz}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ort *
                  </label>
                  <input
                    type="text"
                    name="einzugsadresse.ort"
                    value={formData.einzugsadresse.ort}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etage
                  </label>
                  <input
                    type="number"
                    name="einzugsadresse.etage"
                    value={formData.einzugsadresse.etage}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    name="einzugsadresse.aufzug"
                    checked={formData.einzugsadresse.aufzug}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Aufzug vorhanden
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entfernung zur Parkmöglichkeit (m)
                  </label>
                  <input
                    type="number"
                    name="einzugsadresse.entfernung"
                    value={formData.einzugsadresse.entfernung}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Datum und Zeit */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Datum und Zeit</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Startdatum und -zeit *
              </label>
              <input
                type="datetime-local"
                name="startDatum"
                value={formData.startDatum}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enddatum und -zeit *
              </label>
              <input
                type="datetime-local"
                name="endDatum"
                value={formData.endDatum}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
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
                          value={selectedMitarbeiter?.rolle || 'Helfer'}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleMitarbeiterRolleChange(mitarbeiter._id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm border-gray-300 rounded"
                        >
                          <option value="Fahrer">Fahrer</option>
                          <option value="Helfer">Helfer</option>
                          <option value="Teamleiter">Teamleiter</option>
                          <option value="Träger">Träger</option>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Netto (€)
              </label>
              <input
                type="number"
                name="preis.netto"
                value={formData.preis.netto}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MwSt. (%)
              </label>
              <input
                type="number"
                name="preis.mwst"
                value={formData.preis.mwst}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brutto (€)
              </label>
              <input
                type="number"
                name="preis.brutto"
                value={formData.preis.brutto}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zahlungsart
              </label>
              <select
                name="preis.zahlungsart"
                value={formData.preis.zahlungsart}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="rechnung">Rechnung</option>
                <option value="bar">Bar</option>
                <option value="überweisung">Überweisung</option>
                <option value="ec">EC-Karte</option>
                <option value="kreditkarte">Kreditkarte</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                name="preis.bezahlt"
                checked={formData.preis.bezahlt}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Bezahlt
              </label>
            </div>
          </div>
        </div>
        
        {/* Formular-Buttons */}
        <div className="flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={() => navigate('/umzuege')} 
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow"
          >
            {isNeueModus ? 'Umzug erstellen' : 'Änderungen speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
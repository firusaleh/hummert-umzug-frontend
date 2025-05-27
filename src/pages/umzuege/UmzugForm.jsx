import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Card,
  CardContent,
  Chip,
  TextField
} from '@mui/material';
import {
  Save,
  ArrowBack,
  ArrowForward,
  Check,
  Home,
  Person,
  DateRange,
  People,
  Build,
  AttachMoney,
  Notes
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'react-toastify';

// Import modular components
import AddressForm from './components/AddressForm';
import CustomerForm from './components/CustomerForm';
import DateTimeForm from './components/DateTimeForm';
import TeamAssignment from './components/TeamAssignment';
import ServiceSelection from './components/ServiceSelection';

// Import services
import { umzuegeService, clientService } from '../../services/api';

const STEPS = [
  { label: 'Kunde', icon: <Person /> },
  { label: 'Adressen', icon: <Home /> },
  { label: 'Termin', icon: <DateRange /> },
  { label: 'Team', icon: <People /> },
  { label: 'Leistungen', icon: <Build /> },
  { label: 'Übersicht', icon: <AttachMoney /> }
];

const UmzugForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form data with complete structure matching backend
  const [formData, setFormData] = useState({
    // Customer data
    kundennummer: '',
    auftraggeber: null,
    kontakte: [],
    
    // Addresses
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
    
    // Date and time
    startDatum: null,
    endDatum: null,
    
    // Status and team
    status: 'geplant',
    mitarbeiter: [],
    fahrzeuge: [],
    
    // Additional services and notes
    extraLeistungen: [],
    notizen: [],
    
    // Pricing
    preis: {
      netto: 0,
      brutto: 0,
      mwst: 19,
      bezahlt: false,
      zahlungsart: 'Rechnung'
    }
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Load existing Umzug data in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadUmzugData();
    }
  }, [id]);

  const loadUmzugData = async () => {
    try {
      setLoading(true);
      const response = await umzuegeService.getById(id);
      const umzug = response.data;

      // Transform data for form
      setFormData({
        kundennummer: umzug.kundennummer || '',
        auftraggeber: umzug.auftraggeber || null,
        kontakte: umzug.kontakte || [],
        auszugsadresse: umzug.auszugsadresse || {
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: '',
          land: 'Deutschland',
          etage: 0,
          aufzug: false,
          entfernung: 0
        },
        einzugsadresse: umzug.einzugsadresse || {
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: '',
          land: 'Deutschland',
          etage: 0,
          aufzug: false,
          entfernung: 0
        },
        zwischenstopps: umzug.zwischenstopps || [],
        startDatum: umzug.startDatum ? new Date(umzug.startDatum) : null,
        endDatum: umzug.endDatum ? new Date(umzug.endDatum) : null,
        status: umzug.status || 'geplant',
        mitarbeiter: umzug.mitarbeiter || [],
        fahrzeuge: umzug.fahrzeuge || [],
        extraLeistungen: umzug.extraLeistungen || [],
        notizen: umzug.notizen || [],
        preis: umzug.preis || {
          netto: 0,
          brutto: 0,
          mwst: 19,
          bezahlt: false,
          zahlungsart: 'Rechnung'
        }
      });
    } catch (err) {
      console.error('Error loading Umzug:', err);
      setError('Fehler beim Laden der Umzugsdaten');
      toast.error('Fehler beim Laden der Umzugsdaten');
    } finally {
      setLoading(false);
    }
  };

  // Validation for each step
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Customer
        if (!formData.auftraggeber) {
          newErrors.auftraggeber = 'Bitte wählen Sie einen Kunden aus';
        }
        break;

      case 1: // Addresses
        // Auszugsadresse validation
        if (!formData.auszugsadresse.strasse) {
          newErrors.auszugsStrasse = 'Straße ist erforderlich';
        }
        if (!formData.auszugsadresse.hausnummer) {
          newErrors.auszugsHausnummer = 'Hausnummer ist erforderlich';
        }
        if (!formData.auszugsadresse.plz || !/^\d{5}$/.test(formData.auszugsadresse.plz)) {
          newErrors.auszugsPlz = 'Gültige PLZ erforderlich (5 Ziffern)';
        }
        if (!formData.auszugsadresse.ort) {
          newErrors.auszugsOrt = 'Ort ist erforderlich';
        }

        // Einzugsadresse validation
        if (!formData.einzugsadresse.strasse) {
          newErrors.einzugsStrasse = 'Straße ist erforderlich';
        }
        if (!formData.einzugsadresse.hausnummer) {
          newErrors.einzugsHausnummer = 'Hausnummer ist erforderlich';
        }
        if (!formData.einzugsadresse.plz || !/^\d{5}$/.test(formData.einzugsadresse.plz)) {
          newErrors.einzugsPlz = 'Gültige PLZ erforderlich (5 Ziffern)';
        }
        if (!formData.einzugsadresse.ort) {
          newErrors.einzugsOrt = 'Ort ist erforderlich';
        }
        break;

      case 2: // Date & Time
        if (!formData.startDatum) {
          newErrors.startDatum = 'Startdatum ist erforderlich';
        }
        if (!formData.endDatum) {
          newErrors.endDatum = 'Enddatum ist erforderlich';
        }
        if (formData.startDatum && formData.endDatum && formData.startDatum > formData.endDatum) {
          newErrors.endDatum = 'Enddatum muss nach dem Startdatum liegen';
        }
        break;

      case 3: // Team
        if (!formData.mitarbeiter || formData.mitarbeiter.length === 0) {
          newErrors.mitarbeiter = 'Mindestens ein Mitarbeiter muss zugewiesen werden';
        }
        if (!formData.fahrzeuge || formData.fahrzeuge.length === 0) {
          newErrors.fahrzeuge = 'Mindestens ein Fahrzeug muss zugewiesen werden';
        }
        break;

      case 4: // Services
        // Services are optional, no validation needed
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Save handlers
  const handleSave = async () => {
    // Validate all steps
    let allValid = true;
    for (let i = 0; i < STEPS.length - 1; i++) {
      if (!validateStep(i)) {
        allValid = false;
      }
    }

    if (!allValid) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus');
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare data for API - matching backend model exactly
      const apiData = {
        kundennummer: formData.kundennummer || formData.auftraggeber?.kundennummer || '',
        auftraggeber: {
          name: formData.auftraggeber.name,
          telefon: formData.auftraggeber.telefon,
          email: formData.auftraggeber.email,
          isKunde: true
        },
        kontakte: formData.kontakte.length > 0 ? formData.kontakte : [{
          name: formData.auftraggeber.name,
          telefon: formData.auftraggeber.telefon,
          email: formData.auftraggeber.email,
          isKunde: true
        }],
        auszugsadresse: formData.auszugsadresse,
        einzugsadresse: formData.einzugsadresse,
        zwischenstopps: formData.zwischenstopps,
        startDatum: formData.startDatum,
        endDatum: formData.endDatum || formData.startDatum, // Use startDatum as fallback
        status: formData.status,
        mitarbeiter: formData.mitarbeiter.map(m => m._id || m),
        fahrzeuge: formData.fahrzeuge.map(f => f._id || f),
        extraLeistungen: formData.extraLeistungen,
        notizen: formData.notizen,
        preis: formData.preis
      };

      if (isEditMode) {
        await umzuegeService.update(id, apiData);
        setSuccess(true);
        toast.success('Umzug erfolgreich aktualisiert');
        setTimeout(() => {
          navigate('/umzuege');
        }, 1500);
      } else {
        const response = await umzuegeService.create(apiData);
        setSuccess(true);
        toast.success('Umzug erfolgreich erstellt');
        setTimeout(() => {
          navigate(`/umzuege/${response.data._id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving Umzug:', err);
      const errorMessage = err.response?.data?.message || 'Fehler beim Speichern';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    const serviceTotal = formData.extraLeistungen.reduce(
      (sum, service) => sum + (service.preis * (service.menge || 1)),
      0
    );
    return serviceTotal;
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <CustomerForm
            customer={formData.auftraggeber}
            onChange={(auftraggeber) => setFormData({ ...formData, auftraggeber })}
            errors={errors}
          />
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Auszugsadresse
              </Typography>
              <AddressForm
                address={formData.auszugsadresse}
                onChange={(auszugsadresse) => setFormData({ ...formData, auszugsadresse })}
                errors={{
                  strasse: errors.auszugsStrasse,
                  hausnummer: errors.auszugsHausnummer,
                  plz: errors.auszugsPlz,
                  ort: errors.auszugsOrt
                }}
                prefix="auszugs"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Einzugsadresse
              </Typography>
              <AddressForm
                address={formData.einzugsadresse}
                onChange={(einzugsadresse) => setFormData({ ...formData, einzugsadresse })}
                errors={{
                  strasse: errors.einzugsStrasse,
                  hausnummer: errors.einzugsHausnummer,
                  plz: errors.einzugsPlz,
                  ort: errors.einzugsOrt
                }}
                prefix="einzugs"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <DateTimeForm
            startDate={formData.startDatum}
            endDate={formData.endDatum}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
            errors={errors}
          />
        );

      case 3:
        return (
          <TeamAssignment
            employees={formData.mitarbeiter}
            vehicles={formData.fahrzeuge}
            date={formData.startDatum}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
            errors={errors}
          />
        );

      case 4:
        return (
          <ServiceSelection
            services={formData.extraLeistungen}
            onChange={(extraLeistungen) => setFormData({ ...formData, extraLeistungen })}
            errors={errors}
          />
        );

      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Zusammenfassung
            </Typography>
            
            {/* Customer Info */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Kunde
                </Typography>
                {formData.auftraggeber && (
                  <Box>
                    <Typography>{formData.auftraggeber.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.auftraggeber.email} | {formData.auftraggeber.telefon}
                    </Typography>
                    {formData.kundennummer && (
                      <Typography variant="body2" color="text.secondary">
                        Kundennummer: {formData.kundennummer}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Adressen
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" fontWeight="bold">Auszug:</Typography>
                    <Typography variant="body2">
                      {formData.auszugsadresse.strasse} {formData.auszugsadresse.hausnummer}
                    </Typography>
                    <Typography variant="body2">
                      {formData.auszugsadresse.plz} {formData.auszugsadresse.ort}
                    </Typography>
                    {formData.auszugsadresse.etage > 0 && (
                      <Typography variant="body2">
                        {formData.auszugsadresse.etage}. Etage
                        {formData.auszugsadresse.aufzug && ' (mit Aufzug)'}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" fontWeight="bold">Einzug:</Typography>
                    <Typography variant="body2">
                      {formData.einzugsadresse.strasse} {formData.einzugsadresse.hausnummer}
                    </Typography>
                    <Typography variant="body2">
                      {formData.einzugsadresse.plz} {formData.einzugsadresse.ort}
                    </Typography>
                    {formData.einzugsadresse.etage > 0 && (
                      <Typography variant="body2">
                        {formData.einzugsadresse.etage}. Etage
                        {formData.einzugsadresse.aufzug && ' (mit Aufzug)'}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Termin
                </Typography>
                <Typography>
                  Start: {formData.startDatum && format(formData.startDatum, 'EEEE, dd. MMMM yyyy HH:mm', { locale: de })} Uhr
                </Typography>
                {formData.endDatum && formData.endDatum !== formData.startDatum && (
                  <Typography>
                    Ende: {format(formData.endDatum, 'EEEE, dd. MMMM yyyy HH:mm', { locale: de })} Uhr
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Team */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Team
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold">Mitarbeiter:</Typography>
                  {formData.mitarbeiter.map(m => (
                    <Chip
                      key={m._id}
                      label={m.name}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  ))}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold">Fahrzeuge:</Typography>
                  {formData.fahrzeuge.map(f => (
                    <Chip
                      key={f._id}
                      label={`${f.kennzeichen} - ${f.typ}`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Services & Price */}
            {formData.zusatzleistungen.length > 0 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Zusatzleistungen
                  </Typography>
                  {formData.zusatzleistungen.map(service => (
                    <Box key={service.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {service.name} ({service.quantity} {service.unit})
                      </Typography>
                      <Typography variant="body2">
                        {service.totalPrice.toFixed(2)}€
                      </Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Gesamt:</Typography>
                    <Typography variant="subtitle1" color="primary">
                      {calculateTotalPrice().toFixed(2)}€
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {(formData.bemerkungen || formData.interneBemerkungen) && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Bemerkungen
                  </Typography>
                  {formData.bemerkungen && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">Kundenbemerkungen:</Typography>
                      <Typography variant="body2">{formData.bemerkungen}</Typography>
                    </Box>
                  )}
                  {formData.interneBemerkungen && (
                    <Box>
                      <Typography variant="body2" fontWeight="bold">Interne Bemerkungen:</Typography>
                      <Typography variant="body2">{formData.interneBemerkungen}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  // Main render
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Umzug bearbeiten' : 'Neuen Umzug erstellen'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {isEditMode ? 'Umzug erfolgreich aktualisiert!' : 'Umzug erfolgreich erstellt!'}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((step, index) => (
            <Step key={step.label}>
              <StepLabel icon={step.icon}>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: '400px' }}>
          {renderStepContent()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={() => navigate('/umzuege')}
            startIcon={<ArrowBack />}
          >
            Abbrechen
          </Button>

          <Box>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Zurück
              </Button>
            )}

            {activeStep < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
              >
                Weiter
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              >
                {isEditMode ? 'Speichern' : 'Erstellen'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default UmzugForm;

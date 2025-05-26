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
  Chip
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
  AttachMoney
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Import modular components
import AddressForm from './components/AddressForm';
import CustomerForm from './components/CustomerForm';
import DateTimeForm from './components/DateTimeForm';
import TeamAssignment from './components/TeamAssignment';
import ServiceSelection from './components/ServiceSelection';

// Import services
import { umzuegeService } from '../../services/api';

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

  // Form data
  const [formData, setFormData] = useState({
    kunde: null,
    vonAdresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: '',
      etage: '',
      zusatz: ''
    },
    nachAdresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: '',
      etage: '',
      zusatz: ''
    },
    datum: null,
    zeit: null,
    status: 'geplant',
    mitarbeiter: [],
    fahrzeuge: [],
    zusatzleistungen: [],
    notizen: '',
    internalNotes: ''
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
        kunde: umzug.kunde || null,
        vonAdresse: umzug.vonAdresse || {
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: '',
          etage: '',
          zusatz: ''
        },
        nachAdresse: umzug.nachAdresse || {
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: '',
          etage: '',
          zusatz: ''
        },
        datum: umzug.datum ? new Date(umzug.datum) : null,
        zeit: umzug.zeit || null,
        status: umzug.status || 'geplant',
        mitarbeiter: umzug.mitarbeiter || [],
        fahrzeuge: umzug.fahrzeuge || [],
        zusatzleistungen: umzug.zusatzleistungen || [],
        notizen: umzug.notizen || '',
        internalNotes: umzug.internalNotes || ''
      });
    } catch (err) {
      console.error('Error loading Umzug:', err);
      setError('Fehler beim Laden der Umzugsdaten');
    } finally {
      setLoading(false);
    }
  };

  // Validation for each step
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Customer
        if (!formData.kunde) {
          newErrors.kunde = 'Bitte wählen Sie einen Kunden aus';
        }
        break;

      case 1: // Addresses
        // Von Address validation
        if (!formData.vonAdresse.strasse) {
          newErrors.vonStrasse = 'Straße ist erforderlich';
        }
        if (!formData.vonAdresse.hausnummer) {
          newErrors.vonHausnummer = 'Hausnummer ist erforderlich';
        }
        if (!formData.vonAdresse.plz || !/^\d{5}$/.test(formData.vonAdresse.plz)) {
          newErrors.vonPlz = 'Gültige PLZ erforderlich (5 Ziffern)';
        }
        if (!formData.vonAdresse.ort) {
          newErrors.vonOrt = 'Ort ist erforderlich';
        }

        // Nach Address validation
        if (!formData.nachAdresse.strasse) {
          newErrors.nachStrasse = 'Straße ist erforderlich';
        }
        if (!formData.nachAdresse.hausnummer) {
          newErrors.nachHausnummer = 'Hausnummer ist erforderlich';
        }
        if (!formData.nachAdresse.plz || !/^\d{5}$/.test(formData.nachAdresse.plz)) {
          newErrors.nachPlz = 'Gültige PLZ erforderlich (5 Ziffern)';
        }
        if (!formData.nachAdresse.ort) {
          newErrors.nachOrt = 'Ort ist erforderlich';
        }
        break;

      case 2: // Date & Time
        if (!formData.datum) {
          newErrors.datum = 'Datum ist erforderlich';
        }
        if (!formData.zeit) {
          newErrors.zeit = 'Uhrzeit ist erforderlich';
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
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare data for API
      const apiData = {
        kundeId: formData.kunde._id,
        vonAdresse: formData.vonAdresse,
        nachAdresse: formData.nachAdresse,
        datum: formData.datum,
        zeit: formData.zeit,
        status: formData.status,
        mitarbeiterIds: formData.mitarbeiter.map(m => m._id),
        fahrzeugIds: formData.fahrzeuge.map(f => f._id),
        zusatzleistungen: formData.zusatzleistungen,
        notizen: formData.notizen,
        internalNotes: formData.internalNotes
      };

      if (isEditMode) {
        await umzuegeService.update(id, apiData);
        setSuccess(true);
        setTimeout(() => {
          navigate('/umzuege');
        }, 1500);
      } else {
        const response = await umzuegeService.create(apiData);
        setSuccess(true);
        setTimeout(() => {
          navigate(`/umzuege/${response.data._id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving Umzug:', err);
      setError(err.response?.data?.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    const serviceTotal = formData.zusatzleistungen.reduce(
      (sum, service) => sum + (service.totalPrice || 0),
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
            customer={formData.kunde}
            onChange={(kunde) => setFormData({ ...formData, kunde })}
            errors={errors}
          />
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Von Adresse
              </Typography>
              <AddressForm
                address={formData.vonAdresse}
                onChange={(vonAdresse) => setFormData({ ...formData, vonAdresse })}
                errors={{
                  strasse: errors.vonStrasse,
                  hausnummer: errors.vonHausnummer,
                  plz: errors.vonPlz,
                  ort: errors.vonOrt
                }}
                prefix="von"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Nach Adresse
              </Typography>
              <AddressForm
                address={formData.nachAdresse}
                onChange={(nachAdresse) => setFormData({ ...formData, nachAdresse })}
                errors={{
                  strasse: errors.nachStrasse,
                  hausnummer: errors.nachHausnummer,
                  plz: errors.nachPlz,
                  ort: errors.nachOrt
                }}
                prefix="nach"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <DateTimeForm
            date={formData.datum}
            time={formData.zeit}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
            errors={errors}
          />
        );

      case 3:
        return (
          <TeamAssignment
            employees={formData.mitarbeiter}
            vehicles={formData.fahrzeuge}
            date={formData.datum}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
            errors={errors}
          />
        );

      case 4:
        return (
          <ServiceSelection
            services={formData.zusatzleistungen}
            onChange={(zusatzleistungen) => setFormData({ ...formData, zusatzleistungen })}
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
                {formData.kunde && (
                  <Box>
                    <Typography>{formData.kunde.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.kunde.email} | {formData.kunde.telefon}
                    </Typography>
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
                    <Typography variant="body2" fontWeight="bold">Von:</Typography>
                    <Typography variant="body2">
                      {formData.vonAdresse.strasse} {formData.vonAdresse.hausnummer}
                    </Typography>
                    <Typography variant="body2">
                      {formData.vonAdresse.plz} {formData.vonAdresse.ort}
                    </Typography>
                    {formData.vonAdresse.etage && (
                      <Typography variant="body2">
                        {formData.vonAdresse.etage}. Etage
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" fontWeight="bold">Nach:</Typography>
                    <Typography variant="body2">
                      {formData.nachAdresse.strasse} {formData.nachAdresse.hausnummer}
                    </Typography>
                    <Typography variant="body2">
                      {formData.nachAdresse.plz} {formData.nachAdresse.ort}
                    </Typography>
                    {formData.nachAdresse.etage && (
                      <Typography variant="body2">
                        {formData.nachAdresse.etage}. Etage
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
                  {formData.datum && format(formData.datum, 'EEEE, dd. MMMM yyyy', { locale: de })}
                  {formData.zeit && ` um ${formData.zeit} Uhr`}
                </Typography>
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
                      label={`${m.name} (${m.rolle || 'Helfer'})`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
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
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Umzug bearbeiten' : 'Neuen Umzug erstellen'}
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((step, index) => (
            <Step key={step.label}>
              <StepLabel icon={step.icon}>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Umzug wurde erfolgreich {isEditMode ? 'aktualisiert' : 'erstellt'}!
          </Alert>
        )}

        {/* Step Content */}
        <Box sx={{ minHeight: 400 }}>
          {renderStepContent()}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/umzuege')}
            startIcon={<ArrowBack />}
          >
            Abbrechen
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                startIcon={<ArrowBack />}
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
                color="success"
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
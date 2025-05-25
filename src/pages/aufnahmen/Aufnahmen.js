// frontend/src/pages/aufnahmen/Aufnahmen.js
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Grid,
  Pagination,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';

const Aufnahmen = () => {
  const navigate = useNavigate();
  
  // Status-Optionen für den Filter
  const statusOptions = [
    { value: '', label: 'Alle Status' },
    { value: 'in_bearbeitung', label: 'In Bearbeitung' },
    { value: 'abgeschlossen', label: 'Abgeschlossen' },
    { value: 'angebot_erstellt', label: 'Angebot erstellt' },
    { value: 'bestellt', label: 'Bestellt' }
  ];
  
  // Filter-State
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10
  });
  
  // Daten laden
  const { data, isLoading, refetch } = useQuery(
    ['aufnahmen', filter],
    async () => {
      const params = {
        page: filter.page,
        limit: filter.limit
      };

export default AufnahmeDetails;

// frontend/src/pages/aufnahmen/AufnahmeForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import FileUpload from '../../components/common/FileUpload';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import Loading from '../../components/common/Loading';

const AufnahmeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);
  
  // States für Dialoge
  const [raumDialog, setRaumDialog] = useState(false);
  const [moebelDialog, setMoebelDialog] = useState(false);
  const [selectedRaumIndex, setSelectedRaumIndex] = useState(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  
  // Temporäre Daten für Dialoge
  const [tempRaum, setTempRaum] = useState({
    name: '',
    flaeche: '',
    etage: 0,
    besonderheiten: ''
  });
  
  const [tempMoebel, setTempMoebel] = useState({
    name: '',
    anzahl: 1,
    kategorie: 'sonstiges',
    groesse: {
      laenge: '',
      breite: '',
      hoehe: ''
    },
    gewicht: '',
    zerbrechlich: false,
    besonderheiten: '',
    demontage: false,
    montage: false,
    verpackung: false
  });
  
  // Aufnahmedaten laden, wenn im Bearbeitungsmodus
  const { data: aufnahmeData, isLoading: loadingAufnahme } = useQuery(
    ['aufnahme', id],
    async () => {
      if (!isEditMode) return null;
      const response = await api.get(`/aufnahmen/${id}`);
      return response.data;
    },
    {
      enabled: isEditMode,
      onSuccess: (data) => {
        if (data) {
          // Formularwerte setzen
          const initialValues = {
            datum: data.datum ? dayjs(data.datum) : dayjs(),
            kundenName: data.kundenName || '',
            auszugsadresse: data.auszugsadresse || {
              strasse: '',
              hausnummer: '',
              plz: '',
              ort: '',
              land: 'Deutschland',
              etage: 0,
              aufzug: false,
              entfernung: 0
            },
            einzugsadresse: data.einzugsadresse || {
              strasse: '',
              hausnummer: '',
              plz: '',
              ort: '',
              land: 'Deutschland',
              etage: 0,
              aufzug: false,
              entfernung: 0
            },
            raeume: data.raeume || [],
            notizen: data.notizen || '',
            status: data.status || 'in_bearbeitung'
          };
          
          formik.setValues(initialValues);
        }
      }
    }
  );
  
  // Aufnahme erstellen oder aktualisieren
  const aufnahmeMutation = useMutation(
    (aufnahmeData) => {
      if (isEditMode) {
        return api.put(`/aufnahmen/${id}`, aufnahmeData);
      } else {
        return api.post('/aufnahmen', aufnahmeData);
      }
    },
    {
      onSuccess: (response) => {
        toast.success(`Aufnahme erfolgreich ${isEditMode ? 'aktualisiert' : 'erstellt'}`);
        queryClient.invalidateQueries('aufnahmen');
        
        // Zur Detailansicht navigieren
        if (isEditMode) {
          navigate(`/aufnahmen/${id}`);
        } else if (response.data && response.data.aufnahme) {
          navigate(`/aufnahmen/${response.data.aufnahme._id}`);
        } else {
          navigate('/aufnahmen');
        }
      },
      onError: (error) => {
        toast.error(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Bild hochladen
  const bildUploadMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('datei', file);
      formData.append('bezugId', id);
      formData.append('bezugModell', 'Aufnahme');
      formData.append('kategorie', 'bild');
      
      return api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    {
      onSuccess: (response) => {
        // Bild zur Aufnahme hinzufügen
        if (isEditMode && response.data && response.data.datei) {
          api.post(`/aufnahmen/${id}/bild`, {
            pfad: response.data.datei.pfad
          }).then(() => {
            queryClient.invalidateQueries(['aufnahme', id]);
            toast.success('Bild erfolgreich hochgeladen');
            setUploadDialog(false);
          }
    )
    .catch(error => {
      console.error('Error:', error.message);
      // Handle error appropriately
    });
        }
      },
      onError: (error) => {
        toast.error(`Fehler beim Hochladen: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Formik für Aufnahmeformular
  const formik = useFormik({
    initialValues: {
      datum: dayjs(),
      kundenName: '',
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
      raeume: [],
      notizen: '',
      status: 'in_bearbeitung'
    },
    validationSchema: Yup.object({
      kundenName: Yup.string().required('Kundenname ist erforderlich'),
      datum: Yup.date().nullable().required('Datum ist erforderlich')
    }),
    onSubmit: (values) => {
      // Datum formatieren
      const formattedValues = {
        ...values,
        datum: values.datum ? values.datum.toISOString() : new Date().toISOString()
      };
      
      // Gesamtvolumen berechnen
      let gesamtvolumen = 0;
      formattedValues.raeume.forEach(raum => {
        raum.moebel?.forEach(moebel => {
          if (moebel.groesse?.volumen) {
            gesamtvolumen += moebel.groesse.volumen * moebel.anzahl;
          }
        });
      });
      
      formattedValues.gesamtvolumen = gesamtvolumen;
      
      aufnahmeMutation.mutate(formattedValues);
    }
  });
  
  // Raum hinzufügen
  const handleAddRaum = () => {
    const newRaeume = [...formik.values.raeume, { ...tempRaum, moebel: [] }];
    formik.setFieldValue('raeume', newRaeume);
    setTempRaum({
      name: '',
      flaeche: '',
      etage: 0,
      besonderheiten: ''
    });
    setRaumDialog(false);
  };
  
  // Raum entfernen
  const handleRemoveRaum = (index) => {
    const newRaeume = formik.values.raeume.filter((_, i) => i !== index);
    formik.setFieldValue('raeume', newRaeume);
  };
  
  // Möbel-Dialog öffnen
  const handleOpenMoebelDialog = (raumIndex) => {
    setSelectedRaumIndex(raumIndex);
    setMoebelDialog(true);
  };
  
  // Möbel hinzufügen
  const handleAddMoebel = () => {
    if (selectedRaumIndex === null) return;
    
    // Volumen berechnen, wenn Abmessungen vorhanden
    let groesse = { ...tempMoebel.groesse };
    if (groesse.laenge && groesse.breite && groesse.hoehe) {
      const volumen = (groesse.laenge * groesse.breite * groesse.hoehe) / 1000000; // cm³ zu m³
      groesse.volumen = volumen;
    }
    
    const updatedMoebel = { ...tempMoebel, groesse };
    
    const newRaeume = [...formik.values.raeume];
    newRaeume[selectedRaumIndex].moebel = [
      ...(newRaeume[selectedRaumIndex].moebel || []),
      updatedMoebel
    ];
    
    formik.setFieldValue('raeume', newRaeume);
    
    setTempMoebel({
      name: '',
      anzahl: 1,
      kategorie: 'sonstiges',
      groesse: {
        laenge: '',
        breite: '',
        hoehe: ''
      },
      gewicht: '',
      zerbrechlich: false,
      besonderheiten: '',
      demontage: false,
      montage: false,
      verpackung: false
    });
    
    setMoebelDialog(false);
  };
  
  // Möbel entfernen
  const handleRemoveMoebel = (raumIndex, moebelIndex) => {
    const newRaeume = [...formik.values.raeume];
    newRaeume[raumIndex].moebel = newRaeume[raumIndex].moebel.filter((_, i) => i !== moebelIndex);
    formik.setFieldValue('raeume', newRaeume);
  };
  
  // Bild hochladen
  const handleBildUpload = (file) => {
    if (!isEditMode) {
      toast.info('Bitte speichern Sie die Aufnahme zuerst, bevor Sie Bilder hochladen');
      setUploadDialog(false);
      return;
    }
    
    bildUploadMutation.mutate(file);
  };
  
  // Lade-Status prüfen
  const isLoading = loadingAufnahme || aufnahmeMutation.isLoading || bildUploadMutation.isLoading;
  
  if (isLoading && isEditMode && !formik.values.kundenName) {
    return <Loading />;
  }
  
  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Aufnahme bearbeiten' : 'Neue Aufnahme'}
        buttonText="Zurück"
        buttonIcon={<ArrowBackIcon />}
        onButtonClick={() => navigate(isEditMode ? `/aufnahmen/${id}` : '/aufnahmen')}
      />
      
      <form onSubmit={formik.handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Grunddaten
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="kundenName"
                name="kundenName"
                label="Kundenname"
                value={formik.values.kundenName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.kundenName && Boolean(formik.errors.kundenName)}
                helperText={formik.touched.kundenName && formik.errors.kundenName}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Datum"
                  value={formik.values.datum}
                  onChange={(value) => formik.setFieldValue('datum', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.datum && Boolean(formik.errors.datum)}
                      helperText={formik.touched.datum && formik.errors.datum}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="status"
                name="status"
                select
                label="Status"
                value={formik.values.status}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <MenuItem value="in_bearbeitung">In Bearbeitung</MenuItem>
                <MenuItem value="abgeschlossen">Abgeschlossen</MenuItem>
                <MenuItem value="angebot_erstellt">Angebot erstellt</MenuItem>
                <MenuItem value="bestellt">Bestellt</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Auszugsadresse
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="auszugsadresse.strasse"
                name="auszugsadresse.strasse"
                label="Straße"
                value={formik.values.auszugsadresse.strasse}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="auszugsadresse.hausnummer"
                name="auszugsadresse.hausnummer"
                label="Hausnummer"
                value={formik.values.auszugsadresse.hausnummer}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="auszugsadresse.plz"
                name="auszugsadresse.plz"
                label="PLZ"
                value={formik.values.auszugsadresse.plz}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="auszugsadresse.ort"
                name="auszugsadresse.ort"
                label="Ort"
                value={formik.values.auszugsadresse.ort}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="auszugsadresse.etage"
                name="auszugsadresse.etage"
                label="Etage"
                type="number"
                value={formik.values.auszugsadresse.etage}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="auszugsadresse.aufzug"
                    name="auszugsadresse.aufzug"
                    checked={formik.values.auszugsadresse.aufzug}
                    onChange={formik.handleChange}
                  />
                }
                label="Aufzug vorhanden"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="auszugsadresse.entfernung"
                name="auszugsadresse.entfernung"
                label="Entfernung zur Parkposition (m)"
                type="number"
                value={formik.values.auszugsadresse.entfernung}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
          </Grid>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Einzugsadresse
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="einzugsadresse.strasse"
                name="einzugsadresse.strasse"
                label="Straße"
                value={formik.values.einzugsadresse.strasse}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="einzugsadresse.hausnummer"
                name="einzugsadresse.hausnummer"
                label="Hausnummer"
                value={formik.values.einzugsadresse.hausnummer}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="einzugsadresse.plz"
                name="einzugsadresse.plz"
                label="PLZ"
                value={formik.values.einzugsadresse.plz}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="einzugsadresse.ort"
                name="einzugsadresse.ort"
                label="Ort"
                value={formik.values.einzugsadresse.ort}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="einzugsadresse.etage"
                name="einzugsadresse.etage"
                label="Etage"
                type="number"
                value={formik.values.einzugsadresse.etage}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="einzugsadresse.aufzug"
                    name="einzugsadresse.aufzug"
                    checked={formik.values.einzugsadresse.aufzug}
                    onChange={formik.handleChange}
                  />
                }
                label="Aufzug vorhanden"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="einzugsadresse.entfernung"
                name="einzugsadresse.entfernung"
                label="Entfernung zur Parkposition (m)"
                type="number"
                value={formik.values.einzugsadresse.entfernung}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
          </Grid>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Räume</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setRaumDialog(true)}
            >
              Raum hinzufügen
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          {formik.values.raeume.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body1" gutterBottom>
                Noch keine Räume vorhanden
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setRaumDialog(true)}
                sx={{ mt: 2 }}
              >
                Raum hinzufügen
              </Button>
            </Box>
          ) : (
            formik.values.raeume.map((raum, raumIndex) => (
              <Paper key={raumIndex} variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {raum.name} {raum.flaeche ? `(${raum.flaeche} m²)` : ''}
                  </Typography>
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenMoebelDialog(raumIndex)}
                      sx={{ mr: 1 }}
                    >
                      Möbel
                    </Button>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveRaum(raumIndex)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Etage: {raum.etage}
                </Typography>
                
                {raum.besonderheiten && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Besonderheiten: {raum.besonderheiten}
                  </Typography>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Möbel
                </Typography>
                
                {raum.moebel && raum.moebel.length > 0 ? (
                  <List dense>
                    {raum.moebel.map((moebel, moebelIndex) => (
                      <ListItem key={moebelIndex} divider>
                        <ListItemText
                          primary={`${moebel.name} (${moebel.anzahl} Stück)`}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                Kategorie: {moebel.kategorie.charAt(0).toUpperCase() + moebel.kategorie.slice(1)}
                              </Typography>
                              
                              {moebel.groesse.laenge && moebel.groesse.breite && moebel.groesse.hoehe && (
                                <Typography variant="body2" color="text.secondary">
                                  Größe: {moebel.groesse.laenge} × {moebel.groesse.breite} × {moebel.groesse.hoehe} cm
                                  {moebel.groesse.volumen && ` (${moebel.groesse.volumen.toFixed(2)} m³)`}
                                </Typography>
                              )}
                              
                              {moebel.besonderheiten && (
                                <Typography variant="body2" color="text.secondary">
                                  Besonderheiten: {moebel.besonderheiten}
                                </Typography>
                              )}
                              
                              <Box sx={{ mt: 1 }}>
                                {moebel.demontage && (
                                  <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                                    Demontage
                                  </Typography>
                                )}
                                {moebel.montage && (
                                  <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                                    Montage
                                  </Typography>
                                )}
                                {moebel.verpackung && (
                                  <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                                    Verpackung
                                  </Typography>
                                )}
                                {moebel.zerbrechlich && (
                                  <Typography variant="body2" component="span" color="error.main">
                                    Zerbrechlich
                                  </Typography>
                                )}
                              </Box>
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveMoebel(raumIndex, moebelIndex)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Keine Möbel in diesem Raum
                  </Typography>
                )}
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenMoebelDialog(raumIndex)}
                  >
                    Möbel hinzufügen
                  </Button>
                </Box>
              </Paper>
            ))
          )}
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notizen
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <TextField
            fullWidth
            id="notizen"
            name="notizen"
            label="Notizen"
            multiline
            rows={4}
            value={formik.values.notizen}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
        </Paper>
        
        {isEditMode && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Bilder</Typography>
              <Button
                variant="contained"
                startIcon={<AttachFileIcon />}
                onClick={() => setUploadDialog(true)}
              >
                Bild hochladen
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {aufnahmeData?.bilder && aufnahmeData.bilder.length > 0 ? (
              <Grid container spacing={2}>
                {aufnahmeData.bilder.map((bild, index) => (
                  <Grid item key={index} xs={6} sm={4} md={3}>
                    <Box
                      component="img"
                      src={bild}
                      alt={`Bild ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: 150,
                        objectFit: 'cover',
                        borderRadius: 1,
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(bild, '_blank')}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Noch keine Bilder vorhanden
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  onClick={() => setUploadDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Bild hochladen
                </Button>
              </Box>
            )}
          </Paper>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(isEditMode ? `/aufnahmen/${id}` : '/aufnahmen')}
            sx={{ mr: 2 }}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={aufnahmeMutation.isLoading}
          >
            {aufnahmeMutation.isLoading ? 'Speichern...' : 'Speichern'}
          </Button>
        </Box>
      </form>
      
      {/* Raum-Dialog */}
      <Dialog open={raumDialog} onClose={() => setRaumDialog(false)}>
        <DialogTitle>Raum hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Raumname"
            fullWidth
            value={tempRaum.name}
            onChange={(e) => setTempRaum({ ...tempRaum, name: e.target.value })}
          />
          <TextField
            margin="normal"
            label="Fläche (m²)"
            type="number"
            fullWidth
            value={tempRaum.flaeche}
            onChange={(e) => setTempRaum({ ...tempRaum, flaeche: e.target.value })}
            InputProps={{
              endAdornment: <InputAdornment position="end">m²</InputAdornment>
            }}
          />
          <TextField
            margin="normal"
            label="Etage"
            type="number"
            fullWidth
            value={tempRaum.etage}
            onChange={(e) => setTempRaum({ ...tempRaum, etage: parseInt(e.target.value) })}
          />
          <TextField
            margin="normal"
            label="Besonderheiten"
            fullWidth
            multiline
            rows={2}
            value={tempRaum.besonderheiten}
            onChange={(e) => setTempRaum({ ...tempRaum, besonderheiten: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRaumDialog(false)}>Abbrechen</Button>
          <Button
            onClick={handleAddRaum}
            variant="contained"
            disabled={!tempRaum.name}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Möbel-Dialog */}
      <Dialog
        open={moebelDialog}
        onClose={() => setMoebelDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Möbel hinzufügen</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                label="Möbelname"
                fullWidth
                value={tempMoebel.name}
                onChange={(e) => setTempMoebel({ ...tempMoebel, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                label="Anzahl"
                type="number"
                fullWidth
                value={tempMoebel.anzahl}
                onChange={(e) => setTempMoebel({ ...tempMoebel, anzahl: parseInt(e.target.value) || 1 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                select
                label="Kategorie"
                fullWidth
                value={tempMoebel.kategorie}
                onChange={(e) => setTempMoebel({ ...tempMoebel, kategorie: e.target.value })}
              >
                <MenuItem value="schrank">Schrank</MenuItem>
                <MenuItem value="tisch">Tisch</MenuItem>
                <MenuItem value="stuhl">Stuhl</MenuItem>
                <MenuItem value="sofa">Sofa</MenuItem>
                <MenuItem value="bett">Bett</MenuItem>
                <MenuItem value="karton">Karton</MenuItem>
                <MenuItem value="sonstiges">Sonstiges</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                label="Gewicht (kg)"
                type="number"
                fullWidth
                value={tempMoebel.gewicht}
                onChange={(e) => setTempMoebel({ ...tempMoebel, gewicht: e.target.value })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">kg</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Größe
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                margin="normal"
                label="Länge (cm)"
                type="number"
                fullWidth
                value={tempMoebel.groesse.laenge}
                onChange={(e) => setTempMoebel({
                  ...tempMoebel,
                  groesse: { ...tempMoebel.groesse, laenge: e.target.value }
                })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                margin="normal"
                label="Breite (cm)"
                type="number"
                fullWidth
                value={tempMoebel.groesse.breite}
                onChange={(e) => setTempMoebel({
                  ...tempMoebel,
                  groesse: { ...tempMoebel.groesse, breite: e.target.value }
                })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                margin="normal"
                label="Höhe (cm)"
                type="number"
                fullWidth
                value={tempMoebel.groesse.hoehe}
                onChange={(e) => setTempMoebel({
                  ...tempMoebel,
                  groesse: { ...tempMoebel.groesse, hoehe: e.target.value }
                })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">cm</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="normal"
                label="Besonderheiten"
                fullWidth
                multiline
                rows={2}
                value={tempMoebel.besonderheiten}
                onChange={(e) => setTempMoebel({ ...tempMoebel, besonderheiten: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempMoebel.demontage}
                    onChange={(e) => setTempMoebel({ ...tempMoebel, demontage: e.target.checked })}
                  />
                }
                label="Demontage"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempMoebel.montage}
                    onChange={(e) => setTempMoebel({ ...tempMoebel, montage: e.target.checked })}
                  />
                }
                label="Montage"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempMoebel.verpackung}
                    onChange={(e) => setTempMoebel({ ...tempMoebel, verpackung: e.target.checked })}
                  />
                }
                label="Verpackung"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tempMoebel.zerbrechlich}
                    onChange={(e) => setTempMoebel({ ...tempMoebel, zerbrechlich: e.target.checked })}
                  />
                }
                label="Zerbrechlich"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoebelDialog(false)}>Abbrechen</Button>
          <Button
            onClick={handleAddMoebel}
            variant="contained"
            disabled={!tempMoebel.name}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Upload-Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)}>
        <DialogTitle>Bild hochladen</DialogTitle>
        <DialogContent>
          <DialogContent>
            <DialogContentText>
              Wählen Sie ein Bild aus, das Sie hochladen möchten.
            </DialogContentText>
            <Box sx={{ mt: 2 }}>
              <FileUpload
                onFileSelect={handleBildUpload}
                uploading={bildUploadMutation.isLoading}
                progress={0}
                accept={{
                  'image/*': ['.jpeg', '.jpg', '.png', '.gif']
                }}
              />
            </Box>
          </DialogContent>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Abbrechen</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AufnahmeForm;
      
      if (filter.search) params.search = filter.search;
      if (filter.status) params.status = filter.status;
      
      const response = await api.get('/aufnahmen', { params });
      return response.data;
    }
  );
  
  // Filter ändern
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Bei Filteränderung zurück zur ersten Seite
    }));
  };
  
  // Seitenänderung
  const handlePageChange = (event, newPage) => {
    setFilter(prev => ({
      ...prev,
      page: newPage
    }));
  };
  
  // Neue Aufnahme erstellen
  const handleCreateAufnahme = () => {
    navigate('/aufnahmen/neu');
  };
  
  // Formatieren des Datums
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };
  
  // Tabelle rendern
  const renderTable = () => {
    if (!data || data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} align="center">
            Keine Aufnahmen gefunden.
          </TableCell>
        </TableRow>
      );
    }
    
    return data.map((aufnahme) => (
      <TableRow key={aufnahme._id}>
        <TableCell>{aufnahme.kundenName}</TableCell>
        <TableCell>{formatDate(aufnahme.datum)}</TableCell>
        <TableCell>
          {aufnahme.raeume?.length || 0} Räume
        </TableCell>
        <TableCell>
          {aufnahme.gesamtvolumen ? `${aufnahme.gesamtvolumen.toFixed(2)} m³` : '-'}
        </TableCell>
        <TableCell>
          <StatusBadge status={aufnahme.status} />
        </TableCell>
        <TableCell>
          <IconButton
            color="primary"
            onClick={() => navigate(`/aufnahmen/${aufnahme._id}`)}
          >
            <ViewIcon />
          </IconButton>
          <IconButton
            color="secondary"
            onClick={() => navigate(`/aufnahmen/bearbeiten/${aufnahme._id}`)}
          >
            <EditIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    ));
  };
  
  return (
    <Box>
      <PageHeader
        title="Aufnahmen"
        buttonText="Neue Aufnahme"
        buttonIcon={<AddIcon />}
        onButtonClick={handleCreateAufnahme}
      />
      
      {/* Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              name="search"
              label="Suche nach Kunde, Ort..."
              value={filter.search}
              onChange={handleFilterChange}
              fullWidth
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="status"
              label="Status"
              select
              value={filter.status}
              onChange={handleFilterChange}
              fullWidth
              variant="outlined"
              size="small"
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>
      
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kunde</TableCell>
                  <TableCell>Datum</TableCell>
                  <TableCell>Räume</TableCell>
                  <TableCell>Gesamtvolumen</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderTable()}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginierung */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil((data?.total || 0) / filter.limit)}
              page={filter.page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default Aufnahmen;

// frontend/src/pages/aufnahmen/AufnahmeDetails.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AttachFile as AttachFileIcon,
  Note as NoteIcon,
  Home as HomeIcon,
  ShoppingCart as CartIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';AttachFile as AttachFileIcon,
  Note as NoteIcon,
  Home as HomeIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import FileUpload from '../../components/common/FileUpload';

const AufnahmeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State für aktiven Tab
  const [activeTab, setActiveTab] = useState(0);
  
  // Dialog-States
  const [uploadDialog, setUploadDialog] = useState(false);
  const [angebotDialog, setAngebotDialog] = useState(false);
  const [umzugErstellenDialog, setUmzugErstellenDialog] = useState(false);
  
  // Aufnahmedaten laden
  const { data: aufnahme, isLoading } = useQuery(
    ['aufnahme', id],
    async () => {
      const response = await api.get(`/aufnahmen/${id}`);
      return response.data;
    }
  );
  
  // Datei-Upload-Mutation
  const uploadMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('datei', file);
      formData.append('bezugId', id);
      formData.append('bezugModell', 'Aufnahme');
      formData.append('kategorie', 'dokument');
      
      return api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['aufnahme', id]);
        setUploadDialog(false);
        toast.success('Datei erfolgreich hochgeladen');
      },
      onError: (error) => {
        toast.error(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Angebot-Mutation
  const angebotMutation = useMutation(
    (preisData) => api.post(`/aufnahmen/${id}/angebot`, preisData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['aufnahme', id]);
        setAngebotDialog(false);
        toast.success('Angebot erfolgreich erstellt');
      },
      onError: (error) => {
        toast.error(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Umzug-Erstellung-Mutation
  const umzugMutation = useMutation(
    async () => {
      // Umzugsdaten aus der Aufnahme erstellen
      const umzugData = {
        kundennummer: '',
        auftraggeber: {
          name: aufnahme.kundenName,
          telefon: '',
          email: ''
        },
        auszugsadresse: aufnahme.auszugsadresse || {
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: '',
          land: 'Deutschland',
          etage: 0,
          aufzug: false
        },
        einzugsadresse: aufnahme.einzugsadresse || {
          strasse: '',
          hausnummer: '',
          plz: '',
          ort: '',
          land: 'Deutschland',
          etage: 0,
          aufzug: false
        },
        startDatum: new Date().toISOString(),
        endDatum: new Date().toISOString(),
        status: 'angefragt',
        preis: {
          netto: aufnahme.angebotspreis?.netto || 0,
          brutto: aufnahme.angebotspreis?.brutto || 0,
          mwst: 19,
          bezahlt: false,
          zahlungsart: 'rechnung'
        },
        aufnahmeId: id
      };
      
      return api.post('/umzuege', umzugData);
    },
    {
      onSuccess: (response) => {
        // Aufnahme-Status aktualisieren
        api.put(`/aufnahmen/${id}`, {
          status: 'bestellt'
        }).then(() => {
          queryClient.invalidateQueries(['aufnahme', id]);
        }
    )
    .catch(error => {
      console.error('Error:', error.message);
      // Handle error appropriately
    });
        
        setUmzugErstellenDialog(false);
        toast.success('Umzug erfolgreich erstellt');
        
        // Zur Umzugsdetailseite navigieren
        navigate(`/umzuege/${response.data.umzug._id}`);
      },
      onError: (error) => {
        toast.error(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Formik für Angebot-Formular
  const angebotFormik = useFormik({
    initialValues: {
      netto: aufnahme?.angebotspreis?.netto || 0,
      brutto: aufnahme?.angebotspreis?.brutto || 0
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      netto: Yup.number().required('Nettopreis ist erforderlich'),
      brutto: Yup.number().required('Bruttopreis ist erforderlich')
    }),
    onSubmit: (values) => {
      angebotMutation.mutate(values);
    }
  });
  
  // Tab wechseln
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Datei-Upload
  const handleFileUpload = (file) => {
    uploadMutation.mutate(file);
  };
  
  // Formatieren des Datums
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };
  
  // Nettopreis berechnen
  const handlePreisChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    
    if (field === 'netto') {
      const brutto = numValue * 1.19;
      angebotFormik.setFieldValue('netto', numValue);
      angebotFormik.setFieldValue('brutto', Math.round(brutto * 100) / 100);
    } else if (field === 'brutto') {
      const netto = numValue / 1.19;
      angebotFormik.setFieldValue('brutto', numValue);
      angebotFormik.setFieldValue('netto', Math.round(netto * 100) / 100);
    }
  };
  
  // Umzug erstellen-Dialog öffnen
  const handleUmzugErstellenClick = () => {
    if (!aufnahme.angebotspreis) {
      toast.error('Bitte erstellen Sie zuerst ein Angebot');
      return;
    }
    
    setUmzugErstellenDialog(true);
  };
  
  // Wenn Daten geladen werden
  if (isLoading) {
    return <Loading />;
  }
  
  // Wenn Aufnahme nicht gefunden wurde
  if (!aufnahme) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5">Aufnahme nicht gefunden.</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/aufnahmen')}
          sx={{ mt: 2 }}
        >
          Zurück zur Übersicht
        </Button>
      </Box>
    );
  }
  
  // Aktionsmöglichkeiten je nach Status
  const renderActionButtons = () => {
    switch (aufnahme.status) {
      case 'in_bearbeitung':
        return (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/aufnahmen/bearbeiten/${id}`)}
            >
              Bearbeiten
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CartIcon />}
              onClick={() => setAngebotDialog(true)}
            >
              Angebot erstellen
            </Button>
          </Box>
        );
      case 'abgeschlossen':
        return (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CartIcon />}
              onClick={() => setAngebotDialog(true)}
            >
              Angebot erstellen
            </Button>
          </Box>
        );
      case 'angebot_erstellt':
        return (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<HomeIcon />}
              onClick={handleUmzugErstellenClick}
            >
              Umzug erstellen
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CartIcon />}
              onClick={() => setAngebotDialog(true)}
            >
              Angebot bearbeiten
            </Button>
          </Box>
        );
      case 'bestellt':
        return (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<HomeIcon />}
              onClick={() => navigate(`/umzuege?aufnahmeId=${id}`)}
            >
              Zum Umzug
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };
  
  return (
    <Box>
      <PageHeader
        title={`Aufnahme: ${aufnahme.kundenName}`}
        buttonText="Zurück"
        buttonIcon={<ArrowBackIcon />}
        onButtonClick={() => navigate('/aufnahmen')}
        showButton={false}
      />
      
      {/* Status und Infos */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ mt: 1 }}>
                <StatusBadge status={aufnahme.status} />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Kunde
              </Typography>
              <Typography variant="body1">
                {aufnahme.kundenName}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Datum
              </Typography>
              <Typography variant="body1">
                {formatDate(aufnahme.datum)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          {renderActionButtons()}
        </Box>
      </Paper>
      
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Übersicht" />
          <Tab label="Räume" />
          <Tab label="Dokumente" />
          <Tab label="Angebot" />
        </Tabs>
        
        <Divider />
        
        <Box sx={{ p: 3 }}>
          {/* Übersicht Tab */}
          {activeTab === 0 && (
            <Grid container spacing={4}>
              {/* Gesamtvolumen */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Gesamtvolumen
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h4">
                    {aufnahme.gesamtvolumen ? `${aufnahme.gesamtvolumen.toFixed(2)} m³` : '-'}
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Anzahl Räume */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Räume
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h4">
                    {aufnahme.raeume?.length || 0}
                  </Typography>
                </Paper>
              </Grid>
              
              {/* Auszugsadresse */}
              {aufnahme.auszugsadresse && (
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Auszugsadresse
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body1">
                      {aufnahme.auszugsadresse.strasse} {aufnahme.auszugsadresse.hausnummer}
                    </Typography>
                    <Typography variant="body1">
                      {aufnahme.auszugsadresse.plz} {aufnahme.auszugsadresse.ort}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Etage: {aufnahme.auszugsadresse.etage || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aufzug: {aufnahme.auszugsadresse.aufzug ? 'Ja' : 'Nein'}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {/* Einzugsadresse */}
              {aufnahme.einzugsadresse && (
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Einzugsadresse
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body1">
                      {aufnahme.einzugsadresse.strasse} {aufnahme.einzugsadresse.hausnummer}
                    </Typography>
                    <Typography variant="body1">
                      {aufnahme.einzugsadresse.plz} {aufnahme.einzugsadresse.ort}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Etage: {aufnahme.einzugsadresse.etage || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aufzug: {aufnahme.einzugsadresse.aufzug ? 'Ja' : 'Nein'}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {/* Notizen */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Notizen
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {aufnahme.notizen ? (
                    <Typography variant="body1" whiteSpace="pre-wrap">
                      {aufnahme.notizen}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Keine Notizen vorhanden
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {/* Räume Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Räume und Möbel
              </Typography>
              
              {aufnahme.raeume && aufnahme.raeume.length > 0 ? (
                aufnahme.raeume.map((raum, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Typography variant="h6">{raum.name}</Typography>
                      <Chip 
                        label={`${raum.flaeche || 0} m²`} 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Etage: {raum.etage || 0}
                      </Typography>
                      {raum.besonderheiten && (
                        <Typography variant="body2" color="text.secondary">
                          Besonderheiten: {raum.besonderheiten}
                        </Typography>
                      )}
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Möbel
                    </Typography>
                    
                    {raum.moebel && raum.moebel.length > 0 ? (
                      <List dense>
                        {raum.moebel.map((moebel, moebelIndex) => (
                          <ListItem key={moebelIndex} divider>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body1">
                                    {moebel.name}
                                  </Typography>
                                  <Typography variant="body2">
                                    {moebel.anzahl} Stück
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  {moebel.kategorie && (
                                    <Typography variant="body2" color="text.secondary">
                                      Kategorie: {moebel.kategorie.charAt(0).toUpperCase() + moebel.kategorie.slice(1)}
                                    </Typography>
                                  )}
                                  
                                  {moebel.groesse && (
                                    <Typography variant="body2" color="text.secondary">
                                      Größe: {moebel.groesse.laenge || 0} × {moebel.groesse.breite || 0} × {moebel.groesse.hoehe || 0} cm
                                      {moebel.groesse.volumen && ` (${moebel.groesse.volumen.toFixed(2)} m³)`}
                                    </Typography>
                                  )}
                                  
                                  <Box sx={{ mt: 1 }}>
                                    {moebel.demontage && <Chip label="Demontage" size="small" variant="outlined" sx={{ mr: 1, mb: 1 }} />}
                                    {moebel.montage && <Chip label="Montage" size="small" variant="outlined" sx={{ mr: 1, mb: 1 }} />}
                                    {moebel.verpackung && <Chip label="Verpackung" size="small" variant="outlined" sx={{ mr: 1, mb: 1 }} />}
                                    {moebel.zerbrechlich && <Chip label="Zerbrechlich" size="small" color="error" variant="outlined" sx={{ mr: 1, mb: 1 }} />}
                                  </Box>
                                  
                                  {moebel.besonderheiten && (
                                    <Typography variant="body2" color="text.secondary">
                                      Besonderheiten: {moebel.besonderheiten}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Keine Möbel in diesem Raum
                      </Typography>
                    )}
                  </Paper>
                ))
              ) : (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1">Keine Räume vorhanden</Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/aufnahmen/bearbeiten/${id}`)}
                    sx={{ mt: 2 }}
                  >
                    Räume hinzufügen
                  </Button>
                </Paper>
              )}
            </Box>
          )}
          
          {/* Dokumente Tab */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Dokumente</Typography>
                <Button
                  variant="contained"
                  startIcon={<AttachFileIcon />}
                  onClick={() => setUploadDialog(true)}
                >
                  Dokument hochladen
                </Button>
              </Box>
              
              <Paper variant="outlined">
                {aufnahme.dokumente && aufnahme.dokumente.length > 0 ? (
                  <List>
                    {aufnahme.dokumente.map((dokument, index) => (
                      <ListItem
                        key={index}
                        button
                        component="a"
                        href={dokument.pfad}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ListItemText
                          primary={dokument.name}
                          secondary={formatDate(dokument.datum)}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">Keine Dokumente vorhanden</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AttachFileIcon />}
                      onClick={() => setUploadDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Erstes Dokument hochladen
                    </Button>
                  </Box>
                )}
              </Paper>
              
              {/* Bilder */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Bilder
                </Typography>
                
                <Paper variant="outlined">
                  {aufnahme.bilder && aufnahme.bilder.length > 0 ? (
                    <Grid container spacing={2} sx={{ p: 2 }}>
                      {aufnahme.bilder.map((bild, index) => (
                        <Grid item key={index} xs={6} sm={4} md={3}>
                          <Box
                            component="img"
                            src={bild}
                            alt={`Bild ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 150,
                              objectFit: 'cover',
                              borderRadius: 1,
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(bild, '_blank')}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1">Keine Bilder vorhanden</Typography>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/aufnahmen/bearbeiten/${id}`)}
                        sx={{ mt: 2 }}
                      >
                        Bilder hinzufügen
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          )}
          
          {/* Angebot Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Angebot
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 3 }}>
                {aufnahme.angebotspreis ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          Nettopreis
                        </Typography>
                        <Typography variant="h4">
                          {aufnahme.angebotspreis.netto.toLocaleString('de-DE')} €
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                          Bruttopreis (inkl. 19% MwSt.)
                        </Typography>
                        <Typography variant="h4">
                          {aufnahme.angebotspreis.brutto.toLocaleString('de-DE')} €
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={() => setAngebotDialog(true)}
                        >
                          Angebot bearbeiten
                        </Button>
                        
                        {aufnahme.status === 'angebot_erstellt' && (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<HomeIcon />}
                            onClick={handleUmzugErstellenClick}
                          >
                            Umzug erstellen
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" gutterBottom>
                      Noch kein Angebot erstellt
                    </Typography>
                    
                    {['in_bearbeitung', 'abgeschlossen'].includes(aufnahme.status) && (
                      <Button
                        variant="contained"
                        onClick={() => setAngebotDialog(true)}
                        sx={{ mt: 2 }}
                      >
                        Angebot erstellen
                      </Button>
                    )}
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Upload-Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)}>
        <DialogTitle>Dokument hochladen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Wählen Sie eine Datei aus, die Sie hochladen möchten.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <FileUpload
              onFileSelect={handleFileUpload}
              uploading={uploadMutation.isLoading}
              progress={0}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Abbrechen</Button>
        </DialogActions>
      </Dialog>
      
      {/* Angebot-Dialog */}
      <Dialog open={angebotDialog} onClose={() => setAngebotDialog(false)}>
        <DialogTitle>
          {aufnahme.angebotspreis ? 'Angebot bearbeiten' : 'Angebot erstellen'}
        </DialogTitle>
        <form onSubmit={angebotFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="netto"
                  name="netto"
                  label="Nettopreis (€)"
                  type="number"
                  value={angebotFormik.values.netto}
                  onChange={(e) => handlePreisChange('netto', e.target.value)}
                  onBlur={angebotFormik.handleBlur}
                  error={angebotFormik.touched.netto && Boolean(angebotFormik.errors.netto)}
                  helperText={angebotFormik.touched.netto && angebotFormik.errors.netto}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="brutto"
                  name="brutto"
                  label="Bruttopreis (€)"
                  type="number"
                  value={angebotFormik.values.brutto}
                  onChange={(e) => handlePreisChange('brutto', e.target.value)}
                  onBlur={angebotFormik.handleBlur}
                  error={angebotFormik.touched.brutto && Boolean(angebotFormik.errors.brutto)}
                  helperText={angebotFormik.touched.brutto && angebotFormik.errors.brutto}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAngebotDialog(false)}>Abbrechen</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={angebotMutation.isLoading}
            >
              {angebotMutation.isLoading ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Umzug-Erstellen-Dialog */}
      <Dialog open={umzugErstellenDialog} onClose={() => setUmzugErstellenDialog(false)}>
        <DialogTitle>Umzug erstellen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie aus dieser Aufnahme einen Umzug erstellen? Die Aufnahme wird dann als "Bestellt" markiert.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUmzugErstellenDialog(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={() => umzugMutation.mutate()}
            disabled={umzugMutation.isLoading}
          >
            {umzugMutation.isLoading ? 'Erstellen...' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
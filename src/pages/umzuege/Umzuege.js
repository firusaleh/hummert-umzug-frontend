// frontend/src/pages/umzuege/Umzuege.js
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
  Pagination
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

const Umzuege = () => {
  const navigate = useNavigate();
  
  // Status-Optionen für den Filter
  const statusOptions = [
    { value: '', label: 'Alle Status' },
    { value: 'angefragt', label: 'Angefragt' },
    { value: 'angebot', label: 'Angebot' },
    { value: 'geplant', label: 'Geplant' },
    { value: 'in_bearbeitung', label: 'In Bearbeitung' },
    { value: 'abgeschlossen', label: 'Abgeschlossen' },
    { value: 'storniert', label: 'Storniert' }
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
    ['umzuege', filter],
    async () => {
      const params = {
        page: filter.page,
        limit: filter.limit
      };
      
      if (filter.search) params.search = filter.search;
      if (filter.status) params.status = filter.status;
      
      const response = await api.get('/umzuege', { params });
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
  
  // Neuen Umzug erstellen
  const handleCreateUmzug = () => {
    navigate('/umzuege/neu');
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
            Keine Umzüge gefunden.
          </TableCell>
        </TableRow>
      );
    }
    
    return data.map((umzug) => (
      <TableRow key={umzug._id}>
        <TableCell>{umzug.kundennummer || '-'}</TableCell>
        <TableCell>{umzug.auftraggeber.name}</TableCell>
        <TableCell>
          {umzug.auszugsadresse.ort} → {umzug.einzugsadresse.ort}
        </TableCell>
        <TableCell>{formatDate(umzug.startDatum)}</TableCell>
        <TableCell>
          <StatusBadge status={umzug.status} />
        </TableCell>
        <TableCell>
          <IconButton
            color="primary"
            onClick={() => navigate(`/umzuege/${umzug._id}`)}
          >
            <ViewIcon />
          </IconButton>
          <IconButton
            color="secondary"
            onClick={() => navigate(`/umzuege/bearbeiten/${umzug._id}`)}
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
        title="Umzüge"
        buttonText="Neuer Umzug"
        buttonIcon={<AddIcon />}
        onButtonClick={handleCreateUmzug}
      />
      
      {/* Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              name="search"
              label="Suche nach Kunde, Ort, Kundennummer..."
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
                  <TableCell>Kundennummer</TableCell>
                  <TableCell>Kunde</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Datum</TableCell>
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

export default Umzuege;

// frontend/src/pages/umzuege/UmzugDetails.js
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
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AssignmentTurnedIn as AssignmentIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import FileUpload from '../../components/common/FileUpload';

const UmzugDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State für aktiven Tab
  const [activeTab, setActiveTab] = useState(0);
  
  // Dialog-States
  const [taskDialog, setTaskDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [notizDialog, setNotizDialog] = useState(false);
  
  // Umzugsdaten laden
  const { data: umzug, isLoading } = useQuery(
    ['umzug', id],
    async () => {
      const response = await api.get(`/umzuege/${id}`);
      return response.data;
    }
  );
  
  // Mitarbeiter laden
  const { data: mitarbeiter } = useQuery(
    'mitarbeiter',
    async () => {
      const response = await api.get('/mitarbeiter');
      return response.data;
    }
  );
  
  // Task-Mutation
  const taskMutation = useMutation(
    (taskData) => api.post(`/umzuege/${id}/task`, taskData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['umzug', id]);
        setTaskDialog(false);
        toast.success('Aufgabe erfolgreich hinzugefügt');
      },
      onError: (error) => {
        toast.error(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Task-Status-Mutation
  const taskStatusMutation = useMutation(
    ({ taskId, erledigt }) => api.put(`/umzuege/${id}/task/${taskId}`, { erledigt }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['umzug', id]);
        toast.success('Aufgabenstatus aktualisiert');
      },
      onError: (error) => {
        toast.error(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Datei-Upload-Mutation
  const uploadMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('datei', file);
      formData.append('bezugId', id);
      formData.append('bezugModell', 'Umzug');
      formData.append('kategorie', 'dokument');
      
      return api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['umzug', id]);
        setUploadDialog(false);
        toast.success('Datei erfolgreich hochgeladen');
      },
      onError: (error) => {
        toast.error(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Notiz-Mutation
  const notizMutation = useMutation(
    (text) => api.post(`/umzuege/${id}/notiz`, { text }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['umzug', id]);
        setNotizDialog(false);
        toast.success('Notiz erfolgreich hinzugefügt');
      },
      onError: (error) => {
        toast.error(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Tab wechseln
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Formik für Task-Formular
  const taskFormik = useFormik({
    initialValues: {
      beschreibung: '',
      faelligkeit: '',
      prioritaet: 'mittel',
      zugewiesen: ''
    },
    validationSchema: Yup.object({
      beschreibung: Yup.string().required('Beschreibung ist erforderlich'),
      faelligkeit: Yup.date().nullable()
    }),
    onSubmit: (values) => {
      taskMutation.mutate(values);
    }
  });
  
  // Formik für Notiz-Formular
  const notizFormik = useFormik({
    initialValues: {
      text: ''
    },
    validationSchema: Yup.object({
      text: Yup.string().required('Text ist erforderlich')
    }),
    onSubmit: (values) => {
      notizMutation.mutate(values.text);
    }
  });
  
  // Task-Status ändern
  const handleTaskStatusChange = (taskId, erledigt) => {
    taskStatusMutation.mutate({ taskId, erledigt });
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
  
  // Wenn Daten geladen werden
  if (isLoading) {
    return <Loading />;
  }
  
  // Wenn Umzug nicht gefunden wurde
  if (!umzug) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5">Umzug nicht gefunden.</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/umzuege')}
          sx={{ mt: 2 }}
        >
          Zurück zur Übersicht
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <PageHeader
        title={`Umzug: ${umzug.auftraggeber.name}`}
        buttonText="Bearbeiten"
        buttonIcon={<EditIcon />}
        onButtonClick={() => navigate(`/umzuege/bearbeiten/${id}`)}
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
                <StatusBadge status={umzug.status} />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Kundennummer
              </Typography>
              <Typography variant="body1">
                {umzug.kundennummer || '-'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Datum
              </Typography>
              <Typography variant="body1">
                {formatDate(umzug.startDatum)} - {formatDate(umzug.endDatum)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Details" />
          <Tab label="Aufgaben" />
          <Tab label="Dokumente" />
          <Tab label="Mitarbeiter" />
          <Tab label="Notizen" />
        </Tabs>
        
        <Divider />
        
        <Box sx={{ p: 3 }}>
          {/* Details Tab */}
          {activeTab === 0 && (
            <Grid container spacing={4}>
              {/* Auftraggeberinformationen */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Auftraggeber
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1">
                    {umzug.auftraggeber.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Telefon: {umzug.auftraggeber.telefon}
                  </Typography>
                  {umzug.auftraggeber.email && (
                    <Typography variant="body2" color="text.secondary">
                      E-Mail: {umzug.auftraggeber.email}
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Adressen */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Kontakte
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {umzug.kontakte && umzug.kontakte.length > 0 ? (
                    <List dense>
                      {umzug.kontakte.map((kontakt, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={kontakt.name}
                            secondary={`${kontakt.telefon}${
                              kontakt.email ? ` | ${kontakt.email}` : ''
                            }`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2">Keine weiteren Kontakte</Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Auszugsadresse */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Auszugsadresse
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body1">
                    {umzug.auszugsadresse.strasse} {umzug.auszugsadresse.hausnummer}
                  </Typography>
                  <Typography variant="body1">
                    {umzug.auszugsadresse.plz} {umzug.auszugsadresse.ort}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Etage: {umzug.auszugsadresse.etage || '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aufzug: {umzug.auszugsadresse.aufzug ? 'Ja' : 'Nein'}
                  </Typography>
                  {umzug.auszugsadresse.entfernung > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Entfernung zur Parkposition: {umzug.auszugsadresse.entfernung} m
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Einzugsadresse */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Einzugsadresse
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body1">
                    {umzug.einzugsadresse.strasse} {umzug.einzugsadresse.hausnummer}
                  </Typography>
                  <Typography variant="body1">
                    {umzug.einzugsadresse.plz} {umzug.einzugsadresse.ort}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Etage: {umzug.einzugsadresse.etage || '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aufzug: {umzug.einzugsadresse.aufzug ? 'Ja' : 'Nein'}
                  </Typography>
                  {umzug.einzugsadresse.entfernung > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Entfernung zur Parkposition: {umzug.einzugsadresse.entfernung} m
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Zwischenstopps */}
              {umzug.zwischenstopps && umzug.zwischenstopps.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Zwischenstopps
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <List dense>
                      {umzug.zwischenstopps.map((stopp, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`${stopp.strasse} ${stopp.hausnummer}, ${stopp.plz} ${stopp.ort}`}
                            secondary={`Etage: ${stopp.etage || '0'} | Aufzug: ${
                              stopp.aufzug ? 'Ja' : 'Nein'
                            }`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              )}
              
              {/* Preise */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Preise
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {umzug.preis ? (
                    <>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Netto
                          </Typography>
                          <Typography variant="body1">
                            {umzug.preis.netto ? `${umzug.preis.netto.toLocaleString('de-DE')} €` : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Brutto
                          </Typography>
                          <Typography variant="body1">
                            {umzug.preis.brutto ? `${umzug.preis.brutto.toLocaleString('de-DE')} €` : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            MwSt.
                          </Typography>
                          <Typography variant="body1">
                            {umzug.preis.mwst ? `${umzug.preis.mwst} %` : '19 %'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Zahlungsstatus
                          </Typography>
                          <Typography variant="body1">
                            {umzug.preis.bezahlt ? 'Bezahlt' : 'Offen'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Zahlungsart
                          </Typography>
                          <Typography variant="body1">
                            {umzug.preis.zahlungsart
                              ? umzug.preis.zahlungsart.charAt(0).toUpperCase() + umzug.preis.zahlungsart.slice(1)
                              : 'Rechnung'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </>
                  ) : (
                    <Typography variant="body2">Keine Preisangaben</Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Fahrzeuge */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Fahrzeuge
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {umzug.fahrzeuge && umzug.fahrzeuge.length > 0 ? (
                    <List dense>
                      {umzug.fahrzeuge.map((fahrzeug, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={fahrzeug.typ}
                            secondary={fahrzeug.kennzeichen || ''}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2">Keine Fahrzeuge zugewiesen</Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Zusätzliche Leistungen */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Zusätzliche Leistungen
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {umzug.extraLeistungen && umzug.extraLeistungen.length > 0 ? (
                    <List dense>
                      {umzug.extraLeistungen.map((leistung, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={leistung.beschreibung}
                            secondary={`${leistung.menge} × ${leistung.preis ? `${leistung.preis.toLocaleString('de-DE')} €` : ''}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2">Keine zusätzlichen Leistungen</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {/* Aufgaben Tab */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Aufgaben</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setTaskDialog(true)}
                >
                  Neue Aufgabe
                </Button>
              </Box>
              
              <Paper variant="outlined">
                {umzug.tasks && umzug.tasks.length > 0 ? (
                  <List>
                    {umzug.tasks.map((task) => (
                      <ListItem key={task._id}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={task.erledigt}
                              onChange={(e) => handleTaskStatusChange(task._id, e.target.checked)}
                            />
                          }
                          label=""
                        />
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              sx={{
                                textDecoration: task.erledigt ? 'line-through' : 'none',
                                color: task.erledigt ? 'text.disabled' : 'text.primary'
                              }}
                            >
                              {task.beschreibung}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              {task.faelligkeit && (
                                <Typography variant="body2" color="text.secondary">
                                  Fälligkeit: {formatDate(task.faelligkeit)}
                                </Typography>
                              )}
                              {task.zugewiesen && mitarbeiter && (
                                <Typography variant="body2" color="text.secondary">
                                  Zugewiesen an: {
                                    mitarbeiter.find(m => m._id === task.zugewiesen)?.vorname || 'Unbekannt'
                                  } {
                                    mitarbeiter.find(m => m._id === task.zugewiesen)?.nachname || ''
                                  }
                                </Typography>
                              )}
                              <StatusBadge status={task.prioritaet} />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">Keine Aufgaben vorhanden</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setTaskDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Erste Aufgabe hinzufügen
                    </Button>
                  </Box>
                )}
              </Paper>
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
                {umzug.dokumente && umzug.dokumente.length > 0 ? (
                  <List>
                    {umzug.dokumente.map((dokument, index) => (
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
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Kategorie: {dokument.kategorie || 'Sonstiges'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Datum: {formatDate(dokument.datum)}
                              </Typography>
                            </Box>
                          }
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
            </Box>
          )}
          
          {/* Mitarbeiter Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Zugewiesene Mitarbeiter
              </Typography>
              
              <Paper variant="outlined">
                {umzug.mitarbeiter && umzug.mitarbeiter.length > 0 ? (
                  <List>
                    {umzug.mitarbeiter.map((ma) => (
                      <ListItem key={ma.mitarbeiterId}>
                        <ListItemText
                          primary={
                            <Typography variant="body1">
                              {ma.mitarbeiterId?.vorname || ''} {ma.mitarbeiterId?.nachname || 'Unbekannt'}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Rolle: {ma.rolle.charAt(0).toUpperCase() + ma.rolle.slice(1)}
                              </Typography>
                              {ma.mitarbeiterId?.telefon && (
                                <Typography variant="body2" color="text.secondary">
                                  Telefon: {ma.mitarbeiterId.telefon}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/mitarbeiter/${ma.mitarbeiterId?._id}`)}
                        >
                          <PersonIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">Keine Mitarbeiter zugewiesen</Typography>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/umzuege/bearbeiten/${id}`)}
                      sx={{ mt: 2 }}
                    >
                      Mitarbeiter zuweisen
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
          
          {/* Notizen Tab */}
          {activeTab === 4 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Notizen</Typography>
                <Button
                  variant="contained"
                  startIcon={<NoteIcon />}
                  onClick={() => setNotizDialog(true)}
                >
                  Notiz hinzufügen
                </Button>
              </Box>
              
              <Paper variant="outlined">
                {umzug.notizen && umzug.notizen.length > 0 ? (
                  <List>
                    {umzug.notizen.map((notiz, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={notiz.text}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Erstellt von: {notiz.ersteller || 'Unbekannt'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Datum: {formatDate(notiz.datum)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">Keine Notizen vorhanden</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<NoteIcon />}
                      onClick={() => setNotizDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Erste Notiz hinzufügen
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Task-Dialog */}
      <Dialog open={taskDialog} onClose={() => setTaskDialog(false)}>
        <DialogTitle>Neue Aufgabe hinzufügen</DialogTitle>
        <form onSubmit={taskFormik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              id="beschreibung"
              name="beschreibung"
              label="Beschreibung"
              value={taskFormik.values.beschreibung}
              onChange={taskFormik.handleChange}
              onBlur={taskFormik.handleBlur}
              error={taskFormik.touched.beschreibung && Boolean(taskFormik.errors.beschreibung)}
              helperText={taskFormik.touched.beschreibung && taskFormik.errors.beschreibung}
            />
            
            <TextField
              fullWidth
              margin="normal"
              id="faelligkeit"
              name="faelligkeit"
              label="Fälligkeit"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={taskFormik.values.faelligkeit}
              onChange={taskFormik.handleChange}
              onBlur={taskFormik.handleBlur}
              error={taskFormik.touched.faelligkeit && Boolean(taskFormik.errors.faelligkeit)}
              helperText={taskFormik.touched.faelligkeit && taskFormik.errors.faelligkeit}
            />
            
            <TextField
              fullWidth
              margin="normal"
              id="prioritaet"
              name="prioritaet"
              select
              label="Priorität"
              value={taskFormik.values.prioritaet}
              onChange={taskFormik.handleChange}
              onBlur={taskFormik.handleBlur}
            >
              <MenuItem value="niedrig">Niedrig</MenuItem>
              <MenuItem value="mittel">Mittel</MenuItem>
              <MenuItem value="hoch">Hoch</MenuItem>
            </TextField>
            
            <TextField
              fullWidth
              margin="normal"
              id="zugewiesen"
              name="zugewiesen"
              select
              label="Zugewiesen an"
              value={taskFormik.values.zugewiesen}
              onChange={taskFormik.handleChange}
              onBlur={taskFormik.handleBlur}
            >
              <MenuItem value="">Niemand</MenuItem>
              {mitarbeiter?.map((ma) => (
                <MenuItem key={ma._id} value={ma._id}>
                  {ma.vorname} {ma.nachname}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTaskDialog(false)}>Abbrechen</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={taskMutation.isLoading}
            >
              {taskMutation.isLoading ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UmzugDetails;

// frontend/src/pages/umzuege/UmzugForm.js
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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import Loading from '../../components/common/Loading';

const UmzugForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);
  
  // States für Dialoge
  const [kontaktDialog, setKontaktDialog] = useState(false);
  const [fahrzeugDialog, setFahrzeugDialog] = useState(false);
  const [mitarbeiterDialog, setMitarbeiterDialog] = useState(false);
  const [extraLeistungDialog, setExtraLeistungDialog] = useState(false);
  const [zwischenstoppDialog, setZwischenstoppDialog] = useState(false);
  
  // Temporäre Daten für Dialoge
  const [tempKontakt, setTempKontakt] = useState({ name: '', telefon: '', email: '', isKunde: false });
  const [tempFahrzeug, setTempFahrzeug] = useState({ typ: '', kennzeichen: '' });
  const [tempMitarbeiter, setTempMitarbeiter] = useState({ mitarbeiterId: '', rolle: 'helfer' });
  const [tempExtraLeistung, setTempExtraLeistung] = useState({ beschreibung: '', preis: 0, menge: 1 });
  const [tempZwischenstopp, setTempZwischenstopp] = useState({ 
    strasse: '', hausnummer: '', plz: '', ort: '', land: 'Deutschland', etage: 0, aufzug: false, entfernung: 0 
  });
  
  // Daten für Dropdown-Auswahl
  const [mitarbeiterListe, setMitarbeiterListe] = useState([]);
  const [aufnahmen, setAufnahmen] = useState([]);
  
  // Umzugsdaten laden, wenn im Bearbeitungsmodus
  const { data: umzugData, isLoading: loadingUmzug } = useQuery(
    ['umzug', id],
    async () => {
      if (!isEditMode) return null;
      const response = await api.get(`/umzuege/${id}`);
      return response.data;
    },
    {
      enabled: isEditMode,
      onSuccess: (data) => {
        if (data) {
          // Formularwerte setzen
          const initialValues = {
            kundennummer: data.kundennummer || '',
            auftraggeber: data.auftraggeber || { name: '', telefon: '', email: '' },
            kontakte: data.kontakte || [],
            auszugsadresse: data.auszugsadresse || { 
              strasse: '', hausnummer: '', plz: '', ort: '', land: 'Deutschland', etage: 0, aufzug: false, entfernung: 0 
            },
            einzugsadresse: data.einzugsadresse || { 
              strasse: '', hausnummer: '', plz: '', ort: '', land: 'Deutschland', etage: 0, aufzug: false, entfernung: 0 
            },
            zwischenstopps: data.zwischenstopps || [],
            startDatum: data.startDatum ? dayjs(data.startDatum) : null,
            endDatum: data.endDatum ? dayjs(data.endDatum) : null,
            status: data.status || 'angefragt',
            preis: data.preis || { netto: '', brutto: '', mwst: 19, bezahlt: false, zahlungsart: 'rechnung' },
            aufnahmeId: data.aufnahmeId || '',
            fahrzeuge: data.fahrzeuge || [],
            mitarbeiter: data.mitarbeiter || [],
            extraLeistungen: data.extraLeistungen || []
          };
          
          formik.setValues(initialValues);
        }
      }
    }
  );
  
  // Mitarbeiter laden
  const { data: mitarbeiterData, isLoading: loadingMitarbeiter } = useQuery(
    'mitarbeiter',
    async () => {
      const response = await api.get('/mitarbeiter');
      return response.data;
    },
    {
      onSuccess: (data) => {
        setMitarbeiterListe(data);
      }
    }
  );
  
  // Aufnahmen laden
  const { data: aufnahmenData, isLoading: loadingAufnahmen } = useQuery(
    'aufnahmen',
    async () => {
      const response = await api.get('/aufnahmen');
      return response.data;
    },
    {
      onSuccess: (data) => {
        setAufnahmen(data);
      }
    }
  );
  
  // Umzug erstellen oder aktualisieren
  const umzugMutation = useMutation(
    (umzugData) => {
      if (isEditMode) {
        return api.put(`/umzuege/${id}`, umzugData);
      } else {
        return api.post('/umzuege', umzugData);
      }
    },
    {
      onSuccess: (response) => {
        toast.success(`Umzug erfolgreich ${isEditMode ? 'aktualisiert' : 'erstellt'}`);
        queryClient.invalidateQueries('umzuege');
        
        // Zur Detailansicht navigieren
        if (isEditMode) {
          navigate(`/umzuege/${id}`);
        } else if (response.data && response.data.umzug) {
          navigate(`/umzuege/${response.data.umzug._id}`);
        } else {
          navigate('/umzuege');
        }
      },
      onError: (error) => {
        toast.error(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Formik für Umzugsformular
  const formik = useFormik({
    initialValues: {
      kundennummer: '',
      auftraggeber: {
        name: '',
        telefon: '',
        email: ''
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
      startDatum: null,
      endDatum: null,
      status: 'angefragt',
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
    },
    validationSchema: Yup.object({
      kundennummer: Yup.string(),
      auftraggeber: Yup.object({
        name: Yup.string().required('Name ist erforderlich'),
        telefon: Yup.string().required('Telefon ist erforderlich'),
        email: Yup.string().email('Ungültige E-Mail-Adresse')
      }),
      auszugsadresse: Yup.object({
        strasse: Yup.string().required('Straße ist erforderlich'),
        hausnummer: Yup.string().required('Hausnummer ist erforderlich'),
        plz: Yup.string().required('PLZ ist erforderlich'),
        ort: Yup.string().required('Ort ist erforderlich')
      }),
      einzugsadresse: Yup.object({
        strasse: Yup.string().required('Straße ist erforderlich'),
        hausnummer: Yup.string().required('Hausnummer ist erforderlich'),
        plz: Yup.string().required('PLZ ist erforderlich'),
        ort: Yup.string().required('Ort ist erforderlich')
      }),
      startDatum: Yup.date().nullable().required('Startdatum ist erforderlich'),
      endDatum: Yup.date().nullable().required('Enddatum ist erforderlich')
    }),
    onSubmit: (values) => {
      // Datum formatieren
      const formattedValues = {
        ...values,
        startDatum: values.startDatum ? values.startDatum.toISOString() : null,
        endDatum: values.endDatum ? values.endDatum.toISOString() : null
      };
      
      umzugMutation.mutate(formattedValues);
    }
  });
  
  // Kontakt hinzufügen
  const handleAddKontakt = () => {
    const newKontakte = [...formik.values.kontakte, tempKontakt];
    formik.setFieldValue('kontakte', newKontakte);
    setTempKontakt({ name: '', telefon: '', email: '', isKunde: false });
    setKontaktDialog(false);
  };
  
  // Kontakt entfernen
  const handleRemoveKontakt = (index) => {
    const newKontakte = formik.values.kontakte.filter((_, i) => i !== index);
    formik.setFieldValue('kontakte', newKontakte);
  };
  
  // Fahrzeug hinzufügen
  const handleAddFahrzeug = () => {
    const newFahrzeuge = [...formik.values.fahrzeuge, tempFahrzeug];
    formik.setFieldValue('fahrzeuge', newFahrzeuge);
    setTempFahrzeug({ typ: '', kennzeichen: '' });
    setFahrzeugDialog(false);
  };
  
  // Fahrzeug entfernen
  const handleRemoveFahrzeug = (index) => {
    const newFahrzeuge = formik.values.fahrzeuge.filter((_, i) => i !== index);
    formik.setFieldValue('fahrzeuge', newFahrzeuge);
  };
  
  // Mitarbeiter hinzufügen
  const handleAddMitarbeiter = () => {
    // Prüfen, ob Mitarbeiter bereits hinzugefügt wurde
    const isDuplicate = formik.values.mitarbeiter.some(
      (ma) => ma.mitarbeiterId === tempMitarbeiter.mitarbeiterId
    );
    
    if (isDuplicate) {
      toast.error('Dieser Mitarbeiter wurde bereits hinzugefügt');
      return;
    }
    
    const newMitarbeiter = [...formik.values.mitarbeiter, tempMitarbeiter];
    formik.setFieldValue('mitarbeiter', newMitarbeiter);
    setTempMitarbeiter({ mitarbeiterId: '', rolle: 'helfer' });
    setMitarbeiterDialog(false);
  };
  
  // Mitarbeiter entfernen
  const handleRemoveMitarbeiter = (index) => {
    const newMitarbeiter = formik.values.mitarbeiter.filter((_, i) => i !== index);
    formik.setFieldValue('mitarbeiter', newMitarbeiter);
  };
  
  // Extraleistung hinzufügen
  const handleAddExtraLeistung = () => {
    const newExtraLeistungen = [...formik.values.extraLeistungen, tempExtraLeistung];
    formik.setFieldValue('extraLeistungen', newExtraLeistungen);
    setTempExtraLeistung({ beschreibung: '', preis: 0, menge: 1 });
    setExtraLeistungDialog(false);
  };
  
  // Extraleistung entfernen
  const handleRemoveExtraLeistung = (index) => {
    const newExtraLeistungen = formik.values.extraLeistungen.filter((_, i) => i !== index);
    formik.setFieldValue('extraLeistungen', newExtraLeistungen);
  };
  
  // Zwischenstopp hinzufügen
  const handleAddZwischenstopp = () => {
    const newZwischenstopps = [...formik.values.zwischenstopps, tempZwischenstopp];
    formik.setFieldValue('zwischenstopps', newZwischenstopps);
    setTempZwischenstopp({ 
      strasse: '', hausnummer: '', plz: '', ort: '', land: 'Deutschland', etage: 0, aufzug: false, entfernung: 0 
    });
    setZwischenstoppDialog(false);
  };
  
  // Zwischenstopp entfernen
  const handleRemoveZwischenstopp = (index) => {
    const newZwischenstopps = formik.values.zwischenstopps.filter((_, i) => i !== index);
    formik.setFieldValue('zwischenstopps', newZwischenstopps);
  };
  
  // Preisberechnung
  const handlePreisChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    
    if (field === 'netto') {
      const mwst = formik.values.preis.mwst || 19;
      const brutto = numValue * (1 + mwst / 100);
      formik.setFieldValue('preis.netto', numValue);
      formik.setFieldValue('preis.brutto', Math.round(brutto * 100) / 100);
    } else if (field === 'brutto') {
      const mwst = formik.values.preis.mwst || 19;
      const netto = numValue / (1 + mwst / 100);
      formik.setFieldValue('preis.brutto', numValue);
      formik.setFieldValue('preis.netto', Math.round(netto * 100) / 100);
    } else if (field === 'mwst') {
      const netto = formik.values.preis.netto || 0;
      const brutto = netto * (1 + numValue / 100);
      formik.setFieldValue('preis.mwst', numValue);
      formik.setFieldValue('preis.brutto', Math.round(brutto * 100) / 100);
    }
  };
  
  // Aufnahme auswählen und Daten übernehmen
  const handleAufnahmeChange = (aufnahmeId) => {
    formik.setFieldValue('aufnahmeId', aufnahmeId);
    
    if (!aufnahmeId) return;
    
    const selectedAufnahme = aufnahmen.find(a => a._id === aufnahmeId);
    
    if (selectedAufnahme) {
      // Kundendaten übernehmen
      formik.setFieldValue('auftraggeber.name', selectedAufnahme.kundenName || formik.values.auftraggeber.name);
      
      // Adressen übernehmen, falls vorhanden
      if (selectedAufnahme.auszugsadresse) {
        formik.setFieldValue('auszugsadresse', selectedAufnahme.auszugsadresse);
      }
      
      if (selectedAufnahme.einzugsadresse) {
        formik.setFieldValue('einzugsadresse', selectedAufnahme.einzugsadresse);
      }
      
      // Angebotspreis übernehmen
      if (selectedAufnahme.angebotspreis) {
        formik.setFieldValue('preis.netto', selectedAufnahme.angebotspreis.netto || formik.values.preis.netto);
        formik.setFieldValue('preis.brutto', selectedAufnahme.angebotspreis.brutto || formik.values.preis.brutto);
      }
    }
  };
  
  // Lade-Status prüfen
  const isLoading = loadingUmzug || loadingMitarbeiter || loadingAufnahmen || umzugMutation.isLoading;
  
  if (isLoading && isEditMode && !formik.values.auftraggeber.name) {
    return <Loading />;
  }
  
  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Umzug bearbeiten' : 'Neuer Umzug'}
        buttonText="Zurück"
        buttonIcon={<ArrowBackIcon />}
        onButtonClick={() => navigate(isEditMode ? `/umzuege/${id}` : '/umzuege')}
      />
      
      <form onSubmit={formik.handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Grunddaten
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="kundennummer"
                name="kundennummer"
                label="Kundennummer"
                value={formik.values.kundennummer}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.kundennummer && Boolean(formik.errors.kundennummer)}
                helperText={formik.touched.kundennummer && formik.errors.kundennummer}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
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
                <MenuItem value="angefragt">Angefragt</MenuItem>
                <MenuItem value="angebot">Angebot</MenuItem>
                <MenuItem value="geplant">Geplant</MenuItem>
                <MenuItem value="in_bearbeitung">In Bearbeitung</MenuItem>
                <MenuItem value="abgeschlossen">Abgeschlossen</MenuItem>
                <MenuItem value="storniert">Storniert</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="aufnahmeId"
                name="aufnahmeId"
                select
                label="Aufnahme"
                value={formik.values.aufnahmeId}
                onChange={(e) => handleAufnahmeChange(e.target.value)}
                onBlur={formik.handleBlur}
              >
                <MenuItem value="">Keine Aufnahme</MenuItem>
                {aufnahmen.map((aufnahme) => (
                  <MenuItem key={aufnahme._id} value={aufnahme._id}>
                    {aufnahme.kundenName} - {new Date(aufnahme.datum).toLocaleDateString('de-DE')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Startdatum"
                  value={formik.values.startDatum}
                  onChange={(value) => formik.setFieldValue('startDatum', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.startDatum && Boolean(formik.errors.startDatum)}
                      helperText={formik.touched.startDatum && formik.errors.startDatum}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Enddatum"
                  value={formik.values.endDatum}
                  onChange={(value) => formik.setFieldValue('endDatum', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.endDatum && Boolean(formik.errors.endDatum)}
                      helperText={formik.touched.endDatum && formik.errors.endDatum}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Auftraggeber
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="auftraggeber.name"
                name="auftraggeber.name"
                label="Name"
                value={formik.values.auftraggeber.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.auftraggeber?.name && 
                  Boolean(formik.errors.auftraggeber?.name)
                }
                helperText={
                  formik.touched.auftraggeber?.name && 
                  formik.errors.auftraggeber?.name
                }
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="auftraggeber.telefon"
                name="auftraggeber.telefon"
                label="Telefon"
                value={formik.values.auftraggeber.telefon}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.auftraggeber?.telefon && 
                  Boolean(formik.errors.auftraggeber?.telefon)
                }
                helperText={
                  formik.touched.auftraggeber?.telefon && 
                  formik.errors.auftraggeber?.telefon
                }
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="auftraggeber.email"
                name="auftraggeber.email"
                label="E-Mail"
                value={formik.values.auftraggeber.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.auftraggeber?.email && 
                  Boolean(formik.errors.auftraggeber?.email)
                }
                helperText={
                  formik.touched.auftraggeber?.email && 
                  formik.errors.auftraggeber?.email
                }
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Weitere Kontakte</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setKontaktDialog(true)}
              >
                Kontakt hinzufügen
              </Button>
            </Box>
            
            <List>
              {formik.values.kontakte.map((kontakt, index) => (
                <ListItem key={index} dense divider>
                  <ListItemText
                    primary={kontakt.name}
                    secondary={`${kontakt.telefon}${kontakt.email ? ` | ${kontakt.email}` : ''} ${
                      kontakt.isKunde ? ' | Kunde' : ''
                    }`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleRemoveKontakt(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {formik.values.kontakte.length === 0 && (
                <ListItem dense>
                  <ListItemText primary="Keine weiteren Kontakte" />
                </ListItem>
              )}
            </List>
          </Box>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Adressen
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Auszugsadresse
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="auszugsadresse.strasse"
                name="auszugsadresse.strasse"
                label="Straße"
                value={formik.values.auszugsadresse.strasse}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.auszugsadresse?.strasse && 
                  Boolean(formik.errors.auszugsadresse?.strasse)
                }
                helperText={
                  formik.touched.auszugsadresse?.strasse && 
                  formik.errors.auszugsadresse?.strasse
                }
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
                error={
                  formik.touched.auszugsadresse?.hausnummer && 
                  Boolean(formik.errors.auszugsadresse?.hausnummer)
                }
                helperText={
                  formik.touched.auszugsadresse?.hausnummer && 
                  formik.errors.auszugsadresse?.hausnummer
                }
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
                error={
                  formik.touched.auszugsadresse?.plz && 
                  Boolean(formik.errors.auszugsadresse?.plz)
                }
                helperText={
                  formik.touched.auszugsadresse?.plz && 
                  formik.errors.auszugsadresse?.plz
                }
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
                error={
                  formik.touched.auszugsadresse?.ort && 
                  Boolean(formik.errors.auszugsadresse?.ort)
                }
                helperText={
                  formik.touched.auszugsadresse?.ort && 
                  formik.errors.auszugsadresse?.ort
                }
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
          
          <Typography variant="subtitle1" gutterBottom>
            Einzugsadresse
          </Typography>
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
                error={
                  formik.touched.einzugsadresse?.strasse && 
                  Boolean(formik.errors.einzugsadresse?.strasse)
                }
                helperText={
                  formik.touched.einzugsadresse?.strasse && 
                  formik.errors.einzugsadresse?.strasse
                }
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
                error={
                  formik.touched.einzugsadresse?.hausnummer && 
                  Boolean(formik.errors.einzugsadresse?.hausnummer)
                }
                helperText={
                  formik.touched.einzugsadresse?.hausnummer && 
                  formik.errors.einzugsadresse?.hausnummer
                }
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
                error={
                  formik.touched.einzugsadresse?.plz && 
                  Boolean(formik.errors.einzugsadresse?.plz)
                }
                helperText={
                  formik.touched.einzugsadresse?.plz && 
                  formik.errors.einzugsadresse?.plz
                }
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
                error={
                  formik.touched.einzugsadresse?.ort && 
                  Boolean(formik.errors.einzugsadresse?.ort)
                }
                helperText={
                  formik.touched.einzugsadresse?.ort && 
                  formik.errors.einzugsadresse?.ort
                }
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
      
      {/* Notiz-Dialog */}
      <Dialog open={notizDialog} onClose={() => setNotizDialog(false)}>
        <DialogTitle>Notiz hinzufügen</DialogTitle>
        <form onSubmit={notizFormik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              id="text"
              name="text"
              label="Notiz"
              multiline
              rows={4}
              value={notizFormik.values.text}
              onChange={notizFormik.handleChange}
              onBlur={notizFormik.handleBlur}
              error={notizFormik.touched.text && Boolean(notizFormik.errors.text)}
              helperText={notizFormik.touched.text && notizFormik.errors.text}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNotizDialog(false)}>Abbrechen</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={notizMutation.isLoading}
            >
              {notizMutation.isLoading ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
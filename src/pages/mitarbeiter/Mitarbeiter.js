// frontend/src/pages/mitarbeiter/Mitarbeiter.js
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
  Chip,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Dangerous as InactiveIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import Loading from '../../components/common/Loading';

const Mitarbeiter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';
  
  // Filter-State
  const [filter, setFilter] = useState({
    search: '',
    isActive: 'all',
    page: 1,
    limit: 10
  });
  
  // Daten laden
  const { data, isLoading } = useQuery(
    ['mitarbeiter', filter],
    async () => {
      const params = {
        page: filter.page,
        limit: filter.limit
      };
      
      if (filter.search) params.search = filter.search;
      if (filter.isActive !== 'all') params.isActive = filter.isActive === 'active';
      
      const response = await api.get('/mitarbeiter', { params });
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
  
  // Neuen Mitarbeiter erstellen
  const handleCreateMitarbeiter = () => {
    navigate('/mitarbeiter/neu');
  };
  
  // Formatieren des Datums
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };
  
  // Initialen für Avatar
  const getInitials = (vorname, nachname) => {
    return `${vorname?.charAt(0) || ''}${nachname?.charAt(0) || ''}`.toUpperCase();
  };
  
  // Tabelle rendern
  const renderTable = () => {
    if (!data || data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} align="center">
            Keine Mitarbeiter gefunden.
          </TableCell>
        </TableRow>
      );
    }
    
    return data.map((mitarbeiter) => (
      <TableRow key={mitarbeiter._id}>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, bgcolor: mitarbeiter.isActive ? 'primary.main' : 'text.disabled' }}>
              {getInitials(mitarbeiter.vorname, mitarbeiter.nachname)}
            </Avatar>
            <Box>
              <Box>{mitarbeiter.vorname} {mitarbeiter.nachname}</Box>
              <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                {mitarbeiter.position || '-'}
              </Box>
            </Box>
          </Box>
        </TableCell>
        <TableCell>{mitarbeiter.telefon || '-'}</TableCell>
        <TableCell>{formatDate(mitarbeiter.einstellungsdatum)}</TableCell>
        <TableCell>
          {mitarbeiter.isActive ? (
            <Chip 
              icon={<ActiveIcon fontSize="small" />} 
              label="Aktiv" 
              color="success" 
              size="small" 
              variant="outlined" 
            />
          ) : (
            <Chip 
              icon={<InactiveIcon fontSize="small" />} 
              label="Inaktiv" 
              color="error" 
              size="small" 
              variant="outlined" 
            />
          )}
        </TableCell>
        <TableCell>
          <IconButton
            color="primary"
            onClick={() => navigate(`/mitarbeiter/${mitarbeiter._id}`)}
          >
            <ViewIcon />
          </IconButton>
          {isAdmin && (
            <IconButton
              color="secondary"
              onClick={() => navigate(`/mitarbeiter/bearbeiten/${mitarbeiter._id}`)}
            >
              <EditIcon />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
    ));
  };
  
  return (
    <Box>
      <PageHeader
        title="Mitarbeiter"
        buttonText="Neuer Mitarbeiter"
        buttonIcon={<AddIcon />}
        onButtonClick={handleCreateMitarbeiter}
        showButton={isAdmin}
      />
      
      {/* Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              name="search"
              label="Suche nach Name, Position, Telefon..."
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
              name="isActive"
              label="Status"
              select
              value={filter.isActive}
              onChange={handleFilterChange}
              fullWidth
              variant="outlined"
              size="small"
            >
              <MenuItem value="all">Alle</MenuItem>
              <MenuItem value="active">Aktiv</MenuItem>
              <MenuItem value="inactive">Inaktiv</MenuItem>
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
                  <TableCell>Name</TableCell>
                  <TableCell>Telefon</TableCell>
                  <TableCell>Einstellungsdatum</TableCell>
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

export default Mitarbeiter;

// frontend/src/pages/mitarbeiter/MitarbeiterDetails.js
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
  Avatar,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  Dangerous as InactiveIcon,
  CheckCircle as ActiveIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import Loading from '../../components/common/Loading';
import FileUpload from '../../components/common/FileUpload';

const MitarbeiterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';
  
  // State für aktiven Tab
  const [activeTab, setActiveTab] = useState(0);
  
  // Dialog-States
  const [uploadDialog, setUploadDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  
  // Mitarbeiterdaten laden
  const { data: mitarbeiter, isLoading } = useQuery(
    ['mitarbeiter', id],
    async () => {
      const response = await api.get(`/mitarbeiter/${id}`);
      return response.data;
    }
  );
  
  // Status-Mutation
  const statusMutation = useMutation(
    (isActive) => api.put(`/mitarbeiter/${id}`, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['mitarbeiter', id]);
        setStatusDialog(false);
        toast.success(`Mitarbeiter erfolgreich ${mitarbeiter.isActive ? 'deaktiviert' : 'aktiviert'}`);
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
      formData.append('bezugModell', 'Mitarbeiter');
      formData.append('kategorie', 'dokument');
      
      return api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    },
    {
      onSuccess: (response) => {
        // Dokument zum Mitarbeiter hinzufügen
        if (response.data && response.data.datei) {
          api.post(`/mitarbeiter/${id}/dokument`, {
            name: response.data.datei.originalname,
            pfad: response.data.datei.pfad
          }).then(() => {
            queryClient.invalidateQueries(['mitarbeiter', id]);
            toast.success('Dokument erfolgreich hochgeladen');
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
  
  // Tab wechseln
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Status ändern
  const handleStatusChange = () => {
    statusMutation.mutate(!mitarbeiter.isActive);
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
  
  // Initialen für Avatar
  const getInitials = (vorname, nachname) => {
    return `${vorname?.charAt(0) || ''}${nachname?.charAt(0) || ''}`.toUpperCase();
  };
  
  // Arbeitszeitformat
  const formatArbeitszeit = (startzeit, endzeit) => {
    if (!startzeit || !endzeit) return '-';
    
    const formatTime = (dateString) => {
      return new Date(dateString).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    return `${formatTime(startzeit)} - ${formatTime(endzeit)}`;
  };
  
  // Pausenzeit berechnen
  const calculatePausenzeit = (pausen) => {
    if (!pausen || pausen.length === 0) return 0;
    
    let pausenzeit = 0;
    pausen.forEach(pause => {
      if (pause.start && pause.ende) {
        const start = new Date(pause.start);
        const ende = new Date(pause.ende);
        pausenzeit += (ende - start) / (1000 * 60); // in Minuten
      }
    });
    
    return pausenzeit;
  };
  
  // Arbeitszeit berechnen
  const calculateArbeitszeit = (startzeit, endzeit, pausen) => {
    if (!startzeit || !endzeit) return '-';
    
    const start = new Date(startzeit);
    const ende = new Date(endzeit);
    const gesamtzeit = (ende - start) / (1000 * 60 * 60); // in Stunden
    
    const pausenzeit = calculatePausenzeit(pausen) / 60; // in Stunden
    const arbeitszeit = gesamtzeit - pausenzeit;
    
    return `${arbeitszeit.toFixed(2)} h`;
  };
  
  // Wenn Daten geladen werden
  if (isLoading) {
    return <Loading />;
  }
  
  // Wenn Mitarbeiter nicht gefunden wurde
  if (!mitarbeiter) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5">Mitarbeiter nicht gefunden.</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/mitarbeiter')}
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
        title={`${mitarbeiter.vorname} ${mitarbeiter.nachname}`}
        buttonText="Zurück"
        buttonIcon={<ArrowBackIcon />}
        onButtonClick={() => navigate('/mitarbeiter')}
      />
      
      {/* Status und Infos */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={1}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: mitarbeiter.isActive ? 'primary.main' : 'text.disabled',
                fontSize: '2rem'
              }}
            >
              {getInitials(mitarbeiter.vorname, mitarbeiter.nachname)}
            </Avatar>
          </Grid>
          <Grid item xs={12} md={7}>
            <Typography variant="h5">
              {mitarbeiter.vorname} {mitarbeiter.nachname}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {mitarbeiter.position || 'Keine Position angegeben'}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {mitarbeiter.isActive ? (
                <Chip 
                  icon={<ActiveIcon />} 
                  label="Aktiv" 
                  color="success" 
                  variant="outlined" 
                />
              ) : (
                <Chip 
                  icon={<InactiveIcon />} 
                  label="Inaktiv" 
                  color="error" 
                  variant="outlined" 
                />
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
              {isAdmin && (
                <>
                  <Button
                    variant="outlined"
                    color={mitarbeiter.isActive ? 'error' : 'success'}
                    onClick={() => setStatusDialog(true)}
                    sx={{ mb: 1 }}
                  >
                    {mitarbeiter.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/mitarbeiter/bearbeiten/${id}`)}
                  >
                    Bearbeiten
                  </Button>
                </>
              )}
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
          <Tab label="Übersicht" />
          <Tab label="Arbeitszeiten" />
          <Tab label="Dokumente" />
        </Tabs>
        
        <Divider />
        
        <Box sx={{ p: 3 }}>
          {/* Übersicht Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Kontaktinformationen
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Telefon
                    </Typography>
                    <Typography variant="body1">
                      {mitarbeiter.telefon || '-'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      E-Mail
                    </Typography>
                    <Typography variant="body1">
                      {mitarbeiter.userId?.email || '-'}
                    </Typography>
                  </Box>
                  
                  {mitarbeiter.adresse && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Adresse
                      </Typography>
                      <Typography variant="body1">
                        {mitarbeiter.adresse.strasse} {mitarbeiter.adresse.hausnummer}
                      </Typography>
                      <Typography variant="body1">
                        {mitarbeiter.adresse.plz} {mitarbeiter.adresse.ort}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Jobdetails
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Position
                    </Typography>
                    <Typography variant="body1">
                      {mitarbeiter.position || '-'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Einstellungsdatum
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(mitarbeiter.einstellungsdatum)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Rolle
                    </Typography>
                    <Typography variant="body1">
                      {mitarbeiter.userId?.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Fähigkeiten
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {mitarbeiter.faehigkeiten && mitarbeiter.faehigkeiten.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {mitarbeiter.faehigkeiten.map((faehigkeit, index) => (
                        <Chip key={index} label={faehigkeit} />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Keine Fähigkeiten hinterlegt
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Führerscheinklassen
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {mitarbeiter.fuehrerscheinklassen && mitarbeiter.fuehrerscheinklassen.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {mitarbeiter.fuehrerscheinklassen.map((klasse, index) => (
                        <Chip key={index} label={klasse} color="primary" variant="outlined" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Keine Führerscheinklassen hinterlegt
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Notizen
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {mitarbeiter.notizen ? (
                    <Typography variant="body1" whiteSpace="pre-wrap">
                      {mitarbeiter.notizen}
                    </Typography>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Keine Notizen vorhanden
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {/* Arbeitszeiten Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Arbeitszeiten
              </Typography>
              
              <Paper variant="outlined">
                {mitarbeiter.arbeitszeiten && mitarbeiter.arbeitszeiten.length > 0 ? (
                  <List>
                    {mitarbeiter.arbeitszeiten.map((arbeitszeit, index) => (
                      <ListItem key={index} divider>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Datum
                            </Typography>
                            <Typography variant="body1">
                              {formatDate(arbeitszeit.datum)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Arbeitszeit
                            </Typography>
                            <Typography variant="body1">
                              {formatArbeitszeit(arbeitszeit.startzeit, arbeitszeit.endzeit)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Pausen
                            </Typography>
                            <Typography variant="body1">
                              {arbeitszeit.pausen && arbeitszeit.pausen.length > 0
                                ? `${calculatePausenzeit(arbeitszeit.pausen)} min`
                                : 'Keine Pausen'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Gesamtarbeitszeit
                            </Typography>
                            <Typography variant="body1">
                              {calculateArbeitszeit(arbeitszeit.startzeit, arbeitszeit.endzeit, arbeitszeit.pausen)}
                            </Typography>
                          </Grid>
                          {arbeitszeit.notizen && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Notizen
                              </Typography>
                              <Typography variant="body1">
                                {arbeitszeit.notizen}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" gutterBottom>
                      Keine Arbeitszeiten erfasst
                    </Typography>
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
                {mitarbeiter.dokumente && mitarbeiter.dokumente.length > 0 ? (
                  <List>
                    {mitarbeiter.dokumente.map((dokument, index) => (
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
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Status-Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>
          Mitarbeiter {mitarbeiter.isActive ? 'deaktivieren' : 'aktivieren'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchten Sie {mitarbeiter.vorname} {mitarbeiter.nachname} wirklich 
            {mitarbeiter.isActive ? ' deaktivieren?' : ' aktivieren?'}
            {mitarbeiter.isActive
              ? ' Deaktivierte Mitarbeiter können sich nicht anmelden und werden in der Planung nicht berücksichtigt.'
              : ' Aktivierte Mitarbeiter können sich anmelden und werden in der Planung berücksichtigt.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            color={mitarbeiter.isActive ? 'error' : 'success'}
            onClick={handleStatusChange}
            disabled={statusMutation.isLoading}
          >
            {statusMutation.isLoading
              ? 'Wird bearbeitet...'
              : mitarbeiter.isActive
                ? 'Deaktivieren'
                : 'Aktivieren'
            }
          </Button>
        </DialogActions>
      </Dialog>
      
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
    </Box>
  );
};

export default MitarbeiterDetails;

// frontend/src/pages/mitarbeiter/MitarbeiterForm.js
import React, { useState } from 'react';
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
  Divider,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import Loading from '../../components/common/Loading';

const MitarbeiterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';
  const isEditMode = Boolean(id);
  
  // States für Dialoge
  const [faehigkeitDialog, setFaehigkeitDialog] = useState(false);
  const [fuehrerscheinDialog, setFuehrerscheinDialog] = useState(false);
  
  // Temporäre Daten für Dialoge
  const [tempFaehigkeit, setTempFaehigkeit] = useState('');
  const [tempFuehrerschein, setTempFuehrerschein] = useState('');
  
  // Benutzer laden
  const { data: users, isLoading: loadingUsers } = useQuery(
    'users',
    async () => {
      const response = await api.get('/auth/users');
      return response.data;
    },
    {
      enabled: isAdmin
    }
  );
  
  // Mitarbeiterdaten laden, wenn im Bearbeitungsmodus
  const { data: mitarbeiterData, isLoading: loadingMitarbeiter } = useQuery(
    ['mitarbeiter', id],
    async () => {
      if (!isEditMode) return null;
      const response = await api.get(`/mitarbeiter/${id}`);
      return response.data;
    },
    {
      enabled: isEditMode,
      onSuccess: (data) => {
        if (data) {
          // Formularwerte setzen
          const initialValues = {
            userId: data.userId?._id || '',
            vorname: data.vorname || '',
            nachname: data.nachname || '',
            telefon: data.telefon || '',
            adresse: data.adresse || {
              strasse: '',
              hausnummer: '',
              plz: '',
              ort: ''
            },
            position: data.position || '',
            einstellungsdatum: data.einstellungsdatum ? dayjs(data.einstellungsdatum) : null,
            faehigkeiten: data.faehigkeiten || [],
            fuehrerscheinklassen: data.fuehrerscheinklassen || [],
            notizen: data.notizen || '',
            isActive: data.isActive !== undefined ? data.isActive : true
          };
          
          formik.setValues(initialValues);
        }
      }
    }
  );
  
  // Mitarbeiter erstellen oder aktualisieren
  const mitarbeiterMutation = useMutation(
    (mitarbeiterData) => {
      if (isEditMode) {
        return api.put(`/mitarbeiter/${id}`, mitarbeiterData);
      } else {
        return api.post('/mitarbeiter', mitarbeiterData);
      }
    },
    {
      onSuccess: (response) => {
        toast.success(`Mitarbeiter erfolgreich ${isEditMode ? 'aktualisiert' : 'erstellt'}`);
        queryClient.invalidateQueries('mitarbeiter');
        
        // Zur Detailansicht navigieren
        if (isEditMode) {
          navigate(`/mitarbeiter/${id}`);
        } else if (response.data && response.data.mitarbeiter) {
          navigate(`/mitarbeiter/${response.data.mitarbeiter._id}`);
        } else {
          navigate('/mitarbeiter');
        }
      },
      onError: (error) => {
        toast.error(`Fehler: ${error.response?.data?.message || 'Unbekannter Fehler'}`);
      }
    }
  );
  
  // Formik für Mitarbeiterformular
  const formik = useFormik({
    initialValues: {
      userId: '',
      vorname: '',
      nachname: '',
      telefon: '',
      adresse: {
        strasse: '',
        hausnummer: '',
        plz: '',
        ort: ''
      },
      position: '',
      einstellungsdatum: null,
      faehigkeiten: [],
      fuehrerscheinklassen: [],
      notizen: '',
      isActive: true
    },
    validationSchema: Yup.object({
      userId: Yup.string().required('Benutzer ist erforderlich'),
      vorname: Yup.string().required('Vorname ist erforderlich'),
      nachname: Yup.string().required('Nachname ist erforderlich'),
      telefon: Yup.string()
    }),
    onSubmit: (values) => {
      // Datum formatieren
      const formattedValues = {
        ...values,
        einstellungsdatum: values.einstellungsdatum ? values.einstellungsdatum.toISOString() : null
      };
      
      mitarbeiterMutation.mutate(formattedValues);
    }
  });
  
  // Fähigkeit hinzufügen
  const handleAddFaehigkeit = () => {
    if (!tempFaehigkeit) return;
    
    // Prüfen, ob Fähigkeit bereits existiert
    if (formik.values.faehigkeiten.includes(tempFaehigkeit)) {
      toast.info('Diese Fähigkeit ist bereits vorhanden');
      return;
    }
    
    const newFaehigkeiten = [...formik.values.faehigkeiten, tempFaehigkeit];
    formik.setFieldValue('faehigkeiten', newFaehigkeiten);
    setTempFaehigkeit('');
    setFaehigkeitDialog(false);
  };
  
  // Fähigkeit entfernen
  const handleRemoveFaehigkeit = (faehigkeit) => {
    const newFaehigkeiten = formik.values.faehigkeiten.filter(f => f !== faehigkeit);
    formik.setFieldValue('faehigkeiten', newFaehigkeiten);
  };
  
  // Führerscheinklasse hinzufügen
  const handleAddFuehrerschein = () => {
    if (!tempFuehrerschein) return;
    
    // Prüfen, ob Führerscheinklasse bereits existiert
    if (formik.values.fuehrerscheinklassen.includes(tempFuehrerschein)) {
      toast.info('Diese Führerscheinklasse ist bereits vorhanden');
      return;
    }
    
    const newFuehrerscheine = [...formik.values.fuehrerscheinklassen, tempFuehrerschein];
    formik.setFieldValue('fuehrerscheinklassen', newFuehrerscheine);
    setTempFuehrerschein('');
    setFuehrerscheinDialog(false);
  };
  
  // Führerscheinklasse entfernen
  const handleRemoveFuehrerschein = (klasse) => {
    const newFuehrerscheine = formik.values.fuehrerscheinklassen.filter(f => f !== klasse);
    formik.setFieldValue('fuehrerscheinklassen', newFuehrerscheine);
  };
  
  // Lade-Status prüfen
  const isLoading = loadingUsers || loadingMitarbeiter || mitarbeiterMutation.isLoading;
  
  // Prüfen, ob man Admin ist
  if (!isAdmin) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5">Sie haben keine Berechtigung, diese Seite zu sehen.</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/mitarbeiter')}
          sx={{ mt: 2 }}
        >
          Zurück zur Übersicht
        </Button>
      </Box>
    );
  }
  
  if (isLoading && isEditMode && !formik.values.vorname) {
    return <Loading />;
  }
  
  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
        buttonText="Zurück"
        buttonIcon={<ArrowBackIcon />}
        onButtonClick={() => navigate(isEditMode ? `/mitarbeiter/${id}` : '/mitarbeiter')}
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
                id="userId"
                name="userId"
                select
                label="Benutzer"
                value={formik.values.userId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.userId && Boolean(formik.errors.userId)}
                helperText={formik.touched.userId && formik.errors.userId}
                SelectProps={{
                  native: true
                }}
              >
                <option value="">Bitte wählen</option>
                {users?.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="isActive"
                    name="isActive"
                    checked={formik.values.isActive}
                    onChange={formik.handleChange}
                  />
                }
                label="Aktiv"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="vorname"
                name="vorname"
                label="Vorname"
                value={formik.values.vorname}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.vorname && Boolean(formik.errors.vorname)}
                helperText={formik.touched.vorname && formik.errors.vorname}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="nachname"
                name="nachname"
                label="Nachname"
                value={formik.values.nachname}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.nachname && Boolean(formik.errors.nachname)}
                helperText={formik.touched.nachname && formik.errors.nachname}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="telefon"
                name="telefon"
                label="Telefon"
                value={formik.values.telefon}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.telefon && Boolean(formik.errors.telefon)}
                helperText={formik.touched.telefon && formik.errors.telefon}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="position"
                name="position"
                label="Position"
                value={formik.values.position}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Einstellungsdatum"
                  value={formik.values.einstellungsdatum}
                  onChange={(value) => formik.setFieldValue('einstellungsdatum', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Adresse
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                id="adresse.strasse"
                name="adresse.strasse"
                label="Straße"
                value={formik.values.adresse.strasse}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="adresse.hausnummer"
                name="adresse.hausnummer"
                label="Hausnummer"
                value={formik.values.adresse.hausnummer}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                id="adresse.plz"
                name="adresse.plz"
                label="PLZ"
                value={formik.values.adresse.plz}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                id="adresse.ort"
                name="adresse.ort"
                label="Ort"
                value={formik.values.adresse.ort}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
          </Grid>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Fähigkeiten</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setFaehigkeitDialog(true)}
            >
              Fähigkeit hinzufügen
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formik.values.faehigkeiten && formik.values.faehigkeiten.length > 0 ? (
              formik.values.faehigkeiten.map((faehigkeit, index) => (
                <Chip
                  key={index}
                  label={faehigkeit}
                  onDelete={() => handleRemoveFaehigkeit(faehigkeit)}
                  deleteIcon={<DeleteIcon />}
                />
              ))
            ) : (
              <Typography variant="body1" color="text.secondary">
                Keine Fähigkeiten hinterlegt
              </Typography>
            )}
          </Box>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Führerscheinklassen</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setFuehrerscheinDialog(true)}
            >
              Klasse hinzufügen
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formik.values.fuehrerscheinklassen && formik.values.fuehrerscheinklassen.length > 0 ? (
              formik.values.fuehrerscheinklassen.map((klasse, index) => (
                <Chip
                  key={index}
                  label={klasse}
                  color="primary"
                  variant="outlined"
                  onDelete={() => handleRemoveFuehrerschein(klasse)}
                  deleteIcon={<DeleteIcon />}
                />
              ))
            ) : (
              <Typography variant="body1" color="text.secondary">
                Keine Führerscheinklassen hinterlegt
              </Typography>
            )}
          </Box>
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
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(isEditMode ? `/mitarbeiter/${id}` : '/mitarbeiter')}
            sx={{ mr: 2 }}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={mitarbeiterMutation.isLoading}
          >
            {mitarbeiterMutation.isLoading ? 'Speichern...' : 'Speichern'}
          </Button>
        </Box>
      </form>
      
      {/* Fähigkeit-Dialog */}
      <Dialog open={faehigkeitDialog} onClose={() => setFaehigkeitDialog(false)}>
        <DialogTitle>Fähigkeit hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Fähigkeit"
            fullWidth
            value={tempFaehigkeit}
            onChange={(e) => setTempFaehigkeit(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFaehigkeitDialog(false)}>Abbrechen</Button>
          <Button
            onClick={handleAddFaehigkeit}
            variant="contained"
            disabled={!tempFaehigkeit}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Führerschein-Dialog */}
      <Dialog open={fuehrerscheinDialog} onClose={() => setFuehrerscheinDialog(false)}>
        <DialogTitle>Führerscheinklasse hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Führerscheinklasse"
            fullWidth
            value={tempFuehrerschein}
            onChange={(e) => setTempFuehrerschein(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFuehrerscheinDialog(false)}>Abbrechen</Button>
          <Button
            onClick={handleAddFuehrerschein}
            variant="contained"
            disabled={!tempFuehrerschein}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MitarbeiterForm;
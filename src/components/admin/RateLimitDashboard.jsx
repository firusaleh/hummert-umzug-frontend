// components/admin/RateLimitDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Alert, 
  AlertTitle,
  Grid,
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  CircularProgress
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  AlertTriangle, 
  Shield, 
  Activity, 
  Users,
  RefreshCw,
  Ban,
  CheckCircle
} from 'lucide-react';
import api from '../../services/api';

const RateLimitDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [violations, setViolations] = useState([]);
  const [config, setConfig] = useState(null);
  const [whitelist, setWhitelist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRateLimitData();
    const interval = setInterval(fetchRateLimitData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRateLimitData = async () => {
    try {
      setLoading(true);
      const [statsRes, violationsRes, configRes, whitelistRes] = await Promise.all([
        api.get('/rate-limits/statistics'),
        api.get('/rate-limits/violations'),
        api.get('/rate-limits/config'),
        api.get('/rate-limits/whitelist')
      ]);

      setStatistics(statsRes.data.statistics);
      setViolations(violationsRes.data.violations);
      setConfig(configRes.data.configuration);
      setWhitelist(whitelistRes.data.whitelist);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Rate-Limit-Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearRateLimit = async (key) => {
    try {
      await api.delete(`/rate-limits/clear/${encodeURIComponent(key)}`);
      fetchRateLimitData();
    } catch (err) {
      console.error('Fehler beim Zurücksetzen des Rate-Limits:', err);
    }
  };

  const addToWhitelist = async (ip) => {
    try {
      await api.post('/rate-limits/whitelist', { ip, duration: 86400 });
      fetchRateLimitData();
    } catch (err) {
      console.error('Fehler beim Hinzufügen zur Whitelist:', err);
    }
  };

  const removeFromWhitelist = async (ip) => {
    try {
      await api.delete(`/rate-limits/whitelist/${encodeURIComponent(ip)}`);
      fetchRateLimitData();
    } catch (err) {
      console.error('Fehler beim Entfernen von der Whitelist:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Fehler</AlertTitle>
        {error}
      </Alert>
    );
  }

  // Prepare chart data
  const violationsByType = statistics?.byType ? Object.entries(statistics.byType).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count
  })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Container maxWidth="lg">
      <Box py={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">Rate Limit Überwachung</Typography>
          <Button 
            onClick={fetchRateLimitData} 
            size="small" 
            variant="contained"
            startIcon={<RefreshCw size={16} />}
          >
            Aktualisieren
          </Button>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Gesamte Verstöße
                    </Typography>
                    <Typography variant="h4">
                      {statistics?.totalViolations || 0}
                    </Typography>
                  </Box>
                  <AlertTriangle size={40} color="#f59e0b" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Aktive Limits
                    </Typography>
                    <Typography variant="h4">
                      {Object.keys(config || {}).length}
                    </Typography>
                  </Box>
                  <Shield size={40} color="#3b82f6" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Top-Verletzer
                    </Typography>
                    <Typography variant="h4">
                      {statistics?.topOffenders?.length || 0}
                    </Typography>
                  </Box>
                  <Users size={40} color="#ef4444" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Whitelist
                    </Typography>
                    <Typography variant="h4">
                      {whitelist?.length || 0}
                    </Typography>
                  </Box>
                  <CheckCircle size={40} color="#10b981" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Violations by Type */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verstöße nach Typ
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={violationsByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Distribution Pie Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verteilung der Verstöße
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={violationsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.type}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {violationsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Offenders Table */}
        {statistics?.topOffenders && statistics.topOffenders.length > 0 && (
          <Box mt={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Verletzer
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>IP-Adresse</TableCell>
                        <TableCell align="right">Verstöße</TableCell>
                        <TableCell align="right">Aktionen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistics.topOffenders.map((offender) => (
                        <TableRow key={offender.ip}>
                          <TableCell>{offender.ip}</TableCell>
                          <TableCell align="right">{offender.violationCount}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => addToWhitelist(offender.ip)}
                            >
                              Whitelist
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              onClick={() => clearRateLimit(offender.ip)}
                              sx={{ ml: 1 }}
                            >
                              Limit zurücksetzen
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Recent Violations */}
        {violations && violations.length > 0 && (
          <Box mt={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Kürzliche Verstöße
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Zeitstempel</TableCell>
                        <TableCell>IP-Adresse</TableCell>
                        <TableCell>Endpunkt</TableCell>
                        <TableCell>Typ</TableCell>
                        <TableCell align="right">Aktionen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {violations.slice(0, 10).map((violation, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(violation.timestamp).toLocaleString('de-DE')}
                          </TableCell>
                          <TableCell>{violation.ip}</TableCell>
                          <TableCell>{violation.endpoint}</TableCell>
                          <TableCell>
                            <Chip
                              label={violation.type}
                              size="small"
                              color={violation.type === 'global' ? 'error' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => addToWhitelist(violation.ip)}
                              title="Zur Whitelist hinzufügen"
                            >
                              <CheckCircle size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Whitelist */}
        {whitelist && whitelist.length > 0 && (
          <Box mt={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Whitelist
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>IP-Adresse</TableCell>
                        <TableCell>Hinzugefügt am</TableCell>
                        <TableCell>Läuft ab</TableCell>
                        <TableCell align="right">Aktionen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {whitelist.map((entry) => (
                        <TableRow key={entry.ip}>
                          <TableCell>{entry.ip}</TableCell>
                          <TableCell>
                            {new Date(entry.addedAt).toLocaleString('de-DE')}
                          </TableCell>
                          <TableCell>
                            {entry.expiresAt ? new Date(entry.expiresAt).toLocaleString('de-DE') : 'Nie'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromWhitelist(entry.ip)}
                              title="Von Whitelist entfernen"
                            >
                              <Ban size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default RateLimitDashboard;
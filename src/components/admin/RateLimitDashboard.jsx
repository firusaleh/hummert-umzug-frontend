// components/admin/RateLimitDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import api from '@/services/api';

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
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Rate Limit Überwachung</h2>
        <Button onClick={fetchRateLimitData} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Aktualisieren
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600">Gesamte Verstöße</p>
              <p className="text-2xl font-bold">{statistics?.totalViolations || 0}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-yellow-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600">Aktive Limits</p>
              <p className="text-2xl font-bold">{Object.keys(config || {}).length}</p>
            </div>
            <Shield className="h-10 w-10 text-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600">Top-Verletzer</p>
              <p className="text-2xl font-bold">{statistics?.topOffenders?.length || 0}</p>
            </div>
            <Users className="h-10 w-10 text-red-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600">Whitelist</p>
              <p className="text-2xl font-bold">{whitelist?.length || 0}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Violations by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Verstöße nach Typ</CardTitle>
          </CardHeader>
          <CardContent>
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

        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Verteilung der Verstöße</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={violationsByType}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
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
      </div>

      {/* Top Offenders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top-Verletzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Kennung</th>
                  <th className="text-left p-2">Typ</th>
                  <th className="text-left p-2">Verstöße</th>
                  <th className="text-left p-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((violator, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {violator.identifier}
                      </code>
                    </td>
                    <td className="p-2">
                      <Badge variant={violator.type === 'auth' ? 'destructive' : 'secondary'}>
                        {violator.type}
                      </Badge>
                    </td>
                    <td className="p-2">{violator.count}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => clearRateLimit(violator.identifier)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToWhitelist(violator.identifier.replace('ip:', ''))}
                          disabled={violator.identifier.startsWith('user:')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Whitelist
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Konfiguration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(config || {}).map(([key, value]) => (
              <div key={key} className="border rounded p-4">
                <h4 className="font-semibold capitalize">{key}</h4>
                <p className="text-sm text-gray-600">Fenster: {value.window}</p>
                <p className="text-sm text-gray-600">Limit: {value.limit}</p>
                <p className="text-sm text-gray-600">Strategie: {value.strategy}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle>Whitelist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {whitelist.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.ip}</code>
                  <span className="text-sm text-gray-600 ml-2">
                    TTL: {Math.floor(item.ttl / 3600)}h
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeFromWhitelist(item.ip)}
                >
                  <Ban className="h-3 w-3 mr-1" />
                  Entfernen
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RateLimitDashboard;
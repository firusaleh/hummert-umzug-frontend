// src/pages/Dashboard.jsx - Enhanced with real-time updates
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TruckElectric, 
  ClipboardList, 
  Users, 
  BarChart, 
  ArrowUp, 
  ArrowDown,
  Calendar,
  RefreshCw,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { umzuegeService, mitarbeiterService, finanzenService, aufnahmenService } from '../services/api';
import { extractApiData, ensureArray, toNumber } from '../utils/apiUtils';
import { toast } from 'react-toastify';
import websocketService from '../services/websocket';

// StatCard Komponente für die Statistikkarten
const StatCard = ({ title, value, icon, change, changeType, loading, realtime }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex flex-col animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="p-2 bg-gray-200 rounded-lg h-8 w-8"></div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col relative">
      {realtime && (
        <div className="absolute top-2 right-2">
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {(change !== undefined && changeType !== undefined) && (
            <div className={`flex items-center ${
              changeType === 'increase' ? 'text-green-500' : 'text-red-500'
            }`}>
              {changeType === 'increase' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              <span className="text-sm ml-1">{change}%</span>
            </div>
          )}
        </div>
        {(change !== undefined && changeType !== undefined) && (
          <span className="text-xs text-gray-500">vs. letzten Monat</span>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMoves: 0,
    totalInspections: 0,
    totalEmployees: 0,
    totalRevenue: 0,
    prevMonthMoves: 0,
    prevMonthRevenue: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [upcomingMoves, setUpcomingMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showToast = false) => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    if (showToast) {
      toast.info('Dashboard wird aktualisiert...');
    }
    
    try {
      // Get current date info
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Parallel API calls for better performance
      const [
        movesResponse, 
        inspectionsResponse, 
        employeesResponse, 
        financeResponse, 
        upcomingMovesResponse,
        lastMonthMovesResponse,
        lastMonthFinanceResponse
      ] = await Promise.allSettled([
        umzuegeService.getAll(),
        aufnahmenService.getAll(),
        mitarbeiterService.getAll(),
        finanzenService.getFinanzuebersicht(currentYear, currentMonth),
        umzuegeService.getAll({ status: 'geplant', limit: 5, sort: 'startDatum' }),
        umzuegeService.getAll({ 
          startDatum: new Date(lastMonthYear, lastMonth - 1, 1).toISOString(),
          endDatum: new Date(lastMonthYear, lastMonth, 0).toISOString()
        }),
        finanzenService.getFinanzuebersicht(lastMonthYear, lastMonth)
      ]);

      // Process responses with error handling
      const moves = movesResponse.status === 'fulfilled' ? extractApiData(movesResponse.value) : null;
      const totalMoves = moves ? ensureArray(moves.umzuege || moves).length : 0;
        
      const inspections = inspectionsResponse.status === 'fulfilled' ? extractApiData(inspectionsResponse.value) : null;
      const totalInspections = inspections ? ensureArray(inspections.aufnahmen || inspections).length : 0;
        
      const employees = employeesResponse.status === 'fulfilled' ? extractApiData(employeesResponse.value) : null;
      const totalEmployees = employees ? ensureArray(employees.mitarbeiter || employees).length : 0;
        
      const financeData = financeResponse.status === 'fulfilled' ? extractApiData(financeResponse.value) : null;
      const totalRevenue = toNumber(
        financeData?.umsatzGesamt || 
        financeData?.aktuelleUebersicht?.gesamtEinnahmen || 
        financeData?.einnahmen || 
        0
      );

      // Last month data
      const lastMonthMoves = lastMonthMovesResponse.status === 'fulfilled' ? 
        ensureArray(extractApiData(lastMonthMovesResponse.value).umzuege || []).length : 0;
      
      const lastMonthFinance = lastMonthFinanceResponse.status === 'fulfilled' ? 
        extractApiData(lastMonthFinanceResponse.value) : null;
      const prevMonthRevenue = toNumber(
        lastMonthFinance?.umsatzGesamt || 
        lastMonthFinance?.aktuelleUebersicht?.gesamtEinnahmen || 
        0
      );

      setStats({
        totalMoves,
        totalInspections,
        totalEmployees,
        totalRevenue,
        prevMonthMoves: lastMonthMoves,
        prevMonthRevenue
      });

      // Upcoming moves
      if (upcomingMovesResponse.status === 'fulfilled') {
        const upcomingData = extractApiData(upcomingMovesResponse.value);
        const upcoming = ensureArray(upcomingData.umzuege || upcomingData).slice(0, 5);
        setUpcomingMoves(upcoming);
      }

      // Monthly chart data
      await loadMonthlyChartData(currentYear, currentMonth);
      
      // Category data
      await loadCategoryData();

      setLastUpdate(new Date());
      setError(null);
      
      if (showToast) {
        toast.success('Dashboard erfolgreich aktualisiert!');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Fehler beim Laden der Dashboard-Daten');
      toast.error('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Load monthly chart data
  const loadMonthlyChartData = async (currentYear, currentMonth) => {
    try {
      const monthlyResponse = await finanzenService.getMonatsUebersicht(currentYear);
      const monthlyData = extractApiData(monthlyResponse);
      
      if (monthlyData?.monatsUebersichten) {
        const formattedData = ensureArray(monthlyData.monatsUebersichten)
          .map(month => ({
            name: getMonthShortName(month.monat - 1),
            umzuege: month.umzuege || 0,
            aufnahmen: month.aufnahmen || 0,
            umsatz: Math.round((month.umsatz || 0) / 100) // In hundreds for better chart scaling
          }))
          .slice(-6); // Last 6 months
        
        setMonthlyData(formattedData);
      } else {
        // Fallback: load data month by month
        await loadMonthlyDataFallback(currentYear, currentMonth);
      }
    } catch (error) {
      await loadMonthlyDataFallback(currentYear, currentMonth);
    }
  };

  // Fallback method to load monthly data
  const loadMonthlyDataFallback = async (currentYear, currentMonth) => {
    const monthPromises = [];
    
    for (let i = 5; i >= 0; i--) {
      const targetMonth = currentMonth - i;
      const targetYear = targetMonth <= 0 ? currentYear - 1 : currentYear;
      const actualMonth = targetMonth <= 0 ? targetMonth + 12 : targetMonth;
      
      const startDate = new Date(targetYear, actualMonth - 1, 1);
      const endDate = new Date(targetYear, actualMonth, 0);
      
      monthPromises.push(
        Promise.allSettled([
          umzuegeService.getAll({
            startDatum: startDate.toISOString().split('T')[0],
            endDatum: endDate.toISOString().split('T')[0]
          }),
          aufnahmenService.getAll({
            startDatum: startDate.toISOString().split('T')[0],
            endDatum: endDate.toISOString().split('T')[0]
          })
        ])
      );
    }
    
    const results = await Promise.all(monthPromises);
    
    const chartData = results.map((monthResults, index) => {
      const targetMonth = currentMonth - (5 - index);
      const actualMonth = targetMonth <= 0 ? targetMonth + 12 : targetMonth;
      
      const [umzuegeResult, aufnahmenResult] = monthResults;
      
      const umzuegeCount = umzuegeResult.status === 'fulfilled' ? 
        ensureArray(extractApiData(umzuegeResult.value).umzuege || []).length : 0;
      const aufnahmenCount = aufnahmenResult.status === 'fulfilled' ? 
        ensureArray(extractApiData(aufnahmenResult.value).aufnahmen || []).length : 0;
      
      return {
        name: getMonthShortName(actualMonth - 1),
        umzuege: umzuegeCount,
        aufnahmen: aufnahmenCount,
        umsatz: 0 // Can't calculate revenue without finance data
      };
    });
    
    setMonthlyData(chartData);
  };

  // Load category data
  const loadCategoryData = async () => {
    try {
      const allUmzuegeResponse = await umzuegeService.getAll();
      const allUmzuegeData = extractApiData(allUmzuegeResponse);
      const umzuege = ensureArray(allUmzuegeData.umzuege || allUmzuegeData);
      
      // Group by type/category
      const categoryMap = {
        'Privatumzug': 0,
        'Firmenumzug': 0,
        'Seniorenumzug': 0,
        'Sonstige': 0
      };
      
      umzuege.forEach(umzug => {
        const category = umzug.typ || umzug.kategorie || 'Sonstige';
        if (categoryMap.hasOwnProperty(category)) {
          categoryMap[category]++;
        } else {
          categoryMap['Sonstige']++;
        }
      });
      
      const categoryStats = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, umzuege: count }))
        .filter(cat => cat.umzuege > 0)
        .sort((a, b) => b.umzuege - a.umzuege);
      
      setCategoryData(categoryStats.length > 0 ? categoryStats : [
        { name: 'Privatumzug', umzuege: 0 },
        { name: 'Firmenumzug', umzuege: 0 }
      ]);
    } catch (error) {
      setCategoryData([
        { name: 'Privatumzug', umzuege: 0 },
        { name: 'Firmenumzug', umzuege: 0 }
      ]);
    }
  };

  // WebSocket setup
  useEffect(() => {
    if (realTimeEnabled) {
      websocketService.connect();
      
      // Listen for real-time updates
      websocketService.on('stats:update', (data) => {
        setStats(prev => ({ ...prev, ...data }));
        toast.info('Dashboard aktualisiert', { autoClose: 2000 });
      });
      
      websocketService.on('umzug:created', () => {
        fetchDashboardData();
      });
      
      websocketService.on('umzug:updated', () => {
        fetchDashboardData();
      });
      
      return () => {
        websocketService.off('stats:update');
        websocketService.off('umzug:created');
        websocketService.off('umzug:updated');
        websocketService.disconnect();
      };
    }
  }, [realTimeEnabled, fetchDashboardData]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!realTimeEnabled) {
        fetchDashboardData();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [realTimeEnabled, fetchDashboardData]);

  // Month name helper
  const getMonthShortName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    return months[monthIndex] || '';
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchDashboardData(true);
  };

  // Calculate changes
  const moveChange = calculateChange(stats.totalMoves, stats.prevMonthMoves);
  const revenueChange = calculateChange(stats.totalRevenue, stats.prevMonthRevenue);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 text-lg font-semibold">Fehler beim Laden des Dashboards</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={handleManualRefresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Willkommen zurück! Hier ist die Übersicht über Ihre aktuellen Aktivitäten.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Letztes Update: {lastUpdate.toLocaleTimeString('de-DE')}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Echtzeit-Updates</span>
            </label>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-colors ${
                isRefreshing 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Umzüge gesamt"
            value={stats.totalMoves}
            icon={<TruckElectric size={20} />}
            change={Math.abs(moveChange)}
            changeType={moveChange >= 0 ? 'increase' : 'decrease'}
            loading={loading}
            realtime={realTimeEnabled}
          />
          <StatCard 
            title="Aufnahmen"
            value={stats.totalInspections}
            icon={<ClipboardList size={20} />}
            loading={loading}
            realtime={realTimeEnabled}
          />
          <StatCard 
            title="Mitarbeiter"
            value={stats.totalEmployees}
            icon={<Users size={20} />}
            loading={loading}
            realtime={realTimeEnabled}
          />
          <StatCard 
            title="Umsatz (Monat)"
            value={`${stats.totalRevenue.toLocaleString('de-DE')}€`}
            icon={<BarChart size={20} />}
            change={Math.abs(revenueChange)}
            changeType={revenueChange >= 0 ? 'increase' : 'decrease'}
            loading={loading}
            realtime={realTimeEnabled}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Monatliche Entwicklung</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="umzuege" 
                  stroke="#3B82F6" 
                  name="Umzüge"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="aufnahmen" 
                  stroke="#10B981" 
                  name="Aufnahmen"
                  strokeWidth={2}
                />
                {monthlyData.some(d => d.umsatz > 0) && (
                  <Line 
                    type="monotone" 
                    dataKey="umsatz" 
                    stroke="#F59E0B" 
                    name="Umsatz (100€)"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Umzüge nach Kategorie</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="umzuege" fill="#3B82F6" name="Anzahl" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Moves */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Anstehende Umzüge</h3>
            <Calendar className="text-gray-400" size={20} />
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : upcomingMoves.length > 0 ? (
            <div className="space-y-3">
              {upcomingMoves.map(umzug => (
                <div key={umzug._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <p className="font-medium text-gray-800">
                      {umzug.auftraggeber?.name || umzug.kunde?.name || 'Unbekannt'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {umzug.auszugsadresse?.ort || umzug.vonAdresse?.ort || '-'} → {umzug.einzugsadresse?.ort || umzug.nachAdresse?.ort || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {formatDate(umzug.startDatum || umzug.datum)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {umzug.status === 'geplant' ? 'Geplant' : umzug.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Keine anstehenden Umzüge</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

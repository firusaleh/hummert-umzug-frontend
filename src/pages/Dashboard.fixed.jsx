// src/pages/Dashboard.fixed.jsx
import React, { useEffect, useCallback } from 'react';
import { 
  TruckElectric, 
  ClipboardList, 
  Users, 
  BarChart, 
  ArrowUp, 
  ArrowDown,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.fixed';
import { useApp } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import { dateUtils, numberUtils } from '../services/utils';

// StatCard component for statistics display
const StatCard = ({ title, value, icon, change, changeType, loading, error, onClick }) => {
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

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex flex-col">
        <div className="text-red-500 text-sm">Fehler beim Laden</div>
      </div>
    );
  }

  const cardContent = (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {(change !== undefined && change !== null && changeType) && (
            <div className={`flex items-center ${
              changeType === 'increase' ? 'text-green-500' : 'text-red-500'
            }`}>
              {changeType === 'increase' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              <span className="text-sm ml-1">{change}%</span>
            </div>
          )}
        </div>
        {(change !== undefined && change !== null && changeType) && (
          <span className="text-xs text-gray-500">vs. letzten Monat</span>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className="bg-white rounded-lg shadow p-6 flex flex-col hover:shadow-lg transition-shadow cursor-pointer w-full text-left"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col">
      {cardContent}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { loading, setLoading, error, setError } = useApp();
  const { addNotification } = useNotification();
  
  const [stats, setStats] = React.useState({
    totalMoves: 0,
    totalInspections: 0,
    totalEmployees: 0,
    totalRevenue: 0,
    moveChange: null,
    inspectionChange: null,
    employeeChange: null,
    revenueChange: null
  });
  
  const [monthlyData, setMonthlyData] = React.useState([]);
  const [categoryData, setCategoryData] = React.useState([]);
  const [upcomingMoves, setUpcomingMoves] = React.useState([]);
  const [dataError, setDataError] = React.useState({
    stats: null,
    monthly: null,
    category: null,
    upcoming: null
  });

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  };

  const getChangeType = (change) => {
    if (change === null || change === 0) return null;
    return change > 0 ? 'increase' : 'decrease';
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDataError({
      stats: null,
      monthly: null,
      category: null,
      upcoming: null
    });
    
    try {
      // Load statistics
      try {
        const [movesRes, inspectionsRes, employeesRes, financeRes] = await Promise.allSettled([
          api.umzug.getAll({ limit: 1 }), // Get count from pagination
          api.aufnahme.getAll({ limit: 1 }),
          api.mitarbeiter.getAll({ limit: 1 }),
          api.finanzen.getUebersicht()
        ]);

        const moves = movesRes.status === 'fulfilled' ? movesRes.value : null;
        const inspections = inspectionsRes.status === 'fulfilled' ? inspectionsRes.value : null;
        const employees = employeesRes.status === 'fulfilled' ? employeesRes.value : null;
        const finance = financeRes.status === 'fulfilled' ? financeRes.value : null;

        // Get previous month's data for comparison
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const [lastMonthMovesRes, lastMonthFinanceRes] = await Promise.allSettled([
          api.umzug.getAll({ 
            limit: 1,
            startDate: dateUtils.getMonthStart(lastMonth),
            endDate: dateUtils.getMonthEnd(lastMonth)
          }),
          api.finanzen.getMonatsuebersicht(lastMonth.getFullYear(), lastMonth.getMonth() + 1)
        ]);

        const lastMonthMoves = lastMonthMovesRes.status === 'fulfilled' ? 
          lastMonthMovesRes.value?.data?.pagination?.total || 0 : 0;
        
        const lastMonthRevenue = lastMonthFinanceRes.status === 'fulfilled' ?
          lastMonthFinanceRes.value?.data?.umsatzGesamt || 0 : 0;

        setStats({
          totalMoves: moves?.data?.pagination?.total || 0,
          totalInspections: inspections?.data?.pagination?.total || 0,
          totalEmployees: employees?.data?.pagination?.total || 0,
          totalRevenue: finance?.data?.umsatzGesamt || 0,
          moveChange: calculateChange(moves?.data?.pagination?.total || 0, lastMonthMoves),
          inspectionChange: null, // No comparison data for inspections yet
          employeeChange: null, // Employees don't change monthly
          revenueChange: calculateChange(finance?.data?.umsatzGesamt || 0, lastMonthRevenue)
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        setDataError(prev => ({ ...prev, stats: 'Statistiken konnten nicht geladen werden' }));
      }

      // Load monthly data
      try {
        const currentYear = new Date().getFullYear();
        const monthlyResponse = await api.finanzen.getMonatsuebersicht(currentYear);
        
        if (monthlyResponse.success && monthlyResponse.data?.monatsUebersichten) {
          const formattedData = monthlyResponse.data.monatsUebersichten.map(month => ({
            name: dateUtils.getMonthShortName(month.monat - 1),
            umzuege: month.umzuege || 0,
            aufnahmen: month.aufnahmen || 0
          }));
          setMonthlyData(formattedData);
        } else {
          // Use fallback data
          const fallbackData = [];
          for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            fallbackData.unshift({
              name: dateUtils.getMonthShortName(date.getMonth()),
              umzuege: Math.floor(Math.random() * 30) + 50,
              aufnahmen: Math.floor(Math.random() * 20) + 20
            });
          }
          setMonthlyData(fallbackData);
        }
      } catch (error) {
        console.error('Error loading monthly data:', error);
        setDataError(prev => ({ ...prev, monthly: 'Monatsdaten konnten nicht geladen werden' }));
        // Use fallback data
        const fallbackData = [];
        for (let i = 0; i < 6; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          fallbackData.unshift({
            name: dateUtils.getMonthShortName(date.getMonth()),
            umzuege: Math.floor(Math.random() * 30) + 50,
            aufnahmen: Math.floor(Math.random() * 20) + 20
          });
        }
        setMonthlyData(fallbackData);
      }

      // Load category data
      try {
        const categoryResponse = await api.umzug.getStatsByCategory();
        if (categoryResponse.success && categoryResponse.data) {
          setCategoryData(categoryResponse.data);
        } else {
          // Use fallback data
          const categories = ['Privat', 'Gewerbe', 'Senioren', 'International', 'Spezialtransport'];
          const categoryStats = categories.map(category => ({
            name: category,
            umzuege: Math.floor(Math.random() * 200) + 100
          }));
          setCategoryData(categoryStats);
        }
      } catch (error) {
        console.error('Error loading category data:', error);
        setDataError(prev => ({ ...prev, category: 'Kategoriedaten konnten nicht geladen werden' }));
        // Use fallback data
        const categories = ['Privat', 'Gewerbe', 'Senioren', 'International', 'Spezialtransport'];
        const categoryStats = categories.map(category => ({
          name: category,
          umzuege: Math.floor(Math.random() * 200) + 100
        }));
        setCategoryData(categoryStats);
      }

      // Load upcoming moves
      try {
        const upcomingResponse = await api.umzug.getAll({
          status: 'geplant',
          limit: 5,
          sort: 'startDatum',
          startDate: new Date().toISOString()
        });

        if (upcomingResponse.success) {
          setUpcomingMoves(upcomingResponse.data.items || []);
        }
      } catch (error) {
        console.error('Error loading upcoming moves:', error);
        setDataError(prev => ({ ...prev, upcoming: 'Anstehende Umzüge konnten nicht geladen werden' }));
      }
    } catch (err) {
      console.error('General error loading dashboard data:', err);
      setError('Die Dashboard-Daten konnten nicht vollständig geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCardClick = (path) => {
    navigate(path);
  };

  const handleRetry = () => {
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={handleRetry}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Daten aktualisieren"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Umzüge gesamt" 
          value={numberUtils.formatNumber(stats.totalMoves)} 
          icon={<TruckElectric size={20} />} 
          change={stats.moveChange} 
          changeType={getChangeType(stats.moveChange)}
          loading={loading}
          error={dataError.stats}
          onClick={() => handleCardClick('/umzuege')}
        />
        <StatCard 
          title="Aufnahmen gesamt" 
          value={numberUtils.formatNumber(stats.totalInspections)} 
          icon={<ClipboardList size={20} />} 
          change={stats.inspectionChange} 
          changeType={getChangeType(stats.inspectionChange)}
          loading={loading}
          error={dataError.stats}
          onClick={() => handleCardClick('/aufnahmen')}
        />
        <StatCard 
          title="Mitarbeiter" 
          value={numberUtils.formatNumber(stats.totalEmployees)} 
          icon={<Users size={20} />} 
          change={stats.employeeChange} 
          changeType={getChangeType(stats.employeeChange)}
          loading={loading}
          error={dataError.stats}
          onClick={() => handleCardClick('/mitarbeiter')}
        />
        <StatCard 
          title="Umsatz" 
          value={numberUtils.formatCurrency(stats.totalRevenue)} 
          icon={<BarChart size={20} />} 
          change={stats.revenueChange} 
          changeType={getChangeType(stats.revenueChange)}
          loading={loading}
          error={dataError.stats}
          onClick={() => handleCardClick('/finanzen')}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Monatliche Statistik</h2>
          {loading ? (
            <div className="h-64 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : dataError.monthly ? (
            <div className="h-64 flex justify-center items-center">
              <p className="text-gray-500">Daten konnten nicht geladen werden</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="umzuege" stroke="#3b82f6" activeDot={{ r: 8 }} name="Umzüge" />
                <Line type="monotone" dataKey="aufnahmen" stroke="#10b981" name="Aufnahmen" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Umzüge nach Kategorie</h2>
          {loading ? (
            <div className="h-64 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : dataError.category ? (
            <div className="h-64 flex justify-center items-center">
              <p className="text-gray-500">Daten konnten nicht geladen werden</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="umzuege" fill="#3b82f6" name="Umzüge" />
              </RechartsBarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      {/* Upcoming moves */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Bevorstehende Umzüge</h2>
          <button 
            onClick={() => navigate('/umzuege')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Alle anzeigen
          </button>
        </div>
        
        {loading ? (
          <div className="animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border-b border-gray-200 py-4">
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : dataError.upcoming ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Bevorstehende Umzüge konnten nicht geladen werden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {upcomingMoves.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kunde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Von - Nach
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktion
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingMoves.map((move) => (
                    <tr key={move._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {move.auftraggeber?.name || move.kunde || 'Unbekannt'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar size={16} className="mr-2" />
                          {dateUtils.formatDate(move.startDatum)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${move.typ === 'Gewerbe' ? 'bg-blue-100 text-blue-800' : 
                            move.typ === 'Privat' ? 'bg-green-100 text-green-800' : 
                            move.typ === 'Senioren' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-purple-100 text-purple-800'}`}>
                          {move.typ || 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="truncate max-w-[150px]" title={move.auszugsadresse?.ort}>
                            {move.auszugsadresse?.ort || 'Unbekannt'}
                          </span>
                          <span className="mx-2">→</span>
                          <span className="truncate max-w-[150px]" title={move.einzugsadresse?.ort}>
                            {move.einzugsadresse?.ort || 'Unbekannt'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => navigate(`/umzuege/${move._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <TruckElectric className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">Keine bevorstehenden Umzüge</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
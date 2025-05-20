// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  TruckElectric, 
  ClipboardList, 
  Users, 
  BarChart, 
  ArrowUp, 
  ArrowDown,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { umzuegeService, mitarbeiterService, finanzenService } from '../services/api';

// StatCard Komponente für die Statistikkarten
const StatCard = ({ title, value, icon, change, changeType, loading }) => {
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
    <div className="bg-white rounded-lg shadow p-6 flex flex-col">
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
    totalRevenue: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [upcomingMoves, setUpcomingMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Parallel API-Aufrufe für bessere Performance
        const [
          movesResponse, 
          inspectionsResponse, 
          employeesResponse, 
          financeResponse, 
          upcomingMovesResponse
        ] = await Promise.allSettled([
          umzuegeService.getAll(),
          // Ersetze durch den richtigen Service für Aufnahmen wenn vorhanden, oder verwende einen Mock
          Promise.resolve({ data: { total: 215 } }),
          mitarbeiterService.getAll(),
          finanzenService.getUebersicht(),
          umzuegeService.getAll({ status: 'Geplant', limit: 5, sort: 'startDatum' })
        ]);

        // Stats setzen mit Fallback auf 0 wenn die API fehlschlägt
        const totalMoves = movesResponse.status === 'fulfilled' ? 
          (movesResponse.value?.data?.length || 0) : 0;
          
        const totalInspections = inspectionsResponse.status === 'fulfilled' ? 
          (inspectionsResponse.value?.data?.total || 0) : 0;
          
        const totalEmployees = employeesResponse.status === 'fulfilled' ? 
          (employeesResponse.value?.data?.length || 0) : 0;
          
        const totalRevenue = financeResponse.status === 'fulfilled' ? 
          (financeResponse.value?.data?.umsatzGesamt || 0) : 0;

        setStats({
          totalMoves,
          totalInspections,
          totalEmployees,
          totalRevenue
        });

        // Monatliche Statistik laden
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // Januar ist 1, nicht 0
        
        try {
          // Versuchen, die Monatsübersicht für das aktuelle Jahr zu laden
          const monthlyResponse = await finanzenService.getMonatsuebersicht(currentYear);
          
          if (monthlyResponse?.data?.monatsUebersichten) {
            const formattedData = monthlyResponse.data.monatsUebersichten.map(month => ({
              name: getMonthShortName(month.monat - 1), // API gibt Monate 1-12 zurück, JS verwendet 0-11
              umzuege: month.umzuege || 0,
              aufnahmen: month.aufnahmen || 0
            }));
            
            setMonthlyData(formattedData);
          }
        } catch (monthlyError) {
          // Fehler beim Laden der monatlichen Daten - verwende Fallback-Daten
          
          // Fallback: Simulierte Daten für die letzten 5 Monate
          const fallbackData = [];
          for (let i = 4; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12; // Zyklisch durch die Monate gehen
            fallbackData.push({
              name: getMonthShortName(monthIndex),
              umzuege: Math.floor(Math.random() * 30) + 50, // Zufällige Werte zwischen 50-80
              aufnahmen: Math.floor(Math.random() * 20) + 20 // Zufällige Werte zwischen 20-40
            });
          }
          setMonthlyData(fallbackData);
        }

        // Kategoriendaten laden
        try {
          // Hier würde der echte API-Aufruf für Kategoriedaten stehen
          // Für jetzt verwenden wir simulierte Daten
          const categories = ['Privat', 'Gewerbe', 'Senioren', 'International', 'Spezialtransport'];
          const categoryStats = categories.map(category => ({
            name: category,
            umzuege: Math.floor(Math.random() * 200) + 100 // Zufällige Werte zwischen 100-300
          }));
          
          setCategoryData(categoryStats);
        } catch (categoryError) {
          // Fehler beim Laden der Kategoriendaten
          setCategoryData([]);
        }

        // Bevorstehende Umzüge
        if (upcomingMovesResponse.status === 'fulfilled') {
          const moves = upcomingMovesResponse.value?.data || [];
          // Sicherstellen, dass nur zukünftige Umzüge angezeigt werden
          const today = new Date();
          const filteredMoves = moves
            .filter(move => new Date(move.startDatum) >= today)
            .sort((a, b) => new Date(a.startDatum) - new Date(b.startDatum))
            .slice(0, 5);
            
          setUpcomingMoves(filteredMoves);
        }
        
        setLoading(false);
      } catch (err) {
        // Fehler beim Laden der Dashboard-Daten
        setError('Die Dashboard-Daten konnten nicht geladen werden.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hilfsfunktion: Gibt den Kurznamen eines Monats zurück
  const getMonthShortName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    return months[monthIndex];
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Statistikkarten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Umzüge gesamt" 
          value={stats.totalMoves} 
          icon={<TruckElectric size={20} />} 
          change="12" 
          changeType="increase"
          loading={loading}
        />
        <StatCard 
          title="Aufnahmen gesamt" 
          value={stats.totalInspections} 
          icon={<ClipboardList size={20} />} 
          change="8" 
          changeType="increase"
          loading={loading} 
        />
        <StatCard 
          title="Mitarbeiter" 
          value={stats.totalEmployees} 
          icon={<Users size={20} />} 
          change="5" 
          changeType="increase"
          loading={loading} 
        />
        <StatCard 
          title="Umsatz (€)" 
          value={stats.totalRevenue.toLocaleString()} 
          icon={<BarChart size={20} />} 
          change="3" 
          changeType="decrease"
          loading={loading} 
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Monatliche Statistik</h2>
          {loading ? (
            <div className="h-64 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
      
      {/* Bevorstehende Umzüge */}
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Bevorstehende Umzüge</h2>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
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
                      Adresse
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
                          {move.auftraggeber?.name || 'Unbekannter Kunde'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar size={16} className="mr-2" />
                          {new Date(move.startDatum).toLocaleDateString('de-DE')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${move.typ === 'Gewerbe' ? 'bg-blue-100 text-blue-800' : 
                            move.typ === 'Privat' ? 'bg-green-100 text-green-800' : 
                            move.typ === 'Senioren' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-purple-100 text-purple-800'}`}>
                          {move.typ || 'Nicht kategorisiert'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {move.auszugsadresse ? 
                          `${move.auszugsadresse.strasse}, ${move.auszugsadresse.plz} ${move.auszugsadresse.ort}` : 
                          'Keine Adresse angegeben'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <TruckElectric className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">Keine bevorstehenden Umzüge gefunden</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
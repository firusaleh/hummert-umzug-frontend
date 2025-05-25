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
import { umzuegeService, mitarbeiterService, finanzenService, aufnahmenService } from '../services/api';
import { extractApiData, ensureArray, toNumber } from '../utils/apiUtils';
import { toast } from 'react-toastify';

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
          aufnahmenService.getAll(),
          mitarbeiterService.getAll(),
          finanzenService.getFinanzuebersicht(),
          umzuegeService.getAll({ status: 'geplant', limit: 5, sort: 'startDatum' })
        ]);

        // Stats setzen mit Fallback auf 0 wenn die API fehlschlägt und Nutzung der standardisierten Hilfsfunktionen
        const moves = movesResponse.status === 'fulfilled' ? extractApiData(movesResponse.value) : null;
        const totalMoves = moves ? ensureArray(moves.umzuege || moves).length : 0;
          
        const inspections = inspectionsResponse.status === 'fulfilled' ? extractApiData(inspectionsResponse.value) : null;
        const totalInspections = inspections?.total || 0;
          
        const employees = employeesResponse.status === 'fulfilled' ? extractApiData(employeesResponse.value) : null;
        const totalEmployees = employees ? ensureArray(employees.mitarbeiter || employees).length : 0;
          
        const financeData = financeResponse.status === 'fulfilled' ? extractApiData(financeResponse.value) : null;
        const totalRevenue = financeData?.umsatzGesamt || financeData?.aktuelleUebersicht?.gesamtEinnahmen || 0;

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
          const monthlyResponse = await finanzenService.getMonatsUebersicht(currentYear);
          const monthlyData = extractApiData(monthlyResponse);
          
          if (monthlyData && monthlyData.monatsUebersichten) {
            const monatsListe = ensureArray(monthlyData.monatsUebersichten);
            
            const formattedData = monatsListe.map(month => ({
              name: getMonthShortName(month.monat - 1), // API gibt Monate 1-12 zurück, JS verwendet 0-11
              umzuege: month.umzuege || 0,
              aufnahmen: month.aufnahmen || 0
            }));
            
            setMonthlyData(formattedData);
          } else {
            throw new Error("Keine gültigen Monatsdaten erhalten");
          }
        } catch (monthlyError) {
          // Fehler beim Laden der monatlichen Daten - verwende Fallback-Daten
          
          // Statt Fallback-Daten, API-Daten für letzten Monat verwenden
          try {
            // Load umzuege and aufnahmen for the last 5 months
            const monthlyStatsPromises = [];
            
            for (let i = 4; i >= 0; i--) {
              const monthIndex = (currentMonth - i + 12) % 12; // Zyklisch durch die Monate
              const monthNum = monthIndex + 1; // 1-based month number for API
              const year = monthIndex > currentMonth ? currentYear - 1 : currentYear;
              
              // Simulate month range using startDatum and endDatum filters
              const startDate = new Date(year, monthIndex, 1);
              const endDate = new Date(year, monthIndex + 1, 0); // Last day of month
              
              const startDateStr = startDate.toISOString().split('T')[0];
              const endDateStr = endDate.toISOString().split('T')[0];
              
              // Get umzuege stats for this month
              monthlyStatsPromises.push(
                Promise.allSettled([
                  umzuegeService.getAll({
                    startDatum: startDateStr,
                    endDatum: endDateStr
                  }),
                  aufnahmenService.getAll({
                    startDatum: startDateStr,
                    endDatum: endDateStr
                  })
                ])
              );
            }
            
            // Wait for all month data to load
            const monthlyStatsResults = await Promise.all(monthlyStatsPromises);
            
            // Process the data for each month
            const realMonthlyData = [];
            for (let i = 0; i < 5; i++) {
              const monthIndex = (currentMonth - (4-i) + 12) % 12;
              const [umzuegeResult, aufnahmenResult] = monthlyStatsResults[i];
              
              const umzuegeData = umzuegeResult.status === 'fulfilled' ? 
                extractApiData(umzuegeResult.value) : null;
              const aufnahmenData = aufnahmenResult.status === 'fulfilled' ? 
                extractApiData(aufnahmenResult.value) : null;
              
              const umzuegeCount = umzuegeData ? 
                ensureArray(umzuegeData.umzuege || umzuegeData).length : 0;
              const aufnahmenCount = aufnahmenData ? 
                ensureArray(aufnahmenData.aufnahmen || aufnahmenData).length : 0;
              
              realMonthlyData.push({
                name: getMonthShortName(monthIndex),
                umzuege: umzuegeCount,
                aufnahmen: aufnahmenCount
              });
            }
            
            setMonthlyData(realMonthlyData);
          } catch (error) {
            // Error loading monthly data
            
            // Use empty data as fallback
            const emptyData = [];
            for (let i = 4; i >= 0; i--) {
              const monthIndex = (currentMonth - i + 12) % 12;
              emptyData.push({
                name: getMonthShortName(monthIndex),
                umzuege: 0,
                aufnahmen: 0
              });
            }
            setMonthlyData(emptyData);
            toast.error('Monatsdaten konnten nicht geladen werden.');
          }
        }

        // Kategoriendaten laden
        try {
          // Lade alle Umzüge, um sie nach Kategorien zu gruppieren
          const allUmzuegeResponse = await umzuegeService.getAll();
          const allUmzuegeData = extractApiData(allUmzuegeResponse);
          const umzuege = ensureArray(allUmzuegeData.umzuege || allUmzuegeData);
          
          // Gruppieren der Umzüge nach Typ (Kategorie)
          const categoryMap = {};
          
          umzuege.forEach(umzug => {
            const category = umzug.typ || 'Sonstige';
            if (!categoryMap[category]) {
              categoryMap[category] = 0;
            }
            categoryMap[category]++;
          });
          
          // Kategorien in ein Array für das Chart umwandeln
          let categoryStats = Object.entries(categoryMap)
            .map(([name, count]) => ({
              name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
              umzuege: count
            }))
            .sort((a, b) => b.umzuege - a.umzuege); // Sort by count descending
            
          // Wenn keine Umzüge nach Kategorien gefunden wurden, verwende Standardkategorien
          if (categoryStats.length === 0) {
            categoryStats = [
              { name: 'Privat', umzuege: 0 },
              { name: 'Gewerbe', umzuege: 0 },
              { name: 'Senioren', umzuege: 0 },
              { name: 'International', umzuege: 0 },
              { name: 'Spezialtransport', umzuege: 0 }
            ];
          } else {
            // Get top 5 categories only if we have data
            categoryStats = categoryStats.slice(0, 5);
          }
          
          setCategoryData(categoryStats);
        } catch (categoryError) {
          // Error loading category data
          
          // Fallback auf leeres Array
          setCategoryData([]);
          toast.error('Kategoriedaten konnten nicht geladen werden.');
        }

        // Bevorstehende Umzüge mit standardisierter Fehlerbehandlung
        if (upcomingMovesResponse.status === 'fulfilled') {
          try {
            const movesData = extractApiData(upcomingMovesResponse.value);
            const moves = ensureArray(movesData.umzuege || movesData);
            
            // Sicherstellen, dass nur zukünftige Umzüge angezeigt werden
            const today = new Date();
            
            const filteredMoves = moves
              .filter(move => move && move.startDatum && new Date(move.startDatum) >= today)
              .sort((a, b) => new Date(a.startDatum) - new Date(b.startDatum))
              .slice(0, 5);
              
            setUpcomingMoves(filteredMoves);
          } catch (error) {
            // Error processing upcoming moves
            setUpcomingMoves([]);
          }
        } else {
          setUpcomingMoves([]);
        }
        
        setLoading(false);
      } catch (err) {
        // Verbesserte Fehlerbehandlung beim Laden der Dashboard-Daten
        // Dashboard error
        setError('Die Dashboard-Daten konnten nicht vollständig geladen werden: ' + (err.message || 'Unbekannter Fehler'));
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
          loading={loading}
        />
        <StatCard 
          title="Aufnahmen gesamt" 
          value={stats.totalInspections} 
          icon={<ClipboardList size={20} />} 
          loading={loading} 
        />
        <StatCard 
          title="Mitarbeiter" 
          value={stats.totalEmployees} 
          icon={<Users size={20} />} 
          loading={loading} 
        />
        <StatCard 
          title="Umsatz (€)" 
          value={typeof stats.totalRevenue === 'number' ? stats.totalRevenue.toLocaleString() : '0'} 
          icon={<BarChart size={20} />} 
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
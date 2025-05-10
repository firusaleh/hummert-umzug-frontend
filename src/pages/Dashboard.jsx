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

// Beispieldaten für die Charts
const monthlyData = [
  { name: 'Jan', umzuege: 65, aufnahmen: 28 },
  { name: 'Feb', umzuege: 59, aufnahmen: 48 },
  { name: 'Mär', umzuege: 80, aufnahmen: 40 },
  { name: 'Apr', umzuege: 81, aufnahmen: 37 },
  { name: 'Mai', umzuege: 56, aufnahmen: 25 },
  { name: 'Jun', umzuege: 55, aufnahmen: 33 },
  { name: 'Jul', umzuege: 40, aufnahmen: 22 },
];

const categoryData = [
  { name: 'Privat', umzuege: 400 },
  { name: 'Gewerbe', umzuege: 300 },
  { name: 'Senioren', umzuege: 200 },
  { name: 'International', umzuege: 100 },
  { name: 'Spezialtransport', umzuege: 150 },
];

// StatCard Komponente für die Statistikkarten
const StatCard = ({ title, value, icon, change, changeType }) => {
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
          <div className={`flex items-center ${
            changeType === 'increase' ? 'text-green-500' : 'text-red-500'
          }`}>
            {changeType === 'increase' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="text-sm ml-1">{change}%</span>
          </div>
        </div>
        <span className="text-xs text-gray-500">vs. letzten Monat</span>
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

  // Hier würde normalerweise die API-Abfrage für die Daten stattfinden
  useEffect(() => {
    // Simuliere API-Aufruf
    const fetchData = () => {
      setStats({
        totalMoves: 428,
        totalInspections: 215,
        totalEmployees: 32,
        totalRevenue: 650000
      });
    };

    fetchData();
  }, []);

  // Bevorstehende Umzüge (Beispieldaten)
  const upcomingMoves = [
    { id: 1, client: 'Müller GmbH', date: '08.05.2025', type: 'Gewerbe', address: 'Industriestr. 45, Berlin' },
    { id: 2, client: 'Familie Schmidt', date: '10.05.2025', type: 'Privat', address: 'Ahornweg 12, München' },
    { id: 3, client: 'Dr. Weber', date: '12.05.2025', type: 'Senioren', address: 'Lindenallee 8, Hamburg' },
    { id: 4, client: 'Tech Solutions AG', date: '15.05.2025', type: 'Gewerbe', address: 'Innovationspark 3, Frankfurt' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {/* Statistikkarten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Umzüge gesamt" 
          value={stats.totalMoves} 
          icon={<TruckElectric size={20} />} 
          change="12" 
          changeType="increase" 
        />
        <StatCard 
          title="Aufnahmen gesamt" 
          value={stats.totalInspections} 
          icon={<ClipboardList size={20} />} 
          change="8" 
          changeType="increase" 
        />
        <StatCard 
          title="Mitarbeiter" 
          value={stats.totalEmployees} 
          icon={<Users size={20} />} 
          change="5" 
          changeType="increase" 
        />
        <StatCard 
          title="Umsatz (€)" 
          value={stats.totalRevenue.toLocaleString()} 
          icon={<BarChart size={20} />} 
          change="3" 
          changeType="decrease" 
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Monatliche Statistik</h2>
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
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Umzüge nach Kategorie</h2>
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
        </div>
      </div>
      
      {/* Bevorstehende Umzüge */}
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Bevorstehende Umzüge</h2>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Alle anzeigen</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktion</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {upcomingMoves.map((move) => (
                <tr key={move.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{move.client}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar size={16} className="mr-2" />
                      {move.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${move.type === 'Gewerbe' ? 'bg-blue-100 text-blue-800' : 
                        move.type === 'Privat' ? 'bg-green-100 text-green-800' : 
                        move.type === 'Senioren' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-purple-100 text-purple-800'}`}>
                      {move.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {move.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
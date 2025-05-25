import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Euro, FileText, Receipt, 
  AlertCircle, Calendar, PieChart, BarChart3, Download,
  Plus, Filter, RefreshCw, Search, ChevronDown,
  DollarSign, CreditCard, Wallet, AlertTriangle
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart, 
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

// Simple KPI Card Component
const KPICard = ({ title, value, icon: Icon, trend, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' 
              ? value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
              : value
            }
          </p>
          {trend !== undefined && (
            <p className={`text-xs mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% zum Vormonat
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

// Simple Loading Component
const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-2" />
      <p className="text-gray-600">Lade Finanzdaten...</p>
    </div>
  </div>
);

// Simple Error Component
const ErrorState = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-center">
      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Erneut versuchen
        </button>
      )}
    </div>
  </div>
);

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StableFinanceDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  
  // Date range
  const [dateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 11)),
    end: endOfMonth(new Date())
  });

  // Fetch data function
  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch overview
      const overviewRes = await api.get('/finanzen/uebersicht');
      const overviewData = overviewRes.data?.data || overviewRes.data || {};
      setOverview(overviewData);
      
      // Fetch invoices
      try {
        const invoicesRes = await api.get('/finanzen/rechnungen', {
          params: { limit: 100 }
        });
        const invoiceData = invoicesRes.data?.data || invoicesRes.data || [];
        setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setInvoices([]);
      }
      
      // Fetch expenses
      try {
        const expensesRes = await api.get('/finanzen/projektkosten', {
          params: { limit: 100 }
        });
        const expenseData = expensesRes.data?.data || expensesRes.data || [];
        setExpenses(Array.isArray(expenseData) ? expenseData : []);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setExpenses([]);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Process data for charts
  useEffect(() => {
    if (invoices.length > 0 || expenses.length > 0) {
      // Generate monthly data
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMM', { locale: de });
        
        // Calculate revenue for the month
        const monthRevenue = invoices
          .filter(inv => {
            try {
              return inv.bezahltAm && format(parseISO(inv.bezahltAm), 'yyyy-MM') === monthKey;
            } catch {
              return false;
            }
          })
          .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
        
        // Calculate expenses for the month
        const monthExpenses = expenses
          .filter(exp => {
            try {
              return exp.datum && format(parseISO(exp.datum), 'yyyy-MM') === monthKey;
            } catch {
              return false;
            }
          })
          .reduce((sum, exp) => sum + (exp.betrag || 0), 0);
        
        months.push({
          month: monthName,
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses
        });
      }
      setMonthlyData(months);
      
      // Calculate category breakdown
      const categories = {};
      expenses.forEach(expense => {
        const category = expense.kategorie || 'Sonstige';
        categories[category] = (categories[category] || 0) + (expense.betrag || 0);
      });
      
      const categoryArray = Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 categories
      
      setCategoryData(categoryArray);
    }
  }, [invoices, expenses]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalRevenue = invoices
      .filter(inv => inv.status === 'bezahlt')
      .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
    
    const totalExpenses = expenses
      .reduce((sum, exp) => sum + (exp.betrag || 0), 0);
    
    const openInvoices = invoices
      .filter(inv => inv.status !== 'bezahlt' && inv.status !== 'storniert')
      .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
    
    const overdueInvoices = invoices
      .filter(inv => {
        if (inv.status === 'bezahlt' || inv.status === 'storniert') return false;
        try {
          const dueDate = parseISO(inv.faelligkeitsdatum);
          return dueDate < new Date();
        } catch {
          return false;
        }
      }).length;
    
    // Calculate growth
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    const revenueGrowth = previousMonth && previousMonth.revenue > 0
      ? ((currentMonth?.revenue - previousMonth.revenue) / previousMonth.revenue * 100)
      : 0;
    
    return {
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      openInvoices,
      overdueInvoices,
      revenueGrowth
    };
  }, [invoices, expenses, monthlyData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Finanzverwaltung</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Überblick über Ihre Finanzen
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                    refreshing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Aktualisieren
                </button>
                <button
                  onClick={() => navigate('/finanzen/rechnungen/neu')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Rechnung
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <ErrorState message={error} onRetry={handleRefresh} />
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Umsatz"
            value={kpis.totalRevenue}
            icon={TrendingUp}
            trend={kpis.revenueGrowth}
            color="green"
          />
          <KPICard
            title="Ausgaben"
            value={kpis.totalExpenses}
            icon={CreditCard}
            color="red"
          />
          <KPICard
            title="Gewinn"
            value={kpis.profit}
            icon={Wallet}
            color={kpis.profit >= 0 ? 'green' : 'red'}
          />
          <KPICard
            title="Offene Rechnungen"
            value={kpis.openInvoices}
            icon={FileText}
            color="yellow"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Umsatzentwicklung</h3>
            {monthlyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.1} 
                      name="Umsatz"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#EF4444" 
                      fill="#EF4444" 
                      fillOpacity={0.1} 
                      name="Ausgaben"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Keine Daten verfügbar
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ausgaben nach Kategorie</h3>
            {categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Keine Daten verfügbar
              </div>
            )}
          </div>
        </div>

        {/* Monthly Profit Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monatlicher Gewinn</h3>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="profit" name="Gewinn">
                    {monthlyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Keine Daten verfügbar
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Letzte Rechnungen</h3>
              <button
                onClick={() => navigate('/finanzen/rechnungen')}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                Alle anzeigen →
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {invoices.slice(0, 5).map((invoice) => (
              <div key={invoice._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Rechnung {invoice.rechnungsnummer}
                    </p>
                    <p className="text-sm text-gray-500">
                      {invoice.kunde?.name || invoice.kundeName || 'Unbekannter Kunde'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {(invoice.gesamtbetrag || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {invoice.status === 'bezahlt' ? (
                        <span className="text-green-600">Bezahlt</span>
                      ) : invoice.status === 'ueberfaellig' ? (
                        <span className="text-red-600">Überfällig</span>
                      ) : (
                        <span className="text-yellow-600">Offen</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                Keine Rechnungen vorhanden
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
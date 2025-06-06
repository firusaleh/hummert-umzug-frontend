import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Euro, Receipt, FileText, 
  AlertCircle, Calendar, PieChart, BarChart3, Download,
  Plus, RefreshCw, CreditCard, Wallet, Target, Package, Users, CalendarDays
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart, 
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Import new components
import InvoiceManagement from './components/InvoiceManagement';
import InvoiceForm from './components/InvoiceForm';
import AngebotManagement from './components/AngebotManagement';
import AngebotForm from './components/AngebotForm';
import ProjektkostenManagement from './components/ProjektkostenManagement';
import ProjektkostenForm from './components/ProjektkostenForm';
import FinancialReports from './components/FinancialReports';
import FinanzenMonatsansicht from './FinanzenMonatsansicht';

// Constants
const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

// Navigation Tab Component
const NavigationTab = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              `}
            >
              <Icon className="h-5 w-5" />
              {tab.name}
              {tab.count !== undefined && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ title, value, icon: Icon, trend, color = 'indigo', subtitle }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' 
              ? value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
              : value
            }
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend).toFixed(1)}% zum Vormonat
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

// Chart Card Component
const ChartCard = ({ title, children, action }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm mt-1">
            <span style={{ color: entry.color }}>{entry.name}:</span>{' '}
            <span className="font-medium">
              {entry.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Dashboard Overview Component
const DashboardOverview = ({ loading, error, summary, monthlyData, categoryData, recentInvoices, invoiceStatusData, onRefresh, refreshing }) => {
  const navigate = useNavigate();
  
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Übersicht</h2>
          <p className="text-sm text-gray-500 mt-1">
            Ihre Finanzen auf einen Blick
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Umsatz"
          value={summary.totalRevenue}
          icon={TrendingUp}
          color="green"
          subtitle="Bezahlte Rechnungen"
        />
        <KPICard
          title="Ausgaben"
          value={summary.totalExpenses}
          icon={CreditCard}
          color="red"
        />
        <KPICard
          title="Gewinn"
          value={summary.profit}
          icon={Wallet}
          color={summary.profit >= 0 ? 'green' : 'red'}
          subtitle={`${summary.profitMargin.toFixed(1)}% Marge`}
        />
        <KPICard
          title="Offene Rechnungen"
          value={summary.openInvoices}
          icon={FileText}
          color="yellow"
          subtitle={summary.overdueInvoices > 0 ? `${summary.overdueInvoices} überfällig` : undefined}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend */}
        <ChartCard title="Umsatzentwicklung">
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
        </ChartCard>
        
        {/* Category Breakdown */}
        <ChartCard title="Ausgaben nach Kategorie">
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
        </ChartCard>
      </div>
      
      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Letzte Rechnungen</h3>
            <button
              onClick={() => navigate('/finanzen/rechnungen')}
              className="text-sm text-indigo-600 hover:text-indigo-900"
            >
              Alle anzeigen →
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentInvoices.length > 0 ? (
            recentInvoices.map((invoice) => (
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
                    <p className="text-sm">
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
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              Keine Rechnungen vorhanden
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default function FinanzenDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    openInvoices: 0,
    overdueInvoices: 0,
    profitMargin: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [invoiceStatusData, setInvoiceStatusData] = useState([]);
  const [counts, setCounts] = useState({
    invoices: 0,
    quotes: 0,
    costs: 0
  });
  
  // Tabs configuration
  const tabs = [
    { id: 'overview', name: 'Übersicht', icon: BarChart3 },
    { id: 'monthly', name: 'Monatsansicht', icon: CalendarDays },
    { id: 'invoices', name: 'Rechnungen', icon: Receipt, count: counts.invoices },
    { id: 'quotes', name: 'Angebote', icon: FileText, count: counts.quotes },
    { id: 'costs', name: 'Projektkosten', icon: Package, count: counts.costs },
    { id: 'reports', name: 'Berichte', icon: PieChart }
  ];
  
  // Fetch all data
  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch all data in parallel
      const [invoicesRes, quotesRes, expensesRes] = await Promise.all([
        api.get('/finanzen/rechnungen'),
        api.get('/finanzen/angebote'),
        api.get('/finanzen/projektkosten')
      ]);
      
      const invoices = Array.isArray(invoicesRes.data?.data) 
        ? invoicesRes.data.data 
        : Array.isArray(invoicesRes.data) 
        ? invoicesRes.data 
        : [];
      
      const quotes = Array.isArray(quotesRes.data?.data)
        ? quotesRes.data.data
        : Array.isArray(quotesRes.data)
        ? quotesRes.data
        : [];
        
      const expenses = Array.isArray(expensesRes.data?.data)
        ? expensesRes.data.data
        : Array.isArray(expensesRes.data)
        ? expensesRes.data
        : [];
      
      // Update counts
      setCounts({
        invoices: invoices.length,
        quotes: quotes.length,
        costs: expenses.length
      });
      
      // Calculate summary
      const totalRevenue = invoices
        .filter(inv => inv.status === 'bezahlt')
        .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
      
      const totalExpenses = expenses
        .reduce((sum, exp) => sum + Math.abs(exp.betrag || 0), 0);
      
      const openInvoices = invoices
        .filter(inv => inv.status !== 'bezahlt' && inv.status !== 'storniert')
        .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
      
      const overdueInvoices = invoices
        .filter(inv => {
          if (inv.status === 'bezahlt' || inv.status === 'storniert') return false;
          if (!inv.faelligkeitsdatum) return false;
          try {
            const dueDate = new Date(inv.faelligkeitsdatum);
            return dueDate < new Date();
          } catch {
            return false;
          }
        }).length;
      
      const profit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;
      
      setSummary({
        totalRevenue,
        totalExpenses,
        profit,
        openInvoices,
        overdueInvoices,
        profitMargin
      });
      
      // Calculate monthly data
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMM', { locale: de });
        
        const monthRevenue = invoices
          .filter(inv => {
            if (!inv.datum) return false;
            try {
              return format(new Date(inv.datum), 'yyyy-MM') === monthKey && inv.status === 'bezahlt';
            } catch {
              return false;
            }
          })
          .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
        
        const monthExpenses = expenses
          .filter(exp => {
            if (!exp.datum) return false;
            try {
              return format(new Date(exp.datum), 'yyyy-MM') === monthKey;
            } catch {
              return false;
            }
          })
          .reduce((sum, exp) => sum + Math.abs(exp.betrag || 0), 0);
        
        months.push({
          month: monthName,
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses
        });
      }
      setMonthlyData(months);
      
      // Calculate category data
      const categories = {};
      expenses.forEach(expense => {
        const category = expense.kategorie || 'Sonstige';
        categories[category] = (categories[category] || 0) + Math.abs(expense.betrag || 0);
      });
      
      const categoryArray = Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setCategoryData(categoryArray);
      
      // Recent invoices
      const recent = invoices
        .sort((a, b) => {
          try {
            return new Date(b.datum || b.rechnungsdatum) - new Date(a.datum || a.rechnungsdatum);
          } catch {
            return 0;
          }
        })
        .slice(0, 5);
      setRecentInvoices(recent);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finanzverwaltung</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verwalten Sie Ihre Rechnungen, Angebote und Projektkosten
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <NavigationTab tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            loading={loading}
            error={error}
            summary={summary}
            monthlyData={monthlyData}
            categoryData={categoryData}
            recentInvoices={recentInvoices}
            invoiceStatusData={invoiceStatusData}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}
        
        {activeTab === 'monthly' && <FinanzenMonatsansicht />}
        
        {activeTab === 'invoices' && <InvoiceManagement />}
        
        {activeTab === 'quotes' && <AngebotManagement />}
        
        {activeTab === 'costs' && <ProjektkostenManagement />}
        
        {activeTab === 'reports' && <FinancialReports />}
      </div>
    </div>
  );
}
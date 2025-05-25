import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Euro, FileText, Receipt, 
  AlertCircle, Calendar, PieChart, BarChart3, Download,
  Plus, Filter, Clock, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Search, Settings, ChevronDown
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart, 
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import financeService from '../../services/financeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import InvoiceManagement from './components/InvoiceManagement';
import QuoteManagement from './components/QuoteManagement';
import ExpenseTracking from './components/ExpenseTracking';
import FinancialReports from './components/FinancialReports';

const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
const STATUS_COLORS = {
  draft: '#6B7280',
  sent: '#3B82F6',
  accepted: '#10B981',
  paid: '#10B981',
  overdue: '#EF4444',
  partially_paid: '#F59E0B',
  cancelled: '#EF4444'
};

// Custom hooks for data fetching
function useFinancialData(dateRange) {
  const [data, setData] = useState({
    summary: null,
    monthlyAnalytics: [],
    categoryBreakdown: [],
    recentInvoices: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        const [summary, monthlyAnalytics, categoryBreakdown, invoices] = await Promise.all([
          financeService.getFinancialSummary(dateRange.start.getFullYear()),
          financeService.getMonthlyAnalytics(12),
          financeService.getCategoryBreakdown(dateRange),
          financeService.getInvoices({ 
            startDate: dateRange.start, 
            endDate: dateRange.end,
            limit: 10,
            sort: '-rechnungsdatum'
          })
        ]);

        if (mounted) {
          setData({
            summary,
            monthlyAnalytics,
            categoryBreakdown,
            recentInvoices: invoices,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (mounted) {
          setData(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Fehler beim Laden der Finanzdaten'
          }));
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [dateRange]);

  return data;
}

export default function FinanzenDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 11)),
    end: endOfMonth(new Date())
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch financial data
  const { summary, monthlyAnalytics, categoryBreakdown, recentInvoices, loading, error } = useFinancialData(dateRange);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    financeService.clearCache();
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // Navigation handlers
  const handleCreateInvoice = () => {
    navigate('/finanzen/rechnungen/neu');
  };

  const handleCreateQuote = () => {
    navigate('/finanzen/angebote/neu');
  };

  const handleCreateExpense = () => {
    navigate('/finanzen/projektkosten/neu');
  };

  // Export handler
  const handleExport = async (type) => {
    try {
      await financeService.exportData(type, 'csv', dateRange);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Fehler beim Exportieren: ' + error.message);
    }
  };

  // Search handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/finanzen/suche?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
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

  // Format currency
  const formatCurrency = (value) => {
    return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  };

  // Calculate additional metrics
  const additionalMetrics = useMemo(() => {
    if (!summary?.metrics) return null;

    const { metrics } = summary;
    const currentMonth = monthlyAnalytics[monthlyAnalytics.length - 1];
    const previousMonth = monthlyAnalytics[monthlyAnalytics.length - 2];

    const revenueGrowth = previousMonth && previousMonth.revenue > 0
      ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100)
      : 0;

    const expenseGrowth = previousMonth && previousMonth.expenses > 0
      ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100)
      : 0;

    return {
      revenueGrowth,
      expenseGrowth,
      currentMonthRevenue: currentMonth?.revenue || 0,
      currentMonthExpenses: currentMonth?.expenses || 0,
      currentMonthProfit: currentMonth?.profit || 0
    };
  }, [summary, monthlyAnalytics]);

  if (loading && !isRefreshing) {
    return <LoadingSpinner message="Lade Finanzdaten..." />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Finanzverwaltung</h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Überblick über Ihre Finanzen und Geschäftszahlen
                    </p>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className={`p-2 text-gray-400 hover:text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Search */}
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Suchen..."
                      className="pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </form>

                  {/* Export Menu */}
                  <div className="relative">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      onClick={() => setShowExportMenu(!showExportMenu)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => handleExport('overview')}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Übersicht exportieren
                          </button>
                          <button
                            onClick={() => handleExport('invoices')}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Rechnungen exportieren
                          </button>
                          <button
                            onClick={() => handleExport('expenses')}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Ausgaben exportieren
                          </button>
                          <button
                            onClick={() => handleExport('quotes')}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Angebote exportieren
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Create Menu */}
                  <div className="relative">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setShowCreateMenu(!showCreateMenu)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Neu erstellen
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </button>
                    {showCreateMenu && (
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                          <button
                            onClick={handleCreateInvoice}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Neue Rechnung
                          </button>
                          <button
                            onClick={handleCreateQuote}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Neues Angebot
                          </button>
                          <button
                            onClick={handleCreateExpense}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Neue Ausgabe
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                    { id: 'invoices', label: 'Rechnungen', icon: Receipt },
                    { id: 'quotes', label: 'Angebote', icon: FileText },
                    { id: 'expenses', label: 'Ausgaben', icon: Euro },
                    { id: 'reports', label: 'Berichte', icon: PieChart }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveView(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeView === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 inline mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {activeView === 'dashboard' && summary && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Umsatz</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(summary.metrics.totalRevenue)}
                      </p>
                      {additionalMetrics && (
                        <p className={`text-xs mt-1 ${additionalMetrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {additionalMetrics.revenueGrowth >= 0 ? '+' : ''}{additionalMetrics.revenueGrowth.toFixed(1)}% zum Vormonat
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                {/* Expenses Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ausgaben</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(summary.metrics.totalExpenses)}
                      </p>
                      {additionalMetrics && (
                        <p className={`text-xs mt-1 ${additionalMetrics.expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {additionalMetrics.expenseGrowth >= 0 ? '+' : ''}{additionalMetrics.expenseGrowth.toFixed(1)}% zum Vormonat
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>
                
                {/* Profit Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gewinn</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(summary.metrics.profit)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {summary.metrics.profitMargin.toFixed(1)}% Marge
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${summary.metrics.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Euro className={`h-6 w-6 ${summary.metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </div>
                
                {/* Open Invoices Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Offene Rechnungen</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(summary.metrics.openInvoicesAmount)}
                      </p>
                      {summary.metrics.overdueInvoicesCount > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {summary.metrics.overdueInvoicesCount} überfällig ({formatCurrency(summary.metrics.overdueInvoicesAmount)})
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Umsatzentwicklung</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyAnalytics}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#6366F1" 
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          name="Umsatz"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="expenses" 
                          stroke="#EF4444" 
                          fillOpacity={1}
                          fill="url(#colorExpenses)"
                          name="Ausgaben"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Expense Categories */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ausgaben nach Kategorie</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Monthly Profit Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monatlicher Gewinn</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyAnalytics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="profit" 
                        fill={(entry) => entry.profit >= 0 ? '#10B981' : '#EF4444'}
                        name="Gewinn"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Recent Invoices */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Letzte Rechnungen</h3>
                  <button
                    onClick={() => setActiveView('invoices')}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Alle anzeigen →
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentInvoices.slice(0, 5).map((invoice) => (
                    <div key={invoice._id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            invoice.status === 'bezahlt' ? 'bg-green-500' :
                            invoice.status === 'ueberfaellig' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Rechnung {invoice.rechnungsnummer}
                            </p>
                            <p className="text-sm text-gray-500">
                              {invoice.kunde?.name || invoice.kundeName || 'Unbekannter Kunde'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.gesamtbetrag)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(invoice.rechnungsdatum), 'dd.MM.yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentInvoices.length === 0 && (
                    <div className="px-6 py-8 text-center text-gray-500">
                      Keine Rechnungen vorhanden
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Component views */}
          {activeView === 'invoices' && (
            <InvoiceManagement key={refreshKey} />
          )}
          
          {activeView === 'quotes' && (
            <QuoteManagement key={refreshKey} />
          )}
          
          {activeView === 'expenses' && (
            <ExpenseTracking key={refreshKey} />
          )}
          
          {activeView === 'reports' && (
            <FinancialReports key={refreshKey} dateRange={dateRange} />
          )}
        </div>
        
        {/* Click outside handlers */}
        {(showExportMenu || showCreateMenu) && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => {
              setShowExportMenu(false);
              setShowCreateMenu(false);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
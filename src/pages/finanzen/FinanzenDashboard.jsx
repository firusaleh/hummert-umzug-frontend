import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Euro, FileText, Receipt, 
  AlertCircle, Calendar, PieChart, BarChart3, Download,
  Plus, Filter, Clock, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart, 
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
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

export default function FinanzenDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 11)),
    end: endOfMonth(new Date())
  });
  
  // Financial data
  const [overview, setOverview] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    project: ''
  });
  
  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);
  
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });
      
      const [overviewRes, invoicesRes, quotesRes, expensesRes] = await Promise.all([
        api.get(`/finanzen/uebersicht?${params}`),
        api.get(`/finanzen/rechnungen?${params}`),
        api.get(`/finanzen/angebote?${params}`),
        api.get(`/finanzen/projektkosten?${params}`)
      ]);
      
      setOverview(overviewRes.data.data || overviewRes.data);
      setInvoices(invoicesRes.data.data || invoicesRes.data || []);
      setQuotes(quotesRes.data.data || quotesRes.data || []);
      setExpenses(expensesRes.data.data || expensesRes.data || []);
      
      // Calculate monthly data for charts
      calculateMonthlyData(invoicesRes.data.data || invoicesRes.data || [], 
                          expensesRes.data.data || expensesRes.data || []);
      
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Fehler beim Laden der Finanzdaten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  const calculateMonthlyData = (invoiceData, expenseData) => {
    const months = [];
    const current = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(current, i);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMM', { locale: de });
      
      // Calculate revenue for the month
      const monthRevenue = invoiceData
        .filter(inv => inv.bezahltAm && format(parseISO(inv.bezahltAm), 'yyyy-MM') === monthKey)
        .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
      
      // Calculate expenses for the month
      const monthExpenses = expenseData
        .filter(exp => format(parseISO(exp.datum), 'yyyy-MM') === monthKey)
        .reduce((sum, exp) => sum + (exp.betrag || 0), 0);
      
      months.push({
        month: monthName,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses
      });
    }
    
    setMonthlyData(months);
  };
  
  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!overview) return null;
    
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
        const dueDate = parseISO(inv.faelligkeitsdatum);
        return dueDate < new Date();
      });
    
    const acceptedQuotes = quotes
      .filter(q => q.status === 'angenommen').length;
    
    const quoteAcceptanceRate = quotes.length > 0 
      ? (acceptedQuotes / quotes.length * 100).toFixed(1)
      : 0;
    
    return {
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      openInvoices,
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0),
      quoteAcceptanceRate,
      avgInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0
    };
  }, [overview, invoices, quotes, expenses]);
  
  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const categories = {};
    
    expenses.forEach(expense => {
      const category = expense.kategorie || 'Sonstige';
      categories[category] = (categories[category] || 0) + expense.betrag;
    });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);
  
  const handleCreateInvoice = () => {
    navigate('/finanzen/rechnungen/neu');
  };
  
  const handleCreateQuote = () => {
    navigate('/finanzen/angebote/neu');
  };
  
  const handleCreateExpense = () => {
    navigate('/finanzen/projektkosten/neu');
  };
  
  const handleExport = async (type) => {
    try {
      const response = await api.get(`/finanzen/export/${type}`, {
        params: {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('Export error:', error);
      setError('Fehler beim Exportieren. Bitte versuchen Sie es erneut.');
    }
  };
  
  if (loading) {
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
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Finanzverwaltung</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Überblick über Ihre Finanzen und Geschäftszahlen
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      onClick={() => document.getElementById('export-menu').classList.toggle('hidden')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </button>
                    <div
                      id="export-menu"
                      className="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                    >
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
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => document.getElementById('create-menu').classList.toggle('hidden')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Neu erstellen
                    </button>
                    <div
                      id="create-menu"
                      className="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                    >
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
                  </div>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'dashboard'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveView('invoices')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'invoices'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Receipt className="h-4 w-4 inline mr-2" />
                    Rechnungen
                  </button>
                  <button
                    onClick={() => setActiveView('quotes')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'quotes'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    Angebote
                  </button>
                  <button
                    onClick={() => setActiveView('expenses')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'expenses'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Euro className="h-4 w-4 inline mr-2" />
                    Ausgaben
                  </button>
                  <button
                    onClick={() => setActiveView('reports')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'reports'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <PieChart className="h-4 w-4 inline mr-2" />
                    Berichte
                  </button>
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
          
          {activeView === 'dashboard' && kpis && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Umsatz</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {kpis.totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Dieses Jahr</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ausgaben</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {kpis.totalExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Dieses Jahr</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gewinn</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {kpis.profit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {((kpis.profit / kpis.totalRevenue) * 100).toFixed(1)}% Marge
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${kpis.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Euro className={`h-6 w-6 ${kpis.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Offene Rechnungen</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {kpis.openInvoices.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </p>
                      {kpis.overdueCount > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {kpis.overdueCount} überfällig
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
                      <AreaChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#6366F1" 
                          fill="#6366F1" 
                          fillOpacity={0.6} 
                          name="Umsatz"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="expenses" 
                          stroke="#EF4444" 
                          fill="#EF4444" 
                          fillOpacity={0.6} 
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
                        <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Letzte Aktivitäten</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {invoices.slice(0, 5).map((invoice) => (
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
                              {invoice.kunde?.name || 'Unbekannter Kunde'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {invoice.gesamtbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(invoice.rechnungsdatum), 'dd.MM.yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Other views */}
          {activeView === 'invoices' && (
            <InvoiceManagement />
          )}
          
          {activeView === 'quotes' && (
            <QuoteManagement />
          )}
          
          {activeView === 'expenses' && (
            <ExpenseTracking />
          )}
          
          {activeView === 'reports' && (
            <FinancialReports />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
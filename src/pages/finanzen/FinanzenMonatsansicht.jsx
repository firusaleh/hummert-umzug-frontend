import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Download, Filter,
  TrendingUp, TrendingDown, Euro, Receipt, Package,
  BarChart3, PieChart, RefreshCw, FileText, AlertCircle,
  CreditCard, DollarSign, Activity, Target
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RePieChart, 
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../services/api';

// Constants
const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const EXPENSE_CATEGORIES = {
  'Personal': { color: '#3B82F6', icon: '👥' },
  'Material': { color: '#10B981', icon: '📦' },
  'Fahrzeug': { color: '#F59E0B', icon: '🚛' },
  'Fremdleistungen': { color: '#8B5CF6', icon: '🤝' },
  'Versicherung': { color: '#EF4444', icon: '🛡️' },
  'Verwaltung': { color: '#6366F1', icon: '📋' },
  'Sonstige': { color: '#6B7280', icon: '📌' }
};

// Metric Card Component
const MetricCard = ({ title, value, previousValue, icon: Icon, color = 'blue', prefix = '', suffix = '' }) => {
  const change = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = change >= 0;
  
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-bold text-gray-900">
          {prefix}{typeof value === 'number' ? value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}{suffix}
        </p>
        {previousValue !== undefined && previousValue !== 0 && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium ml-1">{Math.abs(change).toFixed(1)}%</span>
            </div>
            <span className="text-xs text-gray-500">zum Vormonat</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Daily Calendar View Component
const DailyCalendarView = ({ dailyData, selectedDate, onDateSelect }) => {
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  });

  const firstDayOfWeek = startOfMonth(selectedDate).getDay();
  const emptyDays = Array(firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1).fill(null);

  const getDataForDay = (day) => {
    return dailyData.find(d => isSameDay(new Date(d.date), day));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tagesübersicht</h3>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        
        {daysInMonth.map(day => {
          const dayData = getDataForDay(day);
          const hasRevenue = dayData?.revenue > 0;
          const hasExpenses = dayData?.expenses > 0;
          const profit = (dayData?.revenue || 0) - (dayData?.expenses || 0);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                aspect-square p-1 rounded-lg border transition-all
                ${isToday(day) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                ${isSameDay(day, selectedDate) ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="h-full flex flex-col justify-between">
                <div className="text-xs font-medium text-gray-900">
                  {format(day, 'd')}
                </div>
                {(hasRevenue || hasExpenses) && (
                  <div className="space-y-1">
                    {hasRevenue && (
                      <div className="text-xs text-green-600 font-medium">
                        +{dayData.revenue.toFixed(0)}€
                      </div>
                    )}
                    {hasExpenses && (
                      <div className="text-xs text-red-600 font-medium">
                        -{dayData.expenses.toFixed(0)}€
                      </div>
                    )}
                    {profit !== 0 && (
                      <div className={`text-xs font-bold ${profit > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                        {profit > 0 ? '+' : ''}{profit.toFixed(0)}€
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Transaction List Component
const TransactionList = ({ transactions, type = 'all' }) => {
  const filteredTransactions = type === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === type);

  const getTypeIcon = (transaction) => {
    if (transaction.type === 'invoice') return <Receipt className="h-4 w-4 text-green-600" />;
    if (transaction.type === 'expense') return <Package className="h-4 w-4 text-red-600" />;
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {type === 'all' ? 'Alle Transaktionen' : type === 'income' ? 'Einnahmen' : 'Ausgaben'}
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(transaction)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(transaction.date), 'dd.MM.yyyy', { locale: de })}
                      {transaction.category && ` • ${transaction.category}`}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${
                  transaction.type === 'invoice' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'invoice' ? '+' : '-'}
                  {transaction.amount.toLocaleString('de-DE', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} €
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            Keine Transaktionen vorhanden
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-600">{entry.name}:</span>
            <span className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.value.toLocaleString('de-DE', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })} €
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinanzenMonatsansicht() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [monthlyData, setMonthlyData] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    invoiceCount: 0,
    expenseCount: 0,
    avgInvoiceValue: 0,
    previousMonth: {
      revenue: 0,
      expenses: 0,
      profit: 0
    }
  });
  
  const [dailyData, setDailyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('overview'); // overview, daily, transactions

  // Fetch monthly data
  const fetchMonthlyData = async () => {
    try {
      setError(null);
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const prevMonthStart = startOfMonth(subMonths(selectedMonth, 1));
      const prevMonthEnd = endOfMonth(subMonths(selectedMonth, 1));

      // Fetch current month data
      const [invoicesRes, expensesRes, quotesRes] = await Promise.all([
        api.get('/finanzen/rechnungen', {
          params: {
            von: monthStart.toISOString(),
            bis: monthEnd.toISOString()
          }
        }),
        api.get('/finanzen/projektkosten', {
          params: {
            von: monthStart.toISOString(),
            bis: monthEnd.toISOString()
          }
        }),
        api.get('/finanzen/angebote', {
          params: {
            von: monthStart.toISOString(),
            bis: monthEnd.toISOString()
          }
        })
      ]);

      // Fetch previous month data for comparison
      const [prevInvoicesRes, prevExpensesRes] = await Promise.all([
        api.get('/finanzen/rechnungen', {
          params: {
            von: prevMonthStart.toISOString(),
            bis: prevMonthEnd.toISOString()
          }
        }),
        api.get('/finanzen/projektkosten', {
          params: {
            von: prevMonthStart.toISOString(),
            bis: prevMonthEnd.toISOString()
          }
        })
      ]);

      // Process current month data
      const invoices = Array.isArray(invoicesRes.data?.data) ? invoicesRes.data.data : [];
      const expenses = Array.isArray(expensesRes.data?.data) ? expensesRes.data.data : [];
      const quotes = Array.isArray(quotesRes.data?.data) ? quotesRes.data.data : [];

      // Process previous month data
      const prevInvoices = Array.isArray(prevInvoicesRes.data?.data) ? prevInvoicesRes.data.data : [];
      const prevExpenses = Array.isArray(prevExpensesRes.data?.data) ? prevExpensesRes.data.data : [];

      // Calculate current month metrics
      const paidInvoices = invoices.filter(inv => inv.status === 'bezahlt');
      const revenue = paidInvoices.reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
      const expenseTotal = expenses.reduce((sum, exp) => sum + Math.abs(exp.betrag || 0), 0);
      const profit = revenue - expenseTotal;

      // Calculate previous month metrics
      const prevPaidInvoices = prevInvoices.filter(inv => inv.status === 'bezahlt');
      const prevRevenue = prevPaidInvoices.reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
      const prevExpenseTotal = prevExpenses.reduce((sum, exp) => sum + Math.abs(exp.betrag || 0), 0);
      const prevProfit = prevRevenue - prevExpenseTotal;

      setMonthlyData({
        revenue,
        expenses: expenseTotal,
        profit,
        invoiceCount: invoices.length,
        expenseCount: expenses.length,
        quoteCount: quotes.length,
        avgInvoiceValue: invoices.length > 0 ? revenue / invoices.length : 0,
        previousMonth: {
          revenue: prevRevenue,
          expenses: prevExpenseTotal,
          profit: prevProfit
        }
      });

      // Process daily data
      const dailyMap = {};
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      // Initialize all days
      daysInMonth.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        dailyMap[dateKey] = {
          date: dateKey,
          revenue: 0,
          expenses: 0,
          invoices: 0,
          expenseCount: 0
        };
      });

      // Add invoice data
      invoices.forEach(invoice => {
        if (invoice.datum && invoice.status === 'bezahlt') {
          const dateKey = format(new Date(invoice.datum), 'yyyy-MM-dd');
          if (dailyMap[dateKey]) {
            dailyMap[dateKey].revenue += invoice.gesamtbetrag || 0;
            dailyMap[dateKey].invoices += 1;
          }
        }
      });

      // Add expense data
      expenses.forEach(expense => {
        if (expense.datum) {
          const dateKey = format(new Date(expense.datum), 'yyyy-MM-dd');
          if (dailyMap[dateKey]) {
            dailyMap[dateKey].expenses += Math.abs(expense.betrag || 0);
            dailyMap[dateKey].expenseCount += 1;
          }
        }
      });

      const dailyArray = Object.values(dailyMap).map(day => ({
        ...day,
        profit: day.revenue - day.expenses
      }));

      setDailyData(dailyArray);

      // Process category data
      const categories = {};
      expenses.forEach(expense => {
        const category = expense.kategorie || 'Sonstige';
        categories[category] = (categories[category] || 0) + Math.abs(expense.betrag || 0);
      });

      const categoryArray = Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setCategoryData(categoryArray);

      // Process transactions for list view
      const allTransactions = [
        ...invoices.map(inv => ({
          date: inv.datum,
          description: `Rechnung ${inv.rechnungsnummer} - ${inv.kunde?.name || 'Unbekannt'}`,
          amount: inv.gesamtbetrag || 0,
          type: 'invoice',
          status: inv.status
        })),
        ...expenses.map(exp => ({
          date: exp.datum,
          description: exp.beschreibung,
          amount: Math.abs(exp.betrag || 0),
          type: 'expense',
          category: exp.kategorie
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(allTransactions);

      // Fetch trends data (last 6 months)
      const trendsPromises = [];
      for (let i = 5; i >= 0; i--) {
        const trendMonth = subMonths(selectedMonth, i);
        const trendStart = startOfMonth(trendMonth);
        const trendEnd = endOfMonth(trendMonth);
        
        trendsPromises.push(
          Promise.all([
            api.get('/finanzen/rechnungen', {
              params: {
                von: trendStart.toISOString(),
                bis: trendEnd.toISOString()
              }
            }),
            api.get('/finanzen/projektkosten', {
              params: {
                von: trendStart.toISOString(),
                bis: trendEnd.toISOString()
              }
            })
          ])
        );
      }

      const trendsResults = await Promise.all(trendsPromises);
      const trendsData = trendsResults.map((result, index) => {
        const month = subMonths(selectedMonth, 5 - index);
        const [invoicesRes, expensesRes] = result;
        
        const invoices = Array.isArray(invoicesRes.data?.data) ? invoicesRes.data.data : [];
        const expenses = Array.isArray(expensesRes.data?.data) ? expensesRes.data.data : [];
        
        const revenue = invoices
          .filter(inv => inv.status === 'bezahlt')
          .reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
        const expenseTotal = expenses.reduce((sum, exp) => sum + Math.abs(exp.betrag || 0), 0);
        
        return {
          month: format(month, 'MMM', { locale: de }),
          revenue,
          expenses: expenseTotal,
          profit: revenue - expenseTotal
        };
      });

      setTrendsData(trendsData);

    } catch (err) {
      console.error('Error fetching monthly data:', err);
      setError('Fehler beim Laden der Monatsdaten');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth]);

  const handleMonthChange = (direction) => {
    if (direction === 'next') {
      setSelectedMonth(addMonths(selectedMonth, 1));
    } else {
      setSelectedMonth(subMonths(selectedMonth, 1));
    }
    setLoading(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMonthlyData();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export-Funktion wird implementiert...');
  };

  // Calculate profit margin
  const profitMargin = monthlyData.revenue > 0 
    ? (monthlyData.profit / monthlyData.revenue) * 100 
    : 0;

  // Get transactions for selected date
  const selectedDateTransactions = useMemo(() => {
    if (viewMode !== 'daily') return [];
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return transactions.filter(t => {
      if (!t.date) return false;
      return format(new Date(t.date), 'yyyy-MM-dd') === dateStr;
    });
  }, [selectedDate, transactions, viewMode]);

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Monatsübersicht Finanzen</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMonthChange('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="px-4 py-2 bg-gray-100 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                {format(selectedMonth, 'MMMM yyyy', { locale: de })}
              </p>
            </div>
            <button
              onClick={() => handleMonthChange('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={selectedMonth >= new Date()}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportieren
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setViewMode('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'daily'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tagesansicht
          </button>
          <button
            onClick={() => setViewMode('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transaktionen
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Umsatz"
              value={monthlyData.revenue}
              previousValue={monthlyData.previousMonth.revenue}
              icon={TrendingUp}
              color="green"
              prefix="€ "
            />
            <MetricCard
              title="Ausgaben"
              value={monthlyData.expenses}
              previousValue={monthlyData.previousMonth.expenses}
              icon={CreditCard}
              color="red"
              prefix="€ "
            />
            <MetricCard
              title="Gewinn"
              value={monthlyData.profit}
              previousValue={monthlyData.previousMonth.profit}
              icon={Euro}
              color={monthlyData.profit >= 0 ? 'blue' : 'red'}
              prefix="€ "
            />
            <MetricCard
              title="Gewinnmarge"
              value={profitMargin}
              icon={Target}
              color="purple"
              suffix="%"
            />
            <MetricCard
              title="Rechnungen"
              value={monthlyData.invoiceCount}
              icon={Receipt}
              color="yellow"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue & Expenses */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tägliche Entwicklung</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), 'd')}
                  />
                  <YAxis />
                  <Tooltip 
                    content={<CustomTooltip />}
                    labelFormatter={(date) => format(new Date(date), 'dd.MM.yyyy', { locale: de })}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10B981" name="Umsatz" />
                  <Bar dataKey="expenses" fill="#EF4444" name="Ausgaben" />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Gewinn"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ausgaben nach Kategorie</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={EXPENSE_CATEGORIES[entry.name]?.color || CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Keine Ausgaben in diesem Monat
                </div>
              )}
            </div>
          </div>

          {/* 6-Month Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">6-Monats-Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.6}
                  name="Umsatz"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stackId="2"
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.6}
                  name="Ausgaben"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Expenses */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Ausgaben</h3>
            <div className="space-y-3">
              {transactions
                .filter(t => t.type === 'expense')
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((expense, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                        EXPENSE_CATEGORIES[expense.category] 
                          ? `bg-gray-100` 
                          : 'bg-gray-100'
                      }`}>
                        {EXPENSE_CATEGORIES[expense.category]?.icon || '📌'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(expense.date), 'dd.MM.yyyy', { locale: de })}
                          {expense.category && ` • ${expense.category}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-red-600">
                      -{expense.amount.toLocaleString('de-DE', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })} €
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Daily View Mode */}
      {viewMode === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DailyCalendarView 
              dailyData={dailyData}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {format(selectedDate, 'dd. MMMM yyyy', { locale: de })}
              </h3>
              
              {selectedDateTransactions.length > 0 ? (
                <>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Einnahmen</span>
                      <span className="text-sm font-bold text-green-600">
                        +{selectedDateTransactions
                          .filter(t => t.type === 'invoice')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('de-DE', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })} €
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ausgaben</span>
                      <span className="text-sm font-bold text-red-600">
                        -{selectedDateTransactions
                          .filter(t => t.type === 'expense')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString('de-DE', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })} €
                      </span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Tagesergebnis</span>
                        <span className={`text-sm font-bold ${
                          selectedDateTransactions.reduce((sum, t) => 
                            sum + (t.type === 'invoice' ? t.amount : -t.amount), 0
                          ) >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {selectedDateTransactions.reduce((sum, t) => 
                            sum + (t.type === 'invoice' ? t.amount : -t.amount), 0
                          ).toLocaleString('de-DE', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })} €
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Transaktionen</h4>
                    {selectedDateTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-2">
                          {transaction.type === 'invoice' ? (
                            <Receipt className="h-4 w-4 text-green-600" />
                          ) : (
                            <Package className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <p className="text-xs font-medium text-gray-900 line-clamp-1">
                              {transaction.description}
                            </p>
                            {transaction.category && (
                              <p className="text-xs text-gray-500">{transaction.category}</p>
                            )}
                          </div>
                        </div>
                        <p className={`text-xs font-bold ${
                          transaction.type === 'invoice' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'invoice' ? '+' : '-'}
                          {transaction.amount.toFixed(2)} €
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p>Keine Transaktionen an diesem Tag</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transactions View Mode */}
      {viewMode === 'transactions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TransactionList transactions={transactions} type="income" />
          <TransactionList transactions={transactions} type="expense" />
          <div className="lg:row-span-2">
            <TransactionList transactions={transactions} type="all" />
          </div>
        </div>
      )}
    </div>
  );
}
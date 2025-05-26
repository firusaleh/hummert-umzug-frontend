import React, { useState, useEffect } from 'react';
import { 
  Download, Calendar, FileText, TrendingUp, Euro, Users, 
  Package, BarChart3, PieChart as PieChartIcon, Filter,
  Printer, Mail, ChevronDown, ChevronRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';

const FinancialReports = () => {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    expenses: true,
    profit: true,
    customers: true,
    projects: true
  });

  const reportTypes = [
    { value: 'overview', label: 'Übersicht', icon: BarChart3 },
    { value: 'revenue', label: 'Umsatz', icon: TrendingUp },
    { value: 'expenses', label: 'Ausgaben', icon: Package },
    { value: 'profit', label: 'Gewinn & Verlust', icon: Euro },
    { value: 'customers', label: 'Kundenanalyse', icon: Users },
    { value: 'projects', label: 'Projektanalyse', icon: FileText }
  ];

  const dateRanges = [
    { value: 'thisMonth', label: 'Dieser Monat' },
    { value: 'lastMonth', label: 'Letzter Monat' },
    { value: 'last3Months', label: 'Letzte 3 Monate' },
    { value: 'thisYear', label: 'Dieses Jahr' },
    { value: 'lastYear', label: 'Letztes Jahr' },
    { value: 'custom', label: 'Benutzerdefiniert' }
  ];

  useEffect(() => {
    generateReport();
  }, [reportType, dateRange, customStart, customEnd]);

  const getDateRange = () => {
    const now = new Date();
    let start, end;

    switch (dateRange) {
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'last3Months':
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case 'thisYear':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'lastYear':
        start = startOfYear(subMonths(now, 12));
        end = endOfYear(subMonths(now, 12));
        break;
      case 'custom':
        start = customStart ? new Date(customStart) : startOfMonth(now);
        end = customEnd ? new Date(customEnd) : endOfMonth(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return { start, end };
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Fetch all necessary data
      const [invoicesRes, quotesRes, costsRes, movesRes] = await Promise.all([
        api.get('/finanzen/rechnungen'),
        api.get('/finanzen/angebote'),
        api.get('/finanzen/projektkosten'),
        api.get('/umzuege')
      ]);

      const invoices = Array.isArray(invoicesRes.data?.data) ? invoicesRes.data.data : [];
      const quotes = Array.isArray(quotesRes.data?.data) ? quotesRes.data.data : [];
      const costs = Array.isArray(costsRes.data?.data) ? costsRes.data.data : [];
      const moves = Array.isArray(movesRes.data?.data) ? movesRes.data.data : [];

      // Filter by date range
      const filteredInvoices = invoices.filter(inv => {
        const date = new Date(inv.datum);
        return date >= start && date <= end;
      });

      const filteredQuotes = quotes.filter(quote => {
        const date = new Date(quote.datum);
        return date >= start && date <= end;
      });

      const filteredCosts = costs.filter(cost => {
        const date = new Date(cost.datum);
        return date >= start && date <= end;
      });

      // Generate report based on type
      let data = {};
      switch (reportType) {
        case 'overview':
          data = generateOverviewReport(filteredInvoices, filteredQuotes, filteredCosts, moves);
          break;
        case 'revenue':
          data = generateRevenueReport(filteredInvoices, filteredQuotes);
          break;
        case 'expenses':
          data = generateExpensesReport(filteredCosts);
          break;
        case 'profit':
          data = generateProfitReport(filteredInvoices, filteredCosts);
          break;
        case 'customers':
          data = generateCustomerReport(filteredInvoices, filteredQuotes, moves);
          break;
        case 'projects':
          data = generateProjectReport(filteredInvoices, filteredCosts, moves);
          break;
        default:
          data = {};
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOverviewReport = (invoices, quotes, costs, moves) => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.gesamtbetrag || 0), 0);
    const totalExpenses = costs.reduce((sum, cost) => sum + Math.abs(cost.betrag || 0), 0);
    const profit = totalRevenue - totalExpenses;
    const paidInvoices = invoices.filter(inv => inv.status === 'bezahlt');
    const openInvoices = invoices.filter(inv => inv.status === 'offen');
    
    return {
      summary: {
        totalRevenue,
        totalExpenses,
        profit,
        profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
        invoiceCount: invoices.length,
        quoteCount: quotes.length,
        costCount: costs.length,
        paidAmount: paidInvoices.reduce((sum, inv) => sum + inv.gesamtbetrag, 0),
        openAmount: openInvoices.reduce((sum, inv) => sum + inv.gesamtbetrag, 0),
        averageInvoice: invoices.length > 0 ? totalRevenue / invoices.length : 0
      },
      monthlyData: generateMonthlyData(invoices, costs),
      categoryBreakdown: generateCategoryBreakdown(costs),
      statusBreakdown: generateStatusBreakdown(invoices, quotes)
    };
  };

  const generateRevenueReport = (invoices, quotes) => {
    const byStatus = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + inv.gesamtbetrag;
      return acc;
    }, {});

    const byMonth = {};
    invoices.forEach(inv => {
      const month = format(new Date(inv.datum), 'yyyy-MM');
      byMonth[month] = (byMonth[month] || 0) + inv.gesamtbetrag;
    });

    const quoteConversion = {
      total: quotes.length,
      accepted: quotes.filter(q => q.status === 'angenommen').length,
      rejected: quotes.filter(q => q.status === 'abgelehnt').length,
      pending: quotes.filter(q => ['entwurf', 'versendet'].includes(q.status)).length,
      conversionRate: quotes.length > 0 
        ? (quotes.filter(q => q.status === 'angenommen').length / quotes.length) * 100 
        : 0
    };

    return {
      total: invoices.reduce((sum, inv) => sum + inv.gesamtbetrag, 0),
      byStatus,
      byMonth,
      quoteConversion,
      topCustomers: getTopCustomers(invoices, 5),
      averageInvoiceValue: invoices.length > 0 
        ? invoices.reduce((sum, inv) => sum + inv.gesamtbetrag, 0) / invoices.length 
        : 0
    };
  };

  const generateExpensesReport = (costs) => {
    const byCategory = costs.reduce((acc, cost) => {
      const category = cost.kategorie || 'Sonstige';
      acc[category] = (acc[category] || 0) + Math.abs(cost.betrag);
      return acc;
    }, {});

    const byMonth = {};
    costs.forEach(cost => {
      const month = format(new Date(cost.datum), 'yyyy-MM');
      byMonth[month] = (byMonth[month] || 0) + Math.abs(cost.betrag);
    });

    return {
      total: costs.reduce((sum, cost) => sum + Math.abs(cost.betrag), 0),
      byCategory,
      byMonth,
      topExpenses: costs
        .sort((a, b) => Math.abs(b.betrag) - Math.abs(a.betrag))
        .slice(0, 10)
        .map(cost => ({
          description: cost.beschreibung,
          amount: Math.abs(cost.betrag),
          category: cost.kategorie,
          date: cost.datum
        })),
      averageExpense: costs.length > 0 
        ? costs.reduce((sum, cost) => sum + Math.abs(cost.betrag), 0) / costs.length 
        : 0
    };
  };

  const generateProfitReport = (invoices, costs) => {
    const monthlyProfit = {};
    
    // Add revenue by month
    invoices.forEach(inv => {
      const month = format(new Date(inv.datum), 'yyyy-MM');
      monthlyProfit[month] = (monthlyProfit[month] || { revenue: 0, expenses: 0 });
      monthlyProfit[month].revenue += inv.gesamtbetrag;
    });

    // Subtract expenses by month
    costs.forEach(cost => {
      const month = format(new Date(cost.datum), 'yyyy-MM');
      monthlyProfit[month] = (monthlyProfit[month] || { revenue: 0, expenses: 0 });
      monthlyProfit[month].expenses += Math.abs(cost.betrag);
    });

    // Calculate profit for each month
    const profitData = Object.entries(monthlyProfit).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses,
      margin: data.revenue > 0 ? ((data.revenue - data.expenses) / data.revenue) * 100 : 0
    }));

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.gesamtbetrag, 0);
    const totalExpenses = costs.reduce((sum, cost) => sum + Math.abs(cost.betrag), 0);
    const totalProfit = totalRevenue - totalExpenses;

    return {
      total: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: totalProfit,
        margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      },
      monthly: profitData,
      trends: calculateTrends(profitData)
    };
  };

  const generateCustomerReport = (invoices, quotes, moves) => {
    const customerStats = {};

    // Process invoices
    invoices.forEach(inv => {
      const customerId = inv.kunde?.email || 'unknown';
      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          name: inv.kunde?.name || 'Unbekannt',
          email: customerId,
          totalRevenue: 0,
          invoiceCount: 0,
          quoteCount: 0,
          moveCount: 0,
          averageValue: 0
        };
      }
      customerStats[customerId].totalRevenue += inv.gesamtbetrag;
      customerStats[customerId].invoiceCount++;
    });

    // Process quotes
    quotes.forEach(quote => {
      const customerId = quote.kunde?.email || 'unknown';
      if (customerStats[customerId]) {
        customerStats[customerId].quoteCount++;
      }
    });

    // Calculate averages
    Object.values(customerStats).forEach(stats => {
      stats.averageValue = stats.invoiceCount > 0 ? stats.totalRevenue / stats.invoiceCount : 0;
    });

    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    return {
      totalCustomers: Object.keys(customerStats).length,
      topCustomers,
      customerDistribution: generateCustomerDistribution(customerStats),
      lifetimeValue: calculateLifetimeValue(customerStats)
    };
  };

  const generateProjectReport = (invoices, costs, moves) => {
    const projectStats = {};

    // Group by move/project
    moves.forEach(move => {
      projectStats[move._id] = {
        id: move._id,
        number: move.umzugsnummer,
        customer: move.kundenname,
        date: move.datum,
        revenue: 0,
        costs: 0,
        profit: 0,
        margin: 0
      };
    });

    // Add revenue from invoices
    invoices.forEach(inv => {
      if (inv.umzugId && projectStats[inv.umzugId]) {
        projectStats[inv.umzugId].revenue += inv.gesamtbetrag;
      }
    });

    // Add costs
    costs.forEach(cost => {
      if (cost.umzugId && projectStats[cost.umzugId]) {
        projectStats[cost.umzugId].costs += Math.abs(cost.betrag);
      }
    });

    // Calculate profit and margin
    Object.values(projectStats).forEach(project => {
      project.profit = project.revenue - project.costs;
      project.margin = project.revenue > 0 ? (project.profit / project.revenue) * 100 : 0;
    });

    const projects = Object.values(projectStats);
    const profitableProjects = projects.filter(p => p.profit > 0);
    const lossProjects = projects.filter(p => p.profit < 0);

    return {
      totalProjects: projects.length,
      profitableProjects: profitableProjects.length,
      lossProjects: lossProjects.length,
      averageMargin: projects.length > 0 
        ? projects.reduce((sum, p) => sum + p.margin, 0) / projects.length 
        : 0,
      topProjects: projects.sort((a, b) => b.profit - a.profit).slice(0, 10),
      worstProjects: projects.sort((a, b) => a.profit - b.profit).slice(0, 5)
    };
  };

  // Helper functions
  const generateMonthlyData = (invoices, costs) => {
    const monthlyData = {};

    invoices.forEach(inv => {
      const month = format(new Date(inv.datum), 'MMM yyyy', { locale: de });
      monthlyData[month] = monthlyData[month] || { revenue: 0, expenses: 0 };
      monthlyData[month].revenue += inv.gesamtbetrag;
    });

    costs.forEach(cost => {
      const month = format(new Date(cost.datum), 'MMM yyyy', { locale: de });
      monthlyData[month] = monthlyData[month] || { revenue: 0, expenses: 0 };
      monthlyData[month].expenses += Math.abs(cost.betrag);
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      Umsatz: data.revenue,
      Ausgaben: data.expenses,
      Gewinn: data.revenue - data.expenses
    }));
  };

  const generateCategoryBreakdown = (costs) => {
    const breakdown = costs.reduce((acc, cost) => {
      const category = cost.kategorie || 'Sonstige';
      acc[category] = (acc[category] || 0) + Math.abs(cost.betrag);
      return acc;
    }, {});

    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  };

  const generateStatusBreakdown = (invoices, quotes) => {
    const invoiceStatus = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});

    const quoteStatus = quotes.reduce((acc, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1;
      return acc;
    }, {});

    return { invoiceStatus, quoteStatus };
  };

  const getTopCustomers = (invoices, limit = 5) => {
    const customerRevenue = {};

    invoices.forEach(inv => {
      const customerName = inv.kunde?.name || 'Unbekannt';
      customerRevenue[customerName] = (customerRevenue[customerName] || 0) + inv.gesamtbetrag;
    });

    return Object.entries(customerRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([name, revenue]) => ({ name, revenue }));
  };

  const generateCustomerDistribution = (customerStats) => {
    const distribution = {
      'Unter €1.000': 0,
      '€1.000 - €5.000': 0,
      '€5.000 - €10.000': 0,
      'Über €10.000': 0
    };

    Object.values(customerStats).forEach(stats => {
      if (stats.totalRevenue < 1000) distribution['Unter €1.000']++;
      else if (stats.totalRevenue < 5000) distribution['€1.000 - €5.000']++;
      else if (stats.totalRevenue < 10000) distribution['€5.000 - €10.000']++;
      else distribution['Über €10.000']++;
    });

    return Object.entries(distribution).map(([range, count]) => ({ range, count }));
  };

  const calculateLifetimeValue = (customerStats) => {
    const values = Object.values(customerStats).map(s => s.totalRevenue);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  };

  const calculateTrends = (monthlyData) => {
    if (monthlyData.length < 2) return { revenue: 0, expenses: 0, profit: 0 };

    const lastMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];

    return {
      revenue: previousMonth.revenue > 0 
        ? ((lastMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 
        : 0,
      expenses: previousMonth.expenses > 0 
        ? ((lastMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100 
        : 0,
      profit: previousMonth.profit !== 0 
        ? ((lastMonth.profit - previousMonth.profit) / Math.abs(previousMonth.profit)) * 100 
        : 0
    };
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const exportReport = (format) => {
    // Placeholder for export functionality
    console.log(`Exporting report as ${format}`);
    alert(`Export als ${format} wird implementiert...`);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Finanzberichte</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportReport('pdf')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button
            onClick={() => exportReport('excel')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Drucken
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Berichtstyp</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zeitraum</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="md:col-span-3 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-6">
          {/* Overview Report */}
          {reportType === 'overview' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Umsatz</p>
                      <p className="text-2xl font-bold text-gray-900">
                        € {reportData.summary.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ausgaben</p>
                      <p className="text-2xl font-bold text-gray-900">
                        € {reportData.summary.totalExpenses.toFixed(2)}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gewinn</p>
                      <p className={`text-2xl font-bold ${reportData.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        € {reportData.summary.profit.toFixed(2)}
                      </p>
                    </div>
                    <Euro className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gewinnmarge</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.summary.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                    <PieChartIcon className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Monthly Chart */}
              {reportData.monthlyData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Monatliche Entwicklung</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `€ ${value.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="Umsatz" fill="#10B981" />
                      <Bar dataKey="Ausgaben" fill="#EF4444" />
                      <Bar dataKey="Gewinn" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Category Breakdown */}
              {reportData.categoryBreakdown.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ausgaben nach Kategorie</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `€ ${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* Revenue Report */}
          {reportType === 'revenue' && reportData && (
            <>
              {/* Revenue Summary */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Umsatzübersicht</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Gesamtumsatz</p>
                    <p className="text-2xl font-bold text-gray-900">€ {reportData.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Durchschnittlicher Rechnungswert</p>
                    <p className="text-2xl font-bold text-gray-900">€ {reportData.averageInvoiceValue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Angebots-Konversionsrate</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.quoteConversion.conversionRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Top Customers */}
              {reportData.topCustomers.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Kunden</h3>
                  <div className="space-y-2">
                    {reportData.topCustomers.map((customer, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-900">{customer.name}</span>
                        <span className="text-sm font-medium text-gray-900">€ {customer.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Other report types would follow similar patterns */}
        </div>
      )}
    </div>
  );
};

export default FinancialReports;
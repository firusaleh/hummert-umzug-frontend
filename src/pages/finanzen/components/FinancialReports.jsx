import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Calendar, Download, Filter,
  Euro, FileText, PieChart, Activity, DollarSign,
  ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Area, AreaChart, RadialBarChart, RadialBar
} from 'recharts';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, 
  subMonths, addMonths, eachMonthOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function FinancialReports() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overview'); // overview, profit-loss, cash-flow, tax
  const [period, setPeriod] = useState('year'); // month, quarter, year
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState({
    overview: null,
    monthlyTrends: [],
    categoryBreakdown: [],
    projectProfitability: [],
    cashFlow: [],
    taxSummary: null
  });
  
  useEffect(() => {
    fetchReportData();
  }, [year, period]);
  
  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const dateRange = {
        start: period === 'year' ? startOfYear(new Date(year, 0, 1)) : startOfMonth(new Date()),
        end: period === 'year' ? endOfYear(new Date(year, 0, 1)) : endOfMonth(new Date())
      };
      
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      });
      
      const [overviewRes, invoicesRes, expensesRes, quotesRes] = await Promise.all([
        api.get(`/finanzen/uebersicht?${params}`),
        api.get(`/finanzen/rechnungen?${params}`),
        api.get(`/finanzen/projektkosten?${params}`),
        api.get(`/finanzen/angebote?${params}`)
      ]);
      
      const overview = overviewRes.data.data || overviewRes.data;
      const invoices = invoicesRes.data.data || invoicesRes.data || [];
      const expenses = expensesRes.data.data || expensesRes.data || [];
      const quotes = quotesRes.data.data || quotesRes.data || [];
      
      // Process data for reports
      processReportData(overview, invoices, expenses, quotes, dateRange);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const processReportData = (overview, invoices, expenses, quotes, dateRange) => {
    // Monthly trends
    const months = eachMonthOfInterval({
      start: dateRange.start,
      end: dateRange.end
    });
    
    const monthlyTrends = months.map(month => {
      const monthKey = format(month, 'yyyy-MM');
      const monthName = format(month, 'MMM', { locale: de });
      
      const revenue = invoices
        .filter(inv => inv.status === 'bezahlt' && format(new Date(inv.bezahltAm), 'yyyy-MM') === monthKey)
        .reduce((sum, inv) => sum + inv.gesamtbetrag, 0);
      
      const costs = expenses
        .filter(exp => format(new Date(exp.datum), 'yyyy-MM') === monthKey)
        .reduce((sum, exp) => sum + exp.betrag, 0);
      
      const quotesValue = quotes
        .filter(q => format(new Date(q.angebotsdatum), 'yyyy-MM') === monthKey)
        .reduce((sum, q) => sum + q.gesamtbetrag, 0);
      
      return {
        month: monthName,
        revenue,
        costs,
        profit: revenue - costs,
        quotes: quotesValue,
        margin: revenue > 0 ? ((revenue - costs) / revenue * 100).toFixed(1) : 0
      };
    });
    
    // Category breakdown
    const categoryBreakdown = {};
    expenses.forEach(expense => {
      const category = expense.kategorie || 'Sonstige';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + expense.betrag;
    });
    
    // Project profitability
    const projectMap = new Map();
    
    invoices.forEach(invoice => {
      if (invoice.projekt?._id) {
        const projectId = invoice.projekt._id;
        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, {
            name: invoice.projekt.name || invoice.kunde?.name || 'Unbekannt',
            revenue: 0,
            costs: 0,
            invoiceCount: 0,
            expenseCount: 0
          });
        }
        const project = projectMap.get(projectId);
        project.revenue += invoice.gesamtbetrag;
        project.invoiceCount++;
      }
    });
    
    expenses.forEach(expense => {
      if (expense.projekt?._id) {
        const projectId = expense.projekt._id;
        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, {
            name: expense.projekt.name || 'Unbekannt',
            revenue: 0,
            costs: 0,
            invoiceCount: 0,
            expenseCount: 0
          });
        }
        const project = projectMap.get(projectId);
        project.costs += expense.betrag;
        project.expenseCount++;
      }
    });
    
    const projectProfitability = Array.from(projectMap.values())
      .map(project => ({
        ...project,
        profit: project.revenue - project.costs,
        margin: project.revenue > 0 ? ((project.revenue - project.costs) / project.revenue * 100) : 0
      }))
      .sort((a, b) => b.profit - a.profit);
    
    // Tax summary
    const totalRevenue = invoices
      .filter(inv => inv.status === 'bezahlt')
      .reduce((sum, inv) => sum + inv.nettobetrag, 0);
    
    const totalTax = invoices
      .filter(inv => inv.status === 'bezahlt')
      .reduce((sum, inv) => sum + inv.steuerbetrag, 0);
    
    const taxSummary = {
      totalRevenue,
      totalTax,
      taxRate: 19,
      deductibleExpenses: expenses
        .filter(exp => exp.status === 'genehmigt')
        .reduce((sum, exp) => sum + exp.betrag, 0)
    };
    
    setData({
      overview,
      monthlyTrends,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
      projectProfitability,
      cashFlow: monthlyTrends,
      taxSummary
    });
  };
  
  const handleExport = async (format) => {
    try {
      const response = await api.get(`/finanzen/reports/export`, {
        params: {
          type: reportType,
          format,
          year,
          period
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_report_${year}_${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Export-Funktion wird noch implementiert');
    }
  };
  
  const calculateKPIs = () => {
    const trends = data.monthlyTrends;
    if (trends.length === 0) return {};
    
    const totalRevenue = trends.reduce((sum, m) => sum + m.revenue, 0);
    const totalCosts = trends.reduce((sum, m) => sum + m.costs, 0);
    const totalProfit = totalRevenue - totalCosts;
    const avgMonthlyRevenue = totalRevenue / trends.length;
    const avgMonthlyCosts = totalCosts / trends.length;
    
    // Growth rate (comparing last month to first month)
    const growthRate = trends.length > 1 
      ? ((trends[trends.length - 1].revenue - trends[0].revenue) / trends[0].revenue * 100).toFixed(1)
      : 0;
    
    return {
      totalRevenue,
      totalCosts,
      totalProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0,
      avgMonthlyRevenue,
      avgMonthlyCosts,
      growthRate
    };
  };
  
  const kpis = calculateKPIs();
  
  if (loading) {
    return <LoadingSpinner message="Lade Finanzberichte..." />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Finanzberichte</h2>
            <p className="text-sm text-gray-500 mt-1">
              Detaillierte Analysen und Berichte für Ihre Finanzen
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF Export
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Excel Export
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Drucken
            </button>
          </div>
        </div>
        
        {/* Report Type Selection */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setReportType('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              reportType === 'overview'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setReportType('profit-loss')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              reportType === 'profit-loss'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Gewinn & Verlust
          </button>
          <button
            onClick={() => setReportType('cash-flow')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              reportType === 'cash-flow'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cashflow
          </button>
          <button
            onClick={() => setReportType('tax')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              reportType === 'tax'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Steuern
          </button>
        </div>
        
        {/* Period Selection */}
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="month">Monat</option>
            <option value="quarter">Quartal</option>
            <option value="year">Jahr</option>
          </select>
          
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {[2023, 2024, 2025].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Report Content */}
      {reportType === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpis.totalRevenue?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '0 €'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {kpis.growthRate > 0 ? (
                      <span className="text-green-600 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        {kpis.growthRate}% Wachstum
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                        {Math.abs(kpis.growthRate)}% Rückgang
                      </span>
                    )}
                  </p>
                </div>
                <Euro className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamtkosten</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpis.totalCosts?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '0 €'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ø {kpis.avgMonthlyCosts?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '0 €'}/Monat
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nettogewinn</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpis.totalProfit?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '0 €'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {kpis.profitMargin || 0}% Marge
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ø Monatsumsatz</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpis.avgMonthlyRevenue?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '0 €'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.monthlyTrends.length} Monate
                  </p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
          
          {/* Revenue & Profit Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Umsatz- und Gewinnentwicklung</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
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
                    dataKey="profit" 
                    stackId="2"
                    stroke="#6366F1" 
                    fill="#6366F1" 
                    fillOpacity={0.6}
                    name="Gewinn"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Category Breakdown & Project Profitability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ausgaben nach Kategorie</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top 5 Profitable Projekte</h3>
              <div className="space-y-3">
                {data.projectProfitability.slice(0, 5).map((project, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                      <div className="mt-1 relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                          <div
                            style={{ width: `${Math.abs(project.margin)}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                              project.margin >= 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {project.profit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {project.margin.toFixed(1)}% Marge
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {reportType === 'profit-loss' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gewinn- und Verlustrechnung</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10B981" name="Einnahmen" />
                  <Bar dataKey="costs" fill="#EF4444" name="Ausgaben" />
                  <Bar dataKey="profit" fill="#6366F1" name="Gewinn" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Detailed P&L Statement */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Detaillierte Aufstellung</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  {data.monthlyTrends.slice(-3).map(month => (
                    <th key={month.month} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {month.month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Umsatzerlöse</td>
                  {data.monthlyTrends.slice(-3).map(month => (
                    <td key={month.month} className="px-6 py-4 text-sm text-right text-gray-900">
                      {month.revenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Betriebskosten</td>
                  {data.monthlyTrends.slice(-3).map(month => (
                    <td key={month.month} className="px-6 py-4 text-sm text-right text-red-600">
                      -{month.costs.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">Betriebsergebnis</td>
                  {data.monthlyTrends.slice(-3).map(month => (
                    <td key={month.month} className={`px-6 py-4 text-sm text-right font-bold ${
                      month.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {month.profit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {reportType === 'cash-flow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cashflow-Entwicklung</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Einzahlungen"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="costs" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Auszahlungen"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#6366F1" 
                    strokeWidth={3}
                    name="Netto-Cashflow"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {reportType === 'tax' && data.taxSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Nettoumsatz</h3>
              <p className="text-2xl font-bold text-gray-900">
                {data.taxSummary.totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Umsatzsteuer ({data.taxSummary.taxRate}%)</h3>
              <p className="text-2xl font-bold text-gray-900">
                {data.taxSummary.totalTax.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Abzugsfähige Ausgaben</h3>
              <p className="text-2xl font-bold text-gray-900">
                {data.taxSummary.deductibleExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Steuerübersicht</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Bruttoumsatz</span>
                <span className="text-sm font-medium text-gray-900">
                  {(data.taxSummary.totalRevenue + data.taxSummary.totalTax).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">- Umsatzsteuer</span>
                <span className="text-sm font-medium text-red-600">
                  -{data.taxSummary.totalTax.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">= Nettoumsatz</span>
                <span className="text-sm font-medium text-gray-900">
                  {data.taxSummary.totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">- Betriebsausgaben</span>
                <span className="text-sm font-medium text-red-600">
                  -{data.taxSummary.deductibleExpenses.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <div className="flex justify-between py-2 pt-4">
                <span className="text-lg font-medium text-gray-900">Zu versteuernder Gewinn</span>
                <span className="text-lg font-bold text-gray-900">
                  {(data.taxSummary.totalRevenue - data.taxSummary.deductibleExpenses).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
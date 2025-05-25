import React, { useState, useEffect, useMemo } from 'react';
import { 
  Euro, Search, Filter, Plus, Edit2, Trash2, Calendar,
  ShoppingCart, Fuel, Wrench, Users, Home, FileText,
  CheckCircle, Clock, XCircle, TrendingUp, PieChart
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../../../services/api';

const CATEGORY_ICONS = {
  material: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
  kraftstoff: { icon: Fuel, color: 'text-green-600', bg: 'bg-green-100' },
  werkzeuge: { icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-100' },
  personal: { icon: Users, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  buero: { icon: Home, color: 'text-red-600', bg: 'bg-red-100' },
  sonstiges: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' }
};

const STATUS_BADGES = {
  eingereicht: { label: 'Eingereicht', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  genehmigt: { label: 'Genehmigt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  abgelehnt: { label: 'Abgelehnt', color: 'bg-red-100 text-red-800', icon: XCircle },
  erstattet: { label: 'Erstattet', color: 'bg-blue-100 text-blue-800', icon: Euro }
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];

export default function ExpenseTracking() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  
  // Reference data
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  useEffect(() => {
    fetchExpenses();
    fetchProjects();
  }, [dateRange]);
  
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDatum: dateRange.start.toISOString(),
        endDatum: dateRange.end.toISOString()
      });
      
      const response = await api.get(`/finanzen/projektkosten?${params}`);
      setExpenses(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProjects = async () => {
    try {
      const response = await api.get('/umzuege');
      setProjects(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };
  
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };
  
  const handleDelete = async (expense) => {
    if (!window.confirm(`Möchten Sie diese Ausgabe wirklich löschen?`)) {
      return;
    }
    
    try {
      await api.delete(`/finanzen/projektkosten/${expense._id}`);
      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Fehler beim Löschen der Ausgabe');
    }
  };
  
  const handleApprove = async (expense) => {
    try {
      await api.put(`/finanzen/projektkosten/${expense._id}`, { status: 'genehmigt' });
      await fetchExpenses();
    } catch (error) {
      console.error('Error approving expense:', error);
    }
  };
  
  const handleReject = async (expense) => {
    const reason = window.prompt('Grund für die Ablehnung:');
    if (!reason) return;
    
    try {
      await api.put(`/finanzen/projektkosten/${expense._id}`, { 
        status: 'abgelehnt',
        ablehnungsgrund: reason 
      });
      await fetchExpenses();
    } catch (error) {
      console.error('Error rejecting expense:', error);
    }
  };
  
  // Filter expenses
  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];
    
    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.beschreibung?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.lieferant?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(expense => expense.kategorie === categoryFilter);
    }
    
    if (statusFilter) {
      filtered = filtered.filter(expense => expense.status === statusFilter);
    }
    
    if (projectFilter) {
      filtered = filtered.filter(expense => expense.projekt?._id === projectFilter);
    }
    
    return filtered.sort((a, b) => new Date(b.datum) - new Date(a.datum));
  }, [expenses, searchTerm, categoryFilter, statusFilter, projectFilter]);
  
  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      total: filteredExpenses.reduce((sum, exp) => sum + (exp.betrag || 0), 0),
      byCategory: {},
      byStatus: {},
      count: filteredExpenses.length
    };
    
    // Group by category
    filteredExpenses.forEach(expense => {
      const category = expense.kategorie || 'sonstiges';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + expense.betrag;
    });
    
    // Group by status
    filteredExpenses.forEach(expense => {
      const status = expense.status || 'eingereicht';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });
    
    return stats;
  }, [filteredExpenses]);
  
  // Prepare chart data
  const chartData = Object.entries(statistics.byCategory).map(([category, amount]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: amount
  }));
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Ausgabenverwaltung</h2>
          <p className="text-sm text-gray-500 mt-1">
            {statistics.count} Ausgaben im Wert von {statistics.total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/finanzen/projektkosten/neu')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Neue Ausgabe
        </button>
      </div>
      
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamtausgaben</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{statistics.count} Einträge</p>
              </div>
              <Euro className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Durchschnitt</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.count > 0 
                    ? (statistics.total / statistics.count).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                    : '0 €'}
                </p>
                <p className="text-xs text-gray-500 mt-1">pro Ausgabe</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Genehmigt</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.byStatus.genehmigt || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ausgaben</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ausstehend</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.byStatus.eingereicht || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">zur Genehmigung</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
        
        {/* Category Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ausgaben nach Kategorie</h3>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Keine Daten verfügbar</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Suche nach Beschreibung, Lieferant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Alle Kategorien</option>
              {Object.keys(CATEGORY_ICONS).map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Alle Status</option>
              {Object.entries(STATUS_BADGES).map(([key, badge]) => (
                <option key={key} value={key}>{badge.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Alle Projekte</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>
                  {project.auftraggeber?.name} - {format(parseISO(project.startDatum), 'dd.MM.yyyy')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Expense List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Beschreibung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Projekt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Betrag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExpenses.map((expense) => {
              const CategoryIcon = CATEGORY_ICONS[expense.kategorie || 'sonstiges'];
              const StatusBadge = STATUS_BADGES[expense.status || 'eingereicht'];
              
              return (
                <tr key={expense._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {format(parseISO(expense.datum), 'dd.MM.yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {expense.beschreibung}
                      </div>
                      {expense.lieferant && (
                        <div className="text-sm text-gray-500">
                          {expense.lieferant}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-1.5 rounded-full ${CategoryIcon.bg} mr-2`}>
                        <CategoryIcon.icon className={`h-4 w-4 ${CategoryIcon.color}`} />
                      </div>
                      <span className="text-sm text-gray-900">
                        {expense.kategorie?.charAt(0).toUpperCase() + expense.kategorie?.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {expense.projekt?.auftraggeber?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {expense.betrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                      <StatusBadge.icon className="h-3 w-3 mr-1" />
                      {StatusBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {expense.status === 'eingereicht' && (
                        <>
                          <button
                            onClick={() => handleApprove(expense)}
                            className="text-green-600 hover:text-green-700"
                            title="Genehmigen"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(expense)}
                            className="text-red-600 hover:text-red-700"
                            title="Ablehnen"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-indigo-600 hover:text-indigo-700"
                        title="Bearbeiten"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="text-red-600 hover:text-red-700"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <Euro className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Ausgaben</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || categoryFilter || statusFilter 
                ? 'Keine Ausgaben gefunden, die Ihren Filterkriterien entsprechen.'
                : 'Erfassen Sie Ihre erste Ausgabe.'}
            </p>
            {!searchTerm && !categoryFilter && !statusFilter && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/finanzen/projektkosten/neu')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Ausgabe erfassen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
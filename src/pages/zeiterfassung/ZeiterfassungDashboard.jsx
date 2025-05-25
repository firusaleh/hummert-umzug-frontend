import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Calendar, TrendingUp, Users, BarChart3, 
  Download, Filter, Plus, AlertCircle, ChevronRight,
  Timer, Target, Award, Activity
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  differenceInHours, parseISO, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ZeiterfassungForm from './components/ZeiterfassungForm';
import ZeiterfassungList from './components/ZeiterfassungList';
import TimeStatistics from './components/TimeStatistics';
import EmployeeOverview from './components/EmployeeOverview';
import ProjectAnalytics from './components/ProjectAnalytics';
import ExportDialog from './components/ExportDialog';

export default function ZeiterfassungDashboard() {
  const { user } = useAuth();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, entries, analytics
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { locale: de }),
    end: endOfWeek(new Date(), { locale: de })
  });
  
  // Data State
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [statistics, setStatistics] = useState(null);
  
  // Modal States
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showExport, setShowExport] = useState(false);
  
  // Fetch all required data
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  // Fetch time entries when filters change
  useEffect(() => {
    if (selectedProject || selectedEmployee || dateRange.start) {
      fetchTimeEntries();
    }
  }, [selectedProject, selectedEmployee, dateRange]);
  
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projectsRes, employeesRes, statsRes] = await Promise.all([
        api.get('/zeiterfassung/projekte'),
        api.get('/zeiterfassung/mitarbeiter'),
        api.get('/zeiterfassung/statistics')
      ]);
      
      setProjects(projectsRes.data.data || projectsRes.data || []);
      setEmployees(employeesRes.data.data || employeesRes.data || []);
      setStatistics(statsRes.data.data || statsRes.data || {});
      
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTimeEntries = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedProject) params.append('projektId', selectedProject);
      if (selectedEmployee) params.append('mitarbeiterId', selectedEmployee);
      if (dateRange.start) params.append('startDatum', dateRange.start.toISOString());
      if (dateRange.end) params.append('endDatum', dateRange.end.toISOString());
      
      const response = await api.get(`/zeiterfassung?${params}`);
      setTimeEntries(response.data.data || response.data || []);
      
    } catch (err) {
      console.error('Error fetching time entries:', err);
      setError('Fehler beim Laden der Zeiteinträge.');
    }
  };
  
  const handleCreateEntry = () => {
    setEditingEntry(null);
    setShowForm(true);
  };
  
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };
  
  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Möchten Sie diesen Zeiteintrag wirklich löschen?')) {
      return;
    }
    
    try {
      await api.delete(`/zeiterfassung/${entryId}`);
      await fetchTimeEntries();
      // Show success message
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Fehler beim Löschen des Eintrags.');
    }
  };
  
  const handleFormSubmit = async () => {
    setShowForm(false);
    await fetchTimeEntries();
    await fetchInitialData(); // Refresh statistics
  };
  
  // Calculate filtered statistics
  const filteredStatistics = useMemo(() => {
    if (!timeEntries.length) return null;
    
    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.arbeitsstunden || 0), 0);
    const averageHoursPerDay = totalHours / (differenceInHours(dateRange.end, dateRange.start) / 24 || 1);
    
    // Group by employee
    const byEmployee = timeEntries.reduce((acc, entry) => {
      const employeeId = entry.mitarbeiterId?._id || entry.mitarbeiterId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          name: entry.mitarbeiterId?.vorname + ' ' + entry.mitarbeiterId?.nachname,
          hours: 0,
          entries: 0
        };
      }
      acc[employeeId].hours += entry.arbeitsstunden || 0;
      acc[employeeId].entries++;
      return acc;
    }, {});
    
    // Group by project
    const byProject = timeEntries.reduce((acc, entry) => {
      const projectId = entry.projektId?._id || entry.projektId;
      if (!acc[projectId]) {
        acc[projectId] = {
          name: entry.projektId?.auftraggeber?.name || 'Unbekanntes Projekt',
          hours: 0,
          entries: 0
        };
      }
      acc[projectId].hours += entry.arbeitsstunden || 0;
      acc[projectId].entries++;
      return acc;
    }, {});
    
    return {
      totalHours,
      averageHoursPerDay,
      totalEntries: timeEntries.length,
      byEmployee: Object.values(byEmployee),
      byProject: Object.values(byProject)
    };
  }, [timeEntries, dateRange]);
  
  // Quick date range presets
  const handleQuickDateRange = (preset) => {
    const now = new Date();
    switch (preset) {
      case 'today':
        setDateRange({ start: now, end: now });
        break;
      case 'week':
        setDateRange({
          start: startOfWeek(now, { locale: de }),
          end: endOfWeek(now, { locale: de })
        });
        break;
      case 'month':
        setDateRange({
          start: startOfMonth(now),
          end: endOfMonth(now)
        });
        break;
      default:
        break;
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Lade Zeiterfassungsdaten..." />;
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
                  <h1 className="text-2xl font-bold text-gray-900">Zeiterfassung</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Verwalten Sie Arbeitszeiten und analysieren Sie Projektaufwände
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowExport(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                  <button
                    onClick={handleCreateEntry}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Zeiterfassung
                  </button>
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
                    onClick={() => setActiveView('entries')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'entries'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Clock className="h-4 w-4 inline mr-2" />
                    Zeiteinträge
                  </button>
                  <button
                    onClick={() => setActiveView('analytics')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeView === 'analytics'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 inline mr-2" />
                    Analysen
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
          
          {/* Filters */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zeitraum
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleQuickDateRange('today')}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Heute
                  </button>
                  <button
                    onClick={() => handleQuickDateRange('week')}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Woche
                  </button>
                  <button
                    onClick={() => handleQuickDateRange('month')}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Monat
                  </button>
                </div>
              </div>
              
              {/* Project Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projekt
                </label>
                <select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Alle Projekte</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.auftraggeber?.name || 'Unbekannt'}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Employee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mitarbeiter
                </label>
                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Alle Mitarbeiter</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.vorname} {employee.nachname}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Custom Date Range */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Von
                  </label>
                  <input
                    type="date"
                    value={format(dateRange.start, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange(prev => ({ 
                      ...prev, 
                      start: parseISO(e.target.value) 
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bis
                  </label>
                  <input
                    type="date"
                    value={format(dateRange.end, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange(prev => ({ 
                      ...prev, 
                      end: parseISO(e.target.value) 
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Content based on active view */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gesamtstunden</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredStatistics?.totalHours.toFixed(1) || '0'}
                      </p>
                    </div>
                    <Timer className="h-8 w-8 text-indigo-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ø pro Tag</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredStatistics?.averageHoursPerDay.toFixed(1) || '0'}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Einträge</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredStatistics?.totalEntries || 0}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Produktivität</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statistics?.productivityScore || 0}%
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
              </div>
              
              {/* Charts and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TimeStatistics data={filteredStatistics} />
                <EmployeeOverview 
                  employees={filteredStatistics?.byEmployee || []} 
                  onSelectEmployee={setSelectedEmployee}
                />
              </div>
              
              {/* Recent Entries */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Neueste Einträge
                  </h3>
                </div>
                <ZeiterfassungList
                  entries={timeEntries.slice(0, 5)}
                  onEdit={handleEditEntry}
                  onDelete={handleDeleteEntry}
                  compact
                />
                {timeEntries.length > 5 && (
                  <div className="px-6 py-3 border-t border-gray-200">
                    <button
                      onClick={() => setActiveView('entries')}
                      className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center"
                    >
                      Alle Einträge anzeigen
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeView === 'entries' && (
            <div className="bg-white rounded-lg shadow">
              <ZeiterfassungList
                entries={timeEntries}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
              />
            </div>
          )}
          
          {activeView === 'analytics' && (
            <ProjectAnalytics
              projects={filteredStatistics?.byProject || []}
              timeEntries={timeEntries}
              dateRange={dateRange}
            />
          )}
        </div>
        
        {/* Modals */}
        {showForm && (
          <ZeiterfassungForm
            entry={editingEntry}
            projects={projects}
            employees={employees}
            onClose={() => setShowForm(false)}
            onSubmit={handleFormSubmit}
          />
        )}
        
        {showExport && (
          <ExportDialog
            onClose={() => setShowExport(false)}
            filters={{
              projektId: selectedProject,
              mitarbeiterId: selectedEmployee,
              startDatum: dateRange.start,
              endDatum: dateRange.end
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
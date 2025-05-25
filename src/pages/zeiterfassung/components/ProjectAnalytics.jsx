import React, { useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend 
} from 'recharts';
import { Briefcase, TrendingUp, DollarSign, Users, Clock, Calendar } from 'lucide-react';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ProjectAnalytics({ projects, timeEntries, dateRange }) {
  // Calculate project metrics
  const projectMetrics = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    
    return projects.map(project => {
      const projectEntries = timeEntries.filter(entry => 
        (entry.projektId?._id || entry.projektId) === project.id
      );
      
      const totalHours = project.hours || 0;
      const avgHoursPerEntry = projectEntries.length > 0 
        ? totalHours / projectEntries.length 
        : 0;
      
      // Calculate daily distribution
      const dailyHours = {};
      projectEntries.forEach(entry => {
        const day = format(new Date(entry.datum), 'yyyy-MM-dd');
        dailyHours[day] = (dailyHours[day] || 0) + (entry.arbeitsstunden || 0);
      });
      
      // Get unique employees
      const uniqueEmployees = new Set(
        projectEntries.map(entry => entry.mitarbeiterId?._id || entry.mitarbeiterId)
      );
      
      return {
        ...project,
        totalHours,
        avgHoursPerEntry,
        dailyHours,
        employeeCount: uniqueEmployees.size,
        entryCount: projectEntries.length
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [projects, timeEntries]);
  
  // Prepare timeline data
  const timelineData = useMemo(() => {
    if (!dateRange || !timeEntries.length) return [];
    
    const days = eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end
    });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayData = {
        date: dayStr,
        displayDate: format(day, 'dd.MM', { locale: de })
      };
      
      // Add hours for each project
      projectMetrics.forEach(project => {
        dayData[project.name] = project.dailyHours[dayStr] || 0;
      });
      
      dayData.total = Object.values(dayData)
        .filter(val => typeof val === 'number')
        .reduce((sum, val) => sum + val, 0);
      
      return dayData;
    });
  }, [projectMetrics, timeEntries, dateRange]);
  
  // Colors for charts
  const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
  
  if (!projects || projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-gray-500">Keine Projektdaten verfügbar</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projectMetrics.slice(0, 3).map((project, index) => (
          <div key={project.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {project.name}
                </h4>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {project.totalHours.toFixed(1)} Std.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {project.employeeCount} Mitarbeiter
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {project.entryCount} Einträge
                  </div>
                </div>
              </div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + '20' }}
              >
                <Briefcase 
                  className="h-6 w-6" 
                  style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Timeline Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Projektverlauf</h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `${value.toFixed(1)} Std.`}
                labelFormatter={(label) => `Datum: ${label}`}
              />
              <Legend />
              {projectMetrics.slice(0, 5).map((project, index) => (
                <Area
                  key={project.name}
                  type="monotone"
                  dataKey={project.name}
                  stackId="1"
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Project Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Projektvergleich</h3>
          <BarChart className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={projectMetrics} 
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={90} />
              <Tooltip formatter={(value) => `${value.toFixed(1)} Std.`} />
              <Bar dataKey="totalHours" fill="#6366F1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Effizienz-Metriken</h3>
          <div className="space-y-4">
            {projectMetrics.slice(0, 5).map((project, index) => (
              <div key={project.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-3"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm text-gray-700">{project.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-500">
                    Ø {project.avgHoursPerEntry.toFixed(1)} Std/Eintrag
                  </span>
                  <span className="font-medium text-gray-900">
                    {project.employeeCount > 0 
                      ? (project.totalHours / project.employeeCount).toFixed(1) 
                      : '0'} Std/MA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Kostenübersicht</h3>
          <div className="space-y-4">
            {projectMetrics.slice(0, 5).map((project, index) => {
              // Assuming hourly rate of 50€ for demonstration
              const hourlyRate = 50;
              const totalCost = project.totalHours * hourlyRate;
              
              return (
                <div key={project.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-3"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{project.name}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="font-medium text-gray-900">
                      {totalCost.toLocaleString('de-DE')} €
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Gesamtkosten</span>
              <span className="text-lg font-semibold text-gray-900">
                {(projectMetrics.reduce((sum, p) => sum + p.totalHours, 0) * 50)
                  .toLocaleString('de-DE')} €
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
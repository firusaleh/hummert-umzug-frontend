import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, Calendar } from 'lucide-react';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

export default function TimeStatistics({ data }) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <p className="text-gray-500">Keine Daten verfügbar</p>
        </div>
      </div>
    );
  }
  
  // Prepare data for charts
  const dailyData = data.byDay || [];
  const projectData = data.byProject || [];
  
  return (
    <div className="space-y-6">
      {/* Daily Hours Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Tägliche Arbeitszeiten</h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString('de-DE')}
                formatter={(value) => [`${value.toFixed(1)} Std.`, 'Stunden']}
              />
              <Bar dataKey="hours" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Project Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Projektverteilung</h3>
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {projectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(1)} Std.`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="space-y-3">
            {projectData.map((project, index) => (
              <div key={project.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-700">{project.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {project.hours.toFixed(1)} Std.
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ø pro Tag</p>
              <p className="text-xl font-semibold text-gray-900">
                {data.averageHoursPerDay?.toFixed(1) || '0'} Std.
              </p>
            </div>
            <Calendar className="h-8 w-8 text-indigo-100" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produktivste Tag</p>
              <p className="text-xl font-semibold text-gray-900">
                {data.mostProductiveDay || '-'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-100" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Überstunden</p>
              <p className="text-xl font-semibold text-gray-900">
                {data.overtime?.toFixed(1) || '0'} Std.
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
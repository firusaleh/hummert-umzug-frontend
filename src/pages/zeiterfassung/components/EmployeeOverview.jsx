import React from 'react';
import { Users, Clock, TrendingUp, Award } from 'lucide-react';

export default function EmployeeOverview({ employees, onSelectEmployee }) {
  if (!employees || employees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-gray-500">Keine Mitarbeiterdaten verfügbar</p>
        </div>
      </div>
    );
  }
  
  // Sort employees by hours worked
  const sortedEmployees = [...employees].sort((a, b) => b.hours - a.hours);
  const topEmployees = sortedEmployees.slice(0, 5);
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Mitarbeiterübersicht</h3>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="p-6">
        {/* Top Performers */}
        <div className="space-y-4">
          {topEmployees.map((employee, index) => {
            const maxHours = topEmployees[0].hours || 1;
            const percentage = (employee.hours / maxHours) * 100;
            
            return (
              <div key={employee.name} className="group">
                <button
                  onClick={() => onSelectEmployee && onSelectEmployee(employee.id)}
                  className="w-full text-left hover:bg-gray-50 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {index === 0 && <Award className="h-4 w-4 text-yellow-500 mr-2" />}
                      <span className="text-sm font-medium text-gray-900">{employee.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">{employee.entries} Einträge</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {employee.hours.toFixed(1)} Std.
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        
        {employees.length > 5 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Und {employees.length - 5} weitere Mitarbeiter...
            </p>
          </div>
        )}
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Ø pro Mitarbeiter</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(employees.reduce((sum, e) => sum + e.hours, 0) / employees.length).toFixed(1)} Std.
                </p>
              </div>
              <Clock className="h-6 w-6 text-gray-300" />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Produktivität</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.round((employees.reduce((sum, e) => sum + e.entries, 0) / employees.length))} E/MA
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
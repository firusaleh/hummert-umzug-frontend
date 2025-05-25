import React from 'react';
import { Edit2, Trash2, Clock, User, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ZeiterfassungList({ entries, onEdit, onDelete, compact = false }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Zeiteinträge</h3>
        <p className="mt-1 text-sm text-gray-500">
          Erstellen Sie einen neuen Zeiteintrag, um zu beginnen.
        </p>
      </div>
    );
  }
  
  if (compact) {
    return (
      <div className="divide-y divide-gray-200">
        {entries.map((entry) => (
          <div key={entry._id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {entry.mitarbeiterId?.vorname} {entry.mitarbeiterId?.nachname}
                  </span>
                  <span className="mx-2 text-gray-300">•</span>
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-500">
                    {format(new Date(entry.datum), 'dd.MM.yyyy', { locale: de })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {entry.taetigkeit}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {entry.arbeitsstunden?.toFixed(1)} Std.
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.startzeit} - {entry.endzeit}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(entry)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(entry._id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mitarbeiter
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Datum
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Zeit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tätigkeit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stunden
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Aktionen</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry) => (
            <tr key={entry._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.mitarbeiterId?.vorname} {entry.mitarbeiterId?.nachname}
                    </div>
                    {entry.mitarbeiterId?.rolle && (
                      <div className="text-sm text-gray-500">
                        {entry.mitarbeiterId.rolle}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  {format(new Date(entry.datum), 'dd.MM.yyyy', { locale: de })}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    {entry.startzeit} - {entry.endzeit}
                  </div>
                  {entry.pause > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Pause: {entry.pause} Min.
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{entry.taetigkeit}</p>
                      {entry.notizen && (
                        <p className="text-xs text-gray-500 mt-1">{entry.notizen}</p>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {entry.arbeitsstunden?.toFixed(1)} Std.
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(entry)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(entry._id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
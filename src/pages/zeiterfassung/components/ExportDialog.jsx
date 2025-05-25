import React, { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '../../../services/api';

export default function ExportDialog({ onClose, filters }) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const handleExport = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        includeDetails: includeDetails.toString(),
        includeSummary: includeSummary.toString(),
        ...filters
      });
      
      const response = await api.get(`/zeiterfassung/export?${params}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filename = `zeiterfassung_${dateStr}.${exportFormat}`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      window.URL.revokeObjectURL(url);
      onClose();
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Fehler beim Exportieren. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Zeiterfassung exportieren
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Export-Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <span className="block text-sm font-medium text-gray-700">PDF</span>
                    <span className="block text-xs text-gray-500">Für Berichte und Archivierung</span>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <FileSpreadsheet className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <span className="block text-sm font-medium text-gray-700">Excel</span>
                    <span className="block text-xs text-gray-500">Für weitere Bearbeitung</span>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <span className="block text-sm font-medium text-gray-700">CSV</span>
                    <span className="block text-xs text-gray-500">Für Datenanalyse</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Export Options */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Export-Optionen
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Detaillierte Zeiteinträge einschließen
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Zusammenfassung einschließen
                </span>
              </label>
            </div>
          </div>
          
          {/* Date Range Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <div className="text-sm">
                <p className="font-medium text-gray-700">Zeitraum</p>
                <p className="text-gray-600">
                  {filters.startDatum && filters.endDatum
                    ? `${format(new Date(filters.startDatum), 'dd.MM.yyyy', { locale: de })} - 
                       ${format(new Date(filters.endDatum), 'dd.MM.yyyy', { locale: de })}`
                    : 'Alle Zeiteinträge'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Abbrechen
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Exportiere...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
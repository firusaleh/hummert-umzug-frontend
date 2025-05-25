import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Briefcase, FileText, Save } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../services/api';

export default function ZeiterfassungForm({ entry, projects, employees, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    mitarbeiterId: '',
    projektId: '',
    datum: format(new Date(), 'yyyy-MM-dd'),
    startzeit: '',
    endzeit: '',
    pause: 30,
    taetigkeit: '',
    notizen: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [calculatedHours, setCalculatedHours] = useState(0);
  
  // Load entry data if editing
  useEffect(() => {
    if (entry) {
      setFormData({
        mitarbeiterId: entry.mitarbeiterId?._id || entry.mitarbeiterId || '',
        projektId: entry.projektId?._id || entry.projektId || '',
        datum: entry.datum ? format(new Date(entry.datum), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        startzeit: entry.startzeit || '',
        endzeit: entry.endzeit || '',
        pause: entry.pause || 30,
        taetigkeit: entry.taetigkeit || '',
        notizen: entry.notizen || ''
      });
    }
  }, [entry]);
  
  // Calculate working hours whenever times change
  useEffect(() => {
    if (formData.startzeit && formData.endzeit) {
      const [startHours, startMinutes] = formData.startzeit.split(':').map(Number);
      const [endHours, endMinutes] = formData.endzeit.split(':').map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      
      const workMinutes = endTotalMinutes - startTotalMinutes - formData.pause;
      const hours = Math.max(0, workMinutes / 60);
      
      setCalculatedHours(hours);
    } else {
      setCalculatedHours(0);
    }
  }, [formData.startzeit, formData.endzeit, formData.pause]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pause' ? parseInt(value) || 0 : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.mitarbeiterId) {
      newErrors.mitarbeiterId = 'Bitte wählen Sie einen Mitarbeiter aus';
    }
    
    if (!formData.projektId) {
      newErrors.projektId = 'Bitte wählen Sie ein Projekt aus';
    }
    
    if (!formData.datum) {
      newErrors.datum = 'Bitte geben Sie ein Datum an';
    }
    
    if (!formData.startzeit) {
      newErrors.startzeit = 'Bitte geben Sie eine Startzeit an';
    }
    
    if (!formData.endzeit) {
      newErrors.endzeit = 'Bitte geben Sie eine Endzeit an';
    }
    
    if (formData.startzeit && formData.endzeit && formData.startzeit >= formData.endzeit) {
      newErrors.endzeit = 'Die Endzeit muss nach der Startzeit liegen';
    }
    
    if (!formData.taetigkeit || formData.taetigkeit.trim() === '') {
      newErrors.taetigkeit = 'Bitte beschreiben Sie die Tätigkeit';
    }
    
    if (calculatedHours <= 0) {
      newErrors.endzeit = 'Die berechnete Arbeitszeit muss größer als 0 sein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        arbeitsstunden: calculatedHours
      };
      
      if (entry?._id) {
        await api.put(`/zeiterfassung/${entry._id}`, submitData);
      } else {
        await api.post('/zeiterfassung', submitData);
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error saving time entry:', error);
      setErrors({ submit: 'Fehler beim Speichern. Bitte versuchen Sie es erneut.' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {entry ? 'Zeiteintrag bearbeiten' : 'Neuer Zeiteintrag'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Mitarbeiter
              </label>
              <select
                name="mitarbeiterId"
                value={formData.mitarbeiterId}
                onChange={handleChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.mitarbeiterId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">-- Bitte wählen --</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.vorname} {employee.nachname}
                  </option>
                ))}
              </select>
              {errors.mitarbeiterId && (
                <p className="mt-1 text-sm text-red-600">{errors.mitarbeiterId}</p>
              )}
            </div>
            
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Briefcase className="h-4 w-4 inline mr-1" />
                Projekt
              </label>
              <select
                name="projektId"
                value={formData.projektId}
                onChange={handleChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.projektId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">-- Bitte wählen --</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.auftraggeber?.name || 'Unbekannt'} - {
                      project.startDatum 
                        ? format(new Date(project.startDatum), 'dd.MM.yyyy')
                        : 'Kein Datum'
                    }
                  </option>
                ))}
              </select>
              {errors.projektId && (
                <p className="mt-1 text-sm text-red-600">{errors.projektId}</p>
              )}
            </div>
            
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                Datum
              </label>
              <input
                type="date"
                name="datum"
                value={formData.datum}
                onChange={handleChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.datum ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.datum && (
                <p className="mt-1 text-sm text-red-600">{errors.datum}</p>
              )}
            </div>
            
            {/* Break Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pause (Minuten)
              </label>
              <input
                type="number"
                name="pause"
                value={formData.pause}
                onChange={handleChange}
                min="0"
                step="5"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Startzeit
              </label>
              <input
                type="time"
                name="startzeit"
                value={formData.startzeit}
                onChange={handleChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.startzeit ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startzeit && (
                <p className="mt-1 text-sm text-red-600">{errors.startzeit}</p>
              )}
            </div>
            
            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Endzeit
              </label>
              <input
                type="time"
                name="endzeit"
                value={formData.endzeit}
                onChange={handleChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.endzeit ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endzeit && (
                <p className="mt-1 text-sm text-red-600">{errors.endzeit}</p>
              )}
            </div>
          </div>
          
          {/* Activity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-4 w-4 inline mr-1" />
              Tätigkeit
            </label>
            <input
              type="text"
              name="taetigkeit"
              value={formData.taetigkeit}
              onChange={handleChange}
              placeholder="z.B. Möbel verpacken, Transport durchführen..."
              className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                errors.taetigkeit ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.taetigkeit && (
              <p className="mt-1 text-sm text-red-600">{errors.taetigkeit}</p>
            )}
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen (optional)
            </label>
            <textarea
              name="notizen"
              value={formData.notizen}
              onChange={handleChange}
              rows={3}
              placeholder="Zusätzliche Informationen..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          {/* Calculated Hours Display */}
          {calculatedHours > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
              <p className="text-sm text-indigo-800">
                Berechnete Arbeitszeit: <span className="font-semibold">{calculatedHours.toFixed(2)} Stunden</span>
              </p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {entry ? 'Aktualisieren' : 'Erstellen'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
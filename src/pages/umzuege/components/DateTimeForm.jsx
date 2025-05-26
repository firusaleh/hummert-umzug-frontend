import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { format, addDays, isWeekend, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';

const DateTimeForm = ({ 
  startDatum, 
  endDatum, 
  onStartChange, 
  onEndChange,
  errors = {} 
}) => {
  // Get minimum date (today)
  const minDate = format(new Date(), 'yyyy-MM-dd');
  
  // Calculate suggested end date (next business day after start)
  const getSuggestedEndDate = (startDate) => {
    if (!startDate) return '';
    
    let endDate = new Date(startDate);
    endDate = addDays(endDate, 1);
    
    // Skip weekends
    while (isWeekend(endDate)) {
      endDate = addDays(endDate, 1);
    }
    
    return format(endDate, 'yyyy-MM-dd');
  };

  const handleStartDateChange = (value) => {
    onStartChange(value);
    
    // Auto-update end date if it's before the new start date
    if (value && endDatum && isBefore(new Date(endDatum), new Date(value))) {
      onEndChange(getSuggestedEndDate(value));
    }
    
    // Set suggested end date if no end date is set
    if (value && !endDatum) {
      onEndChange(getSuggestedEndDate(value));
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd. MMMM yyyy', { locale: de });
    } catch {
      return dateString;
    }
  };

  const getDayOfWeek = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'EEEE', { locale: de });
    } catch {
      return '';
    }
  };

  const isDateWeekend = (dateString) => {
    if (!dateString) return false;
    try {
      return isWeekend(new Date(dateString));
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-400" />
        Umzugstermin
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Startdatum <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDatum || ''}
              onChange={(e) => handleStartDateChange(e.target.value)}
              min={minDate}
              className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.startDatum ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {errors.startDatum && (
            <p className="mt-1 text-sm text-red-600">{errors.startDatum}</p>
          )}
          {startDatum && (
            <p className="mt-1 text-sm text-gray-500">
              {getDayOfWeek(startDatum)}
              {isDateWeekend(startDatum) && (
                <span className="ml-2 text-orange-600 font-medium">
                  (Wochenende - Zuschlag möglich)
                </span>
              )}
            </p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enddatum <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={endDatum || ''}
              onChange={(e) => onEndChange(e.target.value)}
              min={startDatum || minDate}
              className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.endDatum ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {errors.endDatum && (
            <p className="mt-1 text-sm text-red-600">{errors.endDatum}</p>
          )}
          {endDatum && (
            <p className="mt-1 text-sm text-gray-500">
              {getDayOfWeek(endDatum)}
              {isDateWeekend(endDatum) && (
                <span className="ml-2 text-orange-600 font-medium">
                  (Wochenende - Zuschlag möglich)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Time Slots */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Startzeit
          </label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              defaultValue="08:00"
            >
              <option value="06:00">06:00 Uhr</option>
              <option value="07:00">07:00 Uhr</option>
              <option value="08:00">08:00 Uhr</option>
              <option value="09:00">09:00 Uhr</option>
              <option value="10:00">10:00 Uhr</option>
              <option value="11:00">11:00 Uhr</option>
              <option value="12:00">12:00 Uhr</option>
              <option value="13:00">13:00 Uhr</option>
              <option value="14:00">14:00 Uhr</option>
              <option value="15:00">15:00 Uhr</option>
              <option value="16:00">16:00 Uhr</option>
              <option value="17:00">17:00 Uhr</option>
              <option value="18:00">18:00 Uhr</option>
            </select>
            <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Geschätzte Dauer
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            defaultValue="8"
          >
            <option value="2">2 Stunden</option>
            <option value="4">4 Stunden</option>
            <option value="6">6 Stunden</option>
            <option value="8">8 Stunden (1 Tag)</option>
            <option value="16">16 Stunden (2 Tage)</option>
            <option value="24">24 Stunden (3 Tage)</option>
            <option value="32">32 Stunden (4 Tage)</option>
            <option value="40">40 Stunden (5 Tage)</option>
          </select>
        </div>
      </div>

      {/* Date Summary */}
      {startDatum && endDatum && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Umzugszeitraum:</p>
              <p className="text-blue-700">
                {formatDateForDisplay(startDatum)} bis {formatDateForDisplay(endDatum)}
              </p>
              {startDatum === endDatum ? (
                <p className="text-blue-600 mt-1">Eintägiger Umzug geplant</p>
              ) : (
                <p className="text-blue-600 mt-1">
                  Mehrtägiger Umzug über {Math.ceil((new Date(endDatum) - new Date(startDatum)) / (1000 * 60 * 60 * 24)) + 1} Tage
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimeForm;
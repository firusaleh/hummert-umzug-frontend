import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Event,
  Schedule,
  Warning
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { de } from 'date-fns/locale';
import { format, isWeekend, addHours, startOfDay, setHours, setMinutes } from 'date-fns';

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
];

const DURATION_OPTIONS = [
  { value: 2, label: '2 Stunden' },
  { value: 4, label: '4 Stunden' },
  { value: 6, label: '6 Stunden' },
  { value: 8, label: '8 Stunden (1 Tag)' },
  { value: 12, label: '12 Stunden' },
  { value: 16, label: '16 Stunden (2 Tage)' },
  { value: 24, label: '24 Stunden (3 Tage)' }
];

const DateTimeForm = ({ 
  date,
  time,
  onChange,
  errors = {}
}) => {
  // Local state for form fields
  const [selectedDate, setSelectedDate] = useState(date || null);
  const [selectedTime, setSelectedTime] = useState(time || '08:00');
  const [duration, setDuration] = useState(8);
  const [endDate, setEndDate] = useState(null);
  const [endTime, setEndTime] = useState('17:00');

  // Update local state when props change
  useEffect(() => {
    if (date !== selectedDate) {
      setSelectedDate(date);
    }
    if (time !== selectedTime) {
      setSelectedTime(time || '08:00');
    }
  }, [date, time]);

  // Calculate end date/time based on start and duration
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = setMinutes(setHours(selectedDate, hours), minutes);
      const endDateTime = addHours(startDateTime, duration);
      
      setEndDate(endDateTime);
      setEndTime(format(endDateTime, 'HH:mm'));
    }
  }, [selectedDate, selectedTime, duration]);

  // Handle date change
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    
    // Call parent onChange with both date and time
    onChange({
      datum: newDate,
      zeit: selectedTime
    });
  };

  // Handle time change
  const handleTimeChange = (newTime) => {
    setSelectedTime(newTime);
    
    // Call parent onChange with both date and time
    onChange({
      datum: selectedDate,
      zeit: newTime
    });
  };

  // Handle duration change
  const handleDurationChange = (event) => {
    setDuration(event.target.value);
  };

  // Check if date is weekend
  const isDateWeekend = selectedDate && isWeekend(selectedDate);

  // Format date for display
  const formatDateDisplay = (date) => {
    if (!date) return '';
    return format(date, 'EEEE, dd. MMMM yyyy', { locale: de });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Event />
        Termin und Zeitplanung
      </Typography>

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
        <Grid container spacing={3}>
          {/* Date Selection */}
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Umzugsdatum"
              value={selectedDate}
              onChange={handleDateChange}
              format="dd.MM.yyyy"
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: Boolean(errors.datum),
                  helperText: errors.datum,
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday />
                      </InputAdornment>
                    )
                  }
                }
              }}
              minDate={new Date()}
            />
            
            {selectedDate && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatDateDisplay(selectedDate)}
                </Typography>
                {isDateWeekend && (
                  <Chip
                    size="small"
                    icon={<Warning />}
                    label="Wochenende - Zuschläge möglich"
                    color="warning"
                    sx={{ ml: 2 }}
                  />
                )}
              </Box>
            )}
          </Grid>

          {/* Start Time Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={Boolean(errors.zeit)}>
              <InputLabel>Startzeit</InputLabel>
              <Select
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                label="Startzeit"
                startAdornment={
                  <InputAdornment position="start">
                    <AccessTime />
                  </InputAdornment>
                }
              >
                {TIME_SLOTS.map((slot) => (
                  <MenuItem key={slot} value={slot}>
                    {slot} Uhr
                  </MenuItem>
                ))}
              </Select>
              {errors.zeit && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.zeit}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Duration Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Geschätzte Dauer</InputLabel>
              <Select
                value={duration}
                onChange={handleDurationChange}
                label="Geschätzte Dauer"
                startAdornment={
                  <InputAdornment position="start">
                    <Schedule />
                  </InputAdornment>
                }
              >
                {DURATION_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* End Time Display */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Voraussichtliches Ende"
              value={endDate ? `${format(endDate, 'dd.MM.yyyy')} um ${endTime} Uhr` : ''}
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Event />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Additional Time Options */}
          <Grid item xs={12}>
            <Alert severity="info" icon={<Schedule />}>
              <Typography variant="body2">
                <strong>Zeitplanung:</strong> Die angegebene Dauer ist eine Schätzung. 
                Bei Bedarf können zusätzliche Stunden vor Ort vereinbart werden.
              </Typography>
            </Alert>
          </Grid>

          {/* Summary */}
          {selectedDate && selectedTime && (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Zusammenfassung
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Start:
                    </Typography>
                    <Typography variant="body1">
                      {format(selectedDate, 'dd.MM.yyyy')} um {selectedTime} Uhr
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Voraussichtliches Ende:
                    </Typography>
                    <Typography variant="body1">
                      {endDate && format(endDate, 'dd.MM.yyyy')} um {endTime} Uhr
                    </Typography>
                  </Grid>
                  {duration >= 8 && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Mehrtägiger Umzug geplant ({Math.ceil(duration / 8)} Arbeitstage)
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </LocalizationProvider>
    </Paper>
  );
};

export default DateTimeForm;
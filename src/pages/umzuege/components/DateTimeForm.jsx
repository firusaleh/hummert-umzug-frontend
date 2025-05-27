import React from 'react';
import {
  Grid,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { de } from 'date-fns/locale';

const DateTimeForm = ({ startDate, endDate, onChange, errors }) => {
  const handleStartDateChange = (newDate) => {
    onChange({ 
      startDatum: newDate,
      // If end date is not set or is before start date, update it
      endDatum: (!endDate || newDate > endDate) ? newDate : endDate
    });
  };

  const handleEndDateChange = (newDate) => {
    onChange({ endDatum: newDate });
  };

  // Generate time slots for quick selection
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Termin festlegen
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Startdatum und -zeit"
              value={startDate}
              onChange={handleStartDateChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={!!errors.startDatum}
                  helperText={errors.startDatum}
                />
              )}
              ampm={false}
              inputFormat="dd.MM.yyyy HH:mm"
              minDateTime={new Date()}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DateTimePicker
              label="Enddatum und -zeit"
              value={endDate}
              onChange={handleEndDateChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={!!errors.endDatum}
                  helperText={errors.endDatum}
                />
              )}
              ampm={false}
              inputFormat="dd.MM.yyyy HH:mm"
              minDateTime={startDate || new Date()}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Tipp: Wählen Sie realistische Zeitfenster für den Umzug. Das Enddatum sollte die voraussichtliche Abschlusszeit des Umzugs sein.
            </Typography>
          </Grid>

          {/* Quick time selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Schnellauswahl für häufige Startzeiten:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['07:00', '08:00', '09:00', '10:00', '14:00'].map((time) => (
                <Button
                  key={time}
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const [hours, minutes] = time.split(':');
                    const newDate = startDate ? new Date(startDate) : new Date();
                    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    handleStartDateChange(newDate);
                  }}
                >
                  {time} Uhr
                </Button>
              ))}
            </Box>
          </Grid>

          {/* Duration estimate */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Geschätzte Dauer</InputLabel>
              <Select
                value=""
                onChange={(e) => {
                  if (startDate && e.target.value) {
                    const endDate = new Date(startDate);
                    endDate.setHours(endDate.getHours() + parseInt(e.target.value));
                    handleEndDateChange(endDate);
                  }
                }}
              >
                <MenuItem value="">Bitte wählen</MenuItem>
                <MenuItem value="2">2 Stunden</MenuItem>
                <MenuItem value="4">4 Stunden</MenuItem>
                <MenuItem value="6">6 Stunden</MenuItem>
                <MenuItem value="8">8 Stunden (Ganztags)</MenuItem>
                <MenuItem value="10">10 Stunden</MenuItem>
                <MenuItem value="12">12 Stunden</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Display calculated duration */}
          {startDate && endDate && (
            <Grid item xs={12}>
              <Alert severity="info">
                Geplante Dauer: {Math.round((endDate - startDate) / (1000 * 60 * 60))} Stunden
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default DateTimeForm;

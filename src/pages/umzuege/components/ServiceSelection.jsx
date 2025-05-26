import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Grid,
  Chip,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  LocalShipping,
  Build,
  Inventory,
  CleaningServices,
  AttachMoney
} from '@mui/icons-material';

const SERVICE_CATEGORIES = {
  transport: {
    label: 'Transport',
    icon: <LocalShipping />,
    services: [
      { id: 'umzug_standard', name: 'Standard Umzug', basePrice: 80, unit: 'Stunde' },
      { id: 'umzug_express', name: 'Express Umzug', basePrice: 120, unit: 'Stunde' },
      { id: 'transport_only', name: 'Nur Transport', basePrice: 60, unit: 'Stunde' },
      { id: 'moebeltransport', name: 'Möbeltransport', basePrice: 70, unit: 'Stunde' }
    ]
  },
  packing: {
    label: 'Verpackung',
    icon: <Inventory />,
    services: [
      { id: 'pack_full', name: 'Komplettverpackung', basePrice: 50, unit: 'Stunde' },
      { id: 'pack_partial', name: 'Teilverpackung', basePrice: 40, unit: 'Stunde' },
      { id: 'pack_fragile', name: 'Zerbrechliche Gegenstände', basePrice: 60, unit: 'Stunde' },
      { id: 'pack_materials', name: 'Verpackungsmaterial', basePrice: 2, unit: 'Karton' }
    ]
  },
  assembly: {
    label: 'Montage',
    icon: <Build />,
    services: [
      { id: 'furniture_assembly', name: 'Möbelmontage', basePrice: 45, unit: 'Stunde' },
      { id: 'furniture_disassembly', name: 'Möbeldemontage', basePrice: 40, unit: 'Stunde' },
      { id: 'kitchen_assembly', name: 'Küchenmontage', basePrice: 80, unit: 'Stunde' },
      { id: 'lamp_installation', name: 'Lampen installieren', basePrice: 25, unit: 'Stück' }
    ]
  },
  cleaning: {
    label: 'Reinigung',
    icon: <CleaningServices />,
    services: [
      { id: 'end_cleaning', name: 'Endreinigung', basePrice: 35, unit: 'Stunde' },
      { id: 'deep_cleaning', name: 'Grundreinigung', basePrice: 45, unit: 'Stunde' },
      { id: 'window_cleaning', name: 'Fensterreinigung', basePrice: 30, unit: 'Stunde' },
      { id: 'disposal', name: 'Entsorgung', basePrice: 50, unit: 'Fahrt' }
    ]
  }
};

const ServiceSelection = ({ services = [], onChange, errors = {} }) => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [customService, setCustomService] = useState({
    open: false,
    name: '',
    price: '',
    quantity: 1,
    unit: 'Stunde'
  });
  const [expandedCategory, setExpandedCategory] = useState('transport');

  useEffect(() => {
    // Initialize selected services from props
    if (services.length > 0) {
      const formatted = services.map(service => ({
        ...service,
        quantity: service.quantity || 1,
        totalPrice: service.price * (service.quantity || 1)
      }));
      setSelectedServices(formatted);
    }
  }, [services]);

  const handleServiceToggle = (category, service) => {
    const serviceId = `${category}_${service.id}`;
    const existing = selectedServices.find(s => s.id === serviceId);

    if (existing) {
      // Remove service
      const updated = selectedServices.filter(s => s.id !== serviceId);
      setSelectedServices(updated);
      onChange(updated);
    } else {
      // Add service
      const newService = {
        id: serviceId,
        category,
        name: service.name,
        basePrice: service.basePrice,
        price: service.basePrice,
        unit: service.unit,
        quantity: 1,
        totalPrice: service.basePrice
      };
      const updated = [...selectedServices, newService];
      setSelectedServices(updated);
      onChange(updated);
    }
  };

  const handleQuantityChange = (serviceId, quantity) => {
    const updated = selectedServices.map(service => {
      if (service.id === serviceId) {
        const qty = Math.max(1, parseInt(quantity) || 1);
        return {
          ...service,
          quantity: qty,
          totalPrice: service.price * qty
        };
      }
      return service;
    });
    setSelectedServices(updated);
    onChange(updated);
  };

  const handlePriceChange = (serviceId, price) => {
    const updated = selectedServices.map(service => {
      if (service.id === serviceId) {
        const newPrice = parseFloat(price) || 0;
        return {
          ...service,
          price: newPrice,
          totalPrice: newPrice * service.quantity
        };
      }
      return service;
    });
    setSelectedServices(updated);
    onChange(updated);
  };

  const handleAddCustomService = () => {
    if (customService.name && customService.price) {
      const newService = {
        id: `custom_${Date.now()}`,
        category: 'custom',
        name: customService.name,
        basePrice: parseFloat(customService.price),
        price: parseFloat(customService.price),
        unit: customService.unit,
        quantity: customService.quantity,
        totalPrice: parseFloat(customService.price) * customService.quantity
      };
      const updated = [...selectedServices, newService];
      setSelectedServices(updated);
      onChange(updated);
      
      // Reset form
      setCustomService({
        open: false,
        name: '',
        price: '',
        quantity: 1,
        unit: 'Stunde'
      });
    }
  };

  const handleRemoveService = (serviceId) => {
    const updated = selectedServices.filter(s => s.id !== serviceId);
    setSelectedServices(updated);
    onChange(updated);
  };

  const calculateTotal = () => {
    return selectedServices.reduce((sum, service) => sum + service.totalPrice, 0);
  };

  const isServiceSelected = (category, serviceId) => {
    return selectedServices.some(s => s.id === `${category}_${serviceId}`);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Zusätzliche Dienstleistungen
      </Typography>

      {/* Service Categories */}
      {Object.entries(SERVICE_CATEGORIES).map(([category, data]) => (
        <Accordion
          key={category}
          expanded={expandedCategory === category}
          onChange={() => setExpandedCategory(expandedCategory === category ? null : category)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {data.icon}
              <Typography>{data.label}</Typography>
              {selectedServices.filter(s => s.category === category).length > 0 && (
                <Chip 
                  size="small" 
                  label={selectedServices.filter(s => s.category === category).length}
                  color="primary"
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {data.services.map(service => (
                <Grid item xs={12} sm={6} key={service.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isServiceSelected(category, service.id)}
                        onChange={() => handleServiceToggle(category, service)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">{service.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ab {service.basePrice}€/{service.unit}
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Selected Services List */}
      {selectedServices.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Ausgewählte Dienstleistungen
          </Typography>
          <List>
            {selectedServices.map(service => (
              <ListItem key={service.id} divider>
                <ListItemText
                  primary={service.name}
                  secondary={
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField
                          size="small"
                          type="number"
                          label="Menge"
                          value={service.quantity}
                          onChange={(e) => handleQuantityChange(service.id, e.target.value)}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                {service.unit}
                              </InputAdornment>
                            )
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          size="small"
                          type="number"
                          label="Preis"
                          value={service.price}
                          onChange={(e) => handlePriceChange(service.id, e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">€</InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                /{service.unit}
                              </InputAdornment>
                            )
                          }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2">
                          Gesamt: {service.totalPrice.toFixed(2)}€
                        </Typography>
                      </Grid>
                    </Grid>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => handleRemoveService(service.id)}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {/* Total */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <Typography variant="h6">
                  Gesamtpreis Zusatzleistungen:
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="h5" color="primary">
                  {calculateTotal().toFixed(2)}€
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* Add Custom Service Button */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setCustomService({ ...customService, open: true })}
        >
          Individuelle Dienstleistung hinzufügen
        </Button>
      </Box>

      {/* Custom Service Dialog */}
      <Dialog 
        open={customService.open} 
        onClose={() => setCustomService({ ...customService, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Individuelle Dienstleistung</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Bezeichnung"
                value={customService.name}
                onChange={(e) => setCustomService({ ...customService, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Preis"
                type="number"
                value={customService.price}
                onChange={(e) => setCustomService({ ...customService, price: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>
                }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Einheit</InputLabel>
                <Select
                  value={customService.unit}
                  onChange={(e) => setCustomService({ ...customService, unit: e.target.value })}
                  label="Einheit"
                >
                  <MenuItem value="Stunde">Stunde</MenuItem>
                  <MenuItem value="Stück">Stück</MenuItem>
                  <MenuItem value="Pauschal">Pauschal</MenuItem>
                  <MenuItem value="m²">m²</MenuItem>
                  <MenuItem value="km">km</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Menge"
                type="number"
                value={customService.quantity}
                onChange={(e) => setCustomService({ ...customService, quantity: parseInt(e.target.value) || 1 })}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomService({ ...customService, open: false })}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleAddCustomService} 
            variant="contained"
            disabled={!customService.name || !customService.price}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>

      {errors.services && (
        <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
          {errors.services}
        </Typography>
      )}
    </Paper>
  );
};

export default ServiceSelection;
// Configuration Service for fetching dynamic options from API
import api from './api';

// Cache for configuration data to avoid repeated API calls
const configCache = {
  umzugStatuses: null,
  paymentMethods: null,
  employeePositions: null,
  employeeSkills: null,
  employeeRoles: null,
  vehicleTypes: null,
  vehicleStatuses: null,
  licenseClasses: null,
  cacheTimestamp: null,
  cacheTimeout: 3600000 // 1 hour in milliseconds
};

// Helper to check if cache is valid
const isCacheValid = () => {
  if (!configCache.cacheTimestamp) return false;
  return Date.now() - configCache.cacheTimestamp < configCache.cacheTimeout;
};

// Configuration Service
const configService = {
  // Clear cache
  clearCache() {
    Object.keys(configCache).forEach(key => {
      if (key !== 'cacheTimeout') {
        configCache[key] = null;
      }
    });
  },

  // Get all configurations at once
  async getAllConfigs() {
    if (isCacheValid() && configCache.umzugStatuses) {
      return {
        umzugStatuses: configCache.umzugStatuses,
        paymentMethods: configCache.paymentMethods,
        employeePositions: configCache.employeePositions,
        employeeSkills: configCache.employeeSkills,
        employeeRoles: configCache.employeeRoles,
        vehicleTypes: configCache.vehicleTypes,
        vehicleStatuses: configCache.vehicleStatuses,
        licenseClasses: configCache.licenseClasses
      };
    }

    try {
      const response = await api.get('/config/all');
      const data = response.data;
      
      // Update cache
      configCache.umzugStatuses = data.umzugStatuses;
      configCache.paymentMethods = data.paymentMethods;
      configCache.employeePositions = data.employeePositions;
      configCache.employeeSkills = data.employeeSkills;
      configCache.employeeRoles = data.employeeRoles;
      configCache.vehicleTypes = data.vehicleTypes;
      configCache.vehicleStatuses = data.vehicleStatuses;
      configCache.licenseClasses = data.licenseClasses;
      configCache.cacheTimestamp = Date.now();
      
      return data;
    } catch (error) {
      // Fallback to hardcoded values if API fails
      return this.getDefaultConfigs();
    }
  },

  // Get Umzug statuses
  async getUmzugStatuses() {
    if (isCacheValid() && configCache.umzugStatuses) {
      return configCache.umzugStatuses;
    }

    try {
      const response = await api.get('/config/umzug-statuses');
      configCache.umzugStatuses = response.data;
      configCache.cacheTimestamp = Date.now();
      return response.data;
    } catch (error) {
      // Fallback to hardcoded values
      return ['geplant', 'bestaetigt', 'in_bearbeitung', 'abgeschlossen', 'storniert'];
    }
  },

  // Get payment methods
  async getPaymentMethods() {
    if (isCacheValid() && configCache.paymentMethods) {
      return configCache.paymentMethods;
    }

    try {
      const response = await api.get('/config/payment-methods');
      configCache.paymentMethods = response.data;
      configCache.cacheTimestamp = Date.now();
      return response.data;
    } catch (error) {
      // Fallback to hardcoded values
      return ['rechnung', 'bar', 'ueberweisung', 'ec', 'kreditkarte', 'paypal'];
    }
  },

  // Get employee positions
  async getEmployeePositions() {
    if (isCacheValid() && configCache.employeePositions) {
      return configCache.employeePositions;
    }

    try {
      const response = await api.get('/config/employee-positions');
      configCache.employeePositions = response.data;
      configCache.cacheTimestamp = Date.now();
      return response.data;
    } catch (error) {
      // Fallback to hardcoded values
      return [
        'Teamleiter',
        'Packer',
        'Fahrer',
        'Aufnahmespezialist',
        'Disponent',
        'Lagerarbeiter',
        'Monteur',
        'Helfer',
        'Auszubildender',
        'Praktikant'
      ];
    }
  },

  // Get employee skills
  async getEmployeeSkills() {
    if (isCacheValid() && configCache.employeeSkills) {
      return configCache.employeeSkills;
    }

    try {
      const response = await api.get('/config/employee-skills');
      configCache.employeeSkills = response.data;
      configCache.cacheTimestamp = Date.now();
      return response.data;
    } catch (error) {
      // Fallback to hardcoded values
      return [
        'Umzugsplanung',
        'Teamführung',
        'Führerschein Klasse B',
        'Führerschein Klasse C',
        'Führerschein Klasse CE',
        'Möbelmontage',
        'Klaviertransport',
        'Verpackung',
        'Lagerorganisation',
        'Kundenbetreuung',
        'Gefahrguttransport',
        'Schwerlasttransport',
        'Elektroarbeiten',
        'IT-Kenntnisse'
      ];
    }
  },

  // Get employee roles
  async getEmployeeRoles() {
    if (isCacheValid() && configCache.employeeRoles) {
      return configCache.employeeRoles;
    }

    try {
      const response = await api.get('/config/employee-roles');
      configCache.employeeRoles = response.data;
      configCache.cacheTimestamp = Date.now();
      return response.data;
    } catch (error) {
      // Fallback to hardcoded values
      return ['fahrer', 'helfer', 'teamleiter', 'träger'];
    }
  },

  // Get vehicle types
  async getVehicleTypes() {
    if (isCacheValid() && configCache.vehicleTypes) {
      return configCache.vehicleTypes;
    }

    try {
      const response = await api.get('/config/vehicle-types');
      configCache.vehicleTypes = response.data;
      configCache.cacheTimestamp = Date.now();
      return response.data;
    } catch (error) {
      // Fallback to hardcoded values
      return ['LKW', 'Transporter', 'PKW', 'Anhänger', 'Sonstige'];
    }
  },

  // Get vehicle statuses
  async getVehicleStatuses() {
    if (isCacheValid() && configCache.vehicleStatuses) {
      return configCache.vehicleStatuses;
    }

    try {
      const response = await api.get('/config/vehicle-statuses');
      configCache.vehicleStatuses = response.data;
      configCache.cacheTimestamp = Date.now();
      return response.data;
    } catch (error) {
      // Fallback to hardcoded values
      return ['Verfügbar', 'Im Einsatz', 'In Wartung', 'Defekt', 'Außer Dienst'];
    }
  },

  // Get license classes
  async getLicenseClasses() {
    if (isCacheValid() && configCache.licenseClasses) {
      return configCache.licenseClasses;
    }

    try {
      const response = await api.get('/config/license-classes');
      configCache.licenseClasses = response.data;
      configCache.cacheTimestamp = Date.now();
      return response.data;
    } catch (error) {
      // Fallback to hardcoded values
      return ['B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D1', 'D1E', 'D', 'DE'];
    }
  },

  // Get default configurations (hardcoded fallback)
  getDefaultConfigs() {
    return {
      umzugStatuses: ['geplant', 'bestaetigt', 'in_bearbeitung', 'abgeschlossen', 'storniert'],
      paymentMethods: ['rechnung', 'bar', 'ueberweisung', 'ec', 'kreditkarte', 'paypal'],
      employeePositions: [
        'Teamleiter',
        'Packer',
        'Fahrer',
        'Aufnahmespezialist',
        'Disponent',
        'Lagerarbeiter',
        'Monteur',
        'Helfer',
        'Auszubildender',
        'Praktikant'
      ],
      employeeSkills: [
        'Umzugsplanung',
        'Teamführung',
        'Führerschein Klasse B',
        'Führerschein Klasse C',
        'Führerschein Klasse CE',
        'Möbelmontage',
        'Klaviertransport',
        'Verpackung',
        'Lagerorganisation',
        'Kundenbetreuung',
        'Gefahrguttransport',
        'Schwerlasttransport',
        'Elektroarbeiten',
        'IT-Kenntnisse'
      ],
      employeeRoles: ['fahrer', 'helfer', 'teamleiter', 'träger'],
      vehicleTypes: ['LKW', 'Transporter', 'PKW', 'Anhänger', 'Sonstige'],
      vehicleStatuses: ['Verfügbar', 'Im Einsatz', 'In Wartung', 'Defekt', 'Außer Dienst'],
      licenseClasses: ['B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D1', 'D1E', 'D', 'DE']
    };
  }
};

export default configService;
import React, { useState, useEffect } from 'react';
import { 
  Person as User, 
  Email as Mail, 
  Phone, 
  Search, 
  Add as Plus, 
  Check 
} from '@mui/icons-material';
import { clientService } from '../../../services/api';
import { extractArrayData } from '../../../utils/responseUtils';

const CustomerForm = ({ 
  customer, 
  onChange, 
  errors = {},
  prefix = "auftraggeber"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Search for existing customers
  const searchCustomers = async (term) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await clientService.getAll({ search: term });
      const customers = extractArrayData(response);
      setSearchResults(customers.slice(0, 5)); // Show max 5 results
    } catch (error) {
      console.error('Error searching customers:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchCustomers(searchTerm);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectCustomer = (selectedCustomer) => {
    onChange({
      id: selectedCustomer._id,
      name: selectedCustomer.name,
      telefon: selectedCustomer.telefon || selectedCustomer.phone,
      email: selectedCustomer.email,
      adresse: selectedCustomer.adresse
    });
    setShowSearch(false);
    setSearchTerm('');
    setIsNewCustomer(false);
  };

  const handleChange = (field, value) => {
    onChange({
      ...(customer || {}),
      [field]: value
    });
  };

  const getFieldName = (field) => `${prefix}.${field}`;
  const getError = (field) => errors[getFieldName(field)];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Kundeninformationen
        </h3>
        
        <div className="flex items-center gap-2">
          {!isNewCustomer && (
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Search className="h-4 w-4" />
              Kunde suchen
            </button>
          )}
          
          <button
            type="button"
            onClick={() => {
              setIsNewCustomer(!isNewCustomer);
              setShowSearch(false);
              if (!isNewCustomer) {
                // Clear customer data for new customer
                onChange({
                  name: '',
                  telefon: '',
                  email: '',
                  adresse: null
                });
              }
            }}
            className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            {isNewCustomer ? (
              <>
                <Check className="h-4 w-4" />
                Neuer Kunde
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Neuer Kunde
              </>
            )}
          </button>
        </div>
      </div>

      {/* Customer Search */}
      {showSearch && (
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, Email oder Telefon eingeben..."
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {searchResults.map((result) => (
                <button
                  key={result._id}
                  type="button"
                  onClick={() => handleSelectCustomer(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{result.name}</div>
                  <div className="text-sm text-gray-500">
                    {result.email} • {result.telefon || result.phone}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {searching && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-500">Suche läuft...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={customer?.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              getError('name') ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Max Mustermann"
          />
          {getError('name') && (
            <p className="mt-1 text-sm text-red-600">{getError('name')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              value={customer?.telefon || ''}
              onChange={(e) => handleChange('telefon', e.target.value)}
              className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                getError('telefon') ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+49 123 456789"
            />
            <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {getError('telefon') && (
            <p className="mt-1 text-sm text-red-600">{getError('telefon')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              value={customer?.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                getError('email') ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="max@example.com"
            />
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {getError('email') && (
            <p className="mt-1 text-sm text-red-600">{getError('email')}</p>
          )}
        </div>

        {/* Additional customer fields can be added here */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anmerkungen
          </label>
          <textarea
            value={customer?.anmerkungen || ''}
            onChange={(e) => handleChange('anmerkungen', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Besondere Hinweise zum Kunden..."
          />
        </div>
      </div>

      {customer?.id && (
        <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
          <Check className="h-4 w-4" />
          Bestehender Kunde ausgewählt
        </div>
      )}
    </div>
  );
};

export default CustomerForm;
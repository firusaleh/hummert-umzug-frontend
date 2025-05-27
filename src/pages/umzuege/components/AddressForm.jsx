import React from 'react';
import { 
  LocationOn as MapPin, 
  Home, 
  Business as Building, 
  Navigation 
} from '@mui/icons-material';

const AddressForm = ({ 
  address, 
  onChange, 
  errors = {}, 
  title = "Adresse",
  prefix = "",
  required = true 
}) => {
  const handleChange = (field, value) => {
    onChange({
      ...(address || {}),
      [field]: value
    });
  };

  const getFieldName = (field) => prefix ? `${prefix}.${field}` : field;
  const getError = (field) => errors[getFieldName(field)];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-gray-400" />
        {title}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Street and House Number */}
        <div className="md:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Straße {required && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address?.strasse || ''}
                  onChange={(e) => handleChange('strasse', e.target.value)}
                  className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    getError('strasse') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Musterstraße"
                />
                <Navigation className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {getError('strasse') && (
                <p className="mt-1 text-sm text-red-600">{getError('strasse')}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hausnr. {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={address?.hausnummer || ''}
                onChange={(e) => handleChange('hausnummer', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  getError('hausnummer') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="123a"
              />
              {getError('hausnummer') && (
                <p className="mt-1 text-sm text-red-600">{getError('hausnummer')}</p>
              )}
            </div>
          </div>
        </div>

        {/* PLZ and City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PLZ {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={address?.plz || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
              handleChange('plz', value);
            }}
            maxLength="5"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              getError('plz') ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="12345"
          />
          {getError('plz') && (
            <p className="mt-1 text-sm text-red-600">{getError('plz')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ort {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={address?.ort || ''}
            onChange={(e) => handleChange('ort', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              getError('ort') ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Berlin"
          />
          {getError('ort') && (
            <p className="mt-1 text-sm text-red-600">{getError('ort')}</p>
          )}
        </div>

        {/* Floor and Elevator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Etage
          </label>
          <div className="relative">
            <input
              type="number"
              value={address?.etage || 0}
              onChange={(e) => handleChange('etage', parseInt(e.target.value) || 0)}
              min="0"
              max="50"
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
            <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aufzug vorhanden?
          </label>
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={address?.aufzug || false}
                onChange={(e) => handleChange('aufzug', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Ja, Aufzug vorhanden</span>
            </label>
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Land
          </label>
          <input
            type="text"
            value={address?.land || 'Deutschland'}
            onChange={(e) => handleChange('land', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Deutschland"
          />
        </div>

        {/* Distance to truck parking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entfernung zum LKW (m)
          </label>
          <input
            type="number"
            value={address?.entfernung || 0}
            onChange={(e) => handleChange('entfernung', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            placeholder="0"
          />
        </div>

        {/* Additional Info */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zusätzliche Informationen
          </label>
          <textarea
            value={address?.zusatzinfo || ''}
            onChange={(e) => handleChange('zusatzinfo', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. Hinterhof, 2. Aufgang rechts..."
          />
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
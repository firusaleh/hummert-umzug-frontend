import React, { useState, useEffect } from 'react';
import { Users, Truck, UserCheck, AlertCircle, Calendar, X } from 'lucide-react';
import { mitarbeiterService, vehicleService } from '../../../services/api';
import { extractArrayData } from '../../../utils/responseUtils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const TeamAssignment = ({ 
  selectedMitarbeiter = [], 
  selectedFahrzeuge = [], 
  onMitarbeiterChange,
  onFahrzeugeChange,
  startDatum,
  endDatum,
  errors = {}
}) => {
  const [verfuegbareMitarbeiter, setVerfuegbareMitarbeiter] = useState([]);
  const [verfuegbareFahrzeuge, setVerfuegbareFahrzeuge] = useState([]);
  const [loadingMitarbeiter, setLoadingMitarbeiter] = useState(true);
  const [loadingFahrzeuge, setLoadingFahrzeuge] = useState(true);
  const [activeTab, setActiveTab] = useState('mitarbeiter');

  // Fetch available employees
  useEffect(() => {
    const fetchMitarbeiter = async () => {
      try {
        const response = await mitarbeiterService.getAll({ 
          status: 'Aktiv',
          verfuegbar: true 
        });
        const mitarbeiter = extractArrayData(response);
        setVerfuegbareMitarbeiter(mitarbeiter);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setVerfuegbareMitarbeiter([]);
      } finally {
        setLoadingMitarbeiter(false);
      }
    };

    fetchMitarbeiter();
  }, [startDatum, endDatum]);

  // Fetch available vehicles
  useEffect(() => {
    const fetchFahrzeuge = async () => {
      try {
        const response = await vehicleService.getAll({ 
          verfuegbar: true 
        });
        const fahrzeuge = extractArrayData(response);
        setVerfuegbareFahrzeuge(fahrzeuge);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        setVerfuegbareFahrzeuge([]);
      } finally {
        setLoadingFahrzeuge(false);
      }
    };

    fetchFahrzeuge();
  }, [startDatum, endDatum]);

  const toggleMitarbeiter = (mitarbeiter) => {
    const isSelected = selectedMitarbeiter.some(m => m._id === mitarbeiter._id);
    
    if (isSelected) {
      onMitarbeiterChange(selectedMitarbeiter.filter(m => m._id !== mitarbeiter._id));
    } else {
      onMitarbeiterChange([...selectedMitarbeiter, {
        _id: mitarbeiter._id,
        name: `${mitarbeiter.vorname} ${mitarbeiter.nachname}`,
        position: mitarbeiter.position,
        rolle: 'Helfer' // Default role
      }]);
    }
  };

  const toggleFahrzeug = (fahrzeug) => {
    const isSelected = selectedFahrzeuge.some(f => f._id === fahrzeug._id);
    
    if (isSelected) {
      onFahrzeugeChange(selectedFahrzeuge.filter(f => f._id !== fahrzeug._id));
    } else {
      onFahrzeugeChange([...selectedFahrzeuge, {
        _id: fahrzeug._id,
        kennzeichen: fahrzeug.kennzeichen,
        typ: fahrzeug.typ,
        ladekapazitaet: fahrzeug.ladekapazitaet
      }]);
    }
  };

  const updateMitarbeiterRole = (mitarbeiterId, rolle) => {
    onMitarbeiterChange(
      selectedMitarbeiter.map(m => 
        m._id === mitarbeiterId ? { ...m, rolle } : m
      )
    );
  };

  const removeMitarbeiter = (mitarbeiterId) => {
    onMitarbeiterChange(selectedMitarbeiter.filter(m => m._id !== mitarbeiterId));
  };

  const removeFahrzeug = (fahrzeugId) => {
    onFahrzeugeChange(selectedFahrzeuge.filter(f => f._id !== fahrzeugId));
  };

  const getAvailabilityStatus = (mitarbeiter) => {
    // In a real app, this would check against actual availability data
    return {
      available: true,
      reason: null
    };
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Team & Fahrzeuge</h3>

      {/* Date Context */}
      {startDatum && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            Für den Zeitraum: {format(new Date(startDatum), 'dd. MMM yyyy', { locale: de })}
            {endDatum && startDatum !== endDatum && ` - ${format(new Date(endDatum), 'dd. MMM yyyy', { locale: de })}`}
          </span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('mitarbeiter')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mitarbeiter'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mitarbeiter ({selectedMitarbeiter.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('fahrzeuge')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fahrzeuge'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Fahrzeuge ({selectedFahrzeuge.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Mitarbeiter Tab */}
      {activeTab === 'mitarbeiter' && (
        <div className="space-y-4">
          {/* Selected Mitarbeiter */}
          {selectedMitarbeiter.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ausgewählte Mitarbeiter</h4>
              <div className="space-y-2">
                {selectedMitarbeiter.map((mitarbeiter) => (
                  <div key={mitarbeiter._id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{mitarbeiter.name}</p>
                          <p className="text-sm text-gray-600">{mitarbeiter.position}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={mitarbeiter.rolle}
                          onChange={(e) => updateMitarbeiterRole(mitarbeiter._id, e.target.value)}
                          className="text-sm px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="Teamleiter">Teamleiter</option>
                          <option value="Fahrer">Fahrer</option>
                          <option value="Helfer">Helfer</option>
                          <option value="Praktikant">Praktikant</option>
                        </select>
                        <button
                          onClick={() => removeMitarbeiter(mitarbeiter._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Mitarbeiter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Verfügbare Mitarbeiter</h4>
            {loadingMitarbeiter ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : verfuegbareMitarbeiter.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {verfuegbareMitarbeiter.map((mitarbeiter) => {
                  const isSelected = selectedMitarbeiter.some(m => m._id === mitarbeiter._id);
                  const availability = getAvailabilityStatus(mitarbeiter);
                  
                  return (
                    <button
                      key={mitarbeiter._id}
                      onClick={() => toggleMitarbeiter(mitarbeiter)}
                      disabled={!availability.available}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : availability.available
                          ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {mitarbeiter.vorname} {mitarbeiter.nachname}
                          </p>
                          <p className="text-sm text-gray-600">{mitarbeiter.position}</p>
                        </div>
                        {!availability.available && (
                          <span className="text-xs text-red-600">{availability.reason}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>Keine verfügbaren Mitarbeiter gefunden</p>
              </div>
            )}
          </div>

          {errors.mitarbeiter && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-600">{errors.mitarbeiter}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fahrzeuge Tab */}
      {activeTab === 'fahrzeuge' && (
        <div className="space-y-4">
          {/* Selected Fahrzeuge */}
          {selectedFahrzeuge.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ausgewählte Fahrzeuge</h4>
              <div className="space-y-2">
                {selectedFahrzeuge.map((fahrzeug) => (
                  <div key={fahrzeug._id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">{fahrzeug.kennzeichen}</p>
                          <p className="text-sm text-gray-600">
                            {fahrzeug.typ} • {fahrzeug.ladekapazitaet}m³
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFahrzeug(fahrzeug._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Fahrzeuge */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Verfügbare Fahrzeuge</h4>
            {loadingFahrzeuge ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : verfuegbareFahrzeuge.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {verfuegbareFahrzeuge.map((fahrzeug) => {
                  const isSelected = selectedFahrzeuge.some(f => f._id === fahrzeug._id);
                  
                  return (
                    <button
                      key={fahrzeug._id}
                      onClick={() => toggleFahrzeug(fahrzeug)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{fahrzeug.kennzeichen}</p>
                          <p className="text-sm text-gray-600">
                            {fahrzeug.typ} • {fahrzeug.ladekapazitaet}m³
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {fahrzeug.kilometerstand?.toLocaleString()} km
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Truck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>Keine verfügbaren Fahrzeuge gefunden</p>
              </div>
            )}
          </div>

          {errors.fahrzeuge && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-600">{errors.fahrzeuge}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamAssignment;
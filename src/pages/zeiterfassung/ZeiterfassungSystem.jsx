// src/pages/zeiterfassung/ZeiterfassungSystem.jsx - Enhanced with security fixes and error handling
import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Check, Plus, Edit, Trash2, Search, User, Users, Briefcase } from 'lucide-react';
import { zeiterfassungService } from '../../services/api';

export default function ZeiterfassungSystem() {
  // State für Daten
  const [mitarbeiter, setMitarbeiter] = useState([]);
  const [umzugsprojekte, setUmzugsprojekte] = useState([]);
  const [zeiterfassungen, setZeiterfassungen] = useState([]);
  const [aktuellesProjekt, setAktuellesProjekt] = useState('');
  const [formular, setFormular] = useState({
    mitarbeiterId: '',
    projektId: '',
    datum: new Date().toISOString().split('T')[0],
    startzeit: '',
    endzeit: '',
    pause: '30',
    taetigkeit: '',
    notizen: ''
  });
  const [bearbeitungId, setBearbeitungId] = useState(null);
  const [aktiverMitarbeiter, setAktiverMitarbeiter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Lade Daten beim Komponenten-Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Laden der Mitarbeiter
        const mitarbeiterResponse = await zeiterfassungService.getMitarbeiter();
        if (mitarbeiterResponse.success === false) {
          throw new Error(mitarbeiterResponse.message || 'Fehler beim Laden der Mitarbeiter');
        }
        
        // Extract mitarbeiter data from the response
        // Backend route /zeiterfassung/mitarbeiter returns the data directly in response.data
        const mitarbeiterData = mitarbeiterResponse.data || [];
        console.log('Mitarbeiter geladen:', mitarbeiterData);
        setMitarbeiter(Array.isArray(mitarbeiterData) ? mitarbeiterData : []);
        
        // Laden der Umzugsprojekte
        const projekteResponse = await zeiterfassungService.getUmzugsprojekte();
        if (projekteResponse.success === false) {
          throw new Error(projekteResponse.message || 'Fehler beim Laden der Projekte');
        }
        
        // Extract umzuege data from the response
        // Backend route /zeiterfassung/projekte returns the data directly in response.data
        const projekteData = projekteResponse.data || [];
        console.log('Projekte geladen:', projekteData);
        setUmzugsprojekte(Array.isArray(projekteData) ? projekteData : []);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        setError(`Fehler beim Laden der Mitarbeiter und Projekte: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Lade Zeiterfassungen wenn ein Projekt ausgewählt wurde
  useEffect(() => {
    const fetchZeiterfassungen = async () => {
      if (!aktuellesProjekt) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const zeiterfassungenResponse = await zeiterfassungService.getZeiterfassungen(aktuellesProjekt);
        if (zeiterfassungenResponse.success === false) {
          throw new Error(zeiterfassungenResponse.message || 'Fehler beim Laden der Zeiterfassungen');
        }
        
        // Extract time entries data from the response
        // Backend route /zeiterfassung/projekt/:projektId returns the data directly in response.data
        const zeiterfassungenData = zeiterfassungenResponse.data || [];
        console.log('Zeiterfassungen geladen:', zeiterfassungenData);
        setZeiterfassungen(Array.isArray(zeiterfassungenData) ? zeiterfassungenData : []);
      } catch (error) {
        console.error('Fehler beim Laden der Zeiterfassungen:', error);
        setError(`Die Zeiterfassungen konnten nicht geladen werden: ${error.message}`);
        setZeiterfassungen([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchZeiterfassungen();
  }, [aktuellesProjekt]);
  
  // Berechne Arbeitsstunden
  const berechneArbeitsstunden = (start, end, pauseMinuten) => {
    try {
      if (!start || !end) return 0;
      
      const [startHours, startMinutes] = start.split(':').map(Number);
      const [endHours, endMinutes] = end.split(':').map(Number);
      
      const startZeit = startHours * 60 + startMinutes;
      const endZeit = endHours * 60 + endMinutes;
      
      const arbeitszeitMinuten = endZeit - startZeit - pauseMinuten;
      
      return Math.max(0, arbeitszeitMinuten / 60);
    } catch (error) {
      return 0;
    }
  };
  
  // Formular zurücksetzen
  const resetForm = () => {
    setFormular({
      mitarbeiterId: '',
      // Always set projektId to the current selected project
      projektId: aktuellesProjekt,
      datum: new Date().toISOString().split('T')[0],
      startzeit: '',
      endzeit: '',
      pause: '30',
      taetigkeit: '',
      notizen: ''
    });
    setBearbeitungId(null);
  };
  
  // Zeiterfassung laden zum Bearbeiten
  const handleBearbeiten = (id) => {
    try {
      const zeiterfassung = zeiterfassungen.find(z => z._id === id);
      
      if (zeiterfassung) {
        setFormular({
          mitarbeiterId: zeiterfassung.mitarbeiterId._id,
          projektId: zeiterfassung.projektId,
          datum: zeiterfassung.datum,
          startzeit: zeiterfassung.startzeit,
          endzeit: zeiterfassung.endzeit,
          pause: zeiterfassung.pause.toString(),
          taetigkeit: zeiterfassung.taetigkeit,
          notizen: zeiterfassung.notizen || ''
        });
        
        setBearbeitungId(id);
      }
    } catch (error) {
      setError('Fehler beim Laden der Zeiterfassung.');
    }
  };
  
  // Zeiterfassung speichern
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form before submission
      if (!formular.mitarbeiterId) {
        throw new Error('Bitte wählen Sie einen Mitarbeiter aus');
      }
      
      if (!formular.startzeit || !formular.endzeit) {
        throw new Error('Bitte geben Sie Start- und Endzeit an');
      }
      
      if (!formular.taetigkeit) {
        throw new Error('Bitte geben Sie eine Tätigkeit an');
      }
      
      if (!aktuellesProjekt) {
        throw new Error('Bitte wählen Sie zuerst ein Projekt aus');
      }
      
      const arbeitsstunden = berechneArbeitsstunden(
        formular.startzeit,
        formular.endzeit,
        parseInt(formular.pause, 10)
      );
      
      // Check if the calculated hours make sense
      if (arbeitsstunden <= 0) {
        throw new Error('Die Arbeitszeit muss größer als 0 sein. Bitte prüfen Sie Start- und Endzeit sowie Pause.');
      }
      
      // Ensure projektId is set to the current project
      const zeiterfassungDaten = {
        ...formular,
        projektId: aktuellesProjekt, // Make sure this is set correctly
        pause: parseInt(formular.pause, 10),
        arbeitsstunden
      };
      
      console.log('Speichere Zeiterfassung:', zeiterfassungDaten);
      
      setLoading(true);
      setError(null);
      
      let submitResponse;
      
      if (bearbeitungId) {
        // Update einer bestehenden Zeiterfassung
        submitResponse = await zeiterfassungService.updateZeiterfassung(bearbeitungId, zeiterfassungDaten);
        if (submitResponse.success === false) {
          throw new Error(submitResponse.message || 'Fehler beim Aktualisieren der Zeiterfassung');
        }
        console.log('Zeiterfassung aktualisiert:', submitResponse);
      } else {
        // Erstellen einer neuen Zeiterfassung
        submitResponse = await zeiterfassungService.addZeiterfassung(zeiterfassungDaten);
        if (submitResponse.success === false) {
          throw new Error(submitResponse.message || 'Fehler beim Erstellen der Zeiterfassung');
        }
        console.log('Zeiterfassung erstellt:', submitResponse);
      }
      
      // Lade aktualisierte Daten vom Server
      // Make sure we reload the data from the server after adding/updating
      const response = await zeiterfassungService.getZeiterfassungen(aktuellesProjekt);
      if (response.success === false) {
        throw new Error(response.message || 'Fehler beim Laden der aktualisierten Zeiterfassungen');
      }
      
      // Extract updated time entries - the backend returns the list directly
      const zeiterfassungenData = response.data || [];
      console.log('Aktualisierte Zeiterfassungen geladen:', zeiterfassungenData);
      setZeiterfassungen(Array.isArray(zeiterfassungenData) ? zeiterfassungenData : []);
      
      // Formular zurücksetzen
      resetForm();
      
      // Erfolgsbenachrichtigung
      alert(bearbeitungId ? 'Zeiterfassung erfolgreich aktualisiert!' : 'Zeiterfassung erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern der Zeiterfassung:', error);
      setError(`Die Zeiterfassung konnte nicht gespeichert werden: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Zeiterfassung löschen
  const handleLoeschen = async (id) => {
    if (window.confirm('Möchten Sie diese Zeiterfassung wirklich löschen?')) {
      setLoading(true);
      setError(null);
      
      try {
        const deleteResponse = await zeiterfassungService.deleteZeiterfassung(id);
        if (deleteResponse.success === false) {
          throw new Error(deleteResponse.message || 'Fehler beim Löschen der Zeiterfassung');
        }
        
        console.log('Zeiterfassung gelöscht:', deleteResponse);
        
        // Lade aktualisierte Daten vom Server
        const response = await zeiterfassungService.getZeiterfassungen(aktuellesProjekt);
        if (response.success === false) {
          throw new Error(response.message || 'Fehler beim Laden der aktualisierten Zeiterfassungen');
        }
        
        // Extract updated time entries
        const zeiterfassungenData = response.data || [];
        console.log('Aktualisierte Zeiterfassungen nach Löschen:', zeiterfassungenData);
        setZeiterfassungen(Array.isArray(zeiterfassungenData) ? zeiterfassungenData : []);
                            
        // Erfolgsbenachrichtigung
        alert('Zeiterfassung erfolgreich gelöscht!');
      } catch (error) {
        console.error('Fehler beim Löschen der Zeiterfassung:', error);
        setError(`Die Zeiterfassung konnte nicht gelöscht werden: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Mitarbeiterfilter anwenden
  const handleMitarbeiterFilter = (mitarbeiterId) => {
    setAktiverMitarbeiter(mitarbeiterId === aktiverMitarbeiter ? '' : mitarbeiterId);
  };
  
  // Gefilterte Zeiterfassungen
  const getFilteredZeiterfassungen = () => {
    if (!aktiverMitarbeiter) {
      return zeiterfassungen;
    }
    
    return zeiterfassungen.filter(z => z.mitarbeiterId._id === aktiverMitarbeiter);
  };
  
  // Summe der Arbeitsstunden berechnen
  const getGesamtArbeitsstunden = () => {
    const filtered = getFilteredZeiterfassungen();
    return filtered.reduce((sum, z) => sum + z.arbeitsstunden, 0);
  };
  
  // Projekt-Dropdown-Optionen
  const projektOptionen = umzugsprojekte.map(projekt => ({
    id: projekt._id,
    label: `${projekt.auftraggeber?.name || 'Unbekannter Kunde'} (${new Date(projekt.startDatum).toLocaleDateString('de-DE')})`
  }));
  
  // Mitarbeiter-Dropdown-Optionen
  const mitarbeiterOptionen = mitarbeiter.map(ma => ({
    id: ma._id,
    label: `${ma.vorname} ${ma.nachname}`
  }));
  
  // Render Funktion für Zeiterfassungstabelle
  const renderZeiterfassungen = () => {
    const filtered = getFilteredZeiterfassungen();
    
    if (filtered.length === 0) {
      return (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Keine Zeiterfassungen vorhanden</h3>
          <p className="text-gray-500">
            Füge neue Zeiterfassungen für dieses Projekt hinzu.
          </p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mitarbeiter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zeit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tätigkeit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Std.
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((zeiterfassung) => (
              <tr key={zeiterfassung._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {zeiterfassung.mitarbeiterId.vorname} {zeiterfassung.mitarbeiterId.nachname}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(zeiterfassung.datum).toLocaleDateString('de-DE')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {zeiterfassung.startzeit} - {zeiterfassung.endzeit} (Pause: {zeiterfassung.pause} Min.)
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="text-sm">{zeiterfassung.taetigkeit}</div>
                  {zeiterfassung.notizen && (
                    <div className="text-xs text-gray-500">{zeiterfassung.notizen}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {zeiterfassung.arbeitsstunden.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleBearbeiten(zeiterfassung._id)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                    disabled={loading}
                    aria-label="Bearbeiten"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleLoeschen(zeiterfassung._id)}
                    className="text-red-600 hover:text-red-900"
                    disabled={loading}
                    aria-label="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan="4" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                Gesamtstunden:
              </td>
              <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {getGesamtArbeitsstunden().toFixed(1)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Zeiterfassung</h1>
      
      {/* Fehleranzeige, falls vorhanden */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Projekt-Auswahl */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-grow max-w-md">
            <label htmlFor="projektId" className="block text-sm font-medium text-gray-700 mb-1">
              Projekt auswählen
            </label>
            <select
              id="projektId"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={aktuellesProjekt}
              onChange={(e) => setAktuellesProjekt(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Projekt auswählen --</option>
              {projektOptionen.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mt-4 md:mt-0 space-y-2 md:space-y-0 md:space-x-2 flex flex-col md:flex-row">
            {mitarbeiter.map((ma) => (
              <button
                key={ma._id}
                className={`px-3 py-1.5 rounded text-sm flex items-center ${
                  aktiverMitarbeiter === ma._id
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => handleMitarbeiterFilter(ma._id)}
                disabled={loading}
              >
                <User className="h-4 w-4 mr-1" />
                {ma.vorname}
              </button>
            ))}
            {aktiverMitarbeiter && (
              <button
                className="px-3 py-1.5 rounded text-sm flex items-center bg-red-100 text-red-700 border border-red-300"
                onClick={() => setAktiverMitarbeiter('')}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Filter löschen
              </button>
            )}
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {aktuellesProjekt ? (
        <>
          {/* Zeiterfassungsformular */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">
              {bearbeitungId ? 'Zeiterfassung bearbeiten' : 'Neue Zeiterfassung'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="mitarbeiterId" className="block text-sm font-medium text-gray-700 mb-1">
                    Mitarbeiter
                  </label>
                  <select
                    id="mitarbeiterId"
                    name="mitarbeiterId"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formular.mitarbeiterId}
                    onChange={(e) => setFormular({ ...formular, mitarbeiterId: e.target.value })}
                    required
                    disabled={loading}
                  >
                    <option value="">-- Auswählen --</option>
                    {mitarbeiterOptionen.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="datum" className="block text-sm font-medium text-gray-700 mb-1">
                    Datum
                  </label>
                  <input
                    type="date"
                    id="datum"
                    name="datum"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formular.datum}
                    onChange={(e) => setFormular({ ...formular, datum: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label htmlFor="startzeit" className="block text-sm font-medium text-gray-700 mb-1">
                    Startzeit
                  </label>
                  <input
                    type="time"
                    id="startzeit"
                    name="startzeit"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formular.startzeit}
                    onChange={(e) => setFormular({ ...formular, startzeit: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label htmlFor="endzeit" className="block text-sm font-medium text-gray-700 mb-1">
                    Endzeit
                  </label>
                  <input
                    type="time"
                    id="endzeit"
                    name="endzeit"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formular.endzeit}
                    onChange={(e) => setFormular({ ...formular, endzeit: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="pause" className="block text-sm font-medium text-gray-700 mb-1">
                    Pause (Minuten)
                  </label>
                  <input
                    type="number"
                    id="pause"
                    name="pause"
                    min="0"
                    step="5"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formular.pause}
                    onChange={(e) => setFormular({ ...formular, pause: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="taetigkeit" className="block text-sm font-medium text-gray-700 mb-1">
                    Tätigkeit
                  </label>
                  <input
                    type="text"
                    id="taetigkeit"
                    name="taetigkeit"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formular.taetigkeit}
                    onChange={(e) => setFormular({ ...formular, taetigkeit: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="notizen" className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  id="notizen"
                  name="notizen"
                  rows="2"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formular.notizen}
                  onChange={(e) => setFormular({ ...formular, notizen: e.target.value })}
                  disabled={loading}
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                  disabled={loading}
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>}
                  {bearbeitungId ? 'Aktualisieren' : 'Speichern'}
                </button>
              </div>
              
              {(formular.startzeit && formular.endzeit) && (
                <div className="text-right text-sm">
                  <span className="font-medium">Berechnete Arbeitsstunden: </span>
                  <span className="text-indigo-600 font-medium">
                    {berechneArbeitsstunden(
                      formular.startzeit,
                      formular.endzeit,
                      parseInt(formular.pause, 10)
                    ).toFixed(1)}
                  </span>
                </div>
              )}
            </form>
          </div>
          
          {/* Zeiterfassungsliste */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-medium">Erfasste Zeiten</h2>
              <div className="text-sm text-gray-500">
                {getFilteredZeiterfassungen().length} Einträge
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              renderZeiterfassungen()
            )}
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Kein Projekt ausgewählt</h3>
          <p className="text-gray-500 mb-4">
            Bitte wählen Sie ein Projekt aus, um Zeiten zu erfassen.
          </p>
        </div>
      )}
    </div>
  );
}
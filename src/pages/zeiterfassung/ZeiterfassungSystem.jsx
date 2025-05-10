import React, { useState, useEffect } from 'react';
import { User, Clock, Truck, Plus, Trash2, Save, Edit, Search } from 'lucide-react';

export default function ZeiterfassungSystem() {
  // State für Mitarbeiter
  const [mitarbeiter, setMitarbeiter] = useState([
    { id: 1, name: 'Max Mustermann', position: 'Umzugshelfer' },
    { id: 2, name: 'Anna Schmidt', position: 'Fahrer' },
    { id: 3, name: 'Peter Müller', position: 'Umzugshelfer' },
    { id: 4, name: 'Lisa Wagner', position: 'Teamleiter' }
  ]);
  
  // State für Umzugsprojekte
  const [umzugsprojekte, setUmzugsprojekte] = useState([
    { id: 1, kundenName: 'Familie Müller', datum: '2025-05-10', status: 'In Bearbeitung' },
    { id: 2, kundenName: 'Herr Schmidt', datum: '2025-05-12', status: 'In Bearbeitung' },
    { id: 3, kundenName: 'Frau Weber', datum: '2025-05-15', status: 'Geplant' },
    { id: 4, kundenName: 'Familie Bauer', datum: '2025-05-08', status: 'Abgeschlossen' }
  ]);
  
  // State für Zeiterfassungen
  const [zeiterfassungen, setZeiterfassungen] = useState([
    { id: 1, mitarbeiterId: 1, umzugsprojektId: 1, datum: '2025-05-10', startZeit: '08:00', endZeit: '16:30', pausen: 30, bemerkung: 'Regelmäßige Pause' },
    { id: 2, mitarbeiterId: 2, umzugsprojektId: 1, datum: '2025-05-10', startZeit: '07:30', endZeit: '17:00', pausen: 45, bemerkung: 'Verkehrsstau bei Anfahrt' },
    { id: 3, mitarbeiterId: 3, umzugsprojektId: 1, datum: '2025-05-10', startZeit: '08:00', endZeit: '16:00', pausen: 30, bemerkung: '' },
    { id: 4, mitarbeiterId: 4, umzugsprojektId: 1, datum: '2025-05-10', startZeit: '07:00', endZeit: '17:30', pausen: 60, bemerkung: 'Koordination mit Hausverwaltung' }
  ]);
  
  // State für das aktuelle Umzugsprojekt
  const [aktuellesProjekt, setAktuellesProjekt] = useState(null);
  
  // State für das Formular
  const [formular, setFormular] = useState({
    mitarbeiterId: '',
    startZeit: '',
    endZeit: '',
    pausen: 30,
    bemerkung: ''
  });
  
  // State für die Bearbeitung
  const [bearbeitungId, setBearbeitungId] = useState(null);
  
  // State für die Suchfunktion
  const [suchbegriff, setSuchbegriff] = useState('');
  
  // Effekt, um das aktuelle Projekt zu setzen, wenn sich die Umzugsprojekte ändern
  useEffect(() => {
    if (umzugsprojekte.length > 0 && !aktuellesProjekt) {
      // Standardmäßig das erste "In Bearbeitung" Projekt auswählen
      const inBearbeitung = umzugsprojekte.find(p => p.status === 'In Bearbeitung');
      setAktuellesProjekt(inBearbeitung || umzugsprojekte[0]);
    }
  }, [umzugsprojekte, aktuellesProjekt]);
  
  // Handler für Änderungen im Formular
  const handleFormularChange = (e) => {
    const { name, value } = e.target;
    setFormular({
      ...formular,
      [name]: value
    });
  };
  
  // Handler für das Hinzufügen oder Aktualisieren einer Zeiterfassung
  const handleZeiterfassungSpeichern = () => {
    if (!formular.mitarbeiterId || !formular.startZeit || !formular.endZeit) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    
    const heute = new Date().toISOString().split('T')[0];
    
    if (bearbeitungId) {
      // Zeiterfassung aktualisieren
      setZeiterfassungen(
        zeiterfassungen.map(z => 
          z.id === bearbeitungId 
            ? { 
                ...z, 
                mitarbeiterId: parseInt(formular.mitarbeiterId), 
                startZeit: formular.startZeit, 
                endZeit: formular.endZeit, 
                pausen: parseInt(formular.pausen), 
                bemerkung: formular.bemerkung 
              } 
            : z
        )
      );
      setBearbeitungId(null);
    } else {
      // Neue Zeiterfassung hinzufügen
      const neueZeiterfassung = {
        id: Date.now(),
        mitarbeiterId: parseInt(formular.mitarbeiterId),
        umzugsprojektId: aktuellesProjekt.id,
        datum: aktuellesProjekt.datum,
        startZeit: formular.startZeit,
        endZeit: formular.endZeit,
        pausen: parseInt(formular.pausen),
        bemerkung: formular.bemerkung
      };
      
      setZeiterfassungen([...zeiterfassungen, neueZeiterfassung]);
    }
    
    // Formular zurücksetzen
    setFormular({
      mitarbeiterId: '',
      startZeit: '',
      endZeit: '',
      pausen: 30,
      bemerkung: ''
    });
  };
  
  // Handler für das Löschen einer Zeiterfassung
  const handleZeiterfassungLoeschen = (id) => {
    if (window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      setZeiterfassungen(zeiterfassungen.filter(z => z.id !== id));
    }
  };
  
  // Handler für das Bearbeiten einer Zeiterfassung
  const handleZeiterfassungBearbeiten = (id) => {
    const zeiterfassung = zeiterfassungen.find(z => z.id === id);
    
    if (zeiterfassung) {
      setFormular({
        mitarbeiterId: zeiterfassung.mitarbeiterId.toString(),
        startZeit: zeiterfassung.startZeit,
        endZeit: zeiterfassung.endZeit,
        pausen: zeiterfassung.pausen,
        bemerkung: zeiterfassung.bemerkung
      });
      
      setBearbeitungId(id);
    }
  };
  
  // Hilfsfunktion zum Berechnen der Arbeitszeit
  const berechneArbeitszeit = (startZeit, endZeit, pausen) => {
    const [startStunden, startMinuten] = startZeit.split(':').map(Number);
    const [endStunden, endMinuten] = endZeit.split(':').map(Number);
    
    let startMinutenGesamt = startStunden * 60 + startMinuten;
    let endMinutenGesamt = endStunden * 60 + endMinuten;
    
    // Falls endZeit am nächsten Tag ist
    if (endMinutenGesamt < startMinutenGesamt) {
      endMinutenGesamt += 24 * 60;
    }
    
    const arbeitszeitMinuten = endMinutenGesamt - startMinutenGesamt - pausen;
    
    const stunden = Math.floor(arbeitszeitMinuten / 60);
    const minuten = arbeitszeitMinuten % 60;
    
    return `${stunden}:${minuten.toString().padStart(2, '0')}`;
  };
  
  // Gefilterte Zeiterfassungen für das aktuelle Projekt
  const gefilterteZeiterfassungen = zeiterfassungen
    .filter(z => aktuellesProjekt && z.umzugsprojektId === aktuellesProjekt.id)
    .filter(z => {
      if (!suchbegriff) return true;
      
      const mitarbeiterName = mitarbeiter.find(m => m.id === z.mitarbeiterId)?.name.toLowerCase() || '';
      return mitarbeiterName.includes(suchbegriff.toLowerCase());
    });
  
  return (
    <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mitarbeiter-Zeiterfassung</h1>
      
      {/* Projekt-Auswahl */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">Umzugsprojekt auswählen:</label>
        <select 
          className="w-full p-2 border border-gray-300 rounded-md"
          value={aktuellesProjekt ? aktuellesProjekt.id : ''}
          onChange={(e) => {
            const projektId = parseInt(e.target.value);
            const projekt = umzugsprojekte.find(p => p.id === projektId);
            setAktuellesProjekt(projekt);
          }}
        >
          {umzugsprojekte.map(projekt => (
            <option key={projekt.id} value={projekt.id}>
              {projekt.kundenName} - {projekt.datum} ({projekt.status})
            </option>
          ))}
        </select>
      </div>
      
      {aktuellesProjekt && (
        <>
          {/* Projektkopf */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
            <h2 className="text-xl font-semibold text-blue-800">
              {aktuellesProjekt.kundenName}
            </h2>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="text-gray-600 font-medium">Datum:</span> {aktuellesProjekt.datum}
              </div>
              <div>
                <span className="text-gray-600 font-medium">Status:</span> {aktuellesProjekt.status}
              </div>
            </div>
          </div>
          
          {/* Zeiterfassung Formular */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {bearbeitungId ? 'Zeiterfassung bearbeiten' : 'Neue Zeiterfassung hinzufügen'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Mitarbeiter*</label>
                <select 
                  name="mitarbeiterId"
                  value={formular.mitarbeiterId}
                  onChange={handleFormularChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">-- Mitarbeiter auswählen --</option>
                  {mitarbeiter.map(ma => (
                    <option key={ma.id} value={ma.id}>
                      {ma.name} ({ma.position})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Startzeit*</label>
                  <input 
                    type="time"
                    name="startZeit"
                    value={formular.startZeit}
                    onChange={handleFormularChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Endzeit*</label>
                  <input 
                    type="time"
                    name="endZeit"
                    value={formular.endZeit}
                    onChange={handleFormularChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Pausen (Minuten)</label>
                <input 
                  type="number"
                  name="pausen"
                  value={formular.pausen}
                  onChange={handleFormularChange}
                  min="0"
                  step="5"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-1">Bemerkung</label>
                <input 
                  type="text"
                  name="bemerkung"
                  value={formular.bemerkung}
                  onChange={handleFormularChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Optional: Besonderheiten zur Arbeitszeit"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              {bearbeitungId && (
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  onClick={() => {
                    setBearbeitungId(null);
                    setFormular({
                      mitarbeiterId: '',
                      startZeit: '',
                      endZeit: '',
                      pausen: 30,
                      bemerkung: ''
                    });
                  }}
                >
                  Abbrechen
                </button>
              )}
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                onClick={handleZeiterfassungSpeichern}
              >
                <Save className="w-4 h-4 mr-2" />
                {bearbeitungId ? 'Aktualisieren' : 'Speichern'}
              </button>
            </div>
          </div>
          
          {/* Zeiterfassungen Liste */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Erfasste Arbeitszeiten für dieses Projekt
              </h3>
              
              <div className="relative">
                <input 
                  type="text"
                  value={suchbegriff}
                  onChange={(e) => setSuchbegriff(e.target.value)}
                  className="pl-8 pr-2 py-1 border border-gray-300 rounded-md"
                  placeholder="Mitarbeiter suchen..."
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            {gefilterteZeiterfassungen.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-4 border-b text-left text-gray-700">Mitarbeiter</th>
                      <th className="py-2 px-4 border-b text-left text-gray-700">Datum</th>
                      <th className="py-2 px-4 border-b text-left text-gray-700">Startzeit</th>
                      <th className="py-2 px-4 border-b text-left text-gray-700">Endzeit</th>
                      <th className="py-2 px-4 border-b text-left text-gray-700">Pausen</th>
                      <th className="py-2 px-4 border-b text-left text-gray-700">Arbeitszeit</th>
                      <th className="py-2 px-4 border-b text-left text-gray-700">Bemerkung</th>
                      <th className="py-2 px-4 border-b text-left text-gray-700">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gefilterteZeiterfassungen.map(zeit => {
                      const mitarbeiterName = mitarbeiter.find(m => m.id === zeit.mitarbeiterId)?.name || 'Unbekannt';
                      
                      return (
                        <tr key={zeit.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">{mitarbeiterName}</td>
                          <td className="py-2 px-4 border-b">{zeit.datum}</td>
                          <td className="py-2 px-4 border-b">{zeit.startZeit}</td>
                          <td className="py-2 px-4 border-b">{zeit.endZeit}</td>
                          <td className="py-2 px-4 border-b">{zeit.pausen} min</td>
                          <td className="py-2 px-4 border-b font-medium">
                            {berechneArbeitszeit(zeit.startZeit, zeit.endZeit, zeit.pausen)} h
                          </td>
                          <td className="py-2 px-4 border-b">{zeit.bemerkung}</td>
                          <td className="py-2 px-4 border-b">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleZeiterfassungBearbeiten(zeit.id)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Bearbeiten"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleZeiterfassungLoeschen(zeit.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md">
                Noch keine Arbeitszeiten für dieses Projekt erfasst.
              </div>
            )}
            
            {/* Zusammenfassung */}
            {gefilterteZeiterfassungen.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h4 className="font-medium text-gray-700 mb-2">Zusammenfassung</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-600">Gesamt-Mitarbeiter:</span>
                    <span className="ml-2 font-medium">
                      {new Set(gefilterteZeiterfassungen.map(z => z.mitarbeiterId)).size}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Gesamt-Arbeitsstunden:</span>
                    <span className="ml-2 font-medium">
                      {gefilterteZeiterfassungen.reduce((total, zeit) => {
                        const [stunden, minuten] = berechneArbeitszeit(zeit.startZeit, zeit.endZeit, zeit.pausen).split(':').map(Number);
                        return total + stunden + (minuten / 60);
                      }, 0).toFixed(2)} h
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Durchschnitt pro Mitarbeiter:</span>
                    <span className="ml-2 font-medium">
                      {(gefilterteZeiterfassungen.reduce((total, zeit) => {
                        const [stunden, minuten] = berechneArbeitszeit(zeit.startZeit, zeit.endZeit, zeit.pausen).split(':').map(Number);
                        return total + stunden + (minuten / 60);
                      }, 0) / new Set(gefilterteZeiterfassungen.map(z => z.mitarbeiterId)).size).toFixed(2)} h
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Neuer Mitarbeiter Schnellzugriff */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Mitarbeiter verwalten</h3>
        
        <div className="flex items-center space-x-4">
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
            onClick={() => {
              const name = prompt('Name des neuen Mitarbeiters:');
              if (name) {
                const position = prompt('Position des Mitarbeiters:', 'Umzugshelfer');
                if (position) {
                  const neuerMitarbeiter = {
                    id: Date.now(),
                    name,
                    position
                  };
                  setMitarbeiter([...mitarbeiter, neuerMitarbeiter]);
                }
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Neuer Mitarbeiter
          </button>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mitarbeiter.map(ma => (
            <div key={ma.id} className="p-3 border rounded-md flex justify-between items-center">
              <div>
                <div className="font-medium">{ma.name}</div>
                <div className="text-sm text-gray-500">{ma.position}</div>
              </div>
              <button 
                className="text-red-600 hover:text-red-800"
                onClick={() => {
                  if (window.confirm(`Möchten Sie den Mitarbeiter "${ma.name}" wirklich löschen?`)) {
                    setMitarbeiter(mitarbeiter.filter(m => m.id !== ma.id));
                    // Auch zugehörige Zeiterfassungen löschen
                    setZeiterfassungen(zeiterfassungen.filter(z => z.mitarbeiterId !== ma.id));
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
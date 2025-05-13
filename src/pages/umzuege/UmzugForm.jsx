import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function UmzugForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNeueModus = !id;
  
  const [loading, setLoading] = useState(!!id);
  const [formData, setFormData] = useState({
    kundennummer: '',
    auftraggeber: {
      name: '',
      telefon: '',
      email: ''
    },
    kontakte: [],
    auszugsadresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: '',
      land: 'Deutschland',
      etage: 0,
      aufzug: false,
      entfernung: 0
    },
    einzugsadresse: {
      strasse: '',
      hausnummer: '',
      plz: '',
      ort: '',
      land: 'Deutschland',
      etage: 0,
      aufzug: false,
      entfernung: 0
    },
    zwischenstopps: [],
    startDatum: '',
    endDatum: '',
    status: 'angefragt',
    preis: {
      netto: '',
      brutto: '',
      mwst: 19,
      bezahlt: false,
      zahlungsart: 'rechnung'
    },
    aufnahmeId: '',
    fahrzeuge: [],
    mitarbeiter: [],
    extraLeistungen: []
  });
  
  const [verfuegbareMitarbeiter, setVerfuegbareMitarbeiter] = useState([]);
  const [verfuegbareFahrzeuge, setVerfuegbareFahrzeuge] = useState([]);
  const [showKontaktForm, setShowKontaktForm] = useState(false);
  const [neuerKontakt, setNeuerKontakt] = useState({ name: '', telefon: '', email: '', isKunde: false });

  // Transformationsfunktion für Umzugsdaten - wichtig für das korrekte Format zum Speichern
  const transformUmzugData = useCallback((data) => {
    // Kopie erstellen, um das Original nicht zu verändern
    const transformed = { ...data };
    
    // Datumsfelder korrekt formatieren
    if (transformed.startDatum) {
      try {
        transformed.startDatum = new Date(transformed.startDatum).toISOString();
      } catch (error) {
        console.error('Fehler beim Formatieren des Startdatums:', error);
      }
    }
    
    if (transformed.endDatum) {
      try {
        transformed.endDatum = new Date(transformed.endDatum).toISOString();
      } catch (error) {
        console.error('Fehler beim Formatieren des Enddatums:', error);
      }
    }
    
    // Sicherstellen, dass numerische Werte auch wirklich als Zahlen gespeichert werden
    if (transformed.preis) {
      transformed.preis = {
        ...transformed.preis,
        netto: transformed.preis.netto ? parseFloat(transformed.preis.netto) : 0,
        brutto: transformed.preis.brutto ? parseFloat(transformed.preis.brutto) : 0,
        mwst: transformed.preis.mwst ? parseFloat(transformed.preis.mwst) : 19
      };
    }
    
    // Sicherstellen, dass auszugsadresse und einzugsadresse korrekt formatiert sind
    if (transformed.auszugsadresse) {
      transformed.auszugsadresse = {
        ...transformed.auszugsadresse,
        etage: parseInt(transformed.auszugsadresse.etage) || 0,
        entfernung: parseInt(transformed.auszugsadresse.entfernung) || 0
      };
    }
    
    if (transformed.einzugsadresse) {
      transformed.einzugsadresse = {
        ...transformed.einzugsadresse,
        etage: parseInt(transformed.einzugsadresse.etage) || 0,
        entfernung: parseInt(transformed.einzugsadresse.entfernung) || 0
      };
    }
    
    return transformed;
  }, []);

  // Simuliere API-Aufruf zum Laden der Daten bei Bearbeitung
  useEffect(() => {
    if (id) {
      const fetchUmzug = async () => {
        try {
          setLoading(true);
          // In einer echten Anwendung würde hier ein API-Aufruf mit der ID stattfinden
          try {
            const response = await api.get(`/umzuege/${id}`);
            setFormData(response.data);
          } catch (error) {
            console.error('Fehler beim Laden des Umzugs vom API:', error);
            // Fallback zu Mockdaten
            const mockUmzug = {
              id: 1,
              kundennummer: 'U-2025-001',
              auftraggeber: {
                name: 'Familie Becker',
                telefon: '0123-4567890',
                email: 'becker@beispiel.de'
              },
              kontakte: [
                { name: 'Thomas Becker', telefon: '0123-4567890', email: 'thomas.becker@beispiel.de', isKunde: true }
              ],
              auszugsadresse: {
                strasse: 'Rosenweg',
                hausnummer: '8',
                plz: '10115',
                ort: 'Berlin',
                land: 'Deutschland',
                etage: 3,
                aufzug: true,
                entfernung: 10
              },
              einzugsadresse: {
                strasse: 'Tulpenallee',
                hausnummer: '23',
                plz: '80333',
                ort: 'München',
                land: 'Deutschland',
                etage: 2,
                aufzug: false,
                entfernung: 15
              },
              zwischenstopps: [
                {
                  strasse: 'Lagerstraße',
                  hausnummer: '1',
                  plz: '70174',
                  ort: 'Stuttgart',
                  land: 'Deutschland',
                  etage: 0,
                  aufzug: true,
                  entfernung: 5
                }
              ],
              startDatum: '2025-05-15T08:00:00',
              endDatum: '2025-05-15T18:00:00',
              status: 'geplant',
              preis: {
                netto: 1500,
                brutto: 1785,
                mwst: 19,
                bezahlt: false,
                zahlungsart: 'rechnung'
              },
              aufnahmeId: '',
              fahrzeuge: [
                { id: 1, typ: '7,5t LKW', kennzeichen: 'B-HU 1234' },
                { id: 2, typ: 'Transporter', kennzeichen: 'B-HU 5678' }
              ],
              mitarbeiter: [
                { id: 1, rolle: 'teamleiter' },
                { id: 2, rolle: 'helfer' },
                { id: 3, rolle: 'fahrer' },
                { id: 4, rolle: 'helfer' }
              ],
              extraLeistungen: [
                { beschreibung: 'Klaviertransport', preis: 250, menge: 1 },
                { beschreibung: 'Verpackungsservice', preis: 350, menge: 1 }
              ]
            };
            setFormData(mockUmzug);
          }
          setLoading(false);
        } catch (error) {
          console.error('Fehler beim Laden des Umzugs:', error);
          setLoading(false);
        }
      };

      fetchUmzug();
    } else {
      // Für den Fall "Neuer Umzug" - Datumsfelder initialisieren
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      
      const endTomorrow = new Date(tomorrow);
      endTomorrow.setHours(18, 0, 0, 0);
      
      setFormData(prev => ({
        ...prev,
        startDatum: tomorrow.toISOString().split('T')[0] + 'T08:00',
        endDatum: endTomorrow.toISOString().split('T')[0] + 'T18:00'
      }));
    }
    
    // Mitarbeiter laden - Mock-Daten verwenden statt API-Aufruf
    const mockMitarbeiter = [
      { _id: '1', vorname: 'Max', nachname: 'Mustermann', rolle: 'Teamleiter' },
      { _id: '2', vorname: 'Anna', nachname: 'Schmidt', rolle: 'Helfer' },
      { _id: '3', vorname: 'Lukas', nachname: 'Meyer', rolle: 'Fahrer' },
      { _id: '4', vorname: 'Julia', nachname: 'Weber', rolle: 'Helfer' },
      { _id: '5', vorname: 'Felix', nachname: 'Schulz', rolle: 'Fahrer' },
      { _id: '6', vorname: 'Laura', nachname: 'König', rolle: 'Helfer' }
    ];
    setVerfuegbareMitarbeiter(mockMitarbeiter);
    
    // Fahrzeuge laden - Direkt die Mockdaten für Fahrzeuge setzen ohne API-Aufruf
    const mockFahrzeuge = [
      { _id: '1', kennzeichen: 'B-HU 1234', typ: '7,5t LKW' },
      { _id: '2', kennzeichen: 'B-HU 5678', typ: 'Transporter' },
      { _id: '3', kennzeichen: 'B-HU 9012', typ: '12t LKW' },
      { _id: '4', kennzeichen: 'B-HU 3456', typ: 'Transporter' }
    ];
    setVerfuegbareFahrzeuge(mockFahrzeuge);
    
  }, [id]);

  // Behandelt Änderungen in Input-Feldern
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Für verschachtelte Objekte wie kunde.name
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Für normale Felder
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Behandelt Auswahl von Mitarbeitern
  const handleMitarbeiterToggle = (mitarbeiterId) => {
    setFormData(prev => {
      const mitarbeiterIndex = prev.mitarbeiter.findIndex(m => m.mitarbeiterId === mitarbeiterId);
      let neueMitarbeiter = [...prev.mitarbeiter];
      
      if (mitarbeiterIndex !== -1) {
        // Mitarbeiter entfernen
        neueMitarbeiter.splice(mitarbeiterIndex, 1);
      } else {
        // Mitarbeiter hinzufügen
        neueMitarbeiter.push({
          mitarbeiterId: mitarbeiterId,
          rolle: 'helfer'
        });
      }
      
      return {
        ...prev,
        mitarbeiter: neueMitarbeiter
      };
    });
  };

  // Mitarbeiter-Rolle ändern
  const handleMitarbeiterRolleChange = (mitarbeiterId, neueRolle) => {
    setFormData(prev => {
      const neueMitarbeiter = prev.mitarbeiter.map(m => {
        if (m.mitarbeiterId === mitarbeiterId) {
          return { ...m, rolle: neueRolle };
        }
        return m;
      });
      
      return {
        ...prev,
        mitarbeiter: neueMitarbeiter
      };
    });
  };

  // Behandelt Auswahl von Fahrzeugen
  const handleFahrzeugToggle = (fahrzeugId) => {
    setFormData(prev => {
      // Prüfen, ob das Fahrzeug bereits ausgewählt ist
      const fahrzeugIndex = prev.fahrzeuge.findIndex(f => f._id === fahrzeugId);
      let neueFahrzeuge = [...prev.fahrzeuge];
      
      if (fahrzeugIndex !== -1) {
        // Fahrzeug entfernen
        neueFahrzeuge.splice(fahrzeugIndex, 1);
      } else {
        // Fahrzeug finden und hinzufügen
        const fahrzeug = verfuegbareFahrzeuge.find(f => f._id === fahrzeugId);
        if (fahrzeug) {
          neueFahrzeuge.push({
            _id: fahrzeug._id,
            typ: fahrzeug.typ,
            kennzeichen: fahrzeug.kennzeichen
          });
        }
      }
      
      return {
        ...prev,
        fahrzeuge: neueFahrzeuge
      };
    });
  };

  // Neuen Kontakt hinzufügen
  const handleAddKontakt = () => {
    if (neuerKontakt.name && neuerKontakt.telefon) {
      setFormData(prev => ({
        ...prev,
        kontakte: [...prev.kontakte, { ...neuerKontakt }]
      }));
      setNeuerKontakt({ name: '', telefon: '', email: '', isKunde: false });
      setShowKontaktForm(false);
    }
  };

  // Kontakt entfernen
  const handleRemoveKontakt = (index) => {
    setFormData(prev => ({
      ...prev,
      kontakte: prev.kontakte.filter((_, i) => i !== index)
    }));
  };

  // Formular absenden - mit verbesserter Fehlerbehandlung und Datenformatierung
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Grundlegende Validierung vor dem Senden
    const requiredFields = [
      'auftraggeber.name', 
      'auftraggeber.telefon',
      'auszugsadresse.strasse',
      'auszugsadresse.hausnummer',
      'auszugsadresse.plz',
      'auszugsadresse.ort',
      'einzugsadresse.strasse',
      'einzugsadresse.hausnummer',
      'einzugsadresse.plz',
      'einzugsadresse.ort',
      'startDatum',
      'endDatum'
    ];

    const missingFields = [];
    
    // Prüfe verschachtelte Felder
    requiredFields.forEach(field => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (!formData[parent] || !formData[parent][child]) {
          missingFields.push(field);
        }
      } else if (!formData[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      alert(`Folgende Pflichtfelder fehlen oder sind ungültig: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      // Daten transformieren für API
      const transformedData = transformUmzugData(formData);
      
      console.log('Transformierte Daten zum Speichern:', transformedData);
      
      if (isNeueModus) {
        // Neuen Umzug erstellen
        try {
          const response = await api.post('/umzuege', transformedData);
          console.log('Umzug erfolgreich erstellt:', response.data);
          // Nach Erfolg zur Übersicht navigieren
          navigate('/umzuege');
        } catch (error) {
          console.error('Fehler beim Erstellen des Umzugs:', error);
          
          // Detaillierte Fehlermeldung
          let errorMessage = 'Der Umzug konnte nicht gespeichert werden.';
          if (error.response && error.response.data) {
            console.log('Server-Antwort:', error.response.data);
            if (error.response.data.message) {
              errorMessage += ` Grund: ${error.response.data.message}`;
            }
            if (error.response.data.errors) {
              errorMessage += ` Validierungsfehler: ${JSON.stringify(error.response.data.errors)}`;
            }
          }
          
          alert(errorMessage);
          return; // Navigation wird verhindert
        }
      } else {
        // Bestehenden Umzug aktualisieren
        try {
          const response = await api.put(`/umzuege/${id}`, transformedData);
          console.log('Umzug erfolgreich aktualisiert:', response.data);
          // Nach Erfolg zur Übersicht navigieren
          navigate('/umzuege');
        } catch (error) {
          console.error('Fehler beim Aktualisieren des Umzugs:', error);
          
          // Detaillierte Fehlermeldung
          let errorMessage = 'Der Umzug konnte nicht aktualisiert werden.';
          if (error.response && error.response.data) {
            console.log('Server-Antwort:', error.response.data);
            if (error.response.data.message) {
              errorMessage += ` Grund: ${error.response.data.message}`;
            }
            if (error.response.data.errors) {
              errorMessage += ` Validierungsfehler: ${JSON.stringify(error.response.data.errors)}`;
            }
          }
          
          alert(errorMessage);
          return; // Navigation wird verhindert
        }
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Umzugs:', error);
      alert('Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  };

  // Lade-Status prüfen
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Kopfzeile mit Navigation */}
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isNeueModus ? 'Neuen Umzug anlegen' : 'Umzug bearbeiten'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Kundendaten */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Kundendaten</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kundennummer
              </label>
              <input
                type="text"
                name="kundennummer"
                value={formData.kundennummer}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                placeholder="z.B. U-2025-001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
              >
                <option value="angefragt">Angefragt</option>
                <option value="angebot">Angebot</option>
                <option value="geplant">Geplant</option>
                <option value="in_bearbeitung">In Bearbeitung</option>
                <option value="abgeschlossen">Abgeschlossen</option>
                <option value="storniert">Storniert</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-medium mb-3">Auftraggeber</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="auftraggeber.name"
                  value={formData.auftraggeber.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon *
                </label>
                <input
                  type="text"
                  name="auftraggeber.telefon"
                  value={formData.auftraggeber.telefon}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  name="auftraggeber.email"
                  value={formData.auftraggeber.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Weitere Kontakte</h3>
              <button
                type="button"
                onClick={() => setShowKontaktForm(!showKontaktForm)}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-200 hover:bg-blue-100"
              >
                {showKontaktForm ? 'Abbrechen' : '+ Kontakt hinzufügen'}
              </button>
            </div>
            
            {showKontaktForm && (
              <div className="p-4 border rounded-lg bg-blue-50 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={neuerKontakt.name}
                      onChange={(e) => setNeuerKontakt({...neuerKontakt, name: e.target.value})}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon *
                    </label>
                    <input
                      type="text"
                      value={neuerKontakt.telefon}
                      onChange={(e) => setNeuerKontakt({...neuerKontakt, telefon: e.target.value})}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={neuerKontakt.email}
                      onChange={(e) => setNeuerKontakt({...neuerKontakt, email: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddKontakt}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {formData.kontakte.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-Mail
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.kontakte.map((kontakt, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {kontakt.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {kontakt.telefon}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {kontakt.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleRemoveKontakt(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Entfernen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">Keine weiteren Kontakte eingetragen.</p>
            )}
          </div>
        </div>
        
        {/* Adressen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Adressen</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Auszugsadresse */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-medium mb-3">Auszugsadresse</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Straße *
                  </label>
                  <input
                    type="text"
                    name="auszugsadresse.strasse"
                    value={formData.auszugsadresse.strasse}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hausnummer *
                  </label>
                  <input
                    type="text"
                    name="auszugsadresse.hausnummer"
                    value={formData.auszugsadresse.hausnummer}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    name="auszugsadresse.plz"
                    value={formData.auszugsadresse.plz}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ort *
                  </label>
                  <input
                    type="text"
                    name="auszugsadresse.ort"
                    value={formData.auszugsadresse.ort}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etage
                  </label>
                  <input
                    type="number"
                    name="auszugsadresse.etage"
                    value={formData.auszugsadresse.etage}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    name="auszugsadresse.aufzug"
                    checked={formData.auszugsadresse.aufzug}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Aufzug vorhanden
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entfernung zur Parkmöglichkeit (m)
                  </label>
                  <input
                    type="number"
                    name="auszugsadresse.entfernung"
                    value={formData.auszugsadresse.entfernung}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            {/* Einzugsadresse */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-medium mb-3">Einzugsadresse</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Straße *
                  </label>
                  <input
                    type="text"
                    name="einzugsadresse.strasse"
                    value={formData.einzugsadresse.strasse}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hausnummer *
                  </label>
                  <input
                    type="text"
                    name="einzugsadresse.hausnummer"
                    value={formData.einzugsadresse.hausnummer}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ *
                  </label>
                  <input
                    type="text"
                    name="einzugsadresse.plz"
                    value={formData.einzugsadresse.plz}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ort *
                  </label>
                  <input
                    type="text"
                    name="einzugsadresse.ort"
                    value={formData.einzugsadresse.ort}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etage
                  </label>
                  <input
                    type="number"
                    name="einzugsadresse.etage"
                    value={formData.einzugsadresse.etage}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    name="einzugsadresse.aufzug"
                    checked={formData.einzugsadresse.aufzug}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Aufzug vorhanden
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entfernung zur Parkmöglichkeit (m)
                  </label>
                  <input
                    type="number"
                    name="einzugsadresse.entfernung"
                    value={formData.einzugsadresse.entfernung}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Datum und Zeit */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Datum und Zeit</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Startdatum und -zeit *
              </label>
              <input
                type="datetime-local"
                name="startDatum"
                value={formData.startDatum}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enddatum und -zeit *
              </label>
              <input
                type="datetime-local"
                name="endDatum"
                value={formData.endDatum}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Ressourcen */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Ressourcen</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Mitarbeiter</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {verfuegbareMitarbeiter.map((mitarbeiter) => {
                const isSelected = formData.mitarbeiter.some(m => m.mitarbeiterId === mitarbeiter._id);
                const selectedMitarbeiter = isSelected ? 
                  formData.mitarbeiter.find(m => m.mitarbeiterId === mitarbeiter._id) : null;
                
                return (
                  <div 
                    key={mitarbeiter._id} 
                    className={`p-3 border rounded-lg cursor-pointer ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleMitarbeiterToggle(mitarbeiter._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {mitarbeiter.vorname} {mitarbeiter.nachname}
                        </div>
                        <div className="text-sm text-gray-500">
                          {mitarbeiter.rolle}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <select
                          value={selectedMitarbeiter?.rolle || 'helfer'}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleMitarbeiterRolleChange(mitarbeiter._id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm border-gray-300 rounded"
                        >
                          <option value="fahrer">Fahrer</option>
                          <option value="helfer">Helfer</option>
                          <option value="projektleiter">Projektleiter</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Fahrzeuge</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {verfuegbareFahrzeuge.map((fahrzeug) => {
                const isSelected = formData.fahrzeuge.some(f => f._id === fahrzeug._id);
                
                return (
                  <div 
                    key={fahrzeug._id} 
                    className={`p-3 border rounded-lg cursor-pointer ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleFahrzeugToggle(fahrzeug._id)}
                  >
                    <div className="font-medium">
                      {fahrzeug.typ}
                    </div>
                    <div className="text-sm text-gray-500">
                      {fahrzeug.kennzeichen}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Preise */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Preise</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Netto (€)
              </label>
              <input
                type="number"
                name="preis.netto"
                value={formData.preis.netto}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MwSt. (%)
              </label>
              <input
                type="number"
                name="preis.mwst"
                value={formData.preis.mwst}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brutto (€)
              </label>
              <input
                type="number"
                name="preis.brutto"
                value={formData.preis.brutto}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zahlungsart
              </label>
              <select
                name="preis.zahlungsart"
                value={formData.preis.zahlungsart}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="rechnung">Rechnung</option>
                <option value="bar">Bar</option>
                <option value="überweisung">Überweisung</option>
                <option value="ec">EC-Karte</option>
                <option value="kreditkarte">Kreditkarte</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                name="preis.bezahlt"
                checked={formData.preis.bezahlt}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Bezahlt
              </label>
            </div>
          </div>
        </div>
        
        {/* Formular-Buttons */}
        <div className="flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={() => navigate('/umzuege')} 
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow"
          >
            {isNeueModus ? 'Umzug erstellen' : 'Änderungen speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
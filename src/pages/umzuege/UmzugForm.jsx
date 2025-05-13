import React, { useState, useEffect } from 'react';
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
    startDatum: null,
    endDatum: null,
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

  // Simuliere API-Aufruf zum Laden der Daten bei Bearbeitung
  useEffect(() => {
    if (id) {
      const fetchUmzug = async () => {
        try {
          setLoading(true);
          // In einer echten Anwendung würde hier ein API-Aufruf mit der ID stattfinden
          const response = await api.get(`/umzuege/${id}`);
          setFormData(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Fehler beim Laden des Umzugs:', error);
          setLoading(false);
          
          // Fallback zu Mockdaten für Demo
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
      };

      fetchUmzug();
    }
    
    // Mitarbeiter laden
    const fetchMitarbeiter = async () => {
      try {
        const response = await api.get('/mitarbeiter');
        setVerfuegbareMitarbeiter(response.data);
      } catch (error) {
        console.error('Fehler beim Laden der Mitarbeiter:', error);
        
        // Fallback zu Mockdaten für Demo
        const mockMitarbeiter = [
          { _id: '1', vorname: 'Max', nachname: 'Mustermann', rolle: 'Teamleiter' },
          { _id: '2', vorname: 'Anna', nachname: 'Schmidt', rolle: 'Helfer' },
          { _id: '3', vorname: 'Lukas', nachname: 'Meyer', rolle: 'Fahrer' },
          { _id: '4', vorname: 'Julia', nachname: 'Weber', rolle: 'Helfer' },
          { _id: '5', vorname: 'Felix', nachname: 'Schulz', rolle: 'Fahrer' },
          { _id: '6', vorname: 'Laura', nachname: 'König', rolle: 'Helfer' }
        ];
        setVerfuegbareMitarbeiter(mockMitarbeiter);
      }
    };
    
    // Fahrzeuge laden - API-Aufruf auskommentiert und direkt die Mockdaten verwenden
    // const fetchFahrzeuge = async () => {
    //   try {
    //     const response = await api.get('/fahrzeuge');
    //     setVerfuegbareFahrzeuge(response.data);
    //   } catch (error) {
    //     console.error('Fehler beim Laden der Fahrzeuge:', error);
        
    //     // Fallback zu Mockdaten für Demo
    //     const mockFahrzeuge = [
    //       { _id: '1', kennzeichen: 'B-HU 1234', typ: '7,5t LKW' },
    //       { _id: '2', kennzeichen: 'B-HU 5678', typ: 'Transporter' },
    //       { _id: '3', kennzeichen: 'B-HU 9012', typ: '12t LKW' },
    //       { _id: '4', kennzeichen: 'B-HU 3456', typ: 'Transporter' }
    //     ];
    //     setVerfuegbareFahrzeuge(mockFahrzeuge);
    //   }
    // };
    
    // Direkt die Mockdaten für Fahrzeuge setzen ohne API-Aufruf
    const mockFahrzeuge = [
      { _id: '1', kennzeichen: 'B-HU 1234', typ: '7,5t LKW' },
      { _id: '2', kennzeichen: 'B-HU 5678', typ: 'Transporter' },
      { _id: '3', kennzeichen: 'B-HU 9012', typ: '12t LKW' },
      { _id: '4', kennzeichen: 'B-HU 3456', typ: 'Transporter' }
    ];
    setVerfuegbareFahrzeuge(mockFahrzeuge);
    
    fetchMitarbeiter();
    // fetchFahrzeuge(); // API-Aufruf auskommentiert
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
      const neueMitarbeiter = prev.mitarbeiter.includes(mitarbeiterId)
        ? prev.mitarbeiter.filter(id => id !== mitarbeiterId)
        : [...prev.mitarbeiter, mitarbeiterId];
      
      return {
        ...prev,
        mitarbeiter: neueMitarbeiter
      };
    });
  };

  // Behandelt Auswahl von Fahrzeugen
  const handleFahrzeugToggle = (fahrzeugId) => {
    setFormData(prev => {
      const neueFahrzeuge = prev.fahrzeuge.includes(fahrzeugId)
        ? prev.fahrzeuge.filter(id => id !== fahrzeugId)
        : [...prev.fahrzeuge, fahrzeugId];
      
      return {
        ...prev,
        fahrzeuge: neueFahrzeuge
      };
    });
  };

  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In einer echten Anwendung würde hier ein API-Aufruf zum Speichern stattfinden
    console.log('Formular abgesendet:', formData);
    
    // Zurück zur Übersicht navigieren
    navigate('/umzuege');
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
        {/* Form content would go here */}
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => navigate('/umzuege')} className="px-4 py-2 border rounded">
            Abbrechen
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
}
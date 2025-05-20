import React, { useState, useEffect } from 'react';

export default function UmzugsaufnahmeFormular({ initialData = {}, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    kundenName: '',
    kontaktperson: '',
    telefon: '',
    email: '',
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
    umzugstyp: 'privat',
    umzugsvolumen: '',
    datum: '',
    uhrzeit: '',
    angebotspreis: {
      netto: '',
      brutto: '',
      mwst: 19
    },
    notizen: '',
    besonderheiten: '',
    bewertung: 3
  });

  // Initialdaten laden, wenn vorhanden - mit Sicherheitsabfrage
  useEffect(() => {
    // Stelle sicher, dass initialData ein Objekt ist
    const safeInitialData = initialData || {};
    
    if (Object.keys(safeInitialData).length > 0) {
      setFormData(prevFormData => ({
        ...prevFormData,
        ...safeInitialData,
        // Stelle sicher, dass verschachtelte Objekte korrekt übernommen werden
        auszugsadresse: {
          ...prevFormData.auszugsadresse,
          ...(safeInitialData.auszugsadresse || {})
        },
        einzugsadresse: {
          ...prevFormData.einzugsadresse,
          ...(safeInitialData.einzugsadresse || {})
        },
        angebotspreis: {
          ...prevFormData.angebotspreis,
          ...(safeInitialData.angebotspreis || {})
        }
      }));
    }
  }, [initialData]);

  // Behandelt Änderungen in Input-Feldern
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Für verschachtelte Objekte wie auszugsadresse.strasse
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

  // Preisberechnung
  const handlePreisChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    
    if (field === 'netto') {
      const mwst = formData.angebotspreis.mwst || 19;
      const brutto = numValue * (1 + mwst / 100);
      setFormData(prev => ({
        ...prev,
        angebotspreis: {
          ...prev.angebotspreis,
          netto: numValue,
          brutto: Math.round(brutto * 100) / 100
        }
      }));
    } else if (field === 'brutto') {
      const mwst = formData.angebotspreis.mwst || 19;
      const netto = numValue / (1 + mwst / 100);
      setFormData(prev => ({
        ...prev,
        angebotspreis: {
          ...prev.angebotspreis,
          brutto: numValue,
          netto: Math.round(netto * 100) / 100
        }
      }));
    } else if (field === 'mwst') {
      const netto = formData.angebotspreis.netto || 0;
      const brutto = netto * (1 + numValue / 100);
      setFormData(prev => ({
        ...prev,
        angebotspreis: {
          ...prev.angebotspreis,
          mwst: numValue,
          brutto: Math.round(brutto * 100) / 100
        }
      }));
    }
  };

  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validierung 
    if (formData.kundenName && formData.auszugsadresse.strasse && formData.einzugsadresse.strasse) {
      onSave(formData);
    } else {
      alert('Bitte füllen Sie alle erforderlichen Felder aus.');
    }
  };

  // Vorschau der Adressdaten
  const renderAdressVorschau = () => {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border mb-6">
        <h3 className="text-lg font-semibold mb-4">Adressdaten Vorschau</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Auszugsadresse:</h4>
            <p>
              {formData.auszugsadresse.strasse} {formData.auszugsadresse.hausnummer}<br />
              {formData.auszugsadresse.plz} {formData.auszugsadresse.ort}<br />
              {formData.auszugsadresse.land}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Etage: {formData.auszugsadresse.etage} | 
              Aufzug: {formData.auszugsadresse.aufzug ? 'Ja' : 'Nein'} | 
              Entfernung zur Parkposition: {formData.auszugsadresse.entfernung} m
            </p>
          </div>
          <div>
            <h4 className="font-medium">Einzugsadresse:</h4>
            <p>
              {formData.einzugsadresse.strasse} {formData.einzugsadresse.hausnummer}<br />
              {formData.einzugsadresse.plz} {formData.einzugsadresse.ort}<br />
              {formData.einzugsadresse.land}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Etage: {formData.einzugsadresse.etage} | 
              Aufzug: {formData.einzugsadresse.aufzug ? 'Ja' : 'Nein'} | 
              Entfernung zur Parkposition: {formData.einzugsadresse.entfernung} m
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Kundendaten */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Kundendaten</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kundenname *</label>
            <input
              type="text"
              name="kundenName"
              value={formData.kundenName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kontaktperson</label>
            <input
              type="text"
              name="kontaktperson"
              value={formData.kontaktperson}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              name="telefon"
              value={formData.telefon}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>
      
      {/* Auszugsadresse */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Auszugsadresse</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Straße *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Hausnummer *</label>
            <input
              type="text"
              name="auszugsadresse.hausnummer"
              value={formData.auszugsadresse.hausnummer}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PLZ *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Ort *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Etage</label>
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
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">Aufzug vorhanden</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entfernung (m)</label>
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
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Einzugsadresse</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Straße *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Hausnummer *</label>
            <input
              type="text"
              name="einzugsadresse.hausnummer"
              value={formData.einzugsadresse.hausnummer}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PLZ *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Ort *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Etage</label>
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
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">Aufzug vorhanden</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entfernung (m)</label>
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
      
      {/* Vorschau der Adressen (wenn beide Adressen eingetragen sind) */}
      {formData.auszugsadresse.strasse && formData.einzugsadresse.strasse && renderAdressVorschau()}
      
      {/* Umzugsdetails */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Umzugsdetails</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Umzugstyp</label>
            <select
              name="umzugstyp"
              value={formData.umzugstyp}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="privat">Privatumzug</option>
              <option value="gewerbe">Gewerbeumzug</option>
              <option value="senioren">Seniorenumzug</option>
              <option value="fernumzug">Fernumzug</option>
              <option value="buero">Büroumzug</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Umzugsvolumen (m³)</label>
            <input
              type="number"
              name="umzugsvolumen"
              value={formData.umzugsvolumen}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              min="0"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <input
              type="date"
              name="datum"
              value={formData.datum}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uhrzeit</label>
            <input
              type="time"
              name="uhrzeit"
              value={formData.uhrzeit}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>
      
      {/* Preise */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Preise</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Netto (€)</label>
            <input
              type="number"
              name="angebotspreis.netto"
              value={formData.angebotspreis.netto}
              onChange={(e) => handlePreisChange('netto', e.target.value)}
              className="w-full p-2 border rounded"
              min="0"
              step="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MwSt. (%)</label>
            <input
              type="number"
              name="angebotspreis.mwst"
              value={formData.angebotspreis.mwst}
              onChange={(e) => handlePreisChange('mwst', e.target.value)}
              className="w-full p-2 border rounded"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brutto (€)</label>
            <input
              type="number"
              name="angebotspreis.brutto"
              value={formData.angebotspreis.brutto}
              onChange={(e) => handlePreisChange('brutto', e.target.value)}
              className="w-full p-2 border rounded"
              min="0"
              step="10"
            />
          </div>
        </div>
      </div>
      
      {/* Zusatzinformationen */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Zusatzinformationen</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Besonderheiten</label>
            <textarea
              name="besonderheiten"
              value={formData.besonderheiten}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows="3"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
            <textarea
              name="notizen"
              value={formData.notizen}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows="3"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bewertung</label>
            <select
              name="bewertung"
              value={formData.bewertung}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="1">1 - Sehr einfach</option>
              <option value="2">2 - Einfach</option>
              <option value="3">3 - Normal</option>
              <option value="4">4 - Komplex</option>
              <option value="5">5 - Sehr komplex</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Formular-Buttons */}
      <div className="flex justify-end space-x-3">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-4 py-2 border rounded"
        >
          Abbrechen
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Speichern
        </button>
      </div>
    </form>
  );
}
import React, { useState, useEffect } from 'react';

export default function UmzugsaufnahmeFormular({ initialData = {}, onSave }) {
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

  // Initialdaten laden, wenn vorhanden
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormData({
        ...formData,
        ...initialData,
        // Stelle sicher, dass verschachtelte Objekte korrekt übernommen werden
        auszugsadresse: {
          ...formData.auszugsadresse,
          ...(initialData.auszugsadresse || {})
        },
        einzugsadresse: {
          ...formData.einzugsadresse,
          ...(initialData.einzugsadresse || {})
        },
        angebotspreis: {
          ...formData.angebotspreis,
          ...(initialData.angebotspreis || {})
        }
      });
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
    
    // Validierung könnte hier hinzugefügt werden
    
    if (formData.kundenName && formData.telefon && formData.auszugsadresse.strasse && formData.einzugsadresse.strasse) {
      onSave(formData);
    } else {
      alert('Bitte füllen Sie alle erforderlichen Felder aus.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form content here - this is just a skeleton */}
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
          {/* Other form fields */}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button type="button" className="px-4 py-2 border rounded">
          Abbrechen
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Speichern
        </button>
      </div>
    </form>
  );
}
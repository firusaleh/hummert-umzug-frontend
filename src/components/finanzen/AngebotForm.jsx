// src/components/finanzen/AngebotForm.jsx
import React, { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';

const AngebotForm = ({ onSave, onCancel, bestehendesAngebot = null }) => {
  // Anfangsdaten für das Formular
  const initialData = bestehendesAngebot || {
    kunde: '',
    betrag: '',
    datum: new Date().toISOString().split('T')[0],
    umzugsDatum: '',
    gueltigBis: '',
    leistungen: [
      { id: 1, beschreibung: 'Umzugsservice', menge: 1, einheit: 'Pauschal', einzelpreis: 0, gesamtpreis: 0 }
    ],
    status: 'Offen'
  };
  
  // State für das Formular
  const [formData, setFormData] = useState(initialData);
  
  // Berechne nächste Angebotsnummer (normalerweise würde das vom Backend kommen)
  const nextAngebotsNummer = `ANG-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  
  // Handler für allgemeine Formularfelder
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handler für Leistungen
  const handleLeistungChange = (id, field, value) => {
    const updatedLeistungen = formData.leistungen.map(leistung => {
      if (leistung.id === id) {
        const updatedLeistung = { ...leistung, [field]: value };
        
        // Automatische Berechnung des Gesamtpreises
        if (field === 'menge' || field === 'einzelpreis') {
          updatedLeistung.gesamtpreis = updatedLeistung.menge * updatedLeistung.einzelpreis;
        }
        
        return updatedLeistung;
      }
      return leistung;
    });
    
    setFormData({
      ...formData,
      leistungen: updatedLeistungen
    });
  };
  
  // Leistung hinzufügen
  const handleAddLeistung = () => {
    const newId = formData.leistungen.length > 0 
      ? Math.max(...formData.leistungen.map(l => l.id)) + 1 
      : 1;
      
    const newLeistung = {
      id: newId,
      beschreibung: '',
      menge: 1,
      einheit: 'Stunde',
      einzelpreis: 0,
      gesamtpreis: 0
    };
    
    setFormData({
      ...formData,
      leistungen: [...formData.leistungen, newLeistung]
    });
  };
  
  // Leistung entfernen
  const handleRemoveLeistung = (id) => {
    setFormData({
      ...formData,
      leistungen: formData.leistungen.filter(leistung => leistung.id !== id)
    });
  };
  
  // Gesamtbetrag berechnen
  const berechneGesamtbetrag = () => {
    return formData.leistungen.reduce((sum, leistung) => sum + Number(leistung.gesamtpreis), 0);
  };
  
  // Standardmäßig 30 Tage gültig ab heute
  const calculateDefaultGueltigBis = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };
  
  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validierung
    if (!formData.kunde || !formData.datum || !formData.umzugsDatum) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    
    // Angebotsnummer generieren oder beibehalten
    const angebot = {
      ...formData,
      nummer: bestehendesAngebot ? bestehendesAngebot.nummer : nextAngebotsNummer,
      betrag: berechneGesamtbetrag(),
      gueltigBis: formData.gueltigBis || calculateDefaultGueltigBis(),
      datum: formData.datum || new Date().toISOString().split('T')[0]
    };
    
    // An Parent-Komponente übergeben
    onSave(angebot);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kunde*</label>
          <input 
            type="text" 
            name="kunde" 
            value={formData.kunde} 
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md" 
            placeholder="Name des Kunden"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Angebotsdatum*</label>
          <input 
            type="date" 
            name="datum" 
            value={formData.datum} 
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Umzugsdatum*</label>
          <input 
            type="date" 
            name="umzugsDatum" 
            value={formData.umzugsDatum} 
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gültig bis</label>
          <input 
            type="date" 
            name="gueltigBis" 
            value={formData.gueltigBis} 
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder={calculateDefaultGueltigBis()}
          />
          <p className="text-xs text-gray-500 mt-1">Standard: 30 Tage ab heute</p>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Leistungen</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschreibung</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Menge</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Einheit</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Einzelpreis</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Gesamtpreis</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.leistungen.map(leistung => (
                <tr key={leistung.id}>
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={leistung.beschreibung} 
                      onChange={(e) => handleLeistungChange(leistung.id, 'beschreibung', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm" 
                      placeholder="Beschreibung der Leistung"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      value={leistung.menge} 
                      onChange={(e) => handleLeistungChange(leistung.id, 'menge', parseFloat(e.target.value) || 0)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm"
                      min="0"
                      step="0.5"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={leistung.einheit}
                      onChange={(e) => handleLeistungChange(leistung.id, 'einheit', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="Stunde">Stunde</option>
                      <option value="Stück">Stück</option>
                      <option value="Pauschal">Pauschal</option>
                      <option value="m³">m³</option>
                      <option value="km">km</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={leistung.einzelpreis} 
                        onChange={(e) => handleLeistungChange(leistung.id, 'einzelpreis', parseFloat(e.target.value) || 0)}
                        className="w-full p-1 border border-gray-300 rounded-md text-sm"
                        min="0"
                        step="0.01"
                      />
                      <span className="ml-1">€</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={leistung.gesamtpreis} 
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded-md text-sm bg-gray-50"
                      />
                      <span className="ml-1">€</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <button 
                      type="button"
                      onClick={() => handleRemoveLeistung(leistung.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      disabled={formData.leistungen.length <= 1}
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button 
          type="button"
          onClick={handleAddLeistung}
          className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
        >
          <Plus size={16} className="mr-1" /> Leistung hinzufügen
        </button>
        
        <div className="mt-4 flex justify-end">
          <div className="w-64 bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between font-medium text-gray-700">
              <span>Gesamtbetrag:</span>
              <span>{berechneGesamtbetrag().toLocaleString('de-DE')} €</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end space-x-3">
        <button 
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Check size={16} className="mr-2" />
          {bestehendesAngebot ? 'Angebot aktualisieren' : 'Angebot erstellen'}
        </button>
      </div>
    </form>
  );
};

export default AngebotForm;
// src/components/finanzen/RechnungForm.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';

const RechnungForm = ({ onSave, onCancel, angebote, bestehendeRechnung = null }) => {
  // Anfangsdaten für das Formular
  const initialData = bestehendeRechnung || {
    kunde: '',
    betrag: '',
    datum: new Date().toISOString().split('T')[0],
    faelligkeitsDatum: '',
    zahlungsDatum: null,
    angebotsNummer: '',
    leistungen: [
      { id: 1, beschreibung: 'Umzugsservice', menge: 1, einheit: 'Pauschal', einzelpreis: 0, gesamtpreis: 0 }
    ],
    status: 'Offen',
    zahlungsMethode: 'Überweisung',
    bemerkung: ''
  };
  
  // State für das Formular
  const [formData, setFormData] = useState(initialData);
  
  // Berechne nächste Rechnungsnummer (normalerweise würde das vom Backend kommen)
  const nextRechnungsNummer = `RE-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  
  // Berechne Standardfälligkeitsdatum (30 Tage ab Rechnungsdatum)
  const berechneFaelligkeitsDatum = (rechnungsDatum) => {
    const date = new Date(rechnungsDatum);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };
  
  // Setze Standardfälligkeitsdatum, wenn Rechnungsdatum sich ändert
  useEffect(() => {
    if (formData.datum && !formData.faelligkeitsDatum) {
      setFormData({
        ...formData,
        faelligkeitsDatum: berechneFaelligkeitsDatum(formData.datum)
      });
    }
  }, [formData.datum]);
  
  // Handler für allgemeine Formularfelder
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handler für Checkboxen
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
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
  
  // Wenn ein Angebot ausgewählt wird, übernehme dessen Daten
  const handleAngebotsAuswahl = (angebotsNummer) => {
    if (!angebotsNummer) {
      return;
    }
    
    const selectedAngebot = angebote.find(a => a.nummer === angebotsNummer);
    if (selectedAngebot) {
      setFormData({
        ...formData,
        kunde: selectedAngebot.kunde,
        angebotsNummer: selectedAngebot.nummer,
        leistungen: selectedAngebot.leistungen || formData.leistungen,
        betrag: selectedAngebot.betrag
      });
    }
  };
  
  // Gesamtbetrag berechnen
  const berechneGesamtbetrag = () => {
    return formData.leistungen.reduce((sum, leistung) => sum + Number(leistung.gesamtpreis), 0);
  };
  
  // MWST berechnen (19%)
  const berechneMwSt = () => {
    return berechneGesamtbetrag() * 0.19;
  };
  
  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validierung
    if (!formData.kunde || !formData.datum || !formData.faelligkeitsDatum) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    
    // Rechnungsnummer generieren oder beibehalten
    const rechnung = {
      ...formData,
      nummer: bestehendeRechnung ? bestehendeRechnung.nummer : nextRechnungsNummer,
      betrag: berechneGesamtbetrag(),
      datum: new Date(formData.datum),
      faelligkeitsDatum: new Date(formData.faelligkeitsDatum),
      zahlungsDatum: formData.zahlungsDatum ? new Date(formData.zahlungsDatum) : null
    };
    
    // An Parent-Komponente übergeben
    onSave(rechnung);
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Angebot</label>
          <select
            name="angebotsNummer"
            value={formData.angebotsNummer}
            onChange={(e) => handleAngebotsAuswahl(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Kein Angebot auswählen</option>
            {angebote
              .filter(a => a.status === 'Angenommen')
              .map(angebot => (
                <option key={angebot.id} value={angebot.nummer}>
                  {angebot.nummer} - {angebot.kunde} ({angebot.betrag.toLocaleString('de-DE')} €)
                </option>
              ))
            }
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rechnungsdatum*</label>
          <input 
            type="date" 
            name="datum" 
            value={formData.datum} 
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fälligkeitsdatum*</label>
          <input 
            type="date" 
            name="faelligkeitsDatum" 
            value={formData.faelligkeitsDatum} 
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Standard: 30 Tage ab Rechnungsdatum</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zahlungsdatum</label>
          <input 
            type="date" 
            name="zahlungsDatum" 
            value={formData.zahlungsDatum || ''} 
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Zahlungsmethode</label>
        <select
          name="zahlungsMethode"
          value={formData.zahlungsMethode}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="Überweisung">Überweisung</option>
          <option value="Barzahlung">Barzahlung</option>
          <option value="Lastschrift">Lastschrift</option>
          <option value="Kreditkarte">Kreditkarte</option>
          <option value="PayPal">PayPal</option>
        </select>
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
            <div className="flex justify-between text-sm text-gray-700">
              <span>Nettobetrag:</span>
              <span>{berechneGesamtbetrag().toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700 mt-1">
              <span>MwSt. (19%):</span>
              <span>{berechneMwSt().toLocaleString('de-DE')} €</span>
            </div>
            <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-medium">
              <span>Gesamtbetrag:</span>
              <span>{(berechneGesamtbetrag() + berechneMwSt()).toLocaleString('de-DE')} €</span>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bemerkung</label>
        <textarea
          name="bemerkung"
          value={formData.bemerkung}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md"
          rows="3"
          placeholder="Zusätzliche Informationen oder Zahlungshinweise"
        ></textarea>
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
          {bestehendeRechnung ? 'Rechnung aktualisieren' : 'Rechnung erstellen'}
        </button>
      </div>
    </form>
  );
};

export default RechnungForm;
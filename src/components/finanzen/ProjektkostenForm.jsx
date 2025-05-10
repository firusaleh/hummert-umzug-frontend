// src/components/finanzen/ProjektkostenForm.jsx
import React, { useState } from 'react';
import { X, Plus, Minus, Check, Users, Truck, Package, FileText } from 'lucide-react';

const ProjektkostenForm = ({ onSave, onCancel, bestehendeKosten = null, umzugsprojekte = [] }) => {
  // Anfangsdaten für das Formular
  const initialData = bestehendeKosten || {
    projekt: '',
    umzugsprojektId: '',
    personalkosten: 0,
    materialkosten: 0,
    fahrzeugkosten: 0,
    sonstige: 0,
    ertrag: 0,
    details: {
      personal: [
        { id: 1, beschreibung: 'Umzugshelfer', anzahl: 2, stunden: 8, stundensatz: 25, gesamtkosten: 400 }
      ],
      material: [
        { id: 1, beschreibung: 'Umzugskartons', anzahl: 20, einzelpreis: 5, gesamtkosten: 100 }
      ],
      fahrzeuge: [
        { id: 1, beschreibung: 'Transporter', anzahl: 1, stunden: 8, stundensatz: 15, gesamtkosten: 120 }
      ],
      sonstigePosten: [
        { id: 1, beschreibung: 'Parkgenehmigung', betrag: 50 }
      ]
    }
  };
  
  // State für das Formular
  const [formData, setFormData] = useState(initialData);
  
  // Handler für allgemeine Formularfelder
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handler für numerische Eingaben
  const handleNumericInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value) || 0
    });
  };
  
  // Wenn ein Umzugsprojekt ausgewählt wird
  const handleProjektAuswahl = (projektId) => {
    if (!projektId) return;
    
    const selectedProjekt = umzugsprojekte.find(p => p.id === parseInt(projektId));
    if (selectedProjekt) {
      setFormData({
        ...formData,
        umzugsprojektId: projektId,
        projekt: selectedProjekt.kundenName,
        ertrag: selectedProjekt.betrag || 0
      });
    }
  };
  
  // Handler für Personal
  const handlePersonalChange = (id, field, value) => {
    const updatedPersonal = formData.details.personal.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: parseFloat(value) || 0 };
        
        // Automatische Berechnung der Gesamtkosten
        if (['anzahl', 'stunden', 'stundensatz'].includes(field)) {
          updatedItem.gesamtkosten = updatedItem.anzahl * updatedItem.stunden * updatedItem.stundensatz;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    // Gesamte Personalkosten neu berechnen
    const gesamtPersonalkosten = updatedPersonal.reduce((sum, item) => sum + item.gesamtkosten, 0);
    
    setFormData({
      ...formData,
      personalkosten: gesamtPersonalkosten,
      details: {
        ...formData.details,
        personal: updatedPersonal
      }
    });
  };
  
  // Personal-Beschreibung ändern
  const handlePersonalBeschreibungChange = (id, value) => {
    const updatedPersonal = formData.details.personal.map(item => {
      if (item.id === id) {
        return { ...item, beschreibung: value };
      }
      return item;
    });
    
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        personal: updatedPersonal
      }
    });
  };
  
  // Personal hinzufügen
  const handleAddPersonal = () => {
    const newId = formData.details.personal.length > 0 
      ? Math.max(...formData.details.personal.map(item => item.id)) + 1 
      : 1;
      
    const newItem = {
      id: newId,
      beschreibung: 'Mitarbeiter',
      anzahl: 1,
      stunden: 8,
      stundensatz: 25,
      gesamtkosten: 200
    };
    
    const updatedPersonal = [...formData.details.personal, newItem];
    const gesamtPersonalkosten = updatedPersonal.reduce((sum, item) => sum + item.gesamtkosten, 0);
    
    setFormData({
      ...formData,
      personalkosten: gesamtPersonalkosten,
      details: {
        ...formData.details,
        personal: updatedPersonal
      }
    });
  };
  
  // Personal entfernen
  const handleRemovePersonal = (id) => {
    const updatedPersonal = formData.details.personal.filter(item => item.id !== id);
    const gesamtPersonalkosten = updatedPersonal.reduce((sum, item) => sum + item.gesamtkosten, 0);
    
    setFormData({
      ...formData,
      personalkosten: gesamtPersonalkosten,
      details: {
        ...formData.details,
        personal: updatedPersonal
      }
    });
  };
  
  // Handler für Material
  const handleMaterialChange = (id, field, value) => {
    const updatedMaterial = formData.details.material.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: parseFloat(value) || 0 };
        
        // Automatische Berechnung der Gesamtkosten
        if (['anzahl', 'einzelpreis'].includes(field)) {
          updatedItem.gesamtkosten = updatedItem.anzahl * updatedItem.einzelpreis;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    // Gesamte Materialkosten neu berechnen
    const gesamtMaterialkosten = updatedMaterial.reduce((sum, item) => sum + item.gesamtkosten, 0);
    
    setFormData({
      ...formData,
      materialkosten: gesamtMaterialkosten,
      details: {
        ...formData.details,
        material: updatedMaterial
      }
    });
  };
  
  // Material-Beschreibung ändern
  const handleMaterialBeschreibungChange = (id, value) => {
    const updatedMaterial = formData.details.material.map(item => {
      if (item.id === id) {
        return { ...item, beschreibung: value };
      }
      return item;
    });
    
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        material: updatedMaterial
      }
    });
  };
  
  // Material hinzufügen
  const handleAddMaterial = () => {
    const newId = formData.details.material.length > 0 
      ? Math.max(...formData.details.material.map(item => item.id)) + 1 
      : 1;
      
    const newItem = {
      id: newId,
      beschreibung: 'Material',
      anzahl: 1,
      einzelpreis: 10,
      gesamtkosten: 10
    };
    
    const updatedMaterial = [...formData.details.material, newItem];
    const gesamtMaterialkosten = updatedMaterial.reduce((sum, item) => sum + item.gesamtkosten, 0);
    
    setFormData({
      ...formData,
      materialkosten: gesamtMaterialkosten,
      details: {
        ...formData.details,
        material: updatedMaterial
      }
    });
  };
  
  // Material entfernen
  const handleRemoveMaterial = (id) => {
    const updatedMaterial = formData.details.material.filter(item => item.id !== id);
    const gesamtMaterialkosten = updatedMaterial.reduce((sum, item) => sum + item.gesamtkosten, 0);
    
    setFormData({
      ...formData,
      materialkosten: gesamtMaterialkosten,
      details: {
        ...formData.details,
        material: updatedMaterial
      }
    });
  };
  
  // Handler für Fahrzeuge
  const handleFahrzeugChange = (id, field, value) => {
    const updatedFahrzeuge = formData.details.fahrzeuge.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: parseFloat(value) || 0 };
        
        // Automatische Berechnung der Gesamtkosten
        if (['anzahl', 'stunden', 'stundensatz'].includes(field)) {
          updatedItem.gesamtkosten = updatedItem.anzahl * updatedItem.stunden * updatedItem.stundensatz;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    // Gesamte Fahrzeugkosten neu berechnen
    const gesamtFahrzeugkosten = updatedFahrzeuge.reduce((sum, item) => sum + item.gesamtkosten, 0);
    
    setFormData({
      ...formData,
      fahrzeugkosten: gesamtFahrzeugkosten,
      details: {
        ...formData.details,
        fahrzeuge: updatedFahrzeuge
      }
    });
  };
  
  // Fahrzeug-Beschreibung ändern
  const handleFahrzeugBeschreibungChange = (id, value) => {
    const updatedFahrzeuge = formData.details.fahrzeuge.map(item => {
      if (item.id === id) {
        return { ...item, beschreibung: value };
      }
      return item;
    });
    
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        fahrzeuge: updatedFahrzeuge
      }
    });
  };
  
  // Fahrzeug hinzufügen
  const handleAddFahrzeug = () => {
    const newId = formData.details.fahrzeuge.length > 0 
      ? Math.max(...formData.details.fahrzeuge.map(item => item.id)) + 1 
      : 1;
      
    const newItem = {
      id: newId,
      beschreibung: 'Transportfahrzeug',
      anzahl: 1,
      stunden: 8,
      stundensatz: 15,
      gesamtkosten: 120
    };
    
    const updatedFahrzeuge = [...formData.details.fahrzeuge, newItem];
    const gesamtFahrzeugkosten = updatedFahrzeuge.reduce((sum, item) => sum + item.gesamtkosten, 0);
    
    setFormData({
      ...formData,
      fahrzeugkosten: gesamtFahrzeugkosten,
      details: {
        ...formData.details,
        fahrzeuge: updatedFahrzeuge
      }
    });
  };
  
  // Fahrzeug entfernen
  const handleRemoveFahrzeug = (id) => {
    const updatedFahrzeuge = formData.details.fahrzeuge.filter(item => item.id !== id);
    const gesamtFahrzeugkosten = updatedFahrzeuge.reduce((sum, item) => sum + item.gesamtkosten, 0);
    
    setFormData({
      ...formData,
      fahrzeugkosten: gesamtFahrzeugkosten,
      details: {
        ...formData.details,
        fahrzeuge: updatedFahrzeuge
      }
    });
  };
  
  // Handler für Sonstige Posten
  const handleSonstigeChange = (id, field, value) => {
    const updatedSonstige = formData.details.sonstigePosten.map(item => {
      if (item.id === id) {
        return { ...item, [field]: parseFloat(value) || 0 };
      }
      return item;
    });
    
    // Gesamte Sonstige Kosten neu berechnen
    const gesamtSonstigeKosten = updatedSonstige.reduce((sum, item) => sum + item.betrag, 0);
    
    setFormData({
      ...formData,
      sonstige: gesamtSonstigeKosten,
      details: {
        ...formData.details,
        sonstigePosten: updatedSonstige
      }
    });
  };
  
  // Sonstige-Beschreibung ändern
  const handleSonstigeBeschreibungChange = (id, value) => {
    const updatedSonstige = formData.details.sonstigePosten.map(item => {
      if (item.id === id) {
        return { ...item, beschreibung: value };
      }
      return item;
    });
    
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        sonstigePosten: updatedSonstige
      }
    });
  };
  
  // Sonstigen Posten hinzufügen
  const handleAddSonstiges = () => {
    const newId = formData.details.sonstigePosten.length > 0 
      ? Math.max(...formData.details.sonstigePosten.map(item => item.id)) + 1 
      : 1;
      
    const newItem = {
      id: newId,
      beschreibung: 'Sonstiges',
      betrag: 0
    };
    
    const updatedSonstige = [...formData.details.sonstigePosten, newItem];
    const gesamtSonstigeKosten = updatedSonstige.reduce((sum, item) => sum + item.betrag, 0);
    
    setFormData({
      ...formData,
      sonstige: gesamtSonstigeKosten,
      details: {
        ...formData.details,
        sonstigePosten: updatedSonstige
      }
    });
  };
  
  // Sonstigen Posten entfernen
  const handleRemoveSonstiges = (id) => {
    const updatedSonstige = formData.details.sonstigePosten.filter(item => item.id !== id);
    const gesamtSonstigeKosten = updatedSonstige.reduce((sum, item) => sum + item.betrag, 0);
    
    setFormData({
      ...formData,
      sonstige: gesamtSonstigeKosten,
      details: {
        ...formData.details,
        sonstigePosten: updatedSonstige
      }
    });
  };
  
  // Gesamtkosten berechnen
  const berechneGesamtkosten = () => {
    return formData.personalkosten + formData.materialkosten + formData.fahrzeugkosten + formData.sonstige;
  };
  
  // Gewinn berechnen
  const berechneGewinn = () => {
    return formData.ertrag - berechneGesamtkosten();
  };
  
  // Marge berechnen
  const berechneMarge = () => {
    if (formData.ertrag <= 0) return 0;
    return Math.round((berechneGewinn() / formData.ertrag) * 100);
  };
  
  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validierung
    if (!formData.projekt) {
      alert('Bitte geben Sie einen Projektnamen ein.');
      return;
    }
    
    const projektkosten = {
      ...formData,
      id: bestehendeKosten ? bestehendeKosten.id : Date.now(),
      gesamt: berechneGesamtkosten(),
      marge: berechneMarge()
    };
    
    // An Parent-Komponente übergeben
    onSave(projektkosten);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Projekt*</label>
          {umzugsprojekte.length > 0 ? (
            <select
              name="umzugsprojektId"
              value={formData.umzugsprojektId}
              onChange={(e) => handleProjektAuswahl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Projekt auswählen</option>
              {umzugsprojekte.map(projekt => (
                <option key={projekt.id} value={projekt.id}>
                  {projekt.kundenName} - {new Date(projekt.datum).toLocaleDateString('de-DE')}
                </option>
              ))}
            </select>
          ) : (
            <input 
              type="text" 
              name="projekt" 
              value={formData.projekt} 
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md" 
              placeholder="Name des Projekts"
              required
            />
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Erwarteter Ertrag (€)</label>
          <input 
            type="number" 
            name="ertrag" 
            value={formData.ertrag} 
            onChange={handleNumericInputChange}
            className="w-full p-2 border border-gray-300 rounded-md" 
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>
      
      {/* Personalkosten */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
          <Users size={18} className="mr-2 text-blue-500" /> Personalkosten
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschreibung</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Anzahl</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Stunden</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Stundensatz</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Gesamtkosten</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.details.personal.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={item.beschreibung} 
                      onChange={(e) => handlePersonalBeschreibungChange(item.id, e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm" 
                      placeholder="Beschreibung"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      value={item.anzahl} 
                      onChange={(e) => handlePersonalChange(item.id, 'anzahl', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm"
                      min="0"
                      step="1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      value={item.stunden} 
                      onChange={(e) => handlePersonalChange(item.id, 'stunden', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm"
                      min="0"
                      step="0.5"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={item.stundensatz} 
                        onChange={(e) => handlePersonalChange(item.id, 'stundensatz', e.target.value)}
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
                        value={item.gesamtkosten} 
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded-md text-sm bg-gray-50"
                      />
                      <span className="ml-1">€</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <button 
                      type="button"
                      onClick={() => handleRemovePersonal(item.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      disabled={formData.details.personal.length <= 1}
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
          onClick={handleAddPersonal}
          className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
        >
          <Plus size={16} className="mr-1" /> Personal hinzufügen
        </button>
      </div>
      
      {/* Materialkosten */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
          <Package size={18} className="mr-2 text-green-500" /> Materialkosten
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschreibung</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Anzahl</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Einzelpreis</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Gesamtkosten</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.details.material.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={item.beschreibung} 
                      onChange={(e) => handleMaterialBeschreibungChange(item.id, e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm" 
                      placeholder="Beschreibung"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      value={item.anzahl} 
                      onChange={(e) => handleMaterialChange(item.id, 'anzahl', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm"
                      min="0"
                      step="1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={item.einzelpreis} 
                        onChange={(e) => handleMaterialChange(item.id, 'einzelpreis', e.target.value)}
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
                        value={item.gesamtkosten} 
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded-md text-sm bg-gray-50"
                      />
                      <span className="ml-1">€</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <button 
                      type="button"
                      onClick={() => handleRemoveMaterial(item.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      disabled={formData.details.material.length <= 1}
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
          onClick={handleAddMaterial}
          className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
        >
          <Plus size={16} className="mr-1" /> Material hinzufügen
        </button>
      </div>
      
      {/* Fahrzeugkosten */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
          <Truck size={18} className="mr-2 text-red-500" /> Fahrzeugkosten
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschreibung</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Anzahl</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Stunden</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Stundensatz</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Gesamtkosten</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.details.fahrzeuge.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={item.beschreibung} 
                      onChange={(e) => handleFahrzeugBeschreibungChange(item.id, e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm" 
                      placeholder="Beschreibung"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      value={item.anzahl} 
                      onChange={(e) => handleFahrzeugChange(item.id, 'anzahl', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm"
                      min="0"
                      step="1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="number" 
                      value={item.stunden} 
                      onChange={(e) => handleFahrzeugChange(item.id, 'stunden', e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm"
                      min="0"
                      step="0.5"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={item.stundensatz} 
                        onChange={(e) => handleFahrzeugChange(item.id, 'stundensatz', e.target.value)}
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
                        value={item.gesamtkosten} 
                        readOnly
                        className="w-full p-1 border border-gray-300 rounded-md text-sm bg-gray-50"
                      />
                      <span className="ml-1">€</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <button 
                      type="button"
                      onClick={() => handleRemoveFahrzeug(item.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      disabled={formData.details.fahrzeuge.length <= 1}
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
          onClick={handleAddFahrzeug}
          className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
        >
          <Plus size={16} className="mr-1" /> Fahrzeug hinzufügen
        </button>
      </div>
      
      {/* Sonstige Kosten */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
          <FileText size={18} className="mr-2 text-yellow-500" /> Sonstige Kosten
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschreibung</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Betrag</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.details.sonstigePosten.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={item.beschreibung} 
                      onChange={(e) => handleSonstigeBeschreibungChange(item.id, e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-md text-sm" 
                      placeholder="Beschreibung"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        value={item.betrag} 
                        onChange={(e) => handleSonstigeChange(item.id, 'betrag', e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded-md text-sm"
                        min="0"
                        step="0.01"
                      />
                      <span className="ml-1">€</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <button 
                      type="button"
                      onClick={() => handleRemoveSonstiges(item.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      disabled={formData.details.sonstigePosten.length <= 1}
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
          onClick={handleAddSonstiges}
          className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
        >
          <Plus size={16} className="mr-1" /> Sonstiges hinzufügen
        </button>
      </div>
      
      {/* Zusammenfassung */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-3">Zusammenfassung</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Personalkosten:</span>
              <span className="font-medium">{formData.personalkosten.toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Materialkosten:</span>
              <span className="font-medium">{formData.materialkosten.toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fahrzeugkosten:</span>
              <span className="font-medium">{formData.fahrzeugkosten.toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sonstige Kosten:</span>
              <span className="font-medium">{formData.sonstige.toLocaleString('de-DE')} €</span>
            </div>
            <div className="border-t border-gray-300 pt-2 flex justify-between text-sm font-medium">
              <span>Gesamtkosten:</span>
              <span>{berechneGesamtkosten().toLocaleString('de-DE')} €</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Erwarteter Ertrag:</span>
              <span className="font-medium">{formData.ertrag.toLocaleString('de-DE')} €</span>
            </div>
            <div className="flex justify-between text-sm font-medium mt-1">
              <span className="text-gray-700">Erwarteter Gewinn:</span>
              <span className={berechneGewinn() >= 0 ? 'text-green-600' : 'text-red-600'}>
                {berechneGewinn().toLocaleString('de-DE')} €
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-700">Marge:</span>
              <span className={berechneMarge() >= 20 ? 'text-green-600' : berechneMarge() >= 10 ? 'text-yellow-600' : 'text-red-600'}>
                {berechneMarge()} %
              </span>
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
          {bestehendeKosten ? 'Kosten aktualisieren' : 'Kosten erfassen'}
        </button>
      </div>
    </form>
  );
};

export default ProjektkostenForm;
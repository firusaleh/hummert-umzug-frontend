import React, { useState, useEffect } from 'react';
import { Plus, Minus, Camera, X, Save, Send, Upload } from 'lucide-react';

const UmzugsaufnahmeFormular = ({ initialData = null, onSave = () => {} }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    // Kundendaten
    kundentyp: 'privat',
    nachname: '',
    vorname: '',
    telefon: '',
    email: '',
    kundenAnmerkungen: '',
    
    // Umzugsdetails
    umzugsdatum: '',
    alternativeTermine: '',
    auszugsadresse: {
      strasse: '',
      plz: '',
      ort: '',
      keinAufzug: false,
      stockwerk: 'Erdgeschoss'
    },
    einzugsadresse: {
      strasse: '',
      plz: '',
      ort: '',
      keinAufzug: false,
      stockwerk: 'Erdgeschoss'
    },
    besonderheiten: '',
    
    // Inventar
    inventarItems: [
      { id: 1, raum: 'Wohnzimmer', name: 'Sofa', anzahl: 1, volumen: 2.5, besonderheiten: 'Sehr schwer, 3-Sitzer', fotos: [] }
    ],
    
    // Zusätzliche Dienste
    zusatzleistungen: {
      verpackungsservice: false,
      moebeldemontage: false,
      einpackservice: false,
      klaviertransport: false,
      zwischenlagerung: false,
      entsorgung: false
    },
    weitereWuensche: '',
    
    // Angebot
    dokumente: [],
    angebot: {
      grundpreis: 1200,
      verpackungsservice: 250,
      moebelmontage: 180,
      anmerkungen: ''
    }
  });
  
  // Wenn initialData vorhanden ist, laden wir diese Daten
  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData,
      }));
    }
  }, [initialData]);
  
  // Input-Handler für einfache Textfelder
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Input-Handler für verschachtelte Objekte
  const handleNestedInputChange = (category, field, value) => {
    setFormData({
      ...formData,
      [category]: {
        ...formData[category],
        [field]: value
      }
    });
  };
  
  // Checkbox-Handler für zusätzliche Dienste
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      zusatzleistungen: {
        ...formData.zusatzleistungen,
        [name]: checked
      }
    });
  };
  
  // Adress-Handler
  const handleAddressChange = (addressType, field, value) => {
    setFormData({
      ...formData,
      [addressType]: {
        ...formData[addressType],
        [field]: value
      }
    });
  };
  
  // Inventar-Handler
  const handleAddItem = () => {
    const newItem = {
      id: formData.inventarItems.length > 0 
        ? Math.max(...formData.inventarItems.map(item => item.id)) + 1 
        : 1,
      raum: '',
      name: '',
      anzahl: 1,
      volumen: 0,
      besonderheiten: '',
      fotos: []
    };
    
    setFormData({
      ...formData,
      inventarItems: [...formData.inventarItems, newItem]
    });
  };
  
  const handleRemoveItem = (id) => {
    setFormData({
      ...formData,
      inventarItems: formData.inventarItems.filter(item => item.id !== id)
    });
  };
  
  const handleItemChange = (id, field, value) => {
    setFormData({
      ...formData,
      inventarItems: formData.inventarItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };
  
  // Formular-Absenden
  const handleSubmit = () => {
    // Hier könnten weitere Validierungen stattfinden
    onSave(formData);
  };
  
  // Berechnung der Summe für das Angebot
  const calculateTotals = () => {
    const zwischensumme = formData.angebot.grundpreis + 
                          (formData.zusatzleistungen.verpackungsservice ? formData.angebot.verpackungsservice : 0) + 
                          (formData.zusatzleistungen.moebeldemontage ? formData.angebot.moebelmontage : 0);
    const mwst = zwischensumme * 0.19;
    const gesamtbetrag = zwischensumme + mwst;
    
    return { zwischensumme, mwst, gesamtbetrag };
  };
  
  const totals = calculateTotals();
  
  const renderStepContent = () => {
    switch(activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Kundeninformationen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kundentyp</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="kundentyp" 
                      value="privat" 
                      className="h-4 w-4 text-blue-600" 
                      checked={formData.kundentyp === 'privat'}
                      onChange={() => setFormData({...formData, kundentyp: 'privat'})}
                    />
                    <span className="ml-2">Privatkunde</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input 
                      type="radio" 
                      name="kundentyp" 
                      value="geschäft" 
                      className="h-4 w-4 text-blue-600"
                      checked={formData.kundentyp === 'geschäft'}
                      onChange={() => setFormData({...formData, kundentyp: 'geschäft'})} 
                    />
                    <span className="ml-2">Geschäftskunde</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                <input 
                  type="text" 
                  name="nachname"
                  value={formData.nachname}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md" 
                  placeholder="Nachname" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vorname*</label>
                <input 
                  type="text" 
                  name="vorname"
                  value={formData.vorname}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md" 
                  placeholder="Vorname" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon*</label>
                <input 
                  type="tel" 
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md" 
                  placeholder="+49..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail*</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md" 
                  placeholder="kunde@beispiel.de" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anmerkungen</label>
              <textarea 
                name="kundenAnmerkungen"
                value={formData.kundenAnmerkungen}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md" 
                rows="3" 
                placeholder="Wichtige Kundeninformationen..."
              ></textarea>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Umzugsdetails</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Umzugsdatum*</label>
                <input 
                  type="date" 
                  name="umzugsdatum"
                  value={formData.umzugsdatum}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Termine</label>
                <input 
                  type="date" 
                  name="alternativeTermine"
                  value={formData.alternativeTermine}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auszugsadresse*</label>
              <input 
                type="text" 
                value={formData.auszugsadresse.strasse}
                onChange={(e) => handleAddressChange('auszugsadresse', 'strasse', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mb-2" 
                placeholder="Straße, Hausnummer" 
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  value={formData.auszugsadresse.plz}
                  onChange={(e) => handleAddressChange('auszugsadresse', 'plz', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md" 
                  placeholder="PLZ" 
                />
                <input 
                  type="text" 
                  value={formData.auszugsadresse.ort}
                  onChange={(e) => handleAddressChange('auszugsadresse', 'ort', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md" 
                  placeholder="Ort" 
                />
              </div>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.auszugsadresse.keinAufzug}
                    onChange={(e) => handleAddressChange('auszugsadresse', 'keinAufzug', e.target.checked)}
                    className="h-4 w-4 text-blue-600" 
                  />
                  <span className="ml-2 text-sm">Kein Aufzug vorhanden</span>
                </label>
              </div>
              <div className="mt-1">
                <label className="text-sm font-medium text-gray-700">Stockwerk</label>
                <select 
                  value={formData.auszugsadresse.stockwerk}
                  onChange={(e) => handleAddressChange('auszugsadresse', 'stockwerk', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                >
                  <option>Erdgeschoss</option>
                  <option>1. Stock</option>
                  <option>2. Stock</option>
                  <option>3. Stock</option>
                  <option>4. Stock</option>
                  <option>5. Stock oder höher</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Einzugsadresse*</label>
              <input 
                type="text" 
                value={formData.einzugsadresse.strasse}
                onChange={(e) => handleAddressChange('einzugsadresse', 'strasse', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mb-2" 
                placeholder="Straße, Hausnummer" 
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  value={formData.einzugsadresse.plz}
                  onChange={(e) => handleAddressChange('einzugsadresse', 'plz', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md" 
                  placeholder="PLZ" 
                />
                <input 
                  type="text" 
                  value={formData.einzugsadresse.ort}
                  onChange={(e) => handleAddressChange('einzugsadresse', 'ort', e.target.value)}
                  className="p-2 border border-gray-300 rounded-md" 
                  placeholder="Ort" 
                />
              </div>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    checked={formData.einzugsadresse.keinAufzug}
                    onChange={(e) => handleAddressChange('einzugsadresse', 'keinAufzug', e.target.checked)}
                    className="h-4 w-4 text-blue-600" 
                  />
                  <span className="ml-2 text-sm">Kein Aufzug vorhanden</span>
                </label>
              </div>
              <div className="mt-1">
                <label className="text-sm font-medium text-gray-700">Stockwerk</label>
                <select 
                  value={formData.einzugsadresse.stockwerk}
                  onChange={(e) => handleAddressChange('einzugsadresse', 'stockwerk', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                >
                  <option>Erdgeschoss</option>
                  <option>1. Stock</option>
                  <option>2. Stock</option>
                  <option>3. Stock</option>
                  <option>4. Stock</option>
                  <option>5. Stock oder höher</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Besonderheiten</label>
              <textarea 
                name="besonderheiten"
                value={formData.besonderheiten}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md" 
                rows="3" 
                placeholder="Zufahrt, Parksituation, etc."
              ></textarea>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Inventaraufnahme</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raum</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gegenstand</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anzahl</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volumen m³</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Besonderheiten</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fotos</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.inventarItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <select
                          value={item.raum}
                          onChange={(e) => handleItemChange(item.id, 'raum', e.target.value)}
                          className="w-full p-1 text-sm border border-gray-300 rounded-md"
                        >
                          <option value="">Auswählen...</option>
                          <option>Wohnzimmer</option>
                          <option>Küche</option>
                          <option>Schlafzimmer</option>
                          <option>Badezimmer</option>
                          <option>Flur</option>
                          <option>Keller</option>
                          <option>Dachboden</option>
                          <option>Garage</option>
                          <option>Garten</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          className="w-full p-1 text-sm border border-gray-300 rounded-md"
                          placeholder="z.B. Sofa"
                        />
                      </td>
                      <td className="px-3 py-2 w-16">
                        <input
                          type="number"
                          value={item.anzahl}
                          onChange={(e) => handleItemChange(item.id, 'anzahl', parseInt(e.target.value) || 0)}
                          className="w-full p-1 text-sm border border-gray-300 rounded-md"
                          min="1"
                        />
                      </td>
                      <td className="px-3 py-2 w-20">
                        <input
                          type="number"
                          value={item.volumen}
                          onChange={(e) => handleItemChange(item.id, 'volumen', parseFloat(e.target.value) || 0)}
                          className="w-full p-1 text-sm border border-gray-300 rounded-md"
                          step="0.1"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.besonderheiten}
                          onChange={(e) => handleItemChange(item.id, 'besonderheiten', e.target.value)}
                          className="w-full p-1 text-sm border border-gray-300 rounded-md"
                          placeholder="Zerbrechlich, schwer, etc."
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button className="p-1 text-gray-600 hover:text-blue-600" title="Foto hinzufügen">
                          <Camera size={16} />
                        </button>
                        <span className="text-xs ml-1">{item.fotos.length}</span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Entfernen"
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
              onClick={handleAddItem}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus size={16} className="mr-1" /> Gegenstand hinzufügen
            </button>
            
            <div className="bg-gray-50 p-4 rounded-lg mt-6">
              <h4 className="font-medium text-gray-700 mb-2">Zusammenfassung</h4>
              <div className="flex justify-between text-sm">
                <span>Gesamtanzahl Gegenstände:</span>
                <span className="font-medium">
                  {formData.inventarItems.reduce((sum, item) => sum + item.anzahl, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Geschätztes Gesamtvolumen:</span>
                <span className="font-medium">
                  {formData.inventarItems.reduce((sum, item) => sum + item.volumen * item.anzahl, 0).toFixed(1)} m³
                </span>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Zusätzliche Dienstleistungen</h3>
            
            <div className="space-y-3">
              <label className="flex items-start">
                <input 
                  type="checkbox" 
                  name="verpackungsservice"
                  checked={formData.zusatzleistungen.verpackungsservice}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 mt-1" 
                />
                <div className="ml-3">
                  <span className="text-sm font-medium">Verpackungsservice</span>
                  <p className="text-xs text-gray-500">Wir verpacken Ihre Gegenstände fachgerecht in geeignete Umzugskartons</p>
                </div>
              </label>
              
              <label className="flex items-start">
                <input 
                  type="checkbox" 
                  name="moebeldemontage"
                  checked={formData.zusatzleistungen.moebeldemontage}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 mt-1" 
                />
                <div className="ml-3">
                  <span className="text-sm font-medium">Möbeldemontage und -montage</span>
                  <p className="text-xs text-gray-500">Demontage am Auszugsort und Wieder-Montage am Einzugsort</p>
                </div>
              </label>
              
              <label className="flex items-start">
                <input 
                  type="checkbox" 
                  name="einpackservice"
                  checked={formData.zusatzleistungen.einpackservice}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 mt-1" 
                />
                <div className="ml-3">
                  <span className="text-sm font-medium">Einpackservice für Geschirr und Fragiles</span>
                  <p className="text-xs text-gray-500">Spezielles Verpackungsmaterial für empfindliche Gegenstände</p>
                </div>
              </label>
              
              <label className="flex items-start">
                <input 
                  type="checkbox" 
                  name="klaviertransport"
                  checked={formData.zusatzleistungen.klaviertransport}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 mt-1" 
                />
                <div className="ml-3">
                  <span className="text-sm font-medium">Klaviertransport</span>
                  <p className="text-xs text-gray-500">Fachgerechter Transport von Klavieren und Flügeln</p>
                </div>
              </label>
              
              <label className="flex items-start">
                <input 
                  type="checkbox" 
                  name="zwischenlagerung"
                  checked={formData.zusatzleistungen.zwischenlagerung}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 mt-1" 
                />
                <div className="ml-3">
                  <span className="text-sm font-medium">Zwischenlagerung</span>
                  <p className="text-xs text-gray-500">Lagerung Ihrer Möbel in unserem gesicherten Lager</p>
                </div>
              </label>
              
              <label className="flex items-start">
                <input 
                  type="checkbox" 
                  name="entsorgung"
                  checked={formData.zusatzleistungen.entsorgung}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 mt-1" 
                />
                <div className="ml-3">
                  <span className="text-sm font-medium">Entsorgung</span>
                  <p className="text-xs text-gray-500">Fachgerechte Entsorgung von nicht mehr benötigten Gegenständen</p>
                </div>
              </label>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Weitere Wünsche oder Anforderungen</label>
              <textarea 
                name="weitereWuensche"
                value={formData.weitereWuensche}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md" 
                rows="3" 
                placeholder="Besondere Anforderungen oder individuelle Wünsche"
              ></textarea>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Dokumente & Angebot</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Fotos und Dokumente hochladen</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-1 text-sm text-gray-500">Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen</p>
                <input type="file" className="hidden" multiple />
                <button className="mt-2 py-2 px-4 border border-blue-600 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50">
                  Dateien auswählen
                </button>
              </div>
            </div>
            
            <div className="bg-white p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Kostenvoranschlag</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Grundpreis Umzug (basierend auf Volumen)</span>
                  <span>{formData.angebot.grundpreis.toFixed(2)} €</span>
                </div>
                
                {formData.zusatzleistungen.verpackungsservice && (
                  <div className="flex justify-between text-sm">
                    <span>Verpackungsservice</span>
                    <span>{formData.angebot.verpackungsservice.toFixed(2)} €</span>
                  </div>
                )}
                
                {formData.zusatzleistungen.moebeldemontage && (
                  <div className="flex justify-between text-sm">
                    <span>Möbelmontage</span>
                    <span>{formData.angebot.moebelmontage.toFixed(2)} €</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-medium">
                  <span>Zwischensumme</span>
                  <span>{totals.zwischensumme.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>MwSt. (19%)</span>
                  <span>{totals.mwst.toFixed(2)} €</span>
                </div>
                <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-medium text-lg">
                  <span>Gesamtbetrag</span>
                  <span>{totals.gesamtbetrag.toFixed(2)} €</span>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Anmerkungen zum Angebot</label>
                <textarea 
                  value={formData.angebot.anmerkungen}
                  onChange={(e) => handleNestedInputChange('angebot', 'anmerkungen', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md" 
                  rows="2" 
                  placeholder="Zusätzliche Informationen zum Angebot..."
                ></textarea>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Inhalt wird geladen...</div>;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto">
      <div className="bg-blue-700 text-white p-4">
        <h2 className="text-xl font-bold">
          {initialData ? 'Umzugsauftrag bearbeiten' : 'Neuer Umzugsauftrag'}
        </h2>
        <p className="text-blue-100 text-sm">
          {initialData ? 'Bearbeiten Sie die Details des Umzugsauftrags' : 'Erstellen Sie einen detaillierten Umzugsauftrag'}
        </p>
      </div>
      
      <div className="p-1 bg-gray-100">
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <button
              key={step}
              onClick={() => setActiveStep(step)}
              className={`flex-1 text-center py-2 text-sm font-medium rounded-t-lg ${
                activeStep === step 
                  ? 'bg-white text-blue-700 border-t-2 border-blue-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {step === 1 && "Kunde"}
              {step === 2 && "Details"}
              {step === 3 && "Inventar"}
              {step === 4 && "Services"}
              {step === 5 && "Angebot"}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-6">
        {renderStepContent()}
      </div>
      
      <div className="bg-gray-50 px-6 py-4 flex justify-between">
        <button 
          onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
          className={`py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 ${
            activeStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={activeStep === 1}
        >
          Zurück
        </button>
        
        <div className="space-x-3">
          <button 
            onClick={handleSubmit}
            className="py-2 px-4 border border-blue-700 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            <Save className="w-4 h-4 inline mr-1" />
            Speichern
          </button>
          
          {activeStep < 5 ? (
            <button 
              onClick={() => setActiveStep(activeStep + 1)}
              className="py-2 px-4 bg-blue-700 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-800"
            >
              Weiter
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              className="py-2 px-4 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700"
            >
              <Send className="w-4 h-4 inline mr-1" />
              Angebot erstellen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UmzugsaufnahmeFormular;
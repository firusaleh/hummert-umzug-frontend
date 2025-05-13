import React, { useState } from 'react';
import { Plus, Search, FileText, Edit, Trash2, ArrowLeft } from 'lucide-react';
import UmzugsaufnahmeFormular from './UmzugsaufnahmeFormular';

const AufnahmenList = () => {
  const [showForm, setShowForm] = useState(false);
  const [currentAufnahme, setCurrentAufnahme] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Beispieldaten für vorhandene Aufnahmen (später durch API-Daten ersetzen)
  const [aufnahmen, setAufnahmen] = useState([
    { id: 1, kunde: 'Müller, Thomas', adresse: 'Hauptstr. 12, 80331 München', datum: '2025-04-15', status: 'Ausstehend' },
    { id: 2, kunde: 'Schmidt, Sabine', adresse: 'Bahnhofstr. 5, 60329 Frankfurt', datum: '2025-04-18', status: 'Bestätigt' },
    { id: 3, kunde: 'Weber, Michael', adresse: 'Kirchweg 28, 50667 Köln', datum: '2025-04-22', status: 'Abgeschlossen' }
  ]);
  
  const handleNewAufnahme = () => {
    setCurrentAufnahme(null);
    setShowForm(true);
  };
  
  const handleEditAufnahme = (aufnahme) => {
    setCurrentAufnahme(aufnahme);
    setShowForm(true);
  };
  
  const handleDeleteAufnahme = (id) => {
    if (window.confirm('Möchten Sie diese Aufnahme wirklich löschen?')) {
      setAufnahmen(aufnahmen.filter(a => a.id !== id));
    }
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setCurrentAufnahme(null);
  };
  
  const handleSaveAufnahme = async (data) => {
    setLoading(true);
    
    try {
      // Hier würde normalerweise ein API-Aufruf stattfinden
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simuliere API-Aufruf
      
      if (currentAufnahme) {
        // Bestehende Aufnahme aktualisieren
        setAufnahmen(aufnahmen.map(item => 
          item.id === currentAufnahme.id ? { ...item, ...data, kunde: data.kundenName } : item
        ));
      } else {
        // Neue Aufnahme erstellen
        const newAufnahme = {
          id: Date.now(),
          kunde: data.kundenName,
          adresse: `${data.auszugsadresse.strasse} ${data.auszugsadresse.hausnummer}, ${data.auszugsadresse.plz} ${data.auszugsadresse.ort}`,
          datum: data.datum || new Date().toISOString().split('T')[0],
          status: 'Ausstehend'
        };
        setAufnahmen([...aufnahmen, newAufnahme]);
      }
      
      setShowForm(false);
      setCurrentAufnahme(null);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Aufnahmen</h1>
            <button 
              onClick={handleNewAufnahme}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} className="mr-2" /> Neue Aufnahme
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <h2 className="text-lg font-medium mb-2 md:mb-0">Alle Aufnahmen</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Suchen..."
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {aufnahmen.map((aufnahme) => (
                    <tr key={aufnahme.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{aufnahme.kunde}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{aufnahme.adresse}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(aufnahme.datum).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          aufnahme.status === 'Bestätigt' ? 'bg-green-100 text-green-800' : 
                          aufnahme.status === 'Ausstehend' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {aufnahme.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditAufnahme(aufnahme)} 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAufnahme(aufnahme.id)} 
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {aufnahmen.length === 0 && (
              <div className="text-center py-10">
                <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Keine Aufnahmen vorhanden</p>
                <button 
                  onClick={handleNewAufnahme}
                  className="mt-3 text-blue-600 hover:text-blue-800"
                >
                  Erste Aufnahme erstellen
                </button>
              </div>
            )}
            
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                Insgesamt {aufnahmen.length} Aufnahmen
              </p>
            </div>
          </div>
        </>
      ) : (
        <div>
          <div className="flex items-center mb-6">
            <button 
              onClick={handleCloseForm}
              className="mr-3 px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center"
            >
              <ArrowLeft size={16} className="mr-1" /> Zurück
            </button>
            <h1 className="text-2xl font-bold">
              {currentAufnahme ? `Aufnahme bearbeiten: ${currentAufnahme.kunde}` : 'Neue Aufnahme erstellen'}
            </h1>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <UmzugsaufnahmeFormular 
              initialData={currentAufnahme} 
              onSave={handleSaveAufnahme}
              onCancel={handleCloseForm}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AufnahmenList;
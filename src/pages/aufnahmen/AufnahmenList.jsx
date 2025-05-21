import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Edit, Trash2, ArrowLeft } from 'lucide-react';
import UmzugsaufnahmeFormular from './UmzugsaufnahmeFormular';
import { aufnahmenService } from '../../services/api';

const AufnahmenList = () => {
  const [showForm, setShowForm] = useState(false);
  const [currentAufnahme, setCurrentAufnahme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aufnahmen, setAufnahmen] = useState([]);
  const [suchbegriff, setSuchbegriff] = useState('');
  
  // Aufnahmen vom Server laden
  const loadAufnahmen = async () => {
    setLoading(true);
    try {
      const response = await aufnahmenService.getAll();
      console.log('API Response für Aufnahmen:', response);
      
      // Extrahiere die Aufnahmen aus der Antwort
      // Die Antwort kann entweder direkt ein Array sein, oder in response.aufnahmen oder response.data enthalten sein
      let aufnahmenData = [];
      
      if (response && response.success !== false) {
        if (Array.isArray(response)) {
          // Direkt ein Array
          aufnahmenData = response;
        } else if (response.aufnahmen && Array.isArray(response.aufnahmen)) {
          // In aufnahmen-Feld
          aufnahmenData = response.aufnahmen;
        } else if (response.data && Array.isArray(response.data)) {
          // In data-Feld
          aufnahmenData = response.data;
        } else if (response.data && response.data.aufnahmen && Array.isArray(response.data.aufnahmen)) {
          // Verschachtelt in data.aufnahmen
          aufnahmenData = response.data.aufnahmen;
        } else if (typeof response === 'object') {
          // Vielleicht ein Objekt mit _id-Feldern (Aufnahmen-Objekte)
          const possibleAufnahmen = Object.values(response).filter(item => 
            item && typeof item === 'object' && item._id
          );
          if (possibleAufnahmen.length > 0) {
            aufnahmenData = possibleAufnahmen;
          }
        }
      }
      
      console.log('Extrahierte Aufnahmen:', aufnahmenData);
      setAufnahmen(aufnahmenData);
    } catch (error) {
      console.error('Fehler beim Laden der Aufnahmen:', error);
      // Verbesserte Fehlermeldung mit Details
      const errorMessage = error.response?.data?.message || error.message || 'Die Aufnahmen konnten nicht geladen werden.';
      alert(`Fehler: ${errorMessage}`);
      // Leeres Array setzen, damit die UI nicht bricht
      setAufnahmen([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Beim ersten Rendern Aufnahmen laden
  useEffect(() => {
    loadAufnahmen();
  }, []);
  
  const handleNewAufnahme = () => {
    setCurrentAufnahme(null);
    setShowForm(true);
  };
  
  const handleEditAufnahme = (aufnahme) => {
    setCurrentAufnahme(aufnahme);
    setShowForm(true);
  };
  
  const handleDeleteAufnahme = async (id) => {
    if (!id) {
      alert('Fehler: Keine Aufnahme-ID angegeben.');
      return;
    }
    
    if (window.confirm('Möchten Sie diese Aufnahme wirklich löschen?')) {
      setLoading(true);
      try {
        await aufnahmenService.delete(id);
        // Nach erfolgreicher Löschung aktualisierte Liste laden
        loadAufnahmen();
      } catch (error) {
        console.error('Fehler beim Löschen der Aufnahme:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Die Aufnahme konnte nicht gelöscht werden.';
        alert(`Fehler: ${errorMessage}`);
        setLoading(false);
      }
    }
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setCurrentAufnahme(null);
    // Beim Schließen des Formulars Aufnahmen neu laden
    loadAufnahmen();
  };
  
  const handleSaveAufnahme = async (data) => {
    setLoading(true);
    
    try {
      // Daten validieren bevor wir sie an die API senden
      if (!data.kundenName) {
        throw new Error('Bitte geben Sie einen Kundennamen ein.');
      }
      
      let result;
      if (currentAufnahme) {
        // Bestehende Aufnahme aktualisieren
        result = await aufnahmenService.update(currentAufnahme._id, data);
        console.log('Aufnahme aktualisiert:', result);
      } else {
        // Neue Aufnahme erstellen
        result = await aufnahmenService.create(data);
        console.log('Neue Aufnahme erstellt:', result);
      }
      
      // Formular schließen und Aufnahmen neu laden
      setShowForm(false);
      setCurrentAufnahme(null);
      loadAufnahmen();
      
      // Erfolg bestätigen
      const action = currentAufnahme ? 'aktualisiert' : 'erstellt';
      alert(`Aufnahme erfolgreich ${action}!`);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.';
      alert(`Fehler: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Gefilterte Aufnahmen basierend auf Suchbegriff
  const filteredAufnahmen = aufnahmen.filter(aufnahme => {
    const searchTerm = suchbegriff.toLowerCase();
    // Sichere Überprüfung auf vorhandene Eigenschaften
    const kundenNameMatch = aufnahme.kundenName ? aufnahme.kundenName.toLowerCase().includes(searchTerm) : false;
    const strasseMatch = aufnahme.auszugsadresse && aufnahme.auszugsadresse.strasse 
      ? aufnahme.auszugsadresse.strasse.toLowerCase().includes(searchTerm) 
      : false;
    const ortMatch = aufnahme.auszugsadresse && aufnahme.auszugsadresse.ort 
      ? aufnahme.auszugsadresse.ort.toLowerCase().includes(searchTerm) 
      : false;
    const statusMatch = aufnahme.status ? aufnahme.status.toLowerCase().includes(searchTerm) : false;
    
    return kundenNameMatch || strasseMatch || ortMatch || statusMatch;
  });
  
  // Formatiere Status für die Anzeige
  const formatStatus = (status) => {
    switch(status) {
      case 'in_bearbeitung': return 'In Bearbeitung';
      case 'abgeschlossen': return 'Abgeschlossen';
      case 'angebot_erstellt': return 'Angebot erstellt';
      case 'bestellt': return 'Bestellt';
      default: return status;
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
                    value={suchbegriff}
                    onChange={(e) => setSuchbegriff(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  {filteredAufnahmen.length > 0 ? (
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
                        {filteredAufnahmen.map((aufnahme) => (
                          <tr key={aufnahme._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{aufnahme.kundenName || 'Unbekannt'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {aufnahme.auszugsadresse ? 
                                `${aufnahme.auszugsadresse.strasse || ''} ${aufnahme.auszugsadresse.hausnummer || ''}, ${aufnahme.auszugsadresse.plz || ''} ${aufnahme.auszugsadresse.ort || ''}`.trim().replace(/, $/, '') 
                                : 'Keine Adresse'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {aufnahme.datum ? new Date(aufnahme.datum).toLocaleDateString('de-DE') : 'Kein Datum'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                aufnahme.status === 'bestellt' ? 'bg-green-100 text-green-800' : 
                                aufnahme.status === 'in_bearbeitung' ? 'bg-yellow-100 text-yellow-800' : 
                                aufnahme.status === 'angebot_erstellt' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {aufnahme.status ? formatStatus(aufnahme.status) : 'Nicht definiert'}
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
                                onClick={() => handleDeleteAufnahme(aufnahme._id)} 
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-10">
                      <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">Keine Aufnahmen gefunden</p>
                      <button 
                        onClick={handleNewAufnahme}
                        className="mt-3 text-blue-600 hover:text-blue-800"
                      >
                        Erste Aufnahme erstellen
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    Insgesamt {filteredAufnahmen.length} Aufnahmen
                  </p>
                </div>
              </>
            )}
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
              {currentAufnahme ? `Aufnahme bearbeiten: ${currentAufnahme.kundenName}` : 'Neue Aufnahme erstellen'}
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
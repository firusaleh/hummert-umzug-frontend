// src/pages/fahrzeuge/FahrzeugeList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Car,
  Calendar,
  Truck,
  MoreHorizontal,
  Edit,
  Trash2,
  PlusCircle,
  Gauge,
  SprayCan
} from 'lucide-react';
import { fahrzeugeService } from '../../services/api';
import { toast } from 'react-toastify';

const FahrzeugeList = () => {
  const [fahrzeuge, setFahrzeuge] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFahrzeuge, setFilteredFahrzeuge] = useState([]);
  const [typFilter, setTypFilter] = useState('Alle');
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fahrzeuge vom Backend laden
  useEffect(() => {
    const fetchFahrzeuge = async () => {
      setLoading(true);
      try {
        const response = await fahrzeugeService.getAll();
        const data = response.data || response;
        setFahrzeuge(Array.isArray(data) ? data : []);
        setFilteredFahrzeuge(Array.isArray(data) ? data : []);
      } catch (err) {
        // Fehler beim Laden der Fahrzeuge
        setError('Die Fahrzeuge konnten nicht geladen werden.');
        toast.error('Fahrzeuge konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    fetchFahrzeuge();
  }, []);

  // Filter und Suchfunktion
  useEffect(() => {
    let results = fahrzeuge;
    
    // Suche
    if (searchTerm) {
      results = results.filter(
        (fz) =>
          fz.kennzeichen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fz.bezeichnung?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter nach Typ
    if (typFilter !== 'Alle') {
      results = results.filter((fz) => fz.typ === typFilter);
    }
    
    // Filter nach Status
    if (statusFilter !== 'Alle') {
      results = results.filter((fz) => fz.status === statusFilter);
    }
    
    setFilteredFahrzeuge(results);
    setCurrentPage(1); // Zurück zur ersten Seite nach Filteranwendung
  }, [searchTerm, typFilter, statusFilter, fahrzeuge]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFahrzeuge.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFahrzeuge.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Dropdown-Menü für Aktionen
  const toggleDropdown = (id) => {
    if (dropdownOpen === id) {
      setDropdownOpen(null);
    } else {
      setDropdownOpen(id);
    }
  };

  // Löschfunktion für Fahrzeuge
  const handleDeleteFahrzeug = async (id) => {
    if (window.confirm('Möchten Sie dieses Fahrzeug wirklich löschen?')) {
      try {
        await fahrzeugeService.delete(id);
        toast.success('Fahrzeug erfolgreich gelöscht');
        // Nach erfolgreicher Löschung aktualisierte Liste laden
        const response = await fahrzeugeService.getAll();
        const data = response.data || response;
        setFahrzeuge(Array.isArray(data) ? data : []);
        setFilteredFahrzeuge(Array.isArray(data) ? data : []);
      } catch (error) {
        // Fehler beim Löschen des Fahrzeugs
        toast.error('Das Fahrzeug konnte nicht gelöscht werden');
      }
    }
  };

  // Statusanzeige
  const StatusBadge = ({ status }) => {
    let bgColor, textColor;
    
    switch (status) {
      case 'Verfügbar':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'Im Einsatz':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'In Wartung':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'Defekt':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
      case 'Außer Dienst':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  // TÜV Status Anzeige
  const TuevBadge = ({ tuevDatum, tuevStatus }) => {
    let status = tuevStatus;
    
    // Berechne TÜV-Status falls nicht explizit übergeben
    if (!status && tuevDatum) {
      const heute = new Date();
      const tuevDate = new Date(tuevDatum);
      const differenzInTagen = Math.ceil((tuevDate - heute) / (1000 * 60 * 60 * 24));
      
      if (differenzInTagen < 0) status = 'Abgelaufen';
      else if (differenzInTagen <= 30) status = 'Bald fällig';
      else status = 'Gültig';
    }

    let bgColor, textColor;
    
    switch (status) {
      case 'Gültig':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'Bald fällig':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'Abgelaufen':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {tuevDatum ? new Date(tuevDatum).toLocaleDateString('de-DE') : 'Nicht angegeben'}
        {status && ` (${status})`}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Fahrzeuge</h1>
        <Link 
          to="/fahrzeuge/neu" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center"
        >
          <PlusCircle size={16} className="mr-2" /> Neues Fahrzeug
        </Link>
      </div>
      
      {/* Suchleiste und Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Suche nach Kennzeichen, Bezeichnung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={typFilter}
                onChange={(e) => setTypFilter(e.target.value)}
              >
                <option value="Alle">Alle Typen</option>
                <option value="LKW">LKW</option>
                <option value="Transporter">Transporter</option>
                <option value="PKW">PKW</option>
                <option value="Anhänger">Anhänger</option>
                <option value="Sonstige">Sonstige</option>
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Alle">Alle Status</option>
                <option value="Verfügbar">Verfügbar</option>
                <option value="Im Einsatz">Im Einsatz</option>
                <option value="In Wartung">In Wartung</option>
                <option value="Defekt">Defekt</option>
                <option value="Außer Dienst">Außer Dienst</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fahrzeugliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 border-b border-red-200">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {currentItems.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fahrzeug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kennzeichen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kapazität
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kilometerstand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TÜV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((fahrzeug) => (
                    <tr key={fahrzeug._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {fahrzeug.bild ? (
                              <img 
                                src={fahrzeug.bild} 
                                alt={fahrzeug.bezeichnung} 
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              fahrzeug.typ === 'LKW' ? (
                                <Truck size={20} className="text-gray-500" />
                              ) : (
                                <Car size={20} className="text-gray-500" />
                              )
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{fahrzeug.bezeichnung}</div>
                            <div className="text-sm text-gray-500">
                              {fahrzeug.baujahr && `Baujahr: ${fahrzeug.baujahr}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{fahrzeug.kennzeichen}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{fahrzeug.typ}</div>
                        <div className="text-sm text-gray-500">
                          {fahrzeug.fuehrerscheinklasse && `FS Klasse: ${fahrzeug.fuehrerscheinklasse}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {fahrzeug.kapazitaet?.ladeflaeche ? (
                          <div className="text-sm text-gray-500">
                            <div>
                              {fahrzeug.kapazitaet.ladeflaeche.laenge && 
                               fahrzeug.kapazitaet.ladeflaeche.breite && 
                               fahrzeug.kapazitaet.ladeflaeche.hoehe && 
                                `${fahrzeug.kapazitaet.ladeflaeche.laenge} × ${fahrzeug.kapazitaet.ladeflaeche.breite} × ${fahrzeug.kapazitaet.ladeflaeche.hoehe} cm`}
                            </div>
                            <div>
                              {fahrzeug.kapazitaet.volumen && `${fahrzeug.kapazitaet.volumen} m³`}
                            </div>
                            <div>
                              {fahrzeug.kapazitaet.ladegewicht && `${fahrzeug.kapazitaet.ladegewicht} kg`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Gauge size={16} className="mr-1 text-gray-400" />
                          {fahrzeug.kilometerstand ? `${fahrzeug.kilometerstand.toLocaleString('de-DE')} km` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TuevBadge tuevDatum={fahrzeug.tuev} tuevStatus={fahrzeug.tuevStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={fahrzeug.status || 'Nicht angegeben'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdown(fahrzeug._id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <MoreHorizontal size={20} />
                          </button>
                          
                          {dropdownOpen === fahrzeug._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                              <div className="py-1">
                                <Link 
                                  to={`/fahrzeuge/${fahrzeug._id}`}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Details anzeigen
                                </Link>
                                <Link 
                                  to={`/fahrzeuge/${fahrzeug._id}/bearbeiten`}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit size={14} className="inline mr-2" /> Bearbeiten
                                </Link>
                                <Link 
                                  to={`/fahrzeuge/${fahrzeug._id}/kilometerstand`}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Gauge size={14} className="inline mr-2" /> Kilometerstand aktualisieren
                                </Link>
                                <button 
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                  onClick={() => handleDeleteFahrzeug(fahrzeug._id)}
                                >
                                  <Trash2 size={14} className="inline mr-2" /> Löschen
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10">
                <Car size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Keine Fahrzeuge gefunden</p>
                <Link 
                  to="/fahrzeuge/neu"
                  className="mt-3 text-blue-600 hover:text-blue-800 inline-block"
                >
                  Erstes Fahrzeug anlegen
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Zeige <span className="font-medium">{indexOfFirstItem + 1}</span> bis{' '}
                  <span className="font-medium">
                    {indexOfLastItem > filteredFahrzeuge.length ? filteredFahrzeuge.length : indexOfLastItem}
                  </span>{' '}
                  von <span className="font-medium">{filteredFahrzeuge.length}</span> Einträgen
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Zurück</span>
                    <ChevronLeft size={18} />
                  </button>
                  
                  {[...Array(totalPages).keys()].map((number) => (
                    <button
                      key={number + 1}
                      onClick={() => paginate(number + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === number + 1
                          ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } text-sm font-medium`}
                    >
                      {number + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Weiter</span>
                    <ChevronRight size={18} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FahrzeugeList;
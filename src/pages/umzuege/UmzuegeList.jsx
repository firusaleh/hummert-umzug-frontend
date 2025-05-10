// src/pages/umzuege/UmzuegeList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  TruckElectric, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Download
} from 'lucide-react';

// Beispieldaten für Umzüge
const mockUmzuege = [
  { 
    id: 1, 
    kunde: 'Familie Becker', 
    typ: 'Privat', 
    status: 'Geplant', 
    datum: '15.05.2025', 
    startadresse: 'Rosenweg 8, 10115 Berlin', 
    zieladresse: 'Tulpenallee 23, 80333 München',
    mitarbeiter: 4,
    fahrzeuge: 2 
  },
  { 
    id: 2, 
    kunde: 'Technik GmbH', 
    typ: 'Gewerbe', 
    status: 'In Vorbereitung', 
    datum: '18.05.2025', 
    startadresse: 'Industrieweg 42, 70565 Stuttgart', 
    zieladresse: 'Gewerbestraße 101, 60313 Frankfurt',
    mitarbeiter: 8,
    fahrzeuge: 3
  },
  { 
    id: 3, 
    kunde: 'Dr. Schmidt', 
    typ: 'Senioren', 
    status: 'Abgeschlossen', 
    datum: '01.05.2025', 
    startadresse: 'Eichenallee 7, 20095 Hamburg', 
    zieladresse: 'Seniorenresidenz Am See, 24103 Kiel',
    mitarbeiter: 3,
    fahrzeuge: 1
  },
  { 
    id: 4, 
    kunde: 'Global Trading AG', 
    typ: 'International', 
    status: 'Geplant', 
    datum: '25.05.2025', 
    startadresse: 'Hafenstraße 10, 20457 Hamburg', 
    zieladresse: '123 Oxford Street, London, UK',
    mitarbeiter: 6,
    fahrzeuge: 2
  },
  { 
    id: 5, 
    kunde: 'Kunstgalerie Moderne', 
    typ: 'Spezialtransport', 
    status: 'In Vorbereitung', 
    datum: '20.05.2025', 
    startadresse: 'Museumsplatz 1, 80333 München', 
    zieladresse: 'Galeriering 42, 10117 Berlin',
    mitarbeiter: 5,
    fahrzeuge: 2
  },
];

const UmzuegeList = () => {
  const [umzuege, setUmzuege] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUmzuege, setFilteredUmzuege] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [typeFilter, setTypeFilter] = useState('Alle');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Simuliere API-Aufruf
  useEffect(() => {
    const fetchUmzuege = () => {
      setUmzuege(mockUmzuege);
      setFilteredUmzuege(mockUmzuege);
    };

    fetchUmzuege();
  }, []);

  // Filter und Suchfunktion
  useEffect(() => {
    let results = umzuege;
    
    // Suche
    if (searchTerm) {
      results = results.filter(
        (umzug) =>
          umzug.kunde.toLowerCase().includes(searchTerm.toLowerCase()) ||
          umzug.startadresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
          umzug.zieladresse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter nach Status
    if (statusFilter !== 'Alle') {
      results = results.filter((umzug) => umzug.status === statusFilter);
    }
    
    // Filter nach Typ
    if (typeFilter !== 'Alle') {
      results = results.filter((umzug) => umzug.typ === typeFilter);
    }
    
    setFilteredUmzuege(results);
    setCurrentPage(1); // Zurück zur ersten Seite nach Filteranwendung
  }, [searchTerm, statusFilter, typeFilter, umzuege]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUmzuege.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUmzuege.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Status Badge Komponente
  const StatusBadge = ({ status }) => {
    let bgColor, textColor;
    
    switch (status) {
      case 'Geplant':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'In Vorbereitung':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'Abgeschlossen':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Umzüge</h1>
        <Link 
          to="/umzuege/neu" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center"
        >
          <Plus size={16} className="mr-2" /> Neuer Umzug
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
              placeholder="Suche nach Kunde, Adresse..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Alle">Alle Status</option>
                <option value="Geplant">Geplant</option>
                <option value="In Vorbereitung">In Vorbereitung</option>
                <option value="Abgeschlossen">Abgeschlossen</option>
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <TruckElectric size={18} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="Alle">Alle Typen</option>
                <option value="Privat">Privat</option>
                <option value="Gewerbe">Gewerbe</option>
                <option value="Senioren">Senioren</option>
                <option value="International">International</option>
                <option value="Spezialtransport">Spezialtransport</option>
              </select>
            </div>
            
            <button 
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center"
            >
              <Download size={18} className="mr-2" /> Export
            </button>
          </div>
        </div>
      </div>
      
      {/* Umzugsliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ziel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((umzug) => (
                <tr key={umzug.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{umzug.kunde}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{umzug.typ}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={umzug.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      {umzug.datum}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center">
                      <MapPin size={16} className="mr-2 text-gray-400" />
                      <div className="truncate max-w-xs">{umzug.startadresse}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center">
                      <MapPin size={16} className="mr-2 text-gray-400" />
                      <div className="truncate max-w-xs">{umzug.zieladresse}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {umzug.mitarbeiter} MA, {umzug.fahrzeuge} Fahrzeuge
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      to={`/umzuege/${umzug.id}`} 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Details
                    </Link>
                    <Link 
                      to={`/umzuege/${umzug.id}/bearbeiten`} 
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Zeige <span className="font-medium">{indexOfFirstItem + 1}</span> bis{' '}
                  <span className="font-medium">
                    {indexOfLastItem > filteredUmzuege.length ? filteredUmzuege.length : indexOfLastItem}
                  </span>{' '}
                  von <span className="font-medium">{filteredUmzuege.length}</span> Einträgen
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

export default UmzuegeList;
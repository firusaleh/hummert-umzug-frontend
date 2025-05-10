// src/pages/mitarbeiter/MitarbeiterList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Phone,
  Mail,
  Calendar,
  TruckElectric,
  ClipboardList,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';

// Beispieldaten für Mitarbeiter
const mockMitarbeiter = [
  { 
    id: 1, 
    vorname: 'Max', 
    nachname: 'Mustermann',
    position: 'Teamleiter',
    telefon: '+49 176 1234567',
    email: 'max.mustermann@hummert.de',
    eintrittsdatum: '01.03.2020',
    aktivitaeten: {
      umzuege: 128,
      aufnahmen: 45
    },
    status: 'Aktiv',
    verfuegbarkeit: 'Verfügbar'
  },
  { 
    id: 2, 
    vorname: 'Anna', 
    nachname: 'Schmidt',
    position: 'Packer',
    telefon: '+49 176 2345678',
    email: 'anna.schmidt@hummert.de',
    eintrittsdatum: '15.07.2021',
    aktivitaeten: {
      umzuege: 87,
      aufnahmen: 0
    },
    status: 'Aktiv',
    verfuegbarkeit: 'Im Einsatz'
  },
  { 
    id: 3, 
    vorname: 'Lukas', 
    nachname: 'Meyer',
    position: 'Fahrer',
    telefon: '+49 176 3456789',
    email: 'lukas.meyer@hummert.de',
    eintrittsdatum: '10.04.2019',
    aktivitaeten: {
      umzuege: 142,
      aufnahmen: 0
    },
    status: 'Aktiv',
    verfuegbarkeit: 'Urlaub'
  },
  { 
    id: 4, 
    vorname: 'Sarah', 
    nachname: 'Müller',
    position: 'Aufnahmespezialistin',
    telefon: '+49 176 4567890',
    email: 'sarah.mueller@hummert.de',
    eintrittsdatum: '05.11.2021',
    aktivitaeten: {
      umzuege: 15,
      aufnahmen: 124
    },
    status: 'Aktiv',
    verfuegbarkeit: 'Verfügbar'
  },
  { 
    id: 5, 
    vorname: 'Markus', 
    nachname: 'Wolf',
    position: 'Aufnahme & Vertrieb',
    telefon: '+49 176 5678901',
    email: 'markus.wolf@hummert.de',
    eintrittsdatum: '15.01.2018',
    aktivitaeten: {
      umzuege: 32,
      aufnahmen: 210
    },
    status: 'Aktiv',
    verfuegbarkeit: 'Verfügbar'
  },
];

const MitarbeiterList = () => {
  const [mitarbeiter, setMitarbeiter] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMitarbeiter, setFilteredMitarbeiter] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [positionFilter, setPositionFilter] = useState('Alle');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Simuliere API-Aufruf
  useEffect(() => {
    const fetchMitarbeiter = () => {
      setMitarbeiter(mockMitarbeiter);
      setFilteredMitarbeiter(mockMitarbeiter);
    };

    fetchMitarbeiter();
  }, []);

  // Filter und Suchfunktion
  useEffect(() => {
    let results = mitarbeiter;
    
    // Suche
    if (searchTerm) {
      results = results.filter(
        (ma) =>
          `${ma.vorname} ${ma.nachname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ma.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ma.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter nach Status
    if (statusFilter !== 'Alle') {
      results = results.filter((ma) => ma.status === statusFilter);
    }
    
    // Filter nach Position
    if (positionFilter !== 'Alle') {
      results = results.filter((ma) => ma.position === positionFilter);
    }
    
    setFilteredMitarbeiter(results);
    setCurrentPage(1); // Zurück zur ersten Seite nach Filteranwendung
  }, [searchTerm, statusFilter, positionFilter, mitarbeiter]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMitarbeiter.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMitarbeiter.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Dropdown-Menü für Aktionen
  const toggleDropdown = (id) => {
    if (dropdownOpen === id) {
      setDropdownOpen(null);
    } else {
      setDropdownOpen(id);
    }
  };

  // Verfügbarkeitsstatus-Anzeige
  const VerfuegbarkeitsBadge = ({ status }) => {
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
      case 'Urlaub':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        break;
      case 'Krank':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
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

  // Liste der verfügbaren Positionen aus den Daten extrahieren
  const availablePositions = [...new Set(mitarbeiter.map(ma => ma.position))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mitarbeiter</h1>
        <Link 
          to="/mitarbeiter/neu" 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center"
        >
          <UserPlus size={16} className="mr-2" /> Neuer Mitarbeiter
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
              placeholder="Suche nach Name, E-Mail..."
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
                <option value="Aktiv">Aktiv</option>
                <option value="Inaktiv">Inaktiv</option>
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
              >
                <option value="Alle">Alle Positionen</option>
                {availablePositions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mitarbeiterliste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mitarbeiter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktivitäten
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verfügbarkeit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((ma) => (
                <tr key={ma.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
                        {ma.vorname[0]}{ma.nachname[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ma.vorname} {ma.nachname}</div>
                        <div className="text-sm text-gray-500">{ma.status}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{ma.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center">
                        <Phone size={14} className="mr-1 text-gray-400" />
                        {ma.telefon}
                      </div>
                      <div className="flex items-center mt-1">
                        <Mail size={14} className="mr-1 text-gray-400" />
                        {ma.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      {ma.eintrittsdatum}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center">
                        <TruckElectric size={14} className="mr-1 text-gray-400" />
                        {ma.aktivitaeten.umzuege} Umzüge
                      </div>
                      <div className="flex items-center mt-1">
                        <ClipboardList size={14} className="mr-1 text-gray-400" />
                        {ma.aktivitaeten.aufnahmen} Aufnahmen
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <VerfuegbarkeitsBadge status={ma.verfuegbarkeit} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={() => toggleDropdown(ma.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                      
                      {dropdownOpen === ma.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                          <div className="py-1">
                            <Link 
                              to={`/mitarbeiter/${ma.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Details anzeigen
                            </Link>
                            <Link 
                              to={`/mitarbeiter/${ma.id}/bearbeiten`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit size={14} className="inline mr-2" /> Bearbeiten
                            </Link>
                            <button 
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Zeige <span className="font-medium">{indexOfFirstItem + 1}</span> bis{' '}
                  <span className="font-medium">
                    {indexOfLastItem > filteredMitarbeiter.length ? filteredMitarbeiter.length : indexOfLastItem}
                  </span>{' '}
                  von <span className="font-medium">{filteredMitarbeiter.length}</span> Einträgen
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

export default MitarbeiterList;
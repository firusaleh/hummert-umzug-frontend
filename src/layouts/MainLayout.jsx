// src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  TruckElectric, 
  ClipboardList, 
  Users, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Clock,
  DollarSign,
  ChevronDown,
  BarChart,
  CreditCard
} from 'lucide-react';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSubMenu = (name) => {
    setExpandedMenus({
      ...expandedMenus,
      [name]: !expandedMenus[name]
    });
  };

  // Neue Logout-Funktion
  const handleLogout = () => {
    // Token und Benutzerdaten aus dem localStorage entfernen
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Zur Login-Seite navigieren
    navigate('/login');
  };

  const navigationItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
    { name: 'Umzüge', icon: <TruckElectric size={20} />, path: '/umzuege' },
    { name: 'Aufnahmen', icon: <ClipboardList size={20} />, path: '/aufnahmen' },
    { name: 'Mitarbeiter', icon: <Users size={20} />, path: '/mitarbeiter' },
    { name: 'Zeiterfassung', icon: <Clock size={20} />, path: '/zeiterfassung' },
    { 
      name: 'Finanzen', 
      icon: <DollarSign size={20} />, 
      path: '/finanzen',
      subItems: [
        { name: 'Übersicht', icon: <BarChart size={16} />, path: '/finanzen' },
        { name: 'Monatsansicht', icon: <Calendar size={16} />, path: '/finanzen/monatsansicht' },
        { name: 'Rechnungen', icon: <CreditCard size={16} />, path: '/finanzen/rechnungen' }
      ]
    },
    { name: 'Zeitachse', icon: <Calendar size={20} />, path: '/zeitachse' },
    { name: 'Benachrichtigungen', icon: <Bell size={20} />, path: '/benachrichtigungen' },
    { name: 'Einstellungen', icon: <Settings size={20} />, path: '/einstellungen' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-blue-900 text-white transition-all duration-300 ease-in-out fixed h-full z-10 overflow-y-auto`}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-800">
          <div className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
            <h1 className="text-xl font-bold">Hummert Umzug</h1>
          </div>
          <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-blue-800">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-6">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.name} className="mb-2">
                {item.subItems ? (
                  <div>
                    <button
                      className={`w-full flex items-center justify-between py-3 px-4 ${
                        location.pathname.startsWith(item.path)
                          ? 'bg-blue-800 border-l-4 border-white'
                          : 'hover:bg-blue-800'
                      }`}
                      onClick={() => toggleSubMenu(item.name)}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">{item.icon}</span>
                        <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
                          {item.name}
                        </span>
                      </div>
                      {isSidebarOpen && (
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform duration-200 ${expandedMenus[item.name] ? 'transform rotate-180' : ''}`}
                        />
                      )}
                    </button>
                    
                    {(isSidebarOpen || (!isSidebarOpen && location.pathname.startsWith(item.path))) && expandedMenus[item.name] && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {item.subItems.map(subItem => (
                          <li key={subItem.path}>
                            <Link
                              to={subItem.path}
                              className={`flex items-center py-2 px-4 text-sm ${
                                location.pathname === subItem.path
                                  ? 'bg-blue-700 rounded-md'
                                  : 'hover:bg-blue-700 rounded-md'
                              }`}
                            >
                              <span className="mr-3">{subItem.icon}</span>
                              <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
                                {subItem.name}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center py-3 px-4 ${
                      location.pathname === item.path
                        ? 'bg-blue-800 border-l-4 border-white'
                        : 'hover:bg-blue-800'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>
                      {item.name}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full border-t border-blue-800 p-4">
          {/* Hier wird der Link durch einen Button ersetzt */}
          <button
            onClick={handleLogout}
            className="flex items-center py-2 px-4 hover:bg-blue-800 rounded w-full text-left"
          >
            <LogOut size={20} className="mr-3" />
            <span className={`${isSidebarOpen ? 'block' : 'hidden'}`}>Abmelden</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <header className="bg-white shadow-md p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {location.pathname.startsWith('/finanzen/monatsansicht') 
                ? 'Finanzen: Monatsansicht'
                : navigationItems.find(item => {
                    if (item.path === location.pathname) return true;
                    if (item.subItems) {
                      return item.subItems.some(subItem => subItem.path === location.pathname);
                    }
                    return false;
                  })?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center">
              <Link to="/benachrichtigungen" className="mr-4 relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  3
                </span>
              </Link>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">
                  AM
                </div>
                <span className="text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
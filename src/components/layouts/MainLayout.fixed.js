// src/components/layouts/MainLayout.fixed.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  TruckMoving as Truck, 
  ClipboardList, 
  Users, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useNotification } from '../../context/NotificationContext';
import PropTypes from 'prop-types';

const MainLayout = ({ children, hideNavigation = false }) => {
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen, theme } = useApp();
  const { notifications, unreadCount } = useNotification();
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile, setSidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigationItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/dashboard', permission: null },
    { name: 'Umzüge', icon: <Truck size={20} />, path: '/umzuege', permission: 'umzuege.view' },
    { name: 'Aufnahmen', icon: <ClipboardList size={20} />, path: '/aufnahmen', permission: 'aufnahmen.view' },
    { name: 'Mitarbeiter', icon: <Users size={20} />, path: '/mitarbeiter', permission: 'mitarbeiter.view' },
    { name: 'Zeitachse', icon: <Calendar size={20} />, path: '/zeitachse', permission: 'zeitachse.view' },
    { name: 'Benachrichtigungen', icon: <Bell size={20} />, path: '/benachrichtigungen', permission: null },
    { name: 'Einstellungen', icon: <Settings size={20} />, path: '/einstellungen', permission: null }
  ];

  // Filter navigation items based on permissions
  const filteredNavigationItems = navigationItems.filter(item => {
    if (!item.permission) return true;
    return user?.permissions?.includes(item.permission);
  });

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    const name = user.name || user.username || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (hideNavigation) {
    return <div className="min-h-screen bg-gray-100">{children}</div>;
  }

  return (
    <div className={`flex h-screen bg-gray-100 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-blue-900 text-white transition-all duration-300 ease-in-out ${
          isMobile ? 'fixed' : 'relative'
        } h-full z-50 ${
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-800">
          <div className={`${sidebarOpen ? 'block' : 'hidden'} flex items-center`}>
            <h1 className="text-xl font-bold">Hummert Umzug</h1>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="p-2 rounded-full hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label={sidebarOpen ? 'Sidebar zuklappen' : 'Sidebar aufklappen'}
          >
            {isMobile ? (
              <X size={20} />
            ) : sidebarOpen ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>

        <nav className="mt-6" role="navigation">
          <ul>
            {filteredNavigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isNotifications = item.path === '/benachrichtigungen';
              
              return (
                <li key={item.name} className="mb-2">
                  <Link
                    to={item.path}
                    className={`flex items-center py-3 px-4 transition-colors ${
                      isActive
                        ? 'bg-blue-800 border-l-4 border-white'
                        : 'hover:bg-blue-800'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="mr-3 relative">
                      {item.icon}
                      {isNotifications && unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </span>
                    <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-full border-t border-blue-800 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full py-2 px-4 hover:bg-blue-800 rounded transition-colors"
            aria-label="Abmelden"
          >
            <LogOut size={20} className="mr-3" />
            <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Abmelden</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${!isMobile && sidebarOpen ? 'ml-0' : 'ml-0'} flex flex-col`}>
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center">
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="mr-4 p-2 rounded-full hover:bg-gray-100"
                  aria-label="Menü öffnen"
                >
                  <Menu size={24} />
                </button>
              )}
              <h2 className="text-xl font-semibold text-gray-800">
                {filteredNavigationItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                to="/benachrichtigungen" 
                className="relative p-2 hover:bg-gray-100 rounded-full"
                aria-label={`Benachrichtigungen ${unreadCount > 0 ? `(${unreadCount} ungelesen)` : ''}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">
                  {getUserInitials()}
                </div>
                <span className="text-gray-700 hidden sm:block">
                  {user?.name || user?.username || 'User'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  hideNavigation: PropTypes.bool
};

export default MainLayout;
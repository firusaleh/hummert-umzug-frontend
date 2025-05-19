// pages/benachrichtigungen/Benachrichtigungen.jsx - Updated with infinite scroll
import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Filter, Search, X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import InfiniteScrollList from '../../components/common/InfiniteScrollList';
import LoadMoreButton from '../../components/common/LoadMoreButton';
import useCursorPagination from '../../hooks/useCursorPagination';
import api from '../../services/api';

const Benachrichtigungen = () => {
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('infinite'); // 'infinite' or 'loadmore'
  const [searchTerm, setSearchTerm] = useState('');

  const {
    items: benachrichtigungen,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    changeFilters
  } = useCursorPagination('/benachrichtigungen', {
    initialPageSize: 20,
    initialFilters: {}
  });

  // Handle filter changes
  React.useEffect(() => {
    const filters = {};
    if (filterType) filters.typ = filterType;
    if (filterStatus) filters.gelesen = filterStatus === 'gelesen';
    if (searchTerm) filters.search = searchTerm;
    changeFilters(filters);
  }, [filterType, filterStatus, searchTerm, changeFilters]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/benachrichtigungen/${id}/gelesen`);
      refresh();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/benachrichtigungen/alle-gelesen');
      refresh();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/benachrichtigungen/${id}`);
      refresh();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (typ) => {
    const iconClass = "h-5 w-5";
    switch (typ) {
      case 'info':
        return <Bell className={`${iconClass} text-blue-500`} />;
      case 'warnung':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'erfolg':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'fehler':
        return <XCircle className={`${iconClass} text-red-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Heute, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Gestern, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderNotification = (benachrichtigung, index) => {
    const isUnread = !benachrichtigung.gelesen;
    
    return (
      <div
        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
          isUnread ? 'bg-blue-50' : ''
        }`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(benachrichtigung.typ)}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                  {benachrichtigung.titel}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {formatDate(benachrichtigung.createdAt)}
                  </span>
                  <div className="flex space-x-1">
                    {isUnread && (
                      <button
                        onClick={() => markAsRead(benachrichtigung._id)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                        title="Als gelesen markieren"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(benachrichtigung._id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                      title="Löschen"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-600">{benachrichtigung.inhalt}</p>
              {benachrichtigung.linkUrl && (
                <a
                  href={benachrichtigung.linkUrl}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 inline-block"
                >
                  Details anzeigen →
                </a>
              )}
              {benachrichtigung.bezug && benachrichtigung.bezug.typ && (
                <span className="mt-2 text-xs text-gray-500">
                  Bezug: {benachrichtigung.bezug.typ}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Benachrichtigungen</h1>
        <button
          onClick={markAllAsRead}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center"
        >
          <CheckCheck size={16} className="mr-2" /> Alle als gelesen markieren
        </button>
      </div>

      {/* Filters and view mode selector */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Type filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Alle Typen</option>
                <option value="info">Info</option>
                <option value="warnung">Warnung</option>
                <option value="erfolg">Erfolg</option>
                <option value="fehler">Fehler</option>
                <option value="erinnerung">Erinnerung</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={18} className="text-gray-400" />
              </div>
              <select
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Alle</option>
                <option value="ungelesen">Ungelesen</option>
                <option value="gelesen">Gelesen</option>
              </select>
            </div>
          </div>

          {/* View mode selector */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('infinite')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'infinite'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Infinite Scroll
            </button>
            <button
              onClick={() => setViewMode('loadmore')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'loadmore'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Load More
            </button>
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {viewMode === 'infinite' ? (
          <InfiniteScrollList
            items={benachrichtigungen}
            renderItem={renderNotification}
            loadMore={loadMore}
            hasMore={hasMore}
            loading={loading}
            error={error}
            className="max-h-[600px]"
            emptyMessage="Keine Benachrichtigungen vorhanden"
          />
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {benachrichtigungen.map((benachrichtigung, index) => (
                <div key={benachrichtigung._id || index}>
                  {renderNotification(benachrichtigung, index)}
                </div>
              ))}
            </div>
            <LoadMoreButton
              onClick={loadMore}
              loading={loading}
              hasMore={hasMore}
              text="Weitere Benachrichtigungen laden"
              loadingText="Lade Benachrichtigungen..."
              noMoreText="Alle Benachrichtigungen geladen"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Benachrichtigungen;
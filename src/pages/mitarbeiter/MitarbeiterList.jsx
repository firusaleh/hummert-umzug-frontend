// MitarbeiterList.jsx - Employee list with real data
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useMitarbeiter } from '../../context/MitarbeiterContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

const MitarbeiterList = () => {
  const navigate = useNavigate();
  const {
    mitarbeiter,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    setPagination,
    fetchMitarbeiter,
    deleteMitarbeiter,
    clearError
  } = useMitarbeiter();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState(filters.verfuegbar || '');
  const [positionFilter, setPositionFilter] = useState(filters.position || '');

  // Apply search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, setFilters]);

  // Apply filters
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      verfuegbar: statusFilter === '' ? null : statusFilter === 'verfuegbar',
      position: positionFilter
    }));
  }, [statusFilter, positionFilter, setFilters]);

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await deleteMitarbeiter(id);
      setDeleteConfirm(null);
    } catch (error) {
      // Error is handled in context
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
    fetchMitarbeiter({ page });
  };

  // Refresh data
  const handleRefresh = () => {
    fetchMitarbeiter();
  };

  if (loading && mitarbeiter.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Mitarbeiter
            </h1>
            <p className="mt-2 text-gray-600">
              Verwalten Sie Ihre Mitarbeiter und deren Verfügbarkeit
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/mitarbeiter/neu"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Neuer Mitarbeiter
            </Link>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Fehler</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-500"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Alle Status</option>
              <option value="verfuegbar">Verfügbar</option>
              <option value="nicht_verfuegbar">Nicht verfügbar</option>
            </select>
          </div>

          {/* Position Filter */}
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">Alle Positionen</option>
              <option value="Umzugshelfer">Umzugshelfer</option>
              <option value="Fahrer">Fahrer</option>
              <option value="Vorarbeiter">Vorarbeiter</option>
              <option value="Auszubildender">Auszubildender</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        {pagination.total} Mitarbeiter gefunden
      </div>

      {/* Employee List */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {mitarbeiter.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Mitarbeiter</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || statusFilter || positionFilter
                ? 'Keine Mitarbeiter gefunden. Versuchen Sie andere Filterkriterien.'
                : 'Beginnen Sie mit dem Hinzufügen eines neuen Mitarbeiters.'}
            </p>
            {!filters.search && !statusFilter && !positionFilter && (
              <div className="mt-6">
                <Link
                  to="/mitarbeiter/neu"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Neuer Mitarbeiter
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mitarbeiter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kontakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arbeitszeiten
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mitarbeiter.map((mitarbeiter) => (
                    <tr key={mitarbeiter._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {mitarbeiter.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {mitarbeiter.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {mitarbeiter.personalNummer || mitarbeiter._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {mitarbeiter.telefon || '-'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {mitarbeiter.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{mitarbeiter.position}</div>
                        {mitarbeiter.qualifikationen && mitarbeiter.qualifikationen.length > 0 && (
                          <div className="text-sm text-gray-500">
                            {mitarbeiter.qualifikationen.length} Qualifikationen
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {mitarbeiter.verfuegbar ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verfügbar
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Nicht verfügbar
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {mitarbeiter.arbeitsstunden || 0}h / Woche
                        </div>
                        <div className="text-sm text-gray-500">
                          {mitarbeiter.arbeitszeiten?.length || 0} Einträge
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/mitarbeiter/${mitarbeiter._id}`}
                            className="text-gray-600 hover:text-gray-900"
                            title="Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/mitarbeiter/${mitarbeiter._id}/bearbeiten`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(mitarbeiter._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {mitarbeiter.map((mitarbeiter) => (
                <div key={mitarbeiter._id} className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {mitarbeiter.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">{mitarbeiter.name}</h3>
                        <p className="text-sm text-gray-500">{mitarbeiter.position}</p>
                      </div>
                    </div>
                    {mitarbeiter.verfuegbar ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verfügbar
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Nicht verfügbar
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {mitarbeiter.telefon || '-'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {mitarbeiter.email || '-'}
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {mitarbeiter.arbeitsstunden || 0}h / Woche
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/mitarbeiter/${mitarbeiter._id}`}
                        className="text-gray-600 hover:text-gray-900 p-1"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/mitarbeiter/${mitarbeiter._id}/bearbeiten`}
                        className="text-blue-600 hover:text-blue-900 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(mitarbeiter._id)}
                        className="text-red-600 hover:text-red-900 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Mitarbeiter löschen
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MitarbeiterList;
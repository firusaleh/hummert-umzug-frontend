// MitarbeiterDetails.jsx - Employee details view with real data
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Clock,
  Euro,
  FileText,
  Download,
  Plus,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  CalendarDays
} from 'lucide-react';
import { useMitarbeiter } from '../../context/MitarbeiterContext';
import mitarbeiterService from '../../services/mitarbeiterService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MitarbeiterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const {
    currentMitarbeiter,
    loading,
    error,
    fetchMitarbeiterById,
    deleteMitarbeiter,
    clearError
  } = useMitarbeiter();

  const [arbeitszeiten, setArbeitszeiten] = useState([]);
  const [statistik, setStatistik] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Load employee data
  useEffect(() => {
    if (id) {
      fetchMitarbeiterById(id);
      loadArbeitszeiten();
      loadStatistik();
    }
  }, [id]);

  // Load working hours
  const loadArbeitszeiten = async () => {
    try {
      const result = await mitarbeiterService.getArbeitszeiten(id, {
        limit: 10,
        sort: '-datum'
      });
      setArbeitszeiten(result.data);
    } catch (error) {
      console.error('Error loading Arbeitszeiten:', error);
    }
  };

  // Load statistics
  const loadStatistik = async () => {
    setLoadingStats(true);
    try {
      const result = await mitarbeiterService.getStatistics(id);
      setStatistik(result.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteMitarbeiter(id);
      navigate('/mitarbeiter');
    } catch (error) {
      // Error is handled in context
    }
    setDeleteConfirm(false);
  };

  // Generate monthly report
  const generateMonatsbericht = async () => {
    const now = new Date();
    try {
      const result = await mitarbeiterService.getMonatsbericht(
        id,
        now.getFullYear(),
        now.getMonth() + 1
      );
      // Handle download
      console.log('Report generated:', result);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  if (loading || !currentMitarbeiter) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const mitarbeiter = currentMitarbeiter;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/mitarbeiter')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Zurück zur Übersicht
        </button>

        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-5">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-medium text-blue-600">
                  {mitarbeiter.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{mitarbeiter.name}</h1>
              <p className="text-lg text-gray-600">{mitarbeiter.position}</p>
              <div className="mt-2">
                {mitarbeiter.verfuegbar ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verfügbar
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <XCircle className="h-4 w-4 mr-1" />
                    Nicht verfügbar
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to={`/mitarbeiter/${id}/bearbeiten`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Fehler</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Informationen
          </button>
          <button
            onClick={() => setActiveTab('arbeitszeiten')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'arbeitszeiten'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Arbeitszeiten
          </button>
          <button
            onClick={() => setActiveTab('statistik')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statistik'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Statistiken
          </button>
          <button
            onClick={() => setActiveTab('dokumente')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dokumente'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dokumente
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Kontaktdaten</h2>
            <dl className="space-y-3">
              <div className="flex items-center">
                <dt className="flex items-center text-sm font-medium text-gray-500 w-32">
                  <Phone className="h-4 w-4 mr-2" />
                  Telefon
                </dt>
                <dd className="text-sm text-gray-900">{mitarbeiter.telefon || '-'}</dd>
              </div>
              <div className="flex items-center">
                <dt className="flex items-center text-sm font-medium text-gray-500 w-32">
                  <Mail className="h-4 w-4 mr-2" />
                  E-Mail
                </dt>
                <dd className="text-sm text-gray-900">
                  <a href={`mailto:${mitarbeiter.email}`} className="text-blue-600 hover:text-blue-800">
                    {mitarbeiter.email}
                  </a>
                </dd>
              </div>
              <div className="flex items-start">
                <dt className="flex items-center text-sm font-medium text-gray-500 w-32">
                  <MapPin className="h-4 w-4 mr-2" />
                  Adresse
                </dt>
                <dd className="text-sm text-gray-900">
                  {mitarbeiter.adresse ? (
                    <>
                      {mitarbeiter.adresse.strasse} {mitarbeiter.adresse.hausnummer}<br />
                      {mitarbeiter.adresse.plz} {mitarbeiter.adresse.ort}
                    </>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Personal Information */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Persönliche Daten</h2>
            <dl className="space-y-3">
              <div className="flex">
                <dt className="text-sm font-medium text-gray-500 w-32">Personalnummer</dt>
                <dd className="text-sm text-gray-900">
                  {mitarbeiter.personalNummer || mitarbeiter._id.slice(-6).toUpperCase()}
                </dd>
              </div>
              <div className="flex">
                <dt className="text-sm font-medium text-gray-500 w-32">Geburtsdatum</dt>
                <dd className="text-sm text-gray-900">
                  {mitarbeiter.geburtsdatum 
                    ? new Date(mitarbeiter.geburtsdatum).toLocaleDateString('de-DE')
                    : '-'}
                </dd>
              </div>
              <div className="flex">
                <dt className="text-sm font-medium text-gray-500 w-32">Eintrittsdatum</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(mitarbeiter.createdAt).toLocaleDateString('de-DE')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Employment Details */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Beschäftigungsdetails</h2>
            <dl className="space-y-3">
              <div className="flex items-center">
                <dt className="flex items-center text-sm font-medium text-gray-500 w-32">
                  <Clock className="h-4 w-4 mr-2" />
                  Wochenstunden
                </dt>
                <dd className="text-sm text-gray-900">{mitarbeiter.arbeitsstunden || 40}h</dd>
              </div>
              <div className="flex items-center">
                <dt className="flex items-center text-sm font-medium text-gray-500 w-32">
                  <Euro className="h-4 w-4 mr-2" />
                  Stundenlohn
                </dt>
                <dd className="text-sm text-gray-900">
                  {mitarbeiter.stundenlohn ? `${mitarbeiter.stundenlohn.toFixed(2)} €` : '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Qualifications */}
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-gray-400" />
              Qualifikationen
            </h2>
            {mitarbeiter.qualifikationen && mitarbeiter.qualifikationen.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mitarbeiter.qualifikationen.map((qual, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {qual}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Keine Qualifikationen hinterlegt</p>
            )}
          </div>

          {/* Emergency Contact */}
          {mitarbeiter.notfallkontakt && mitarbeiter.notfallkontakt.name && (
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notfallkontakt</h2>
              <dl className="space-y-3">
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-32">Name</dt>
                  <dd className="text-sm text-gray-900">{mitarbeiter.notfallkontakt.name}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-32">Telefon</dt>
                  <dd className="text-sm text-gray-900">{mitarbeiter.notfallkontakt.telefon}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-32">Beziehung</dt>
                  <dd className="text-sm text-gray-900">{mitarbeiter.notfallkontakt.beziehung}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Notes */}
          {mitarbeiter.notizen && (
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 lg:col-span-2">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notizen</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{mitarbeiter.notizen}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'arbeitszeiten' && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Arbeitszeiten</h2>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Zeit erfassen
              </button>
            </div>
          </div>
          
          {arbeitszeiten.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Beginn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ende
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stunden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Projekt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {arbeitszeiten.map((zeit) => (
                    <tr key={zeit._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(zeit.datum).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {zeit.beginn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {zeit.ende}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {zeit.stunden}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {zeit.projekt || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Keine Arbeitszeiten erfasst</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'statistik' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {loadingStats ? (
            <div className="lg:col-span-3 flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : statistik ? (
            <>
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Gesamtstunden</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {statistik.gesamtstunden || 0}h
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
              </div>

              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Durchschnitt/Woche</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {statistik.durchschnittProWoche || 0}h
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
              </div>

              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Abgeschlossene Projekte</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {statistik.abgeschlosseneProjekte || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-gray-400" />
                </div>
              </div>

              <div className="lg:col-span-3 bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monatsbericht</h3>
                <button
                  onClick={generateMonatsbericht}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Aktuellen Monat herunterladen
                </button>
              </div>
            </>
          ) : (
            <div className="lg:col-span-3 text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Keine Statistiken verfügbar</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dokumente' && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Dokumente</h2>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Dokument hochladen
              </button>
            </div>
          </div>
          
          {mitarbeiter.dokumente && mitarbeiter.dokumente.length > 0 ? (
            <div className="p-6">
              <div className="space-y-3">
                {mitarbeiter.dokumente.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          Hochgeladen am {new Date(doc.uploadedAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Keine Dokumente vorhanden</p>
            </div>
          )}
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
              Sind Sie sicher, dass Sie {mitarbeiter.name} löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
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

export default MitarbeiterDetails;
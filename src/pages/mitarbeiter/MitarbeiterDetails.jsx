// src/pages/mitarbeiter/MitarbeiterDetails.jsx - Enhanced with full API integration
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Euro,
  CreditCard,
  Users,
  FileText,
  Clock,
  Award,
  Car,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { mitarbeiterService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

// Status Badge Component
const StatusBadge = ({ isActive }) => {
  return (
    <span className={`px-3 py-1 inline-flex items-center text-sm leading-5 font-semibold rounded-full ${
      isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isActive ? (
        <>
          <UserCheck className="w-4 h-4 mr-1" />
          Aktiv
        </>
      ) : (
        <>
          <UserX className="w-4 h-4 mr-1" />
          Inaktiv
        </>
      )}
    </span>
  );
};

// Position Badge Component
const PositionBadge = ({ position }) => {
  const positionColors = {
    'Geschäftsführer': 'bg-purple-100 text-purple-800',
    'Teamleiter': 'bg-blue-100 text-blue-800',
    'Träger': 'bg-green-100 text-green-800',
    'Fahrer': 'bg-yellow-100 text-yellow-800',
    'Praktikant': 'bg-orange-100 text-orange-800',
    'Verkäufer': 'bg-pink-100 text-pink-800',
    'Verwaltung': 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${positionColors[position] || 'bg-gray-100 text-gray-800'}`}>
      {position}
    </span>
  );
};

const MitarbeiterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mitarbeiter, setMitarbeiter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [arbeitszeitenStats, setArbeitszeitenStats] = useState(null);

  // Load Mitarbeiter data
  useEffect(() => {
    loadMitarbeiterData();
    loadArbeitszeitenStats();
  }, [id]);

  const loadMitarbeiterData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mitarbeiterService.getById(id);
      setMitarbeiter(response.data);
    } catch (err) {
      console.error('Error loading Mitarbeiter:', err);
      setError(err.response?.data?.message || 'Fehler beim Laden der Mitarbeiterdaten');
      toast.error('Fehler beim Laden der Mitarbeiterdaten');
    } finally {
      setLoading(false);
    }
  };

  const loadArbeitszeitenStats = async () => {
    try {
      const response = await mitarbeiterService.getArbeitszeiten(id, {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      
      if (response.data && Array.isArray(response.data)) {
        const totalHours = response.data.reduce((sum, az) => sum + (az.berechneteStunden || 0), 0);
        setArbeitszeitenStats({
          currentMonth: totalHours,
          count: response.data.length
        });
      }
    } catch (err) {
      console.error('Error loading Arbeitszeiten stats:', err);
    }
  };

  // Handle status toggle
  const handleStatusToggle = async () => {
    try {
      await mitarbeiterService.update(id, { isActive: !mitarbeiter.isActive });
      await loadMitarbeiterData();
      toast.success(`Mitarbeiter ${!mitarbeiter.isActive ? 'aktiviert' : 'deaktiviert'}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Fehler beim Ändern des Status');
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    if (!window.confirm(`Möchten Sie ${mitarbeiter.vorname} ${mitarbeiter.nachname} wirklich löschen?`)) {
      return;
    }

    try {
      setDeleting(true);
      await mitarbeiterService.delete(id);
      toast.success('Mitarbeiter erfolgreich gelöscht');
      navigate('/mitarbeiter');
    } catch (err) {
      console.error('Error deleting Mitarbeiter:', err);
      toast.error('Fehler beim Löschen des Mitarbeiters');
    } finally {
      setDeleting(false);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('dokument', file);

    try {
      setUploadingDoc(true);
      await mitarbeiterService.uploadDokument(id, formData);
      await loadMitarbeiterData();
      toast.success('Dokument erfolgreich hochgeladen');
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error('Fehler beim Hochladen des Dokuments');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Format address
  const formatAddress = (adresse) => {
    if (!adresse) return 'Keine Adresse angegeben';
    const { strasse, hausnummer, plz, ort } = adresse;
    return `${strasse} ${hausnummer}, ${plz} ${ort}`;
  };

  // Calculate age
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={loadMitarbeiterData} />;
  }

  if (!mitarbeiter) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        Mitarbeiter nicht gefunden.
      </div>
    );
  }

  const age = calculateAge(mitarbeiter.geburtstag);

  return (
    <div>
      {/* Header with navigation and actions */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/mitarbeiter"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Übersicht
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {mitarbeiter.vorname} {mitarbeiter.nachname}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleStatusToggle}
            className={`${
              mitarbeiter.isActive ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'
            } text-white font-bold py-2 px-4 rounded inline-flex items-center`}
          >
            {mitarbeiter.isActive ? (
              <>
                <UserX className="w-4 h-4 mr-2" />
                Deaktivieren
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Aktivieren
              </>
            )}
          </button>
          <Link
            to={`/mitarbeiter/${id}/bearbeiten`}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Bearbeiten
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Löschen...' : 'Löschen'}
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Main information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info and photo */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Grundinformationen</h2>
              <StatusBadge isActive={mitarbeiter.isActive} />
            </div>

            <div className="flex items-start space-x-6">
              {/* Profile image */}
              <div className="flex-shrink-0">
                {mitarbeiter.profilbild ? (
                  <img
                    src={mitarbeiter.profilbild}
                    alt={`${mitarbeiter.vorname} ${mitarbeiter.nachname}`}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl text-gray-500">
                      {mitarbeiter.vorname?.charAt(0)}{mitarbeiter.nachname?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Basic info */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <div className="mt-1">
                    <PositionBadge position={mitarbeiter.position} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Abteilung</p>
                  <p className="font-medium">{mitarbeiter.abteilung || 'Nicht zugewiesen'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Einstellungsdatum</p>
                  <p className="font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {mitarbeiter.einstellungsdatum 
                      ? format(new Date(mitarbeiter.einstellungsdatum), 'dd.MM.yyyy', { locale: de })
                      : 'Nicht angegeben'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Geburtstag</p>
                  <p className="font-medium">
                    {mitarbeiter.geburtstag 
                      ? `${format(new Date(mitarbeiter.geburtstag), 'dd.MM.yyyy', { locale: de })} ${age ? `(${age} Jahre)` : ''}`
                      : 'Nicht angegeben'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stundensatz</p>
                  <p className="font-medium flex items-center">
                    <Euro className="w-4 h-4 mr-1 text-gray-400" />
                    {mitarbeiter.gehalt?.stundensatz || '0'} €/h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verfügbarkeit</p>
                  <p className="font-medium">{mitarbeiter.verfuegbarkeit || 'Nicht angegeben'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Kontaktdaten</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Telefon</p>
                  <a href={`tel:${mitarbeiter.telefon}`} className="text-blue-600 hover:underline">
                    {mitarbeiter.telefon || 'Nicht angegeben'}
                  </a>
                </div>
              </div>
              
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">E-Mail</p>
                  <a href={`mailto:${mitarbeiter.email}`} className="text-blue-600 hover:underline">
                    {mitarbeiter.email || mitarbeiter.userId?.email || 'Nicht angegeben'}
                  </a>
                </div>
              </div>
              
              <div className="flex items-start md:col-span-2">
                <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="font-medium">{formatAddress(mitarbeiter.adresse)}</p>
                </div>
              </div>
            </div>

            {/* Emergency contact */}
            {mitarbeiter.notfallkontakt?.name && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Notfallkontakt
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{mitarbeiter.notfallkontakt.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium">{mitarbeiter.notfallkontakt.telefon}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Beziehung</p>
                    <p className="font-medium">{mitarbeiter.notfallkontakt.beziehung}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Skills and licenses */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Qualifikationen</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  Fähigkeiten
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mitarbeiter.faehigkeiten?.length > 0 ? (
                    mitarbeiter.faehigkeiten.map((faehigkeit, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {faehigkeit}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Keine Fähigkeiten angegeben</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                  <Car className="w-4 h-4 mr-2" />
                  Führerscheinklassen
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mitarbeiter.fuehrerscheinklassen?.length > 0 ? (
                    mitarbeiter.fuehrerscheinklassen.map((klasse, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                      >
                        {klasse}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Keine Führerscheinklassen angegeben</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Working hours statistics */}
          {arbeitszeitenStats && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Arbeitszeiten
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-500">Stunden diesen Monat</p>
                  <p className="text-2xl font-bold text-gray-900">{arbeitszeitenStats.currentMonth.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-500">Arbeitstage</p>
                  <p className="text-2xl font-bold text-gray-900">{arbeitszeitenStats.count}</p>
                </div>
              </div>
              
              <Link
                to={`/zeiterfassung/mitarbeiter/${id}`}
                className="mt-4 text-blue-600 hover:underline text-sm inline-flex items-center"
              >
                Detaillierte Zeiterfassung anzeigen
                <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
              </Link>
            </div>
          )}
        </div>

        {/* Right column - Financial info and documents */}
        <div className="space-y-6">
          {/* Financial information */}
          {mitarbeiter.gehalt && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Gehaltsinformationen</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Bruttogehalt</p>
                  <p className="font-medium text-lg">{mitarbeiter.gehalt.brutto || 0} €</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nettogehalt</p>
                  <p className="font-medium text-lg">{mitarbeiter.gehalt.netto || 0} €</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stundensatz</p>
                  <p className="font-medium">{mitarbeiter.gehalt.stundensatz || 0} €/h</p>
                </div>
              </div>
            </div>
          )}

          {/* Bank information */}
          {mitarbeiter.bankverbindung?.iban && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Bankverbindung
              </h2>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Kontoinhaber</p>
                  <p className="font-medium">{mitarbeiter.bankverbindung.kontoinhaber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IBAN</p>
                  <p className="font-medium font-mono text-sm">{mitarbeiter.bankverbindung.iban}</p>
                </div>
                {mitarbeiter.bankverbindung.bic && (
                  <div>
                    <p className="text-sm text-gray-500">BIC</p>
                    <p className="font-medium">{mitarbeiter.bankverbindung.bic}</p>
                  </div>
                )}
                {mitarbeiter.bankverbindung.bank && (
                  <div>
                    <p className="text-sm text-gray-500">Bank</p>
                    <p className="font-medium">{mitarbeiter.bankverbindung.bank}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Dokumente
              </h2>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleDocumentUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={uploadingDoc}
                />
                <span className="text-blue-600 hover:underline text-sm flex items-center">
                  <Upload className="w-4 h-4 mr-1" />
                  {uploadingDoc ? 'Hochladen...' : 'Dokument hochladen'}
                </span>
              </label>
            </div>
            
            <div className="space-y-2">
              {mitarbeiter.dokumente?.length > 0 ? (
                mitarbeiter.dokumente.map((dokument, index) => (
                  <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{dokument.name}</p>
                        <p className="text-xs text-gray-500">
                          {dokument.datum && format(new Date(dokument.datum), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                    </div>
                    <a
                      href={dokument.pfad}
                      download
                      className="text-blue-600 hover:underline"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Keine Dokumente vorhanden</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {mitarbeiter.notizen && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Notizen</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{mitarbeiter.notizen}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MitarbeiterDetails;
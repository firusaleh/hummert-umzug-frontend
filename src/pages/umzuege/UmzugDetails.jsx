// src/pages/umzuege/UmzugDetails.jsx - Enhanced with API integration
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Truck, 
  Users, 
  Phone, 
  Mail,
  FileText,
  MessageSquare,
  Clipboard,
  Edit,
  Trash2,
  Euro,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { umzuegeService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

// StatusBadge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    geplant: { bgColor: 'bg-blue-100', textColor: 'text-blue-800', label: 'Geplant', icon: Calendar },
    bestaetigt: { bgColor: 'bg-purple-100', textColor: 'text-purple-800', label: 'Bestätigt', icon: CheckCircle },
    in_bearbeitung: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', label: 'In Bearbeitung', icon: RefreshCw },
    abgeschlossen: { bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Abgeschlossen', icon: CheckCircle },
    storniert: { bgColor: 'bg-red-100', textColor: 'text-red-800', label: 'Storniert', icon: XCircle }
  };
  
  const config = statusConfig[status] || { 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-800', 
    label: status || 'Unbekannt',
    icon: AlertCircle
  };
  
  const Icon = config.icon;
  
  return (
    <span className={`px-3 py-1 inline-flex items-center text-sm leading-5 font-semibold rounded-full ${config.bgColor} ${config.textColor}`}>
      <Icon className="w-4 h-4 mr-1" />
      {config.label}
    </span>
  );
};

// Role Badge Component
const RoleBadge = ({ rolle }) => {
  const roleConfig = {
    fahrer: { bgColor: 'bg-blue-100', textColor: 'text-blue-800', label: 'Fahrer' },
    helfer: { bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Helfer' },
    projektleiter: { bgColor: 'bg-purple-100', textColor: 'text-purple-800', label: 'Projektleiter' }
  };
  
  const config = roleConfig[rolle] || { 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-800', 
    label: rolle || 'Mitarbeiter' 
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
};

const UmzugDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [umzug, setUmzug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [neueNotiz, setNeueNotiz] = useState('');
  const [addingNotiz, setAddingNotiz] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load Umzug data
  useEffect(() => {
    loadUmzugData();
  }, [id]);

  const loadUmzugData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await umzuegeService.getById(id);
      setUmzug(response.data);
    } catch (err) {
      console.error('Error loading Umzug:', err);
      setError(err.response?.data?.message || 'Fehler beim Laden der Umzugsdaten');
      toast.error('Fehler beim Laden der Umzugsdaten');
    } finally {
      setLoading(false);
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return 'Keine Adresse angegeben';
    const { strasse, hausnummer, plz, ort, etage, aufzug } = address;
    const addressStr = `${strasse} ${hausnummer}, ${plz} ${ort}`;
    const etageStr = etage ? `${etage}. OG` : 'EG';
    const aufzugStr = aufzug ? 'mit Aufzug' : 'ohne Aufzug';
    return { addressStr, details: `${etageStr} (${aufzugStr})` };
  };

  // Handle adding a note
  const handleNotizSubmit = async (e) => {
    e.preventDefault();
    
    if (!neueNotiz.trim()) return;
    
    try {
      setAddingNotiz(true);
      
      const updatedNotizen = [
        ...(umzug.notizen || []),
        {
          text: neueNotiz,
          datum: new Date().toISOString(),
          ersteller: 'Aktueller Benutzer' // Would come from auth context
        }
      ];
      
      await umzuegeService.update(id, { notizen: updatedNotizen });
      
      // Reload data to get updated state
      await loadUmzugData();
      
      setNeueNotiz('');
      toast.success('Notiz erfolgreich hinzugefügt');
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Fehler beim Hinzufügen der Notiz');
    } finally {
      setAddingNotiz(false);
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    if (!window.confirm('Möchten Sie diesen Umzug wirklich löschen?')) {
      return;
    }
    
    try {
      setDeleting(true);
      await umzuegeService.delete(id);
      toast.success('Umzug erfolgreich gelöscht');
      navigate('/umzuege');
    } catch (err) {
      console.error('Error deleting Umzug:', err);
      toast.error('Fehler beim Löschen des Umzugs');
    } finally {
      setDeleting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      await umzuegeService.update(id, { status: newStatus });
      await loadUmzugData();
      toast.success('Status erfolgreich aktualisiert');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={loadUmzugData} />;
  }

  if (!umzug) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        Umzug nicht gefunden.
      </div>
    );
  }

  const auszugsadresse = formatAddress(umzug.auszugsadresse);
  const einzugsadresse = formatAddress(umzug.einzugsadresse);

  return (
    <div>
      {/* Header with navigation and actions */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/umzuege"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Übersicht
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Umzug Details - {umzug.auftraggeber?.name || 'Unbekannt'}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/umzuege/${id}/edit`}
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
          {/* Status and basic info */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Grundinformationen</h2>
              <StatusBadge status={umzug.status} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Kundennummer</p>
                <p className="font-medium">{umzug.kundennummer || 'Nicht angegeben'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Umzugsdatum</p>
                <p className="font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {format(new Date(umzug.startDatum), 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Zeitraum</p>
                <p className="font-medium flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  {format(new Date(umzug.startDatum), 'HH:mm')} - 
                  {format(new Date(umzug.endDatum), 'HH:mm')} Uhr
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Zahlungsstatus</p>
                <p className="font-medium flex items-center">
                  {umzug.preis?.bezahlt ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Bezahlt
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2 text-red-500" />
                      Offen
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Adressen</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Auszugsadresse</p>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{auszugsadresse.addressStr}</p>
                    <p className="text-sm text-gray-600">{auszugsadresse.details}</p>
                    {umzug.auszugsadresse.entfernung > 0 && (
                      <p className="text-sm text-gray-600">
                        Entfernung zum Parkplatz: {umzug.auszugsadresse.entfernung}m
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Einzugsadresse</p>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{einzugsadresse.addressStr}</p>
                    <p className="text-sm text-gray-600">{einzugsadresse.details}</p>
                    {umzug.einzugsadresse.entfernung > 0 && (
                      <p className="text-sm text-gray-600">
                        Entfernung zum Parkplatz: {umzug.einzugsadresse.entfernung}m
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {umzug.zwischenstopps?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Zwischenstopps</p>
                  {umzug.zwischenstopps.map((stopp, index) => {
                    const stoppAddr = formatAddress(stopp);
                    return (
                      <div key={index} className="flex items-start mt-2">
                        <MapPin className="w-5 h-5 mr-2 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium">{stoppAddr.addressStr}</p>
                          <p className="text-sm text-gray-600">{stoppAddr.details}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Team and vehicles */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Team & Fahrzeuge</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Mitarbeiter ({umzug.mitarbeiter?.length || 0})
                </h3>
                <div className="space-y-2">
                  {umzug.mitarbeiter?.map((mitarbeiter, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">
                        {mitarbeiter.mitarbeiterId?.name || 'Unbekannt'}
                      </span>
                      <RoleBadge rolle={mitarbeiter.rolle} />
                    </div>
                  ))}
                  {(!umzug.mitarbeiter || umzug.mitarbeiter.length === 0) && (
                    <p className="text-sm text-gray-500">Keine Mitarbeiter zugewiesen</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                  <Truck className="w-4 h-4 mr-2" />
                  Fahrzeuge ({umzug.fahrzeuge?.length || 0})
                </h3>
                <div className="space-y-2">
                  {umzug.fahrzeuge?.map((fahrzeug, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded">
                      <p className="text-sm font-medium">{fahrzeug.kennzeichen}</p>
                      <p className="text-xs text-gray-600">{fahrzeug.typ}</p>
                    </div>
                  ))}
                  {(!umzug.fahrzeuge || umzug.fahrzeuge.length === 0) && (
                    <p className="text-sm text-gray-500">Keine Fahrzeuge zugewiesen</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional services */}
          {umzug.extraLeistungen?.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Zusatzleistungen</h2>
              <div className="space-y-2">
                {umzug.extraLeistungen.map((leistung, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{leistung.beschreibung}</p>
                      <p className="text-sm text-gray-600">Menge: {leistung.menge}</p>
                    </div>
                    <p className="font-medium">{leistung.preis}€</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Contact, pricing, notes */}
        <div className="space-y-6">
          {/* Customer contact */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Kundenkontakt</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Auftraggeber</p>
                <p className="font-medium">{umzug.auftraggeber?.name || 'Nicht angegeben'}</p>
              </div>
              
              {umzug.auftraggeber?.telefon && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`tel:${umzug.auftraggeber.telefon}`} className="text-blue-600 hover:underline">
                    {umzug.auftraggeber.telefon}
                  </a>
                </div>
              )}
              
              {umzug.auftraggeber?.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`mailto:${umzug.auftraggeber.email}`} className="text-blue-600 hover:underline">
                    {umzug.auftraggeber.email}
                  </a>
                </div>
              )}

              {umzug.kontakte?.length > 1 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Weitere Kontakte</p>
                  {umzug.kontakte.slice(1).map((kontakt, index) => (
                    <div key={index} className="text-sm mb-2">
                      <p className="font-medium">{kontakt.name}</p>
                      {kontakt.telefon && <p>{kontakt.telefon}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Preisübersicht</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Netto:</span>
                <span className="font-medium">{umzug.preis?.netto || 0}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">MwSt ({umzug.preis?.mwst || 19}%):</span>
                <span className="font-medium">
                  {((umzug.preis?.netto || 0) * ((umzug.preis?.mwst || 19) / 100)).toFixed(2)}€
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Brutto:</span>
                  <span className="font-semibold text-lg">{umzug.preis?.brutto || 0}€</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Zahlungsart:</span>
                  <span className="font-medium capitalize">{umzug.preis?.zahlungsart || 'Rechnung'}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Status:</span>
                  {umzug.preis?.bezahlt ? (
                    <span className="text-green-600 font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Bezahlt
                    </span>
                  ) : (
                    <span className="text-red-600 font-medium flex items-center">
                      <XCircle className="w-4 h-4 mr-1" />
                      Offen
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Notizen</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {umzug.notizen?.map((notiz, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">{notiz.text}</p>
                  <div className="mt-1 text-xs text-gray-500">
                    {notiz.ersteller} - {format(new Date(notiz.datum), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </div>
                </div>
              ))}
              
              {(!umzug.notizen || umzug.notizen.length === 0) && (
                <p className="text-sm text-gray-500">Keine Notizen vorhanden</p>
              )}
            </div>
            
            <form onSubmit={handleNotizSubmit} className="mt-4">
              <textarea
                value={neueNotiz}
                onChange={(e) => setNeueNotiz(e.target.value)}
                placeholder="Neue Notiz hinzufügen..."
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
              />
              <button
                type="submit"
                disabled={addingNotiz || !neueNotiz.trim()}
                className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
              >
                {addingNotiz ? 'Hinzufügen...' : 'Notiz hinzufügen'}
              </button>
            </form>
          </div>

          {/* Status actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Status ändern</h2>
            
            <div className="space-y-2">
              {['geplant', 'bestaetigt', 'in_bearbeitung', 'abgeschlossen', 'storniert'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={umzug.status === status}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    umzug.status === status
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <StatusBadge status={status} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UmzugDetails;
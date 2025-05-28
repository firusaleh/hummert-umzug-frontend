// src/pages/aufnahmen/AufnahmeDetails.jsx - Enhanced with full API integration
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  FileText,
  Package,
  Edit,
  Trash2,
  Download,
  Home,
  Euro,
  Star,
  Image as ImageIcon,
  FileDown,
  Plus,
  Check,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { aufnahmenService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    in_bearbeitung: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', label: 'In Bearbeitung' },
    abgeschlossen: { bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Abgeschlossen' },
    angebot_erstellt: { bgColor: 'bg-blue-100', textColor: 'text-blue-800', label: 'Angebot erstellt' },
    bestellt: { bgColor: 'bg-purple-100', textColor: 'text-purple-800', label: 'Bestellt' }
  };
  
  const config = statusConfig[status] || { 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-800', 
    label: status || 'Unbekannt' 
  };
  
  return (
    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
};

// Type Badge Component
const TypeBadge = ({ type }) => {
  const typeConfig = {
    privat: { bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Privat' },
    gewerbe: { bgColor: 'bg-blue-100', textColor: 'text-blue-800', label: 'Gewerbe' },
    senioren: { bgColor: 'bg-purple-100', textColor: 'text-purple-800', label: 'Senioren' },
    fernumzug: { bgColor: 'bg-orange-100', textColor: 'text-orange-800', label: 'Fernumzug' },
    buero: { bgColor: 'bg-gray-100', textColor: 'text-gray-800', label: 'Büro' }
  };
  
  const config = typeConfig[type] || { 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-800', 
    label: type || 'Standard' 
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
};

const AufnahmeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aufnahme, setAufnahme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [creatingUmzug, setCreatingUmzug] = useState(false);

  // Load Aufnahme data
  useEffect(() => {
    loadAufnahmeData();
  }, [id]);

  const loadAufnahmeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aufnahmenService.getById(id);
      setAufnahme(response.data || response);
    } catch (err) {
      console.error('Error loading Aufnahme:', err);
      setError(err.response?.data?.message || 'Fehler beim Laden der Aufnahmedaten');
      toast.error('Fehler beim Laden der Aufnahmedaten');
    } finally {
      setLoading(false);
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return 'Keine Adresse angegeben';
    const { strasse, hausnummer, plz, ort, etage, aufzug, entfernung } = address;
    const addressStr = `${strasse} ${hausnummer}, ${plz} ${ort}`;
    const etageStr = etage > 0 ? `${etage}. OG` : etage === 0 ? 'EG' : `${Math.abs(etage)}. UG`;
    const aufzugStr = aufzug ? 'mit Aufzug' : 'ohne Aufzug';
    const entfernungStr = entfernung > 0 ? `${entfernung}m zur Parkposition` : '';
    return { addressStr, details: `${etageStr} (${aufzugStr})${entfernungStr ? ', ' + entfernungStr : ''}` };
  };

  // Calculate total volume
  const calculateTotalVolume = () => {
    if (!aufnahme?.raeume) return 0;
    
    let totalVolume = 0;
    aufnahme.raeume.forEach(raum => {
      raum.moebel?.forEach(moebel => {
        if (moebel.groesse?.volumen) {
          totalVolume += moebel.groesse.volumen * (moebel.anzahl || 1);
        }
      });
    });
    
    return totalVolume.toFixed(2);
  };

  // Count total items
  const countTotalItems = () => {
    if (!aufnahme?.raeume) return 0;
    
    let totalItems = 0;
    aufnahme.raeume.forEach(raum => {
      raum.moebel?.forEach(moebel => {
        totalItems += moebel.anzahl || 1;
      });
    });
    
    return totalItems;
  };

  // Handle deletion
  const handleDelete = async () => {
    if (!window.confirm('Möchten Sie diese Aufnahme wirklich löschen?')) {
      return;
    }
    
    try {
      setDeleting(true);
      await aufnahmenService.delete(id);
      toast.success('Aufnahme erfolgreich gelöscht');
      navigate('/aufnahmen');
    } catch (err) {
      console.error('Error deleting Aufnahme:', err);
      toast.error('Fehler beim Löschen der Aufnahme');
    } finally {
      setDeleting(false);
    }
  };

  // Handle PDF generation
  const handleGeneratePdf = async () => {
    try {
      setGeneratingPdf(true);
      const response = await aufnahmenService.generatePDF(id);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Aufnahme_${aufnahme.kundenName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF erfolgreich generiert');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Fehler beim Generieren des PDFs');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Handle create Umzug
  const handleCreateUmzug = async () => {
    try {
      setCreatingUmzug(true);
      const response = await aufnahmenService.createUmzug(id);
      toast.success('Umzug erfolgreich erstellt');
      navigate(`/umzuege/${response.data._id || response.data.id}`);
    } catch (err) {
      console.error('Error creating Umzug:', err);
      toast.error('Fehler beim Erstellen des Umzugs');
    } finally {
      setCreatingUmzug(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={loadAufnahmeData} />;
  }

  if (!aufnahme) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        Aufnahme nicht gefunden.
      </div>
    );
  }

  const auszugsadresse = formatAddress(aufnahme.auszugsadresse);
  const einzugsadresse = formatAddress(aufnahme.einzugsadresse);
  const totalVolume = calculateTotalVolume();
  const totalItems = countTotalItems();

  return (
    <div>
      {/* Header with navigation and actions */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/aufnahmen"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Übersicht
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Aufnahme - {aufnahme.kundenName}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleGeneratePdf}
            disabled={generatingPdf}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {generatingPdf ? 'Generiere...' : 'PDF Export'}
          </button>
          {aufnahme.status !== 'bestellt' && (
            <button
              onClick={handleCreateUmzug}
              disabled={creatingUmzug}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded inline-flex items-center disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              {creatingUmzug ? 'Erstelle...' : 'Umzug erstellen'}
            </button>
          )}
          <Link
            to={`/aufnahmen/${id}/bearbeiten`}
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
          {/* Basic info */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Grundinformationen</h2>
              <div className="flex space-x-2">
                <StatusBadge status={aufnahme.status} />
                <TypeBadge type={aufnahme.umzugstyp} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Aufnahmedatum</p>
                <p className="font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {format(new Date(aufnahme.datum), 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Uhrzeit</p>
                <p className="font-medium flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  {aufnahme.uhrzeit || '09:00'} Uhr
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Aufnehmer</p>
                <p className="font-medium">
                  {aufnahme.aufnehmer?.name || aufnahme.mitarbeiterId?.name || 'Nicht angegeben'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bewertung</p>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= (aufnahme.bewertung || 3) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Kundenkontakt</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Kunde</p>
                <p className="font-medium">{aufnahme.kundenName}</p>
              </div>
              {aufnahme.kontaktperson && (
                <div>
                  <p className="text-sm text-gray-500">Kontaktperson</p>
                  <p className="font-medium">{aufnahme.kontaktperson}</p>
                </div>
              )}
              {aufnahme.telefon && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <a href={`tel:${aufnahme.telefon}`} className="text-blue-600 hover:underline">
                      {aufnahme.telefon}
                    </a>
                  </div>
                </div>
              )}
              {aufnahme.email && (
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">E-Mail</p>
                    <a href={`mailto:${aufnahme.email}`} className="text-blue-600 hover:underline">
                      {aufnahme.email}
                    </a>
                  </div>
                </div>
              )}
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
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rooms and furniture */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Räume und Inventar
            </h2>
            
            {aufnahme.raeume && aufnahme.raeume.length > 0 ? (
              <div className="space-y-4">
                {aufnahme.raeume.map((raum, raumIndex) => (
                  <div key={raumIndex} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-700 mb-2">
                      {raum.name}
                      {raum.flaeche && <span className="text-sm text-gray-500 ml-2">({raum.flaeche} m²)</span>}
                    </h3>
                    
                    {raum.moebel && raum.moebel.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {raum.moebel.map((moebel, moebelIndex) => (
                          <div key={moebelIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex items-center">
                              <Package className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-sm">
                                {moebel.anzahl}x {moebel.name}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              {moebel.zerbrechlich && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Zerbrechlich</span>
                              )}
                              {moebel.demontage && (
                                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">Demontage</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Keine Möbel erfasst</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Keine Räume erfasst</p>
            )}
          </div>
        </div>

        {/* Right column - Summary and pricing */}
        <div className="space-y-6">
          {/* Volume summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Zusammenfassung</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Gesamtvolumen</p>
                <p className="font-medium text-lg">{totalVolume} m³</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Anzahl Gegenstände</p>
                <p className="font-medium">{totalItems}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Anzahl Räume</p>
                <p className="font-medium">{aufnahme.raeume?.length || 0}</p>
              </div>
              {aufnahme.umzugsvolumen && (
                <div>
                  <p className="text-sm text-gray-500">Geschätztes Volumen</p>
                  <p className="font-medium">{aufnahme.umzugsvolumen} m³</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          {aufnahme.angebotspreis && (aufnahme.angebotspreis.netto || aufnahme.angebotspreis.brutto) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Euro className="w-5 h-5 mr-2" />
                Angebotspreis
              </h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Netto:</span>
                  <span className="font-medium">{aufnahme.angebotspreis.netto || 0}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MwSt ({aufnahme.angebotspreis.mwst || 19}%):</span>
                  <span className="font-medium">
                    {((aufnahme.angebotspreis.netto || 0) * ((aufnahme.angebotspreis.mwst || 19) / 100)).toFixed(2)}€
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Brutto:</span>
                    <span className="font-semibold text-lg">{aufnahme.angebotspreis.brutto || 0}€</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes and special requirements */}
          {(aufnahme.notizen || aufnahme.besonderheiten) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Notizen & Besonderheiten</h2>
              
              {aufnahme.notizen && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Notizen</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{aufnahme.notizen}</p>
                </div>
              )}
              
              {aufnahme.besonderheiten && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Besonderheiten</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{aufnahme.besonderheiten}</p>
                </div>
              )}
            </div>
          )}

          {/* Images */}
          {aufnahme.bilder && aufnahme.bilder.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Bilder ({aufnahme.bilder.length})
              </h2>
              
              <div className="grid grid-cols-2 gap-2">
                {aufnahme.bilder.map((bild, index) => (
                  <a
                    key={index}
                    href={bild}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-24 bg-gray-100 rounded overflow-hidden hover:opacity-75"
                  >
                    <img
                      src={bild}
                      alt={`Bild ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {aufnahme.dokumente && aufnahme.dokumente.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Dokumente
              </h2>
              
              <div className="space-y-2">
                {aufnahme.dokumente.map((dokument, index) => (
                  <a
                    key={index}
                    href={dokument.pfad}
                    download
                    className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                  >
                    <span className="text-sm">{dokument.name}</span>
                    <Download className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AufnahmeDetails;
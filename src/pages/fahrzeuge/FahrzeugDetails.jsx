// src/pages/fahrzeuge/FahrzeugDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Car,
  Truck,
  Calendar,
  Gauge,
  Ruler,
  Weight,
  BadgeEuro,
  Clock,
  Wrench,
  FileText,
  Eye,
  Shield
} from 'lucide-react';
import { fahrzeugeService } from '../../services/api';
import { toast } from 'react-toastify';

const FahrzeugDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [fahrzeug, setFahrzeug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fahrzeugdaten laden
  useEffect(() => {
    const fetchFahrzeug = async () => {
      setLoading(true);
      try {
        const response = await fahrzeugeService.getById(id);
        if (response && (response.data || response.success)) {
          setFahrzeug(response.data || response);
        } else {
          throw new Error('Keine Fahrzeugdaten erhalten');
        }
      } catch (err) {
        // Fehler beim Laden des Fahrzeugs
        setError('Das Fahrzeug konnte nicht geladen werden.');
        toast.error('Fahrzeug konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFahrzeug();
    }
  }, [id]);

  // Fahrzeug löschen
  const handleDelete = async () => {
    if (window.confirm('Möchten Sie dieses Fahrzeug wirklich löschen?')) {
      try {
        await fahrzeugeService.delete(id);
        toast.success('Fahrzeug erfolgreich gelöscht');
        navigate('/fahrzeuge');
      } catch (error) {
        // Fehler beim Löschen des Fahrzeugs
        toast.error('Das Fahrzeug konnte nicht gelöscht werden');
      }
    }
  };

  // TÜV Status berechnen
  const getTuevStatus = (tuevDatum) => {
    if (!tuevDatum) return { status: 'Unbekannt', color: 'gray' };
    
    const heute = new Date();
    const tuevDate = new Date(tuevDatum);
    const differenzInTagen = Math.ceil((tuevDate - heute) / (1000 * 60 * 60 * 24));
    
    if (differenzInTagen < 0) return { status: 'Abgelaufen', color: 'red' };
    if (differenzInTagen <= 30) return { status: 'Bald fällig', color: 'yellow' };
    return { status: 'Gültig', color: 'green' };
  };

  // Status Badge
  const StatusBadge = ({ status }) => {
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
      case 'In Wartung':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'Defekt':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
      case 'Außer Dienst':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !fahrzeug) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error || 'Fahrzeug nicht gefunden'}</p>
        <Link to="/fahrzeuge" className="mt-4 text-blue-600 hover:text-blue-800 inline-block">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const tuevStatus = getTuevStatus(fahrzeug.tuev);

  return (
    <div>
      {/* Kopfzeile mit Navigation und Aktionen */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link to="/fahrzeuge" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {fahrzeug.bezeichnung}
          </h1>
          <StatusBadge status={fahrzeug.status || 'Nicht angegeben'} />
        </div>
        <div className="flex space-x-2">
          <Link 
            to={`/fahrzeuge/${id}/kilometerstand`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <Gauge size={16} className="mr-2" /> Kilometerstand
          </Link>
          <Link 
            to={`/fahrzeuge/${id}/bearbeiten`}
            className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 flex items-center"
          >
            <Edit size={16} className="mr-2" /> Bearbeiten
          </Link>
          <button 
            onClick={handleDelete}
            className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 flex items-center"
          >
            <Trash2 size={16} className="mr-2" /> Löschen
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fahrzeugbild und Hauptinformationen */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-center mb-6">
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {fahrzeug.bild ? (
                <img 
                  src={fahrzeug.bild} 
                  alt={fahrzeug.bezeichnung} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  {fahrzeug.typ === 'LKW' ? (
                    <Truck size={64} />
                  ) : (
                    <Car size={64} />
                  )}
                  <span className="text-sm mt-2">Kein Bild vorhanden</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold border-b pb-2 mb-3">Fahrzeugdetails</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Kennzeichen</p>
                  <p className="font-medium">{fahrzeug.kennzeichen}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Typ</p>
                  <p className="font-medium">{fahrzeug.typ}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Führerscheinklasse</p>
                  <p className="font-medium">{fahrzeug.fuehrerscheinklasse || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Baujahr</p>
                  <p className="font-medium">{fahrzeug.baujahr || 'Nicht angegeben'}</p>
                </div>
                {fahrzeug.anschaffungsdatum && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Anschaffungsdatum</p>
                    <p className="font-medium">{new Date(fahrzeug.anschaffungsdatum).toLocaleDateString('de-DE')}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold border-b pb-2 mb-3">Aktueller Status</h2>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={fahrzeug.status || 'Nicht angegeben'} />
              </div>
              {fahrzeug.aktuelleFahrt && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500">Aktuelle Fahrt</p>
                  <Link 
                    to={`/umzuege/${fahrzeug.aktuelleFahrt._id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Zur Fahrtdetails
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Wartung und TÜV */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Wartung & Prüfung</h2>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full mr-4 bg-${tuevStatus.color}-100`}>
                <Calendar size={24} className={`text-${tuevStatus.color}-600`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">TÜV bis</p>
                <p className="font-medium">
                  {fahrzeug.tuev ? new Date(fahrzeug.tuev).toLocaleDateString('de-DE') : 'Nicht angegeben'}
                </p>
                {tuevStatus.status !== 'Unbekannt' && (
                  <p className={`text-sm text-${tuevStatus.color}-600 font-medium`}>
                    {tuevStatus.status}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100 mr-4">
                <Gauge size={24} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Kilometerstand</p>
                <p className="font-medium">
                  {fahrzeug.kilometerstand ? `${fahrzeug.kilometerstand.toLocaleString('de-DE')} km` : 'Nicht angegeben'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100 mr-4">
                <Wrench size={24} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Nächster Service</p>
                <p className="font-medium">
                  {fahrzeug.naechsterService ? new Date(fahrzeug.naechsterService).toLocaleDateString('de-DE') : 'Nicht angegeben'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Kapazität */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Kapazität & Maße</h2>
          
          <div className="space-y-6">
            {fahrzeug.kapazitaet?.ladeflaeche && (
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gray-100 mr-4">
                  <Ruler size={24} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ladefläche (L×B×H)</p>
                  <p className="font-medium">
                    {fahrzeug.kapazitaet.ladeflaeche.laenge && 
                     fahrzeug.kapazitaet.ladeflaeche.breite && 
                     fahrzeug.kapazitaet.ladeflaeche.hoehe ? 
                      `${fahrzeug.kapazitaet.ladeflaeche.laenge} × ${fahrzeug.kapazitaet.ladeflaeche.breite} × ${fahrzeug.kapazitaet.ladeflaeche.hoehe} cm` : 
                      'Nicht vollständig angegeben'}
                  </p>
                  {fahrzeug.kapazitaet.volumen && (
                    <p className="text-sm text-gray-500">
                      Volumen: {fahrzeug.kapazitaet.volumen.toFixed(2)} m³
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {fahrzeug.kapazitaet?.ladegewicht && (
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gray-100 mr-4">
                  <Weight size={24} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ladegewicht</p>
                  <p className="font-medium">{fahrzeug.kapazitaet.ladegewicht.toLocaleString('de-DE')} kg</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Versicherung */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Versicherung</h2>
          
          {fahrzeug.versicherung && (
            <div className="space-y-6">
              {fahrzeug.versicherung.gesellschaft && (
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-gray-100 mr-4">
                    <Shield size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Versicherungsgesellschaft</p>
                    <p className="font-medium">{fahrzeug.versicherung.gesellschaft}</p>
                  </div>
                </div>
              )}
              
              {fahrzeug.versicherung.vertragsnummer && (
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-gray-100 mr-4">
                    <FileText size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vertragsnummer</p>
                    <p className="font-medium">{fahrzeug.versicherung.vertragsnummer}</p>
                  </div>
                </div>
              )}
              
              {fahrzeug.versicherung.ablaufdatum && (
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-gray-100 mr-4">
                    <Calendar size={24} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ablaufdatum</p>
                    <p className="font-medium">{new Date(fahrzeug.versicherung.ablaufdatum).toLocaleDateString('de-DE')}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {(!fahrzeug.versicherung || 
            (!fahrzeug.versicherung.gesellschaft && 
             !fahrzeug.versicherung.vertragsnummer && 
             !fahrzeug.versicherung.ablaufdatum)) && (
            <p className="text-gray-500 italic">Keine Versicherungsinformationen angegeben</p>
          )}
        </div>
        
        {/* Notizen */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">Notizen</h2>
          
          {fahrzeug.notizen ? (
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
              {fahrzeug.notizen}
            </div>
          ) : (
            <p className="text-gray-500 italic">Keine Notizen vorhanden</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FahrzeugDetails;
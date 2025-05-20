// src/pages/finanzen/FinanzenMonatsansicht.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { finanzenService } from '../../services/api';
import { extractApiData, ensureArray } from '../../utils/apiUtils';

const FinanzenMonatsansicht = () => {
  const [jahr, setJahr] = useState(new Date().getFullYear());
  const [monatsIndex, setMonatsIndex] = useState(new Date().getMonth());
  const [finanzDaten, setFinanzDaten] = useState(null);
  const [monatDetails, setMonatDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [error, setError] = useState(null);

  // Monatsnamen
  const monatNamen = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  useEffect(() => {
    const fetchJahresUebersicht = async () => {
      setIsLoading(true);
      try {
        const response = await finanzenService.getMonatsUebersicht(jahr);
        const finanzData = extractApiData(response);
        
        if (!finanzData) {
          throw new Error('Keine gültigen Finanzdaten erhalten');
        }
        
        setFinanzDaten(finanzData);
      } catch (error) {
        console.error('Fehler beim Laden der Jahresübersicht:', error);
        setError('Die Jahresübersicht konnte nicht geladen werden.');
        toast.error('Fehler beim Laden der Jahresübersicht');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJahresUebersicht();
  }, [jahr]);

  useEffect(() => {
    const fetchMonatsDetails = async () => {
      setIsLoadingDetails(true);
      try {
        // Monate in API sind 1-basiert (1=Januar, 12=Dezember)
        const response = await finanzenService.getMonatsDetails(jahr, monatsIndex + 1);
        const monatData = extractApiData(response);
        
        if (!monatData) {
          throw new Error('Keine gültigen Monatsdetails erhalten');
        }
        
        // Normalisiere Daten
        const normalizedMonatData = {
          ...monatData,
          rechnungen: ensureArray(monatData.rechnungen),
          ausgaben: ensureArray(monatData.ausgaben),
          angebote: ensureArray(monatData.angebote),
          finanzuebersicht: monatData.finanzuebersicht || {
            einnahmen: 0,
            ausgaben: 0,
            gewinn: 0,
            offeneRechnungen: 0
          },
          ausgabenNachKategorie: monatData.ausgabenNachKategorie || {}
        };
        
        setMonatDetails(normalizedMonatData);
      } catch (error) {
        console.error('Fehler beim Laden der Monatsdetails:', error);
        toast.error('Fehler beim Laden der Monatsdetails');
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchMonatsDetails();
  }, [monatsIndex, jahr]);

  // Jahr wechseln
  const changeJahr = (change) => {
    setJahr(prevJahr => prevJahr + change);
  };

  // Monat wechseln
  const changeMonat = (change) => {
    let newMonat = monatsIndex + change;
    let newJahr = jahr;

    if (newMonat < 0) {
      newMonat = 11;
      newJahr -= 1;
    } else if (newMonat > 11) {
      newMonat = 0;
      newJahr += 1;
    }

    setMonatsIndex(newMonat);
    if (newJahr !== jahr) {
      setJahr(newJahr);
    }
  };

  // Farben für das Tortendiagramm
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Ausgabenkategorien für das Tortendiagramm vorbereiten
  const getAusgabenKategorienData = () => {
    if (!monatDetails || !monatDetails.ausgabenNachKategorie) return [];

    // Stelle sicher, dass ausgabenNachKategorie ein Objekt ist
    if (typeof monatDetails.ausgabenNachKategorie !== 'object') return [];

    try {
      return Object.entries(monatDetails.ausgabenNachKategorie)
        .filter(([kategorie, betrag]) => betrag !== null && betrag !== undefined)
        .map(([kategorie, betrag], index) => ({
          name: kategorie || 'Sonstige',
          value: parseFloat(betrag) || 0
        }));
    } catch (error) {
      console.error('Fehler bei der Verarbeitung der Ausgabenkategorien:', error);
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-10">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <p className="text-gray-600">
            Bitte stellen Sie sicher, dass die API-Verbindung funktioniert und versuchen Sie es später erneut.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Finanzübersicht</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeJahr(-1)}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-lg font-medium">{jahr}</span>
          <button
            onClick={() => changeJahr(1)}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Jahresübersicht */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Jahresübersicht {jahr}</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={finanzDaten?.monatsUebersichten || []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monatName" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} €`, undefined]} />
              <Legend />
              <Bar dataKey="einnahmen" name="Einnahmen" fill="#4ade80" />
              <Bar dataKey="ausgaben" name="Ausgaben" fill="#f87171" />
              <Bar dataKey="gewinn" name="Gewinn" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Gesamteinnahmen</p>
            <p className="text-2xl font-bold">
              {(finanzDaten?.jahresgesamtwerte?.gesamtEinnahmen || 0).toFixed(2)} €
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Gesamtausgaben</p>
            <p className="text-2xl font-bold">
              {(finanzDaten?.jahresgesamtwerte?.gesamtAusgaben || 0).toFixed(2)} €
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Jahresgewinn</p>
            <p className="text-2xl font-bold">
              {(finanzDaten?.jahresgesamtwerte?.gesamtGewinn || 0).toFixed(2)} €
            </p>
          </div>
        </div>
      </div>

      {/* Monatsdetails */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Monatsdetails: {monatNamen[monatsIndex]} {jahr}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changeMonat(-1)}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="flex items-center">
              <Calendar size={16} className="mr-1" /> {monatNamen[monatsIndex]}
            </span>
            <button
              onClick={() => changeMonat(1)}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {isLoadingDetails ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Einnahmen</p>
                <p className="text-2xl font-bold">{monatDetails?.finanzuebersicht?.einnahmen?.toFixed(2) || '0.00'} €</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Ausgaben</p>
                <p className="text-2xl font-bold">{monatDetails?.finanzuebersicht?.ausgaben?.toFixed(2) || '0.00'} €</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Gewinn</p>
                <p className="text-2xl font-bold">{monatDetails?.finanzuebersicht?.gewinn?.toFixed(2) || '0.00'} €</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Offene Rechnungen</p>
                <p className="text-2xl font-bold">{monatDetails?.finanzuebersicht?.offeneRechnungen || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Ausgabenkategorien */}
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-4">Ausgaben nach Kategorien</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getAusgabenKategorienData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getAusgabenKategorienData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value.toFixed(2)} €`, undefined]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Einnahmen / Ausgaben Vergleich */}
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-4">Einnahmen / Ausgaben Vergleich</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: `${monatNamen[monatsIndex]} ${jahr}`,
                          einnahmen: monatDetails?.finanzuebersicht?.einnahmen || 0,
                          ausgaben: monatDetails?.finanzuebersicht?.ausgaben || 0,
                          gewinn: monatDetails?.finanzuebersicht?.gewinn || 0
                        }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value.toFixed(2)} €`, undefined]} />
                      <Legend />
                      <Bar dataKey="einnahmen" name="Einnahmen" fill="#4ade80" />
                      <Bar dataKey="ausgaben" name="Ausgaben" fill="#f87171" />
                      <Bar dataKey="gewinn" name="Gewinn" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Rechnungen des Monats */}
            <div className="mt-8">
              <h3 className="text-md font-medium text-gray-800 mb-4">Rechnungen des Monats</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rechnungsnummer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kunde
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betrag
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monatDetails?.rechnungen && monatDetails.rechnungen.length > 0 ? (
                      monatDetails.rechnungen.map(rechnung => (
                        <tr key={rechnung._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rechnung.rechnungNummer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rechnung.kunde?.name || 'Unbekannt'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(rechnung.ausstellungsdatum).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rechnung.gesamtbetrag.toFixed(2)} €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(rechnung.status)}`}>
                              {rechnung.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/finanzen/rechnungen/${rechnung._id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                              Ansehen
                            </Link>
                            <Link to={`/finanzen/rechnungen/${rechnung._id}/bearbeiten`} className="text-blue-600 hover:text-blue-900">
                              Bearbeiten
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                          Keine Rechnungen in diesem Monat
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ausgaben des Monats */}
            <div className="mt-8">
              <h3 className="text-md font-medium text-gray-800 mb-4">Ausgaben des Monats</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bezeichnung
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategorie
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Umzug
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betrag
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monatDetails?.ausgaben && monatDetails.ausgaben.length > 0 ? (
                      monatDetails.ausgaben.map(ausgabe => (
                        <tr key={ausgabe._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {ausgabe.bezeichnung}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ausgabe.kategorie}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ausgabe.umzug?.bezeichnung || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(ausgabe.datum).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ausgabe.betrag.toFixed(2)} €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAusgabenStatusColor(ausgabe.bezahlstatus)}`}>
                              {ausgabe.bezahlstatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/finanzen/projektkosten/${ausgabe._id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                              Ansehen
                            </Link>
                            <Link to={`/finanzen/projektkosten/${ausgabe._id}/bearbeiten`} className="text-blue-600 hover:text-blue-900">
                              Bearbeiten
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          Keine Ausgaben in diesem Monat
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Angebote des Monats */}
            <div className="mt-8">
              <h3 className="text-md font-medium text-gray-800 mb-4">Angebote des Monats</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Angebotsnummer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kunde
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Erstellt am
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gültig bis
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betrag
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monatDetails?.angebote && monatDetails.angebote.length > 0 ? (
                      monatDetails.angebote.map(angebot => (
                        <tr key={angebot._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {angebot.angebotNummer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {angebot.kunde?.name || 'Unbekannt'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(angebot.erstelltAm).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(angebot.gueltigBis).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {angebot.gesamtbetrag.toFixed(2)} €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAngebotStatusColor(angebot.status)}`}>
                              {angebot.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/finanzen/angebote/${angebot._id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                              Ansehen
                            </Link>
                            <Link to={`/finanzen/angebote/${angebot._id}/bearbeiten`} className="text-blue-600 hover:text-blue-900">
                              Bearbeiten
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          Keine Angebote in diesem Monat
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Hilfsfunktionen für Styling
function getStatusColor(status) {
  switch (status) {
    case 'Entwurf':
      return 'bg-gray-100 text-gray-800';
    case 'Gesendet':
      return 'bg-blue-100 text-blue-800';
    case 'Bezahlt':
      return 'bg-green-100 text-green-800';
    case 'Überfällig':
      return 'bg-red-100 text-red-800';
    case 'Teilweise bezahlt':
      return 'bg-yellow-100 text-yellow-800';
    case 'Storniert':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getAusgabenStatusColor(status) {
  switch (status) {
    case 'Offen':
      return 'bg-yellow-100 text-yellow-800';
    case 'Bezahlt':
      return 'bg-green-100 text-green-800';
    case 'Storniert':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getAngebotStatusColor(status) {
  switch (status) {
    case 'Entwurf':
      return 'bg-gray-100 text-gray-800';
    case 'Gesendet':
      return 'bg-blue-100 text-blue-800';
    case 'Akzeptiert':
      return 'bg-green-100 text-green-800';
    case 'Abgelehnt':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default FinanzenMonatsansicht;
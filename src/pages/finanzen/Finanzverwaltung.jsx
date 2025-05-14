// src/pages/finanzen/Finanzverwaltung.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Plus, FileText, DollarSign, CreditCard, BarChart2 } from 'lucide-react';
import { finanzenService } from '../../services/api';

const Finanzverwaltung = () => {
  const [finanzDaten, setFinanzDaten] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await finanzenService.getUebersicht();
        setFinanzDaten(response.data);
      } catch (error) {
        console.error('Fehler beim Laden der Finanzdaten:', error);
        setError('Die Finanzdaten konnten nicht geladen werden.');
        toast.error('Fehler beim Laden der Finanzdaten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-800">Finanzverwaltung</h1>
        <div className="flex space-x-2">
          <Link to="/finanzen/angebote/neu" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            <Plus size={16} className="mr-2" /> Angebot erstellen
          </Link>
          <Link to="/finanzen/rechnungen/neu" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            <FileText size={16} className="mr-2" /> Rechnung erstellen
          </Link>
          <Link to="/finanzen/projektkosten/neu" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
            <DollarSign size={16} className="mr-2" /> Kosten erfassen
          </Link>
        </div>
      </div>

      {/* Finanzübersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Offene Rechnungen</p>
              <h3 className="text-2xl font-bold mt-1">{finanzDaten?.aktuelleUebersicht.offeneRechnungen || 0}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <CreditCard size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Wert: {(finanzDaten?.letzteRechnungen || [])
              .filter(r => r.status !== 'Bezahlt')
              .reduce((sum, r) => sum + r.gesamtbetrag, 0)
              .toFixed(2)} €
          </p>
          <Link to="/finanzen/rechnungen" className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2">
            Alle anzeigen <ArrowUpRight size={14} className="ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Gesamteinnahmen</p>
              <h3 className="text-2xl font-bold mt-1">{finanzDaten?.aktuelleUebersicht.gesamtEinnahmen.toFixed(2) || '0.00'} €</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <ArrowUpRight size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {finanzDaten?.aktuelleUebersicht.bezahlteRechnungen || 0} bezahlte Rechnungen
          </p>
          <Link to="/finanzen/monatsansicht" className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2">
            Monatsansicht <ArrowUpRight size={14} className="ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Gesamtausgaben</p>
              <h3 className="text-2xl font-bold mt-1">{finanzDaten?.aktuelleUebersicht.gesamtAusgaben.toFixed(2) || '0.00'} €</h3>
            </div>
            <div className="p-2 bg-red-100 rounded-full">
              <ArrowDownRight size={20} className="text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Verschiedene Kategorien
          </p>
          <Link to="/finanzen/projektkosten" className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2">
            Ausgaben ansehen <ArrowUpRight size={14} className="ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Aktueller Gewinn</p>
              <h3 className="text-2xl font-bold mt-1">{finanzDaten?.aktuelleUebersicht.aktuellerGewinn.toFixed(2) || '0.00'} €</h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <BarChart2 size={20} className="text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {finanzDaten?.aktuelleUebersicht.aktuellerGewinn >= 0 ? 'Positiver' : 'Negativer'} Trend
          </p>
          <Link to="/finanzen/monatsansicht" className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2">
            Finanzübersicht <ArrowUpRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Einnahmen & Ausgaben (letzte 12 Monate)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={finanzDaten?.last12Months || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toFixed(2)} €`, undefined]} />
                <Legend />
                <Line type="monotone" dataKey="einnahmen" name="Einnahmen" stroke="#4ade80" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="ausgaben" name="Ausgaben" stroke="#f87171" strokeWidth={2} />
                <Line type="monotone" dataKey="gewinn" name="Gewinn" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Rechnungsstatus</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Entwurf', wert: countRechnungenByStatus(finanzDaten?.letzteRechnungen || [], 'Entwurf') },
                  { name: 'Gesendet', wert: countRechnungenByStatus(finanzDaten?.letzteRechnungen || [], 'Gesendet') },
                  { name: 'Bezahlt', wert: countRechnungenByStatus(finanzDaten?.letzteRechnungen || [], 'Bezahlt') },
                  { name: 'Überfällig', wert: countRechnungenByStatus(finanzDaten?.letzteRechnungen || [], 'Überfällig') }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wert" name="Anzahl" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Letzte Rechnungen */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Letzte Rechnungen</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rechnungsnummer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {finanzDaten?.letzteRechnungen && finanzDaten.letzteRechnungen.length > 0 ? (
                finanzDaten.letzteRechnungen.map(rechnung => (
                  <tr key={rechnung._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rechnung.rechnungNummer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rechnung.kunde?.name || 'Unbekannt'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(rechnung.ausstellungsdatum).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rechnung.gesamtbetrag.toFixed(2)} €</td>
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
                    Keine Rechnungen vorhanden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Link to="/finanzen/rechnungen" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            Alle Rechnungen anzeigen <ArrowUpRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>

      {/* Letzte Ausgaben */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Letzte Ausgaben</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bezeichnung</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategorie</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Umzug</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {finanzDaten?.letzteAusgaben && finanzDaten.letzteAusgaben.length > 0 ? (
                finanzDaten.letzteAusgaben.map(ausgabe => (
                  <tr key={ausgabe._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ausgabe.bezeichnung}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ausgabe.kategorie}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ausgabe.umzug?.bezeichnung || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ausgabe.datum).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ausgabe.betrag.toFixed(2)} €</td>
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
                    Keine Ausgaben vorhanden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Link to="/finanzen/projektkosten" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            Alle Ausgaben anzeigen <ArrowUpRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// Hilfsfunktionen
function countRechnungenByStatus(rechnungen, status) {
  return rechnungen.filter(r => r.status === status).length;
}

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

export default Finanzverwaltung;
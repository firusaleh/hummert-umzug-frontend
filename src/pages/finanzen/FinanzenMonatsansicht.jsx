import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Filter,
  Download,
  Calendar
} from 'lucide-react';
import { finanzenService } from '../../services/api';

export default function FinanzenMonatsansicht() {
  // State für Filter und Datumauswahl
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('alle');
  const [filterTyp, setFilterTyp] = useState('alle');
  const [ansicht, setAnsicht] = useState('monat'); // 'monat' oder 'jahr'
  
  // State für Finanzdaten
  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Lädt Daten basierend auf ausgewähltem Datum und Ansicht
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (ansicht === 'monat') {
          // Der Monat ist 0-basiert (0 = Januar, 11 = Dezember)
          const response = await finanzenService.getMonatsdetails(
            currentDate.getMonth() + 1, // wir addieren 1, da die API 1-basierte Monate erwartet
            currentDate.getFullYear()
          );
          setMonthlyData(response.data);
        } else {
          const response = await finanzenService.getMonatsuebersicht(
            currentDate.getFullYear()
          );
          setYearlyData(response.data);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Finanzdaten:', error);
        setError('Die Finanzdaten konnten nicht geladen werden.');
        
        // Fallback: Simuliere API-Aufruf für Demo
        if (ansicht === 'monat') {
          // Beispieldaten für Monat
          setMonthlyData({
            einnahmen: {
              total: 24500,
              categories: [
                { name: 'Umzüge', amount: 18500 },
                { name: 'Zusatzleistungen', amount: 4200 },
                { name: 'Lagerung', amount: 1800 }
              ]
            },
            ausgaben: {
              total: 16800,
              categories: [
                { name: 'Personal', amount: 9800 },
                { name: 'Fahrzeuge', amount: 3200 },
                { name: 'Material', amount: 1400 },
                { name: 'Miete', amount: 1800 },
                { name: 'Sonstige', amount: 600 }
              ]
            },
            transaktionen: [
              {
                id: 1,
                datum: '2025-05-02',
                beschreibung: 'Umzug Familie Müller',
                betrag: 1450,
                typ: 'einnahme',
                kategorie: 'Umzüge',
                status: 'abgeschlossen'
              },
              {
                id: 2,
                datum: '2025-05-05',
                beschreibung: 'Tankkosten LKW-01',
                betrag: -120,
                typ: 'ausgabe',
                kategorie: 'Fahrzeuge',
                status: 'abgeschlossen'
              },
              {
                id: 3,
                datum: '2025-05-10',
                beschreibung: 'Umzug Firma Tech GmbH',
                betrag: 3800,
                typ: 'einnahme',
                kategorie: 'Umzüge',
                status: 'ausstehend'
              }
            ]
          });
        } else {
          // Beispieldaten für Jahr
          const data = [];
          for (let month = 0; month < 12; month++) {
            const einnahmen = Math.floor(Math.random() * 20000) + 10000;
            const ausgaben = Math.floor(Math.random() * 15000) + 8000;
            
            data.push({
              month,
              einnahmen,
              ausgaben,
              gewinn: einnahmen - ausgaben
            });
          }
          setYearlyData(data);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentDate, ansicht]);

  // Funktionen zum Ändern des Datums
  const nextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (ansicht === 'monat') {
        next.setMonth(next.getMonth() + 1);
      } else {
        next.setFullYear(next.getFullYear() + 1);
      }
      return next;
    });
  };

  const prevMonth = () => {
    setCurrentDate(prev => {
      const prev1 = new Date(prev);
      if (ansicht === 'monat') {
        prev1.setMonth(prev1.getMonth() - 1);
      } else {
        prev1.setFullYear(prev1.getFullYear() - 1);
      }
      return prev1;
    });
  };

  // Formatiert Währungsbeträge
  const formatCurrency = (amount) => {
    return amount.toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  // Monatsnamen
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  // Berechnet Prozentsatz für Visualisierung
  const getPercentage = (amount, total) => {
    return Math.max(5, Math.round((amount / total) * 100));
  };

  // Gefilterte Transaktionen
  const getFilteredTransactions = () => {
    if (!monthlyData || !monthlyData.transaktionen) return [];
    
    return monthlyData.transaktionen.filter(transaction => {
      // Filter nach Status
      if (filterStatus !== 'alle' && transaction.status !== filterStatus) {
        return false;
      }
      
      // Filter nach Typ
      if (filterTyp !== 'alle' && transaction.typ !== filterTyp) {
        return false;
      }
      
      return true;
    });
  };

  // Berechnet Gesamtsummen der gefilterten Transaktionen
  const getFilteredTotals = () => {
    const transactions = getFilteredTransactions();
    
    const einnahmen = transactions
      .filter(t => t.typ === 'einnahme')
      .reduce((sum, t) => sum + t.betrag, 0);
    
    const ausgaben = transactions
      .filter(t => t.typ === 'ausgabe')
      .reduce((sum, t) => sum + Math.abs(t.betrag), 0);
    
    return {
      einnahmen,
      ausgaben,
      bilanz: einnahmen - ausgaben
    };
  };

  // Export-Funktion (Platzhalter)
  const handleExport = () => {
    alert('Exportfunktion wird implementiert...');
    // Hier würde eine API-Anfrage zum Generieren einer Export-Datei stattfinden
  };

  // Rendert Monatsübersicht
  const renderMonthView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (!monthlyData) {
      return (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">Keine Daten verfügbar</p>
        </div>
      );
    }
    
    const filteredTransactions = getFilteredTransactions();
    const totals = getFilteredTotals();
    
    return (
      <div className="space-y-6">
        {/* Zusammenfassung */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm">Einnahmen</h3>
              <DollarSign size={20} className="text-green-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(monthlyData.einnahmen.total)}
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp size={16} className="text-green-500 mr-1" />
              <span className="text-sm text-gray-600">
                {monthlyData.einnahmen.categories.length} Kategorien
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm">Ausgaben</h3>
              <CreditCard size={20} className="text-red-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(monthlyData.ausgaben.total)}
            </p>
            <div className="flex items-center mt-2">
              <TrendingDown size={16} className="text-red-500 mr-1" />
              <span className="text-sm text-gray-600">
                {monthlyData.ausgaben.categories.length} Kategorien
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm">Bilanz</h3>
              <FileText size={20} className="text-blue-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(monthlyData.einnahmen.total - monthlyData.ausgaben.total)}
            </p>
            <div className="flex items-center mt-2">
              {monthlyData.einnahmen.total > monthlyData.ausgaben.total ? (
                <>
                  <TrendingUp size={16} className="text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Positiv</span>
                </>
              ) : (
                <>
                  <TrendingDown size={16} className="text-red-500 mr-1" />
                  <span className="text-sm text-red-600">Negativ</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filterfunktionen für Transaktionen */}
        <div className="bg-gray-50 p-4 rounded-lg flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <Filter size={18} className="text-gray-400 mr-2" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-md px-3 py-1.5"
            >
              <option value="alle">Alle Status</option>
              <option value="abgeschlossen">Abgeschlossen</option>
              <option value="ausstehend">Ausstehend</option>
            </select>
          </div>

          <div className="flex items-center">
            <select
              value={filterTyp}
              onChange={(e) => setFilterTyp(e.target.value)}
              className="border rounded-md px-3 py-1.5"
            >
              <option value="alle">Alle Typen</option>
              <option value="einnahme">Einnahmen</option>
              <option value="ausgabe">Ausgaben</option>
            </select>
          </div>

          <div className="ml-auto">
            <button 
              className="flex items-center bg-white border rounded-md px-3 py-1.5 hover:bg-gray-50"
              onClick={handleExport}
            >
              <Download size={18} className="mr-2" />
              Exportieren
            </button>
          </div>
        </div>

        {/* Gefilterte Transaktionen */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Transaktionen</h3>
            <p className="text-sm text-gray-500">
              {filterStatus !== 'alle' || filterTyp !== 'alle' ? (
                `Gefiltert: ${filteredTransactions.length} Einträge`
              ) : (
                `${filteredTransactions.length} Einträge`
              )}
            </p>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beschreibung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Betrag
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.datum).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.beschreibung}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.kategorie}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'abgeschlossen' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Ausstehend'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        transaction.betrag > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(transaction.betrag)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      Summe Einnahmen:
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-green-600">
                      {formatCurrency(totals.einnahmen)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      Summe Ausgaben:
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-red-600">
                      {formatCurrency(totals.ausgaben)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                      Bilanz:
                    </td>
                    <td className={`px-6 py-3 text-right text-sm font-medium ${
                      totals.bilanz >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(totals.bilanz)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">Keine Transaktionen für die angegebenen Filter.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Rendert Jahresübersicht
  const renderYearView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (!yearlyData) {
      return (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">Keine Daten verfügbar</p>
        </div>
      );
    }
    
    const totalEinnahmen = yearlyData.reduce((sum, month) => sum + month.einnahmen, 0);
    const totalAusgaben = yearlyData.reduce((sum, month) => sum + month.ausgaben, 0);
    const totalGewinn = totalEinnahmen - totalAusgaben;
    
    return (
      <div className="space-y-6">
        {/* Jahresübersicht */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm">Gesamteinnahmen</h3>
              <DollarSign size={20} className="text-green-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(totalEinnahmen)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm">Gesamtausgaben</h3>
              <CreditCard size={20} className="text-red-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(totalAusgaben)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 text-sm">Gesamtbilanz</h3>
              <FileText size={20} className="text-blue-500" />
            </div>
            <p className={`text-2xl font-semibold ${totalGewinn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalGewinn)}
            </p>
          </div>
        </div>

        {/* Monatsvergleich */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Monatliche Übersicht {currentDate.getFullYear()}</h3>
          
          <div className="space-y-4">
            {yearlyData.map((month) => (
              <div key={month.month} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{monthNames[month.month]}</h4>
                  <span className={`${month.gewinn >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                    {formatCurrency(month.gewinn)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Einnahmen</span>
                      <span>{formatCurrency(month.einnahmen)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-500 h-2.5 rounded-full" 
                        style={{ width: `${getPercentage(month.einnahmen, Math.max(...yearlyData.map(m => m.einnahmen)))}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Ausgaben</span>
                      <span>{formatCurrency(month.ausgaben)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-red-500 h-2.5 rounded-full" 
                        style={{ width: `${getPercentage(month.ausgaben, Math.max(...yearlyData.map(m => m.ausgaben)))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Finanzen</h1>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setAnsicht('monat')}
            className={`px-3 py-1.5 rounded ${
              ansicht === 'monat' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monatsansicht
          </button>
          <button 
            onClick={() => setAnsicht('jahr')}
            className={`px-3 py-1.5 rounded ${
              ansicht === 'jahr' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Jahresübersicht
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
        <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center">
          <Calendar size={20} className="text-gray-500 mr-2" />
          {ansicht === 'monat' ? (
            <h2 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          ) : (
            <h2 className="text-lg font-semibold">
              {currentDate.getFullYear()}
            </h2>
          )}
        </div>
        
        <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-gray-100">
          <ChevronRight size={20} />
        </button>
      </div>
      
      {ansicht === 'monat' ? renderMonthView() : renderYearView()}
    </div>
  );
}
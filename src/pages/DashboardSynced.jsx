// Enhanced Dashboard with real-time data synchronization
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Users,
  Truck,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useDataSync } from '../context/DataSyncContext';
import { useSyncedUmzuege, useSyncedMitarbeiter, useSyncedFahrzeuge } from '../hooks/useSyncedData';
import { dateUtils } from '../services/utils';

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, change, color = 'blue', loading, syncStatus }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg relative">
      {syncStatus && (
        <div className="absolute top-2 right-2">
          {syncStatus === 'syncing' && <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />}
          {syncStatus === 'synced' && <CheckCircle className="h-4 w-4 text-green-400" />}
          {syncStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    value
                  )}
                </div>
                {change !== undefined && !loading && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change >= 0 ? '+' : ''}{change}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ activity, isNew }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'umzug_created':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'umzug_updated':
        return <Activity className="h-5 w-5 text-yellow-500" />;
      case 'mitarbeiter_assigned':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'fahrzeug_assigned':
        return <Truck className="h-5 w-5 text-purple-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className={`flex space-x-3 ${isNew ? 'animate-fadeIn' : ''}`}>
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm text-gray-800">{activity.description}</p>
        <p className="text-xs text-gray-500">{dateUtils.formatRelativeTime(activity.timestamp)}</p>
      </div>
    </div>
  );
};

// Connection Status Component
const ConnectionStatus = ({ connected, syncing, lastSync }) => {
  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {connected ? (
          <Wifi className="h-5 w-5 text-green-500" />
        ) : (
          <WifiOff className="h-5 w-5 text-red-500" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {connected ? 'Verbunden' : 'Getrennt'}
          </p>
          {lastSync && (
            <p className="text-xs text-gray-500">
              Letzte Sync: {new Date(lastSync).toLocaleTimeString('de-DE')}
            </p>
          )}
        </div>
      </div>
      {syncing && (
        <div className="flex items-center text-sm text-gray-500">
          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
          Synchronisiere...
        </div>
      )}
    </div>
  );
};

const DashboardSynced = () => {
  const { connected, syncing, lastSync, syncAll } = useDataSync();
  
  // Synced data hooks
  const { 
    data: umzuege, 
    loading: umzuegeLoading,
    hasLocalChanges: umzuegeHasChanges 
  } = useSyncedUmzuege();
  
  const { 
    data: mitarbeiter, 
    loading: mitarbeiterLoading,
    hasLocalChanges: mitarbeiterHasChanges 
  } = useSyncedMitarbeiter();
  
  const { 
    data: fahrzeuge, 
    loading: fahrzeugeLoading,
    hasLocalChanges: fahrzeugeHasChanges 
  } = useSyncedFahrzeuge();

  const [activities, setActivities] = useState([]);
  const [newActivities, setNewActivities] = useState(new Set());

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    
    // Umzüge stats
    const activeUmzuege = umzuege.filter(u => 
      u.status === 'geplant' || u.status === 'in_bearbeitung'
    ).length;
    
    const thisMonthUmzuege = umzuege.filter(u => 
      new Date(u.umzugsdatum).getMonth() === thisMonth
    ).length;
    
    const lastMonthUmzuege = umzuege.filter(u => 
      new Date(u.umzugsdatum).getMonth() === lastMonth
    ).length;
    
    const umzuegeChange = lastMonthUmzuege > 0 
      ? Math.round(((thisMonthUmzuege - lastMonthUmzuege) / lastMonthUmzuege) * 100)
      : 0;

    // Mitarbeiter stats
    const activeMitarbeiter = mitarbeiter.filter(m => m.verfuegbar).length;
    const mitarbeiterAuslastung = mitarbeiter.length > 0
      ? Math.round((mitarbeiter.filter(m => m.currentUmzug).length / mitarbeiter.length) * 100)
      : 0;

    // Fahrzeuge stats
    const verfuegbareFahrzeuge = fahrzeuge.filter(f => f.status === 'verfügbar').length;
    const fahrzeugeAuslastung = fahrzeuge.length > 0
      ? Math.round((fahrzeuge.filter(f => f.status === 'im_einsatz').length / fahrzeuge.length) * 100)
      : 0;

    return {
      activeUmzuege,
      umzuegeChange,
      activeMitarbeiter,
      mitarbeiterAuslastung,
      verfuegbareFahrzeuge,
      fahrzeugeAuslastung,
      totalRevenue: umzuege
        .filter(u => u.status === 'abgeschlossen' && new Date(u.umzugsdatum).getMonth() === thisMonth)
        .reduce((sum, u) => sum + (u.preis || 0), 0)
    };
  }, [umzuege, mitarbeiter, fahrzeuge]);

  // Generate activities from data changes
  useEffect(() => {
    const generateActivity = (type, data) => {
      return {
        id: `${type}_${Date.now()}_${Math.random()}`,
        type,
        description: data.description,
        timestamp: new Date().toISOString(),
        relatedId: data.relatedId
      };
    };

    // Listen for data changes and create activities
    const recentUmzuege = umzuege
      .filter(u => {
        const created = new Date(u.createdAt || u._createdAt);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return created > hourAgo;
      })
      .slice(0, 5)
      .map(u => generateActivity('umzug_created', {
        description: `Neuer Umzug für ${u.kundenname} erstellt`,
        relatedId: u._id
      }));

    setActivities(prev => {
      const newActivitiesList = [...recentUmzuege];
      const newIds = new Set(newActivitiesList.map(a => a.id));
      
      // Mark new activities for animation
      setNewActivities(newIds);
      setTimeout(() => setNewActivities(new Set()), 1000);
      
      return [...newActivitiesList, ...prev.filter(a => !newIds.has(a.id))].slice(0, 10);
    });
  }, [umzuege]);

  // Manual sync all data
  const handleSyncAll = async () => {
    await syncAll();
  };

  // Upcoming moves for today
  const todayUmzuege = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return umzuege
      .filter(u => u.umzugsdatum?.split('T')[0] === today && u.status !== 'storniert')
      .sort((a, b) => new Date(a.umzugsdatum) - new Date(b.umzugsdatum));
  }, [umzuege]);

  const hasAnyLocalChanges = umzuegeHasChanges || mitarbeiterHasChanges || fahrzeugeHasChanges;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Echtzeit-Übersicht über alle Aktivitäten
              </p>
            </div>
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Alle synchronisieren
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          <ConnectionStatus connected={connected} syncing={syncing} lastSync={lastSync} />
        </div>

        {/* Local Changes Warning */}
        {hasAnyLocalChanges && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  Lokale Änderungen vorhanden
                </p>
                <p className="mt-1 text-sm text-yellow-700">
                  Es gibt nicht synchronisierte Änderungen. Diese werden automatisch 
                  synchronisiert, sobald die Verbindung wiederhergestellt ist.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Aktive Umzüge"
            value={stats.activeUmzuege}
            icon={Calendar}
            change={stats.umzuegeChange}
            color="blue"
            loading={umzuegeLoading}
            syncStatus={umzuegeHasChanges ? 'syncing' : 'synced'}
          />
          <StatCard
            title="Verfügbare Mitarbeiter"
            value={`${stats.activeMitarbeiter} (${stats.mitarbeiterAuslastung}%)`}
            icon={Users}
            color="green"
            loading={mitarbeiterLoading}
            syncStatus={mitarbeiterHasChanges ? 'syncing' : 'synced'}
          />
          <StatCard
            title="Freie Fahrzeuge"
            value={`${stats.verfuegbareFahrzeuge} (${stats.fahrzeugeAuslastung}%)`}
            icon={Truck}
            color="purple"
            loading={fahrzeugeLoading}
            syncStatus={fahrzeugeHasChanges ? 'syncing' : 'synced'}
          />
          <StatCard
            title="Umsatz (Monat)"
            value={`€${stats.totalRevenue.toLocaleString('de-DE')}`}
            icon={TrendingUp}
            color="green"
            loading={umzuegeLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Today's Moves */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Heutige Umzüge</h2>
            </div>
            <div className="px-6 py-4">
              {todayUmzuege.length === 0 ? (
                <p className="text-sm text-gray-500">Keine Umzüge für heute geplant</p>
              ) : (
                <div className="space-y-4">
                  {todayUmzuege.map(umzug => (
                    <Link
                      key={umzug._id}
                      to={`/umzuege/${umzug._id}`}
                      className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {umzug.kundenname}
                          </p>
                          <p className="text-sm text-gray-500">
                            {umzug.adresseAlt?.ort} → {umzug.adresseNeu?.ort}
                          </p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {dateUtils.formatTime(umzug.umzugsdatum)}
                            </span>
                            <span>{umzug.mitarbeiter?.length || 0} Mitarbeiter</span>
                            <span>{umzug.fahrzeuge?.length || 0} Fahrzeuge</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          umzug.status === 'in_bearbeitung' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {umzug.status === 'in_bearbeitung' ? 'Läuft' : 'Geplant'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Letzte Aktivitäten</h2>
            </div>
            <div className="px-6 py-4">
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500">Keine aktuellen Aktivitäten</p>
              ) : (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      isNew={newActivities.has(activity.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/umzuege/neu"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
          >
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">Neuer Umzug</p>
              <p className="text-sm text-gray-500">Umzug planen</p>
            </div>
          </Link>

          <Link
            to="/mitarbeiter"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
          >
            <div className="flex-shrink-0">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">Mitarbeiter</p>
              <p className="text-sm text-gray-500">Team verwalten</p>
            </div>
          </Link>

          <Link
            to="/fahrzeuge"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
          >
            <div className="flex-shrink-0">
              <Truck className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">Fahrzeuge</p>
              <p className="text-sm text-gray-500">Flotte verwalten</p>
            </div>
          </Link>

          <Link
            to="/zeitachse"
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
          >
            <div className="flex-shrink-0">
              <Activity className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">Zeitachse</p>
              <p className="text-sm text-gray-500">Verlauf anzeigen</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Add fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DashboardSynced;
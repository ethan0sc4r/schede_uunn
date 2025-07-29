import React, { useState, useEffect } from 'react';
import { TrendingUp, Ship, Users, Calendar, BarChart3, PieChart, Activity } from 'lucide-react';

interface UnitStats {
  totalUnits: number;
  unitsByClass: { [key: string]: number };
  unitsByCountry: { [key: string]: number };
  recentActivity: Array<{
    id: number;
    action: string;
    unit_name: string;
    timestamp: string;
    user_name?: string;
  }>;
  versionsStats: {
    totalVersions: number;
    publishedVersions: number;
    draftVersions: number;
  };
}

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = "" }) => {
  const [stats, setStats] = useState<UnitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle statistiche');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-32">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={fetchAnalytics}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const topClasses = stats ? Object.entries(stats.unitsByClass)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5) : [];

  const topCountries = stats ? Object.entries(stats.unitsByCountry)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5) : [];

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
          <p className="text-gray-600">Panoramica delle unità navali e attività</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range === 'week' ? 'Settimana' : range === 'month' ? 'Mese' : 'Anno'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Units */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totale Unità</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalUnits || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Ship className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Versions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Versioni Totali</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.versionsStats.totalVersions || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Published Versions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Versioni Pubblicate</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.versionsStats.publishedVersions || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Draft Versions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bozze</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.versionsStats.draftVersions || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Classes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <PieChart className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Classi Principali</h3>
          </div>
          <div className="space-y-3">
            {topClasses.map(([className, count], index) => (
              <div key={className} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ 
                      backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">{className || 'Non specificata'}</span>
                </div>
                <span className="text-sm text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Paesi Principali</h3>
          </div>
          <div className="space-y-3">
            {topCountries.map(([country, count], index) => (
              <div key={country} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ 
                      backgroundColor: `hsl(${index * 72}, 60%, 50%)` 
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">{country || 'Non specificato'}</span>
                </div>
                <span className="text-sm text-gray-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <Activity className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Attività Recente</h3>
        </div>
        <div className="space-y-3">
          {stats?.recentActivity?.slice(0, 10).map((activity) => (
            <div key={`${activity.id}-${activity.timestamp}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action} - {activity.unit_name}
                  </p>
                  {activity.user_name && (
                    <p className="text-xs text-gray-500">by {activity.user_name}</p>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleString('it-IT')}
              </span>
            </div>
          ))}
          {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
            <p className="text-sm text-gray-500 italic">Nessuna attività recente</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
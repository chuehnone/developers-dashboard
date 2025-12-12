
import React, { useEffect, useState } from 'react';
import {
  GitMerge,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MetricCard } from './components/MetricCard';
import { VelocityChart } from './components/VelocityChart';
import { MembersTable } from './components/MembersTable';
import { MembersPage } from './components/MembersPage';
import { GithubPage } from './components/GithubPage';
import { fetchDashboardData, fetchGithubAnalytics } from './services/dashboardService';
import { DeveloperMetric, DashboardSummary, TimeRange, GithubAnalyticsData } from './types';
import { isConfigValid } from './services/config';

const App: React.FC = () => {
  const [data, setData] = useState<DeveloperMetric[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [githubData, setGithubData] = useState<GithubAnalyticsData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('sprint');
  const [currentView, setCurrentView] = useState<string>('overview');
  const [configErrors, setConfigErrors] = useState<Array<{ variable: string; message: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Validate configuration before loading data
      const validation = isConfigValid();
      if (!validation.valid && validation.errors) {
        setConfigErrors(validation.errors);
        setLoading(false);
        return;
      }

      try {
        // Fetch standard dashboard data
        const result = await fetchDashboardData(timeRange);
        setData(result.metrics);
        setSummary(result.summary);

        // Fetch specialized data sets (in a real app, these would be fetched only when the view changes)
        // For this demo, we'll just fetch them all to keep state simple
        const ghResult = await fetchGithubAnalytics();
        setGithubData(ghResult);


      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

  const renderConfigError = () => {
    if (configErrors.length === 0) return null;

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-slate-900 border border-red-500/30 rounded-lg p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-400 mb-2">
                Configuration Error
              </h2>
              <p className="text-slate-300 mb-4">
                The dashboard requires environment variables to be configured. Please create a <code className="px-2 py-1 bg-slate-800 rounded text-sm">.env.local</code> file in the project root with the following missing variables:
              </p>
              <div className="space-y-3 mb-6">
                {configErrors.map((error, idx) => (
                  <div key={idx} className="bg-slate-800 border border-slate-700 rounded p-3">
                    <code className="text-sm text-blue-400">{error.variable}</code>
                    <p className="text-sm text-slate-400 mt-1">{error.message}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <p className="text-sm text-slate-300 mb-2">
                  <strong>Quick Start:</strong>
                </p>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Copy <code className="px-1 bg-slate-900 rounded">.env.local.example</code> to <code className="px-1 bg-slate-900 rounded">.env.local</code></li>
                  <li>Fill in your GitHub credentials</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading || !summary) {
      return (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (currentView === 'members') {
      return <MembersPage data={data} />;
    }

    if (currentView === 'github' && githubData) {
      return <GithubPage data={githubData} />;
    }


    // Default Overview Dashboard
    return (
      <>
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Merge Frequency" 
            value={summary.totalPrsMerged} 
            trend={summary.prTrend} 
            icon={GitMerge} 
          />
          <MetricCard 
            title="Avg Cycle Time (Hrs)" 
            value={summary.avgCycleTime} 
            trend={summary.cycleTimeTrend} 
            icon={Clock} 
            inverseTrend // Lower is better
          />
        </div>

        {/* Main Charts Area */}
        <div className="grid grid-cols-1 gap-6">
          <VelocityChart data={data} />
        </div>

        {/* Data Table Widget (Overview Only) */}
        <MembersTable data={data} />
      </>
    );
  };

  const getPageTitle = () => {
    switch(currentView) {
      case 'members': return 'Team Members';
      case 'github': return 'GitHub Analytics';
      default: return 'Engineering Overview';
    }
  }

  const getPageSubtitle = () => {
    switch(currentView) {
      case 'members': return 'Detailed performance breakdown per developer';
      case 'github': return 'Codebase health, cycle time, and review bottlenecks';
      default: return 'Track key metrics across GitHub';
    }
  }

  // Show configuration error screen if there are errors
  if (configErrors.length > 0) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
        {renderConfigError()}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {/* Header */}
        <header className="bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-800 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {getPageTitle()}
              </h1>
              <p className="text-sm text-slate-400">
                {getPageSubtitle()}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-500" />
                </div>
                <select 
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  disabled={loading}
                >
                  <option value="sprint">Last Sprint (2 weeks)</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                </select>
              </div>
              
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[2px]">
                <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                   <img src="https://picsum.photos/seed/manager/100/100" alt="Profile" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;

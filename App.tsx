
import React, { useEffect, useState } from 'react';
import { 
  Zap, 
  GitMerge, 
  Clock, 
  Calendar
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MetricCard } from './components/MetricCard';
import { VelocityChart } from './components/VelocityChart';
import { WorkDistributionChart } from './components/WorkDistributionChart';
import { MembersTable } from './components/MembersTable';
import { MembersPage } from './components/MembersPage';
import { GithubPage } from './components/GithubPage';
import { JiraPage } from './components/JiraPage';
import { fetchDashboardData, fetchGithubAnalytics, fetchJiraAnalytics } from './services/mockData';
import { DeveloperMetric, DashboardSummary, TimeRange, GithubAnalyticsData, JiraAnalyticsData } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<DeveloperMetric[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [githubData, setGithubData] = useState<GithubAnalyticsData | null>(null);
  const [jiraData, setJiraData] = useState<JiraAnalyticsData | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('sprint');
  const [currentView, setCurrentView] = useState<string>('overview');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch standard dashboard data
        const result = await fetchDashboardData(timeRange);
        setData(result.metrics);
        setSummary(result.summary);

        // Fetch specialized data sets (in a real app, these would be fetched only when the view changes)
        // For this demo, we'll just fetch them all to keep state simple
        const ghResult = await fetchGithubAnalytics();
        setGithubData(ghResult);

        const jiraResult = await fetchJiraAnalytics();
        setJiraData(jiraResult);
        
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange]);

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

    if (currentView === 'jira' && jiraData) {
      return <JiraPage data={jiraData} />;
    }

    // Default Overview Dashboard
    return (
      <>
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Total Story Points" 
            value={summary.totalPoints} 
            trend={summary.velocityTrend} 
            icon={Zap} 
          />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VelocityChart data={data} />
          </div>
          <div className="lg:col-span-1">
            <WorkDistributionChart data={data} />
          </div>
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
      case 'jira': return 'Jira Activity';
      default: return 'Engineering Overview';
    }
  }

  const getPageSubtitle = () => {
    switch(currentView) {
      case 'members': return 'Detailed performance breakdown per developer';
      case 'github': return 'Codebase health, cycle time, and review bottlenecks';
      case 'jira': return 'Sprint health, planning accuracy, and work allocation';
      default: return 'Track key metrics across GitHub and Jira';
    }
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

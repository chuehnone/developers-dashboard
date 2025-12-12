import React from 'react';
import { GithubAnalyticsData } from '../types';
import { MetricCard } from './MetricCard';
import { CycleTimeChart } from './CycleTimeChart';
import { PRScatterPlot } from './PRScatterPlot';
import { StalePRsList } from './StalePRsList';
import { Clock, GitPullRequest, GitMerge, CheckCircle2 } from 'lucide-react';

interface GithubPageProps {
  data: GithubAnalyticsData;
}

export const GithubPage: React.FC<GithubPageProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Top KPI Cards - Process Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Avg Cycle Time"
          value={`${data.summary.avgCycleTime}h`}
          trend={-5}
          icon={Clock}
          inverseTrend
          trendLabel="vs last 14 days"
        />
        <MetricCard
          title="Pickup Time"
          value={`${data.summary.avgPickupTime}h`}
          trend={12}
          icon={GitPullRequest}
          inverseTrend
          trendLabel="wait time increased"
        />
        <MetricCard
          title="Review Time"
          value={`${data.summary.avgReviewTime}h`}
          trend={-2}
          icon={CheckCircle2}
          inverseTrend
        />
        <MetricCard
          title="Merge Rate"
          value={`${data.summary.mergeRate}%`}
          trend={1}
          icon={GitMerge}
        />
      </div>

      {/* Main Charts - Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CycleTimeChart data={data.cycleTimeTrend} />
        <PRScatterPlot data={data.scatterData} />
      </div>

      {/* Action Items - Bottlenecks */}
      <div className="grid grid-cols-1 gap-6">
        <StalePRsList prs={data.stalePRs} />
      </div>
    </div>
  );
};

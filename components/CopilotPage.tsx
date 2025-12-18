import React from 'react';
import { CopilotAnalyticsData } from '../types';
import { MetricCard } from './MetricCard';
import { CopilotActivityChart } from './CopilotActivityChart';
import { EditorDistributionChart } from './EditorDistributionChart';
import { CopilotUsersTable } from './CopilotUsersTable';
import { Users, UserCheck, TrendingUp, AlertCircle } from 'lucide-react';

interface CopilotPageProps {
  data: CopilotAnalyticsData;
}

export const CopilotPage: React.FC<CopilotPageProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Telemetry Warning Banner */}
      {data.summary.neverUsed > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-blue-300">Activity Tracking Requires Telemetry</h4>
              <p className="text-sm text-blue-200/80 mt-1">
                {data.summary.neverUsed} user{data.summary.neverUsed > 1 ? 's have' : ' has'} never shown activity.
                Copilot activity metrics require users to enable telemetry in their IDE settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top KPI Cards - Adoption Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Copilot Seats"
          value={data.summary.totalSeats}
          trend={0}
          icon={Users}
          trendLabel="seats assigned"
        />
        <MetricCard
          title="Active Users"
          value={data.summary.activeUsers}
          trend={0}
          icon={UserCheck}
          trendLabel="active last 7 days"
        />
        <MetricCard
          title="Adoption Rate"
          value={`${data.summary.adoptionRate}%`}
          trend={0}
          icon={TrendingUp}
          trendLabel="team adoption"
        />
        <MetricCard
          title="Inactive Seats"
          value={data.summary.neverUsed}
          trend={0}
          icon={AlertCircle}
          inverseTrend
          trendLabel="never used"
        />
      </div>

      {/* Charts - Activity Trends and Editor Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CopilotActivityChart data={data.activityTrend} />
        <EditorDistributionChart data={data.editorDistribution} />
      </div>

      {/* User Details Table */}
      <div className="grid grid-cols-1 gap-6">
        <CopilotUsersTable users={data.userStats} />
      </div>

      {/* Additional Info */}
      {data.summary.avgDaysSinceActivity > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400">
            Average time since last activity: <span className="text-slate-200 font-semibold">{data.summary.avgDaysSinceActivity} days</span>
          </p>
        </div>
      )}
    </div>
  );
};

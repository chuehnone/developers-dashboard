
import React from 'react';
import { JiraAnalyticsData } from '../types';
import { MetricCard } from './MetricCard';
import { JiraVelocityChart } from './JiraVelocityChart';
import { InvestmentProfile } from './InvestmentProfile';
import { StuckTicketsList } from './StuckTicketsList';
import { Target, TrendingUp, AlertOctagon, Bug } from 'lucide-react';

interface JiraPageProps {
  data: JiraAnalyticsData;
}

export const JiraPage: React.FC<JiraPageProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Top KPI Cards - Agile Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Avg Velocity (3 Sprints)"
          value={data.summary.avgVelocity}
          trend={8}
          icon={TrendingUp}
          trendLabel="vs previous avg"
        />
        <MetricCard
          title="Say/Do Ratio"
          value={`${data.summary.sayDoRatio}%`}
          trend={-5}
          icon={Target}
          trendLabel="planning accuracy"
        />
        <MetricCard
          title="Scope Creep"
          value={`${data.summary.scopeCreep} pts`}
          trend={15}
          icon={AlertOctagon}
          inverseTrend
          trendLabel="added mid-sprint"
        />
        <MetricCard
          title="Bug Rate"
          value={`${data.summary.bugRate}%`}
          trend={-2}
          icon={Bug}
          inverseTrend
          trendLabel="of total volume"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <JiraVelocityChart data={data.sprintHistory} />
        </div>
        <div className="lg:col-span-1">
          <InvestmentProfile data={data.investmentProfile} />
        </div>
      </div>

      {/* Secondary Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StuckTicketsList tickets={data.activeTickets} />
        </div>
         {/* Placeholder for Ticket Status Distribution or other widgets */}
         <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl">
             <h3 className="text-lg font-semibold text-slate-100 mb-4">Sprint Goals Status</h3>
             <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                     <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                         <span className="text-sm font-medium text-slate-200">Release v2.4 Core Features</span>
                     </div>
                     <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">On Track</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                     <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                         <span className="text-sm font-medium text-slate-200">Migrate Payment Gateway</span>
                     </div>
                     <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">At Risk</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                     <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                         <span className="text-sm font-medium text-slate-200">Update Documentation</span>
                     </div>
                     <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">Completed</span>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

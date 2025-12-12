import React from 'react';
import { PullRequest } from '../types';
import { AlertCircle, Clock, GitPullRequest } from 'lucide-react';

interface StalePRsListProps {
  prs: PullRequest[];
}

export const StalePRsList: React.FC<StalePRsListProps> = ({ prs }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <AlertCircle className="text-amber-500" size={20} />
            Stale PRs (Needs Attention)
          </h3>
          <p className="text-sm text-slate-400">Open for {'>'} 3 days with low activity</p>
        </div>
      </div>
      
      <div className="divide-y divide-slate-800">
        {prs.map((pr) => {
          // Calculate arbitrary age for mock display
          const daysOpen = Math.floor((Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <div key={pr.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <GitPullRequest size={18} className="text-slate-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-200">{pr.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="font-mono">{pr.id}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <img src={pr.authorAvatar} alt="" className="w-4 h-4 rounded-full" />
                      <span>{pr.author}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-amber-500 text-sm font-medium">
                    <Clock size={14} />
                    <span>{daysOpen} days</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    +{pr.lines_added} / -{pr.lines_deleted}
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors">
                  View
                </button>
              </div>
            </div>
          );
        })}
        
        {prs.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No stale PRs found. Good job team!
          </div>
        )}
      </div>
    </div>
  );
};

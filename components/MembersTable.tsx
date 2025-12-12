import React from 'react';
import { DeveloperMetric } from '../types';
import { MoreHorizontal, ExternalLink } from 'lucide-react';

interface MembersTableProps {
  data: DeveloperMetric[];
}

export const MembersTable: React.FC<MembersTableProps> = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-100">Team Performance Details</h3>
        <button className="text-sm text-blue-500 hover:text-blue-400 font-medium">Download Report</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Developer</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Impact Score</th>
              <th className="px-6 py-4 text-right">Velocity</th>
              <th className="px-6 py-4 text-right">PRs Merged</th>
              <th className="px-6 py-4 text-right">Avg Cycle Time</th>
              <th className="px-6 py-4 text-right">Code Reviews</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((dev) => (
              <tr key={dev.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img 
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-800" 
                      src={dev.avatar} 
                      alt={dev.name} 
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-100">{dev.name}</p>
                      <p className="text-xs text-slate-500">@{dev.name.toLowerCase().replace(' ', '')}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {dev.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end">
                    <span className="font-bold text-slate-100">{dev.impactScore}</span>
                    <div className={`w-2 h-2 rounded-full ml-2 ${dev.impactScore > 80 ? 'bg-emerald-500' : dev.impactScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-slate-300">
                  {dev.velocity} pts
                </td>
                <td className="px-6 py-4 text-right text-slate-300">
                  {dev.prsMerged}
                </td>
                <td className="px-6 py-4 text-right text-slate-300">
                  {dev.avgCycleTimeHours}h
                </td>
                <td className="px-6 py-4 text-right text-slate-300">
                  {dev.reviewCommentsGiven}
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="text-slate-500 hover:text-slate-300 transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
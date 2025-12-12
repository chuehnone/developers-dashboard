import React, { useState, useMemo } from 'react';
import { DeveloperMetric } from '../types';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  MessageSquare,
  GitMerge,
  AlertCircle
} from 'lucide-react';

interface MembersPageProps {
  data: DeveloperMetric[];
}

export const MembersPage: React.FC<MembersPageProps> = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  const filteredData = useMemo(() => {
    return data.filter(dev => {
      const matchesSearch = dev.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || dev.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [data, searchQuery, roleFilter]);

  const roles = ['All', ...new Set(data.map(d => d.role))];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Team Members</h2>
        <p className="text-slate-400">Detailed performance breakdown per developer</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            className="bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Search developers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <select 
            className="bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-48 p-2.5"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rich Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Member Profile</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">GitHub Activity</th>
                <th className="px-6 py-4 text-right">Impact Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredData.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-800/30 transition-colors group">
                  {/* Member Profile */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="relative">
                        <img 
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-800" 
                          src={dev.avatar} 
                          alt={dev.name} 
                        />
                        <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${
                          dev.status === 'Shipping' ? 'bg-emerald-500' : 
                          dev.status === 'Blocked' ? 'bg-red-500' :
                          dev.status === 'On Leave' ? 'bg-slate-500' : 'bg-yellow-500'
                        }`}></div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-slate-100">{dev.name}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 mt-1">
                          {dev.role}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        dev.status === 'Shipping' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        dev.status === 'Blocked' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        dev.status === 'On Leave' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                      {dev.status}
                    </span>
                  </td>

                  {/* GitHub Activity */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase font-semibold">Merged</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <GitMerge size={14} className="text-purple-500" />
                          <span className="text-sm font-bold text-slate-200">{dev.prsMerged}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase font-semibold">Review Rate</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MessageSquare size={14} className="text-blue-500" />
                          <span className="text-sm font-bold text-slate-200">
                             {dev.prsMerged > 0 ? (dev.reviewCommentsGiven / dev.prsMerged).toFixed(1) : '0'}x
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Impact Score */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-slate-100">{dev.impactScore}</span>
                      <div className={`flex items-center text-xs font-medium ${
                        dev.impactTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {dev.impactTrend >= 0 ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
                        {Math.abs(dev.impactTrend)}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-8 w-8 mb-2 text-slate-600" />
                      <p>No team members found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

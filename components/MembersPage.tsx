import React, {useMemo, useState} from 'react';
import {DeveloperMetric, PRCreatedDetail} from '../types';
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    ChevronDown,
    ChevronUp,
    Code,
    ExternalLink,
    Filter,
    GitMerge,
    MessageSquare,
    Search,
    Users
} from 'lucide-react';

interface MembersPageProps {
    data: DeveloperMetric[];
}

export const MembersPage: React.FC<MembersPageProps> = ({data}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('All');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (devId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(devId)) {
            newExpanded.delete(devId);
        } else {
            newExpanded.add(devId);
        }
        setExpandedRows(newExpanded);
    };

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
            <div
                className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-500"/>
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
                    <Filter className="h-4 w-4 text-slate-500"/>
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
                            <th className="px-6 py-4">GitHub Activity</th>
                            <th className="px-6 py-4">Comments Given</th>
                            <th className="px-6 py-4 text-right">Impact Score</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                        {filteredData.map((dev) => {
                            const isExpanded = expandedRows.has(dev.id);
                            const hasComments = dev.commentAnalysis && dev.commentAnalysis.uniqueCommenters > 0;
                            const hasCommentsGiven = dev.commentGivenAnalysis && dev.commentGivenAnalysis.totalCommentsGiven > 0;
                            const hasPRsCreated = dev.prCreatedAnalysis && dev.prCreatedAnalysis.totalPRsCreated > 0;

                            return (
                                <React.Fragment key={dev.id}>
                                    {/* Main Row */}
                                    <tr className="hover:bg-slate-800/30 transition-colors group">
                                        {/* Member Profile */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="relative">
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-800"
                                                        src={dev.avatar}
                                                        alt={dev.name}
                                                    />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-semibold text-slate-100">{dev.name}</p>
                                                    <span
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 mt-1">
                              {dev.role}
                            </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* GitHub Activity */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col">
                                                    <span
                                                        className="text-xs text-slate-500 uppercase font-semibold">Merged</span>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <GitMerge size={14} className="text-purple-500"/>
                                                        <span
                                                            className="text-sm font-bold text-slate-200">{dev.prsMerged}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500 uppercase font-semibold">Review Rate</span>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <MessageSquare size={14} className="text-blue-500"/>
                                                        <span className="text-sm font-bold text-slate-200">
                                 {dev.prsMerged > 0 ? (dev.reviewCommentsGiven / dev.prsMerged).toFixed(1) : '0'}x
                              </span>
                                                    </div>
                                                </div>
                                                {hasComments && (
                                                    <div className="flex flex-col">
                                                        <span
                                                            className="text-xs text-slate-500 uppercase font-semibold">Commenters</span>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <Users size={14} className="text-cyan-500"/>
                                                            <span className="text-sm font-bold text-slate-200">
                                  {dev.commentAnalysis!.uniqueCommenters}
                                </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Comments Given */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                {hasCommentsGiven ? (
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex flex-col">
                                                            <span
                                                                className="text-xs text-slate-500 uppercase font-semibold">Total Comments</span>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <MessageSquare size={14} className="text-emerald-500"/>
                                                                <span className="text-sm font-bold text-slate-200">
                                    {dev.commentGivenAnalysis!.totalCommentsGiven}
                                  </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span
                                                                className="text-xs text-slate-500 uppercase font-semibold">PRs Reviewed</span>
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <GitMerge size={14} className="text-blue-400"/>
                                                                <span className="text-sm font-bold text-slate-200">
                                    {dev.commentGivenAnalysis!.totalPRsCommentedOn}
                                  </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-slate-500">No comments</div>
                                                )}

                                                {/* Expand/Collapse Button - Show if has comments given OR received OR PRs created */}
                                                {(hasCommentsGiven || hasComments || hasPRsCreated) && (
                                                    <button
                                                        onClick={() => toggleRow(dev.id)}
                                                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                                                        aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                                                    >
                                                        {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Impact Score */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span
                                                    className="text-lg font-bold text-slate-100">{dev.impactScore}</span>
                                                <div className={`flex items-center text-xs font-medium ${
                                                    dev.impactTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                                }`}>
                                                    {dev.impactTrend >= 0 ?
                                                        <ArrowUpRight size={12} className="mr-0.5"/> :
                                                        <ArrowDownRight size={12} className="mr-0.5"/>}
                                                    {Math.abs(dev.impactTrend)}%
                                                </div>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Comment Details Row */}
                                    {isExpanded && hasComments && (
                                        <tr className="bg-slate-800/20">
                                            <td colSpan={4} className="px-6 py-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                            <MessageSquare size={16} className="text-cyan-500"/>
                                                            PR Comment Analysis
                                                        </h4>
                                                        <div className="text-xs text-slate-400">
                                                            {dev.commentAnalysis!.totalCommentsReceived} total comments
                                                            from {dev.commentAnalysis!.uniqueCommenters} people
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Top Commenters */}
                                                        <div
                                                            className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                                                            <h5 className="text-xs font-semibold text-slate-400 uppercase mb-3">Top
                                                                Commenters</h5>
                                                            <div className="space-y-2">
                                                                {dev.commentAnalysis!.topCommenters.map((commenter, idx) => (
                                                                    <div key={commenter.login}
                                                                         className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span
                                                                                className="text-xs font-bold text-slate-500 w-4">#{idx + 1}</span>
                                                                            <img
                                                                                src={commenter.avatar}
                                                                                alt={commenter.login}
                                                                                className="h-6 w-6 rounded-full ring-1 ring-slate-700"
                                                                            />
                                                                            <span
                                                                                className="text-sm text-slate-300">{commenter.login}</span>
                                                                        </div>
                                                                        <span
                                                                            className="text-sm font-semibold text-cyan-400">{commenter.count}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Engagement Stats */}
                                                        <div
                                                            className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                                                            <h5 className="text-xs font-semibold text-slate-400 uppercase mb-3">Engagement
                                                                Stats</h5>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <div className="flex justify-between text-xs mb-1">
                                                                        <span className="text-slate-400">Avg Comments per PR</span>
                                                                        <span className="text-slate-200 font-semibold">
                                        {dev.prsMerged > 0
                                            ? (dev.commentAnalysis!.totalCommentsReceived / dev.prsMerged).toFixed(1)
                                            : '0'}
                                      </span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex justify-between text-xs mb-1">
                                                                        <span className="text-slate-400">Avg Commenters per PR</span>
                                                                        <span className="text-slate-200 font-semibold">
                                        {dev.prsMerged > 0
                                            ? (dev.commentAnalysis!.uniqueCommenters / dev.prsMerged).toFixed(1)
                                            : '0'}
                                      </span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex justify-between text-xs mb-1">
                                                                        <span
                                                                            className="text-slate-400">Total Comments</span>
                                                                        <span className="text-slate-200 font-semibold">
                                        {dev.commentAnalysis!.totalCommentsReceived}
                                      </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {/* Expanded Comments Given Details Row */}
                                    {isExpanded && hasCommentsGiven && (
                                        <tr className="bg-slate-800/20">
                                            <td colSpan={4} className="px-6 py-4">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                            <MessageSquare size={16} className="text-emerald-500"/>
                                                            PRs Reviewed by {dev.name}
                                                        </h4>
                                                        <div className="text-xs text-slate-400">
                                                            {dev.commentGivenAnalysis!.totalCommentsGiven} comments
                                                            across {dev.commentGivenAnalysis!.totalPRsCommentedOn} PRs
                                                        </div>
                                                    </div>

                                                    {/* PR List */}
                                                    <div
                                                        className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                                                        <div className="max-h-96 overflow-y-auto">
                                                            <table className="w-full">
                                                                <thead
                                                                    className="bg-slate-950/50 text-slate-400 uppercase text-xs font-semibold sticky top-0">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left">PR Title</th>
                                                                    <th className="px-4 py-2 text-left">Repository</th>
                                                                    <th className="px-4 py-2 text-center">Status</th>
                                                                    <th className="px-4 py-2 text-center">Comments</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-800">
                                                                {dev.commentGivenAnalysis!.prsCommentedOn.map((pr) => (
                                                                    <tr key={pr.prId}
                                                                        className="hover:bg-slate-800/30 transition-colors">
                                                                        <td className="px-4 py-3">
                                                                            <a
                                                                                href={pr.prUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-sm text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                                                                            >
                                                                                {pr.prTitle}
                                                                                <ExternalLink size={12}/>
                                                                            </a>
                                                                            <div
                                                                                className="flex items-center gap-2 mt-1">
                                                                                <img
                                                                                    src={pr.prAuthorAvatar}
                                                                                    alt={pr.prAuthor}
                                                                                    className="h-4 w-4 rounded-full"
                                                                                />
                                                                                <span
                                                                                    className="text-xs text-slate-500">by {pr.prAuthor}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <span
                                                                                className="text-xs text-slate-400">{pr.repository}</span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            {pr.status === 'merged' ? (
                                                                                <span
                                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                                              <GitMerge size={12}/>
                                              Merged
                                            </span>
                                                                            ) : pr.status === 'open' ? (
                                                                                <span
                                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                              <AlertCircle size={12}/>
                                              Open
                                            </span>
                                                                            ) : (
                                                                                <span
                                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-500/20 text-slate-400">
                                              <AlertCircle size={12}/>
                                              Closed
                                            </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                          <span className="text-sm font-semibold text-emerald-400">
                                            {pr.commentCount}
                                          </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {/* PRs Created by Developer Section */}
                                    {isExpanded && hasPRsCreated && (
                                        <tr className="bg-slate-800/20">
                                            <td colSpan={4} className="px-6 py-4">
                                                <div className="space-y-4">
                                                    {/* Section Header */}
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                            <Code size={16} className="text-blue-500"/>
                                                            PRs Created by {dev.name}
                                                        </h4>
                                                        <div className="text-xs text-slate-400">
                                                            {dev.prCreatedAnalysis!.totalPRsCreated} PRs created • {dev.prCreatedAnalysis!.totalPRsMerged} merged • {dev.prCreatedAnalysis!.totalPRsOpen} open
                                                        </div>
                                                    </div>

                                                    {/* PR List Table */}
                                                    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                                                        <div className="max-h-96 overflow-y-auto">
                                                            <table className="w-full">
                                                                {/* Table Header */}
                                                                <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs font-semibold sticky top-0">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left">PR Title</th>
                                                                    <th className="px-4 py-2 text-left">Repository</th>
                                                                    <th className="px-4 py-2 text-center">Status</th>
                                                                    <th className="px-4 py-2 text-center">Milestone</th>
                                                                </tr>
                                                                </thead>
                                                                {/* Table Body */}
                                                                <tbody className="divide-y divide-slate-800">
                                                                {dev.prCreatedAnalysis!.prsCreated.map((pr) => (
                                                                    <tr key={pr.prId} className="hover:bg-slate-800/30 transition-colors">
                                                                        {/* PR Title */}
                                                                        <td className="px-4 py-3">
                                                                            <a
                                                                                href={pr.prUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-sm text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                                                                            >
                                                                                {pr.prTitle}
                                                                                <ExternalLink size={12}/>
                                                                            </a>
                                                                            <div className="text-xs text-slate-500 mt-1">
                                                                                #{pr.prNumber}
                                                                            </div>
                                                                        </td>
                                                                        {/* Repository */}
                                                                        <td className="px-4 py-3">
                                                                            <span className="text-xs text-slate-400">{pr.repository}</span>
                                                                        </td>
                                                                        {/* Status Badge */}
                                                                        <td className="px-4 py-3 text-center">
                                                                            {pr.status === 'merged' ? (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                                                                                    <GitMerge size={12}/>
                                                                                    Merged
                                                                                </span>
                                                                            ) : pr.status === 'open' ? (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                                                                    <AlertCircle size={12}/>
                                                                                    Open
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-500/20 text-slate-400">
                                                                                    <AlertCircle size={12}/>
                                                                                    Closed
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        {/* Milestone */}
                                                                        <td className="px-4 py-3 text-center">
                                                                            {pr.milestone ? (
                                                                                <span className="text-sm text-slate-300">
                                                                                    {pr.milestone}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-xs text-slate-500">-</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <AlertCircle className="h-8 w-8 mb-2 text-slate-600"/>
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

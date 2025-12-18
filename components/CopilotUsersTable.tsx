import React, { useState } from 'react';
import { CopilotUserStats } from '../types';
import { ArrowUpDown } from 'lucide-react';

interface CopilotUsersTableProps {
  users: CopilotUserStats[];
}

type SortField = 'login' | 'status' | 'lastActivityAt' | 'daysSinceActivity';
type SortDirection = 'asc' | 'desc';

export const CopilotUsersTable: React.FC<CopilotUsersTableProps> = ({ users }) => {
  const [sortField, setSortField] = useState<SortField>('daysSinceActivity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'login':
        comparison = a.login.localeCompare(b.login);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'lastActivityAt':
        if (!a.lastActivityAt && !b.lastActivityAt) comparison = 0;
        else if (!a.lastActivityAt) comparison = 1;
        else if (!b.lastActivityAt) comparison = -1;
        else comparison = new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime();
        break;
      case 'daysSinceActivity':
        if (a.daysSinceActivity === null && b.daysSinceActivity === null) comparison = 0;
        else if (a.daysSinceActivity === null) comparison = 1;
        else if (b.daysSinceActivity === null) comparison = -1;
        else comparison = a.daysSinceActivity - b.daysSinceActivity;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getStatusBadge = (status: 'active' | 'inactive' | 'never-used') => {
    const styles = {
      active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      inactive: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'never-used': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      'never-used': 'Never Used',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Copilot User Activity</h3>
          <p className="text-sm text-slate-400 mt-1">Per-user Copilot usage details</p>
        </div>
        <div className="text-sm text-slate-400">
          Total: {users.length} users
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">
                <button
                  onClick={() => handleSort('login')}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                >
                  User
                  <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-6 py-4">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                >
                  Status
                  <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-6 py-4">
                <button
                  onClick={() => handleSort('lastActivityAt')}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                >
                  Last Activity
                  <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-6 py-4">Editor</th>
              <th className="px-6 py-4 text-right">
                <button
                  onClick={() => handleSort('daysSinceActivity')}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors ml-auto"
                >
                  Days Idle
                  <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-6 py-4">Assigned Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedUsers.map((user) => (
              <tr key={user.login} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-800"
                      src={user.avatar}
                      alt={user.login}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-100">{user.name || user.login}</p>
                      <p className="text-xs text-slate-500">@{user.login}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-6 py-4 text-slate-300 text-sm">
                  {formatRelativeTime(user.lastActivityAt)}
                </td>
                <td className="px-6 py-4 text-slate-300 text-sm">
                  {user.lastActivityEditor || '—'}
                </td>
                <td className="px-6 py-4 text-right text-slate-300 text-sm">
                  {user.daysSinceActivity !== null ? `${user.daysSinceActivity} days` : '—'}
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm">
                  {new Date(user.assignedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

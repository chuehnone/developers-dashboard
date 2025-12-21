import React, { useEffect } from 'react';
import { DeveloperMetric } from '../types';
import { Portal } from '../utils/portal';
import {
  X,
  GitMerge,
  MessageSquare,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
} from 'lucide-react';

interface DeveloperDetailsModalProps {
  developer: DeveloperMetric | null;
  onClose: () => void;
}

export const DeveloperDetailsModal: React.FC<DeveloperDetailsModalProps> = ({
  developer,
  onClose,
}) => {
  useEffect(() => {
    if (!developer) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [developer, onClose]);

  if (!developer) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const hasComments = developer.commentAnalysis && developer.commentAnalysis.uniqueCommenters > 0;

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-800"
                  src={developer.avatar}
                  alt={developer.name}
                />
              </div>
              <div>
                <h2 id="modal-title" className="text-2xl font-bold text-slate-100">
                  {developer.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {developer.role}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Impact Score */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-purple-500" size={24} />
                  <div>
                    <p className="text-sm text-slate-400">Impact Score</p>
                    <p className="text-3xl font-bold text-slate-100">{developer.impactScore}</p>
                  </div>
                </div>
                <div
                  className={`flex items-center text-lg font-medium ${
                    developer.impactTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {developer.impactTrend >= 0 ? (
                    <ArrowUpRight size={20} className="mr-0.5" />
                  ) : (
                    <ArrowDownRight size={20} className="mr-0.5" />
                  )}
                  {Math.abs(developer.impactTrend)}%
                </div>
              </div>
            </div>

            {/* GitHub Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GitMerge className="text-purple-500" size={18} />
                  <p className="text-xs text-slate-400 uppercase font-semibold">PRs Merged</p>
                </div>
                <p className="text-2xl font-bold text-slate-100">{developer.prsMerged}</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-blue-500" size={18} />
                  <p className="text-xs text-slate-400 uppercase font-semibold">Avg Cycle Time</p>
                </div>
                <p className="text-2xl font-bold text-slate-100">{developer.avgCycleTimeHours}h</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="text-cyan-500" size={18} />
                  <p className="text-xs text-slate-400 uppercase font-semibold">Review Comments</p>
                </div>
                <p className="text-2xl font-bold text-slate-100">{developer.reviewCommentsGiven}</p>
              </div>
            </div>

            {/* PR Comment Analysis */}
            {hasComments && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <MessageSquare size={16} className="text-cyan-500" />
                    PR Comment Analysis
                  </h4>
                  <div className="text-xs text-slate-400">
                    {developer.commentAnalysis!.totalCommentsReceived} total comments from{' '}
                    {developer.commentAnalysis!.uniqueCommenters} people
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Commenters */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                      Top Commenters
                    </h5>
                    <div className="space-y-2">
                      {developer.commentAnalysis!.topCommenters.map((commenter, idx) => (
                        <div key={commenter.login} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 w-4">
                              #{idx + 1}
                            </span>
                            <img
                              src={commenter.avatar}
                              alt={commenter.login}
                              className="h-6 w-6 rounded-full ring-1 ring-slate-700"
                            />
                            <span className="text-sm text-slate-300">{commenter.login}</span>
                          </div>
                          <span className="text-sm font-semibold text-cyan-400">
                            {commenter.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Engagement Stats */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                      Engagement Stats
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Avg Comments per PR</span>
                          <span className="text-slate-200 font-semibold">
                            {developer.prsMerged > 0
                              ? (
                                  developer.commentAnalysis!.totalCommentsReceived /
                                  developer.prsMerged
                                ).toFixed(1)
                              : '0'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Avg Commenters per PR</span>
                          <span className="text-slate-200 font-semibold">
                            {developer.prsMerged > 0
                              ? (
                                  developer.commentAnalysis!.uniqueCommenters / developer.prsMerged
                                ).toFixed(1)
                              : '0'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Total Comments</span>
                          <span className="text-slate-200 font-semibold">
                            {developer.commentAnalysis!.totalCommentsReceived}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Metrics */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h5 className="text-xs font-semibold text-slate-400 uppercase mb-3">
                Additional Metrics
              </h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">PRs Opened</p>
                  <p className="text-lg font-semibold text-slate-200">{developer.prsOpened}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Review Rate</p>
                  <p className="text-lg font-semibold text-slate-200">
                    {developer.prsMerged > 0
                      ? (developer.reviewCommentsGiven / developer.prsMerged).toFixed(1)
                      : '0'}
                    x
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

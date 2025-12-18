import { CopilotSeat, CopilotSeatsResponse } from './copilotTypes';
import {
  CopilotUserStats,
  CopilotEditorDistribution,
  CopilotActivityTrend,
  CopilotAnalyticsData,
} from '../../../types';

// Active user threshold: 7 days
const ACTIVE_THRESHOLD_DAYS = 7;

// Editor display name mapping for consistency
const EDITOR_DISPLAY_NAMES: Record<string, string> = {
  'vscode': 'VS Code',
  'visualstudio': 'Visual Studio',
  'jetbrains': 'JetBrains IDEs',
  'intellij': 'IntelliJ IDEA',
  'pycharm': 'PyCharm',
  'webstorm': 'WebStorm',
  'neovim': 'Neovim',
  'vim': 'Vim',
  'emacs': 'Emacs',
  'sublime': 'Sublime Text',
  'atom': 'Atom',
};

/**
 * Normalize editor name for display
 */
function normalizeEditorName(editor: string | null): string {
  if (!editor) return 'Unknown';

  const normalized = editor.toLowerCase();
  return EDITOR_DISPLAY_NAMES[normalized] || editor;
}

/**
 * Determine activity status based on last activity timestamp
 */
function determineActivityStatus(lastActivityAt: string | null): {
  isActive: boolean;
  status: 'active' | 'inactive' | 'never-used';
  daysSinceActivity: number | null;
} {
  if (!lastActivityAt) {
    return {
      isActive: false,
      status: 'never-used',
      daysSinceActivity: null,
    };
  }

  const now = new Date();
  const lastActivity = new Date(lastActivityAt);
  const daysSince = Math.floor(
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isActive = daysSince <= ACTIVE_THRESHOLD_DAYS;

  return {
    isActive,
    status: isActive ? 'active' : 'inactive',
    daysSinceActivity: daysSince,
  };
}

/**
 * Calculate adoption rate (percentage of active users)
 */
function calculateAdoptionRate(seats: CopilotSeat[]): number {
  if (seats.length === 0) return 0;

  const activeCount = seats.filter((seat) => {
    if (!seat.last_activity_at) return false;
    const { isActive } = determineActivityStatus(seat.last_activity_at);
    return isActive;
  }).length;

  return (activeCount / seats.length) * 100;
}

/**
 * Calculate activity trend over time (daily snapshots)
 */
function calculateActivityTrend(
  seats: CopilotSeat[],
  days: number
): CopilotActivityTrend[] {
  const trends: CopilotActivityTrend[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0); // Start of day
    const dateKey = date.toISOString().split('T')[0];

    let activeCount = 0;
    let neverUsedCount = 0;

    for (const seat of seats) {
      if (!seat.last_activity_at) {
        neverUsedCount++;
        continue;
      }

      const lastActivityDate = new Date(seat.last_activity_at);
      const daysSinceActivity = Math.floor(
        (date.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // User was active if their last activity was within 7 days of this date
      // and the activity happened before or on this date
      if (daysSinceActivity >= 0 && daysSinceActivity <= ACTIVE_THRESHOLD_DAYS) {
        activeCount++;
      }
    }

    const inactiveCount = seats.length - activeCount - neverUsedCount;

    trends.push({
      date: dateKey,
      activeUsers: activeCount,
      inactiveUsers: inactiveCount,
      totalSeats: seats.length,
    });
  }

  return trends;
}

/**
 * Calculate editor distribution (which editors are being used)
 */
function calculateEditorDistribution(
  seats: CopilotSeat[]
): CopilotEditorDistribution[] {
  const editorCounts = new Map<string, number>();

  seats.forEach((seat) => {
    const editorName = normalizeEditorName(seat.last_activity_editor);
    editorCounts.set(editorName, (editorCounts.get(editorName) || 0) + 1);
  });

  const total = Array.from(editorCounts.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  const distribution = Array.from(editorCounts.entries())
    .map(([editor, count]) => ({
      editor,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  return distribution;
}

/**
 * Main transformation function: Convert raw Copilot API response to analytics data
 */
export function buildCopilotAnalyticsData(
  response: CopilotSeatsResponse,
  timeRangeDays: number
): CopilotAnalyticsData {
  // Transform each seat to user stats
  const userStats: CopilotUserStats[] = response.seats.map((seat) => {
    const { isActive, status, daysSinceActivity } = determineActivityStatus(
      seat.last_activity_at
    );

    return {
      login: seat.assignee.login,
      name: undefined, // Not provided by Copilot API
      avatar: seat.assignee.avatar_url,
      lastActivityAt: seat.last_activity_at,
      lastActivityEditor: seat.last_activity_editor
        ? normalizeEditorName(seat.last_activity_editor)
        : null,
      assignedAt: seat.created_at,
      daysSinceActivity,
      isActive,
      status,
    };
  });

  // Calculate summary metrics
  const activeUsers = userStats.filter((u) => u.isActive).length;
  const neverUsed = userStats.filter((u) => u.status === 'never-used').length;
  const inactiveUsers = userStats.filter((u) => u.status === 'inactive').length;
  const adoptionRate = calculateAdoptionRate(response.seats);

  // Calculate average days since activity (excluding never-used)
  const daysWithActivity = userStats
    .filter((u) => u.daysSinceActivity !== null)
    .map((u) => u.daysSinceActivity!);
  const avgDaysSinceActivity =
    daysWithActivity.length > 0
      ? Math.round(
          daysWithActivity.reduce((sum, d) => sum + d, 0) /
            daysWithActivity.length
        )
      : 0;

  return {
    summary: {
      totalSeats: response.total_seats,
      activeUsers,
      inactiveUsers,
      neverUsed,
      adoptionRate: Math.round(adoptionRate * 10) / 10, // Round to 1 decimal
      avgDaysSinceActivity,
    },
    userStats,
    editorDistribution: calculateEditorDistribution(response.seats),
    activityTrend: calculateActivityTrend(response.seats, timeRangeDays),
  };
}

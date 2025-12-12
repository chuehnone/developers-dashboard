
export interface Developer {
  id: string;
  name: string;
  role: 'Frontend' | 'Backend' | 'Fullstack' | 'DevOps';
  avatar: string;
}


export interface GithubStats {
  developerId: string;
  prsOpened: number;
  prsMerged: number;
  avgCycleTimeHours: number; // Time from open to merge
  reviewCommentsGiven: number;
}

export type DeveloperStatus = 'Shipping' | 'Bug Fixing' | 'Tech Debt' | 'Blocked' | 'On Leave';

// Combined interface for dashboard display
export interface DeveloperMetric extends Developer, GithubStats {
  impactScore: number; // Calculated field
  impactTrend: number; // Percentage change
  status: DeveloperStatus;
  recentActivityTrend: number[]; // Array of commit counts for sparklines
}

export type TimeRange = 'sprint' | 'month' | 'quarter';

export interface DashboardSummary {
  totalPrsMerged: number;
  avgCycleTime: number;
  velocityTrend: number; // Percentage
  prTrend: number; // Percentage
  cycleTimeTrend: number; // Percentage
}

// GitHub Analytics Specific Types

export interface PullRequest {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  created_at: string;
  first_commit_at: string;
  first_review_at: string | null;
  merged_at: string | null;
  lines_added: number;
  lines_deleted: number;
  status: 'merged' | 'open' | 'closed';
  url: string;
}

export interface CycleTimeDaily {
  date: string;
  codingTime: number; // hours
  pickupTime: number; // hours
  reviewTime: number; // hours
  totalTime: number; // hours
}

export interface GithubAnalyticsData {
  summary: {
    avgCycleTime: number;
    avgPickupTime: number;
    avgReviewTime: number;
    mergeRate: number;
  };
  cycleTimeTrend: CycleTimeDaily[];
  scatterData: { size: number; time: number; pr: PullRequest }[];
  stalePRs: PullRequest[];
}


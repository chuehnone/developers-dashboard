
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

// PR Comment Analysis Types

export interface CommentAuthor {
  login: string;
  count: number;
  avatar: string;  // https://github.com/{login}.png
}

export interface PRCommentAnalysis {
  developerId: string;
  totalCommentsReceived: number;  // Total comments on their PRs (excluding self)
  uniqueCommenters: number;       // Number of unique people who commented
  topCommenters: CommentAuthor[];  // Top 5 commenters sorted by count
  allCommenters: CommentAuthor[];  // Full list for expandable view
}

// PR Comment Given Analysis Types (inverse - tracks comments developer GAVE on others' PRs)

export interface PRCommentedOn {
  prId: string;              // Unique PR identifier
  prNumber: number;          // PR number
  prTitle: string;           // PR title
  prUrl: string;             // GitHub PR URL
  prAuthor: string;          // PR author login
  prAuthorAvatar: string;    // PR author avatar URL
  repository: string;        // Repository name
  commentCount: number;      // Number of comments by developer on this PR
  status: 'merged' | 'open' | 'closed';  // PR status
  lastCommentedAt: string;   // ISO timestamp of last comment
}

export interface PRCommentGivenAnalysis {
  developerId: string;
  totalCommentsGiven: number;     // Total comments given on others' PRs
  totalPRsCommentedOn: number;    // Number of unique PRs commented on
  prsCommentedOn: PRCommentedOn[]; // Detailed list, sorted by comment count DESC
}

// Combined interface for dashboard display
export interface DeveloperMetric extends Developer, GithubStats {
  impactScore: number; // Calculated field
  impactTrend: number; // Percentage change
  recentActivityTrend: number[]; // Array of commit counts for sparklines
  commentAnalysis?: PRCommentAnalysis;  // Optional comment analysis data (comments RECEIVED)
  commentGivenAnalysis?: PRCommentGivenAnalysis;  // Optional comment given analysis (comments GIVEN)
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

// Copilot Analytics Types

export interface CopilotUserStats {
  login: string;
  name?: string;
  avatar: string;
  lastActivityAt: string | null;
  lastActivityEditor: string | null;
  assignedAt: string;
  daysSinceActivity: number | null;
  isActive: boolean; // Active if activity within last 7 days
  status: 'active' | 'inactive' | 'never-used';
}

export interface CopilotEditorDistribution {
  editor: string;
  count: number;
  percentage: number;
}

export interface CopilotActivityTrend {
  date: string; // ISO date (YYYY-MM-DD)
  activeUsers: number;
  inactiveUsers: number;
  totalSeats: number;
}

export interface CopilotAnalyticsData {
  summary: {
    totalSeats: number;
    activeUsers: number;
    inactiveUsers: number;
    neverUsed: number;
    adoptionRate: number; // Percentage of active users
    avgDaysSinceActivity: number;
  };
  userStats: CopilotUserStats[];
  editorDistribution: CopilotEditorDistribution[];
  activityTrend: CopilotActivityTrend[];
}

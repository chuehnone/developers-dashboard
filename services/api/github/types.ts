export interface GitHubUser {
  login: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface GitHubCommit {
  committedDate: string;
  author?: {
    user?: {
      login: string;
    };
  };
  additions?: number;
  deletions?: number;
}

export interface GitHubReview {
  author: {
    login: string;
  };
  createdAt: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  comments?: {
    totalCount: number;
  };
}

export interface GitHubComment {
  author: {
    login: string;
  };
  createdAt: string;
}

export interface GitHubIssueComment {
  __typename: 'IssueComment';
  author: {
    login: string;
  };
  createdAt: string;
}

export interface GitHubTimelineItem {
  __typename: string;
  createdAt: string;
  author?: {
    login: string;
  };
  requestedReviewer?: {
    login: string;
  };
  state?: string;
}

export interface GitHubMilestone {
  title: string;
  number: number;
  state: 'OPEN' | 'CLOSED';
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  closedAt?: string;
  additions: number;
  deletions: number;
  milestone?: GitHubMilestone;
  author: {
    login: string;
  };
  reviews: {
    nodes: GitHubReview[];
  };
  comments: {
    nodes: GitHubComment[];
  };
  timelineItems?: {
    nodes: (GitHubTimelineItem | GitHubIssueComment)[];
  };
  commits: {
    nodes: Array<{
      commit: GitHubCommit;
    }>;
  };
  repository?: {
    name: string;
    owner: {
      login: string;
    };
  };
}

export interface GitHubRepository {
  name: string;
  owner?: {
    login: string;
  };
  pullRequests: {
    nodes: GitHubPullRequest[];
  };
  defaultBranchRef?: {
    target: {
      history: {
        nodes: GitHubCommit[];
      };
    };
  };
}

export interface GitHubTeam {
  name: string;
  slug: string;
  members: {
    nodes: Array<{
      login: string;
    }>;
  };
}

export interface GitHubOrganization {
  login?: string;
  repositories: {
    nodes: GitHubRepository[];
  };
  membersWithRole?: {
    nodes: GitHubUser[];
  };
  teams?: {
    nodes: GitHubTeam[];
  };
}

export interface ContributionsByRepository {
  repository: {
    name: string;
  };
  contributions: {
    totalCount: number;
  };
}

export interface GitHubContributionsCollection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  restrictedContributionsCount: number;
  pullRequestContributionsByRepository: ContributionsByRepository[];
  commitContributionsByRepository: ContributionsByRepository[];
  pullRequestReviewContributionsByRepository: ContributionsByRepository[];
}

export interface GitHubUserWithContributions {
  login: string;
  name?: string;
  avatarUrl?: string;
  contributionsCollection: GitHubContributionsCollection;
}

export interface OrgPullRequestsResponse {
  organization: GitHubOrganization;
}

export interface UserContributionsResponse {
  user: GitHubUserWithContributions;
}

export interface OrgMembersResponse {
  organization: {
    membersWithRole: {
      nodes: GitHubUser[];
    };
    teams?: {
      nodes: GitHubTeam[];
    };
  };
}

export interface PullRequestDetailsResponse {
  repository: {
    pullRequest: GitHubPullRequest;
  };
}

export interface SearchPullRequestsResponse {
  search: {
    nodes: GitHubPullRequest[];
  };
}

export interface RepositoryActivityResponse {
  repository: GitHubRepository;
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: string;
}

import {
  GitHubPullRequest,
  GitHubRepository,
  GitHubUser,
  OrgPullRequestsResponse,
} from './types';
import {
  GithubStats,
  PullRequest,
  CycleTimeDaily,
  GithubAnalyticsData,
} from '../../../types';

export interface CycleTimeBreakdown {
  codingTime: number;
  pickupTime: number;
  reviewTime: number;
  totalTime: number;
}

export function calculateCycleTime(pr: GitHubPullRequest): CycleTimeBreakdown {
  const createdAt = new Date(pr.createdAt);
  const mergedAt = pr.mergedAt ? new Date(pr.mergedAt) : null;

  let codingTime = 0;
  let pickupTime = 0;
  let reviewTime = 0;

  // Get first commit time
  const firstCommit = pr.commits.nodes[0]?.commit.committedDate;
  const firstCommitAt = firstCommit ? new Date(firstCommit) : createdAt;

  // Coding time: first commit to PR created
  codingTime = (createdAt.getTime() - firstCommitAt.getTime()) / (1000 * 60 * 60);

  // Find first review time from timeline
  const firstReviewEvent = pr.timelineItems?.nodes.find(
    (item) =>
      item.__typename === 'PullRequestReview' &&
      item.createdAt &&
      new Date(item.createdAt) > createdAt
  );

  const firstReviewAt = firstReviewEvent
    ? new Date(firstReviewEvent.createdAt)
    : null;

  if (firstReviewAt) {
    // Pickup time: PR created to first review
    pickupTime = (firstReviewAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Review time: first review to merged
    if (mergedAt) {
      reviewTime = (mergedAt.getTime() - firstReviewAt.getTime()) / (1000 * 60 * 60);
    }
  } else if (mergedAt) {
    // No review, all time is pickup time
    pickupTime = (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  }

  const totalTime = codingTime + pickupTime + reviewTime;

  return {
    codingTime: Math.max(0, codingTime),
    pickupTime: Math.max(0, pickupTime),
    reviewTime: Math.max(0, reviewTime),
    totalTime: Math.max(0, totalTime),
  };
}

export function mapGitHubPRToAppPR(pr: GitHubPullRequest, repoName?: string): PullRequest {
  const firstCommit = pr.commits.nodes[0]?.commit.committedDate;
  const firstReview = pr.reviews.nodes[0]?.createdAt;

  return {
    id: `${repoName || 'unknown'}-${pr.number}`,
    title: pr.title,
    author: pr.author.login,
    authorAvatar: `https://github.com/${pr.author.login}.png`,
    created_at: pr.createdAt,
    first_commit_at: firstCommit || pr.createdAt,
    first_review_at: firstReview || null,
    merged_at: pr.mergedAt || null,
    lines_added: pr.additions,
    lines_deleted: pr.deletions,
    status: pr.state === 'MERGED' ? 'merged' : pr.state === 'OPEN' ? 'open' : 'closed',
    url: `https://github.com/${pr.repository?.owner.login || 'unknown'}/${
      pr.repository?.name || repoName || 'unknown'
    }/pull/${pr.number}`,
  };
}

export function aggregateUserPullRequests(
  allPRs: GitHubPullRequest[],
  userLogin: string
): GithubStats {
  const userPRs = allPRs.filter(
    (pr) => pr.author.login.toLowerCase() === userLogin.toLowerCase()
  );

  const prsOpened = userPRs.length;
  const prsMerged = userPRs.filter((pr) => pr.state === 'MERGED').length;

  // Calculate average cycle time for merged PRs
  const mergedPRs = userPRs.filter((pr) => pr.state === 'MERGED');
  const totalCycleTime = mergedPRs.reduce((sum, pr) => {
    const cycleTime = calculateCycleTime(pr);
    return sum + cycleTime.totalTime;
  }, 0);
  const avgCycleTimeHours = mergedPRs.length > 0 ? totalCycleTime / mergedPRs.length : 0;

  // Count review comments given by this user
  const reviewCommentsGiven = allPRs.reduce((sum, pr) => {
    const userReviews = pr.reviews.nodes.filter(
      (review) => review.author.login.toLowerCase() === userLogin.toLowerCase()
    );
    return sum + userReviews.reduce((reviewSum, review) => {
      return reviewSum + (review.comments?.totalCount || 0);
    }, 0);
  }, 0);

  return {
    developerId: userLogin,
    prsOpened,
    prsMerged,
    avgCycleTimeHours: Math.round(avgCycleTimeHours * 10) / 10,
    reviewCommentsGiven,
  };
}

export function aggregateOrgPullRequests(
  response: OrgPullRequestsResponse
): GitHubPullRequest[] {
  const allPRs: GitHubPullRequest[] = [];

  for (const repo of response.organization.repositories.nodes) {
    for (const pr of repo.pullRequests.nodes) {
      allPRs.push({
        ...pr,
        repository: {
          name: repo.name,
          owner: {
            login: response.organization.repositories.nodes[0].name, // Approximation
          },
        },
      });
    }
  }

  return allPRs;
}

export function calculateDailyCycleTimeTrend(
  allPRs: GitHubPullRequest[],
  days: number = 30
): CycleTimeDaily[] {
  const now = new Date();
  const dailyData: Map<string, CycleTimeBreakdown[]> = new Map();

  // Initialize map for last N days
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    dailyData.set(dateKey, []);
  }

  // Group PRs by merge date
  const mergedPRs = allPRs.filter((pr) => pr.mergedAt);
  for (const pr of mergedPRs) {
    if (!pr.mergedAt) continue;

    const mergeDate = new Date(pr.mergedAt);
    const dateKey = mergeDate.toISOString().split('T')[0];

    if (dailyData.has(dateKey)) {
      const cycleTime = calculateCycleTime(pr);
      dailyData.get(dateKey)!.push(cycleTime);
    }
  }

  // Calculate averages for each day
  const result: CycleTimeDaily[] = [];
  const sortedDates = Array.from(dailyData.keys()).sort();

  for (const date of sortedDates) {
    const prs = dailyData.get(date)!;

    if (prs.length === 0) {
      result.push({
        date,
        codingTime: 0,
        pickupTime: 0,
        reviewTime: 0,
        totalTime: 0,
      });
      continue;
    }

    const avgCodingTime = prs.reduce((sum, p) => sum + p.codingTime, 0) / prs.length;
    const avgPickupTime = prs.reduce((sum, p) => sum + p.pickupTime, 0) / prs.length;
    const avgReviewTime = prs.reduce((sum, p) => sum + p.reviewTime, 0) / prs.length;
    const avgTotalTime = prs.reduce((sum, p) => sum + p.totalTime, 0) / prs.length;

    result.push({
      date,
      codingTime: Math.round(avgCodingTime * 10) / 10,
      pickupTime: Math.round(avgPickupTime * 10) / 10,
      reviewTime: Math.round(avgReviewTime * 10) / 10,
      totalTime: Math.round(avgTotalTime * 10) / 10,
    });
  }

  return result;
}

export function buildGithubAnalyticsData(allPRs: GitHubPullRequest[]): GithubAnalyticsData {
  const mergedPRs = allPRs.filter((pr) => pr.state === 'MERGED');
  const openPRs = allPRs.filter((pr) => pr.state === 'OPEN');

  // Calculate summary metrics
  const cycleBreakdowns = mergedPRs.map((pr) => calculateCycleTime(pr));
  const avgCycleTime =
    cycleBreakdowns.reduce((sum, b) => sum + b.totalTime, 0) / cycleBreakdowns.length || 0;
  const avgPickupTime =
    cycleBreakdowns.reduce((sum, b) => sum + b.pickupTime, 0) / cycleBreakdowns.length || 0;
  const avgReviewTime =
    cycleBreakdowns.reduce((sum, b) => sum + b.reviewTime, 0) / cycleBreakdowns.length || 0;
  const mergeRate = allPRs.length > 0 ? (mergedPRs.length / allPRs.length) * 100 : 0;

  // Calculate cycle time trend
  const cycleTimeTrend = calculateDailyCycleTimeTrend(allPRs, 14);

  // Build scatter data (PR size vs time)
  const scatterData = mergedPRs.map((pr) => {
    const cycleTime = calculateCycleTime(pr);
    const size = pr.additions + pr.deletions;
    return {
      size,
      time: cycleTime.totalTime,
      pr: mapGitHubPRToAppPR(pr),
    };
  });

  // Find stale PRs (open for more than 7 days with no recent activity)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const stalePRs = openPRs
    .filter((pr) => {
      const updatedAt = new Date(pr.updatedAt);
      return updatedAt < sevenDaysAgo;
    })
    .map((pr) => mapGitHubPRToAppPR(pr));

  return {
    summary: {
      avgCycleTime: Math.round(avgCycleTime * 10) / 10,
      avgPickupTime: Math.round(avgPickupTime * 10) / 10,
      avgReviewTime: Math.round(avgReviewTime * 10) / 10,
      mergeRate: Math.round(mergeRate * 10) / 10,
    },
    cycleTimeTrend,
    scatterData,
    stalePRs,
  };
}

export function getRecentActivityTrend(
  allPRs: GitHubPullRequest[],
  userLogin: string,
  days: number = 7
): number[] {
  const trend: number[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const countForDay = allPRs.filter((pr) => {
      if (pr.author.login.toLowerCase() !== userLogin.toLowerCase()) {
        return false;
      }

      // Count commits on this day
      const hasCommitOnDay = pr.commits.nodes.some((node) => {
        const commitDate = new Date(node.commit.committedDate);
        return commitDate >= startOfDay && commitDate <= endOfDay;
      });

      return hasCommitOnDay;
    }).length;

    trend.push(countForDay);
  }

  return trend;
}

export interface CommentAuthorStats {
  login: string;
  count: number;
}

export interface DeveloperCommentAnalysis {
  developerId: string;
  totalComments: number;
  uniqueCommenters: number;
  topCommenters: CommentAuthorStats[];
  commenters: CommentAuthorStats[];
}

/**
 * Analyzes who commented on a developer's PRs
 * Filters out self-comments (PR author commenting on their own PR)
 * Combines review comments and issue comments
 */
export function analyzeCommentsOnDeveloperPRs(
  allPRs: GitHubPullRequest[],
  userLogin: string
): DeveloperCommentAnalysis {
  // Get PRs authored by this developer
  const userPRs = allPRs.filter(
    (pr) => pr.author.login.toLowerCase() === userLogin.toLowerCase()
  );

  // Map to count comments per commenter
  const commenterCounts = new Map<string, number>();

  for (const pr of userPRs) {
    const prAuthor = pr.author.login.toLowerCase();

    // Process review comments (code-level comments)
    const reviewComments = pr.comments?.nodes || [];
    for (const comment of reviewComments) {
      if (!comment.author) {
        continue; // Skip deleted users
      }

      const commenterLogin = comment.author.login.toLowerCase();

      // Filter out PR author's own comments
      if (commenterLogin === prAuthor) {
        continue;
      }

      const currentCount = commenterCounts.get(commenterLogin) || 0;
      commenterCounts.set(commenterLogin, currentCount + 1);
    }

    // Process issue comments (general PR discussion)
    const timelineItems = pr.timelineItems?.nodes || [];
    for (const item of timelineItems) {
      // Type guard for IssueComment
      if ('__typename' in item && item.__typename === 'IssueComment' && item.author) {
        const commenterLogin = item.author.login.toLowerCase();

        // Filter out PR author's own comments
        if (commenterLogin === prAuthor) {
          continue;
        }

        const currentCount = commenterCounts.get(commenterLogin) || 0;
        commenterCounts.set(commenterLogin, currentCount + 1);
      }
    }
  }

  // Convert map to sorted array
  const commenters: CommentAuthorStats[] = Array.from(commenterCounts.entries())
    .map(([login, count]) => ({ login, count }))
    .sort((a, b) => b.count - a.count);

  const totalComments = commenters.reduce((sum, c) => sum + c.count, 0);
  const uniqueCommenters = commenters.length;
  const topCommenters = commenters.slice(0, 5); // Top 5

  return {
    developerId: userLogin,
    totalComments,
    uniqueCommenters,
    topCommenters,
    commenters,
  };
}

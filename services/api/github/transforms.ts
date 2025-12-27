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
  PRCreatedDetail,
  PRCreatedAnalysis,
} from '../../../types';

/**
 * Filters pull requests by creation date within specified days from now
 * @param prs - Array of GitHub pull requests
 * @param days - Number of days to look back from today (0 = no filtering)
 * @returns Filtered array of PRs created within the time range
 */
export function filterPRsByCreationDate(
  prs: GitHubPullRequest[],
  days: number
): GitHubPullRequest[] {
  // If days is 0 or negative, return all PRs (backward compatible)
  if (days <= 0) {
    return prs;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0); // Start of day

  return prs.filter((pr) => {
    const createdAt = new Date(pr.createdAt);
    return createdAt >= cutoffDate;
  });
}

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

function mapGitHubPRToAppPR(pr: GitHubPullRequest, repoName?: string): PullRequest {
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
  userLogin: string,
  days: number = 0
): GithubStats {
  // Filter PRs by creation date if days is specified
  const filteredPRs = filterPRsByCreationDate(allPRs, days);

  const userPRs = filteredPRs.filter(
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

  // Count review comments given by this user on OTHER people's PRs
  const reviewCommentsGiven = filteredPRs.reduce((sum, pr) => {
    // Skip PRs authored by this user - only count reviews on others' PRs
    if (pr.author.login.toLowerCase() === userLogin.toLowerCase()) {
      return sum;
    }

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
  const orgLogin = response.organization.login || 'unknown';

  for (const repo of response.organization.repositories.nodes) {
    for (const pr of repo.pullRequests.nodes) {
      allPRs.push({
        ...pr,
        repository: {
          name: repo.name,
          owner: {
            login: repo.owner?.login || orgLogin,
          },
        },
      });
    }
  }

  return allPRs;
}

function calculateDailyCycleTimeTrend(
  allPRs: GitHubPullRequest[],
  days: number = 30
): CycleTimeDaily[] {
  // Filter PRs by creation date before calculating trends
  const filteredPRs = filterPRsByCreationDate(allPRs, days);

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
  const mergedPRs = filteredPRs.filter((pr) => pr.mergedAt);
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

export function buildGithubAnalyticsData(
  allPRs: GitHubPullRequest[],
  days: number = 0
): GithubAnalyticsData {
  // Filter PRs by creation date if days is specified
  const filteredPRs = filterPRsByCreationDate(allPRs, days);

  const mergedPRs = filteredPRs.filter((pr) => pr.state === 'MERGED');
  const openPRs = filteredPRs.filter((pr) => pr.state === 'OPEN');

  // Calculate summary metrics
  const cycleBreakdowns = mergedPRs.map((pr) => calculateCycleTime(pr));
  const avgCycleTime =
    cycleBreakdowns.reduce((sum, b) => sum + b.totalTime, 0) / cycleBreakdowns.length || 0;
  const avgPickupTime =
    cycleBreakdowns.reduce((sum, b) => sum + b.pickupTime, 0) / cycleBreakdowns.length || 0;
  const avgReviewTime =
    cycleBreakdowns.reduce((sum, b) => sum + b.reviewTime, 0) / cycleBreakdowns.length || 0;
  const mergeRate = filteredPRs.length > 0 ? (mergedPRs.length / filteredPRs.length) * 100 : 0;

  // Calculate cycle time trend
  const cycleTimeTrend = calculateDailyCycleTimeTrend(filteredPRs, Math.min(days || 14, 14));

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

  // Find stale PRs with dynamic threshold based on time range
  // Calculate dynamic stale threshold: 50% of time range (min 3 days, max 14 days)
  const staleDaysThreshold = days > 0
    ? Math.max(3, Math.min(14, Math.floor(days * 0.5)))
    : 7; // Default to 7 days if no time range

  const staleThresholdDate = new Date();
  staleThresholdDate.setDate(staleThresholdDate.getDate() - staleDaysThreshold);

  const stalePRs = openPRs
    .filter((pr) => {
      const updatedAt = new Date(pr.updatedAt);
      return updatedAt < staleThresholdDate;
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

export interface PRCommentedOnStats {
  pr: GitHubPullRequest;
  commentCount: number;
  lastCommentedAt: string;
}

export interface DeveloperCommentGivenAnalysis {
  developerId: string;
  totalCommentsGiven: number;
  totalPRsCommentedOn: number;
  prsCommentedOn: PRCommentedOnStats[];
}

/**
 * Analyzes who commented on a developer's PRs
 * Filters out self-comments (PR author commenting on their own PR)
 * Combines review comments and issue comments
 */
export function analyzeCommentsOnDeveloperPRs(
  allPRs: GitHubPullRequest[],
  userLogin: string,
  days: number = 0
): DeveloperCommentAnalysis {
  // Filter PRs by creation date if days is specified
  const filteredPRs = filterPRsByCreationDate(allPRs, days);

  // Get PRs authored by this developer
  const userPRs = filteredPRs.filter(
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

/**
 * Analyzes PRs that a developer commented on (inverse of analyzeCommentsOnDeveloperPRs)
 * Tracks comments GIVEN by developer on OTHER people's PRs
 * Filters out comments on their own PRs
 * Combines review comments, direct comments, and timeline comments
 */
export function analyzeCommentsGivenByDeveloper(
  allPRs: GitHubPullRequest[],
  userLogin: string,
  days: number = 0
): DeveloperCommentGivenAnalysis {
  const user = userLogin.toLowerCase();

  // Filter PRs by creation date if days is specified
  const filteredPRs = filterPRsByCreationDate(allPRs, days);

  // Map to track PRs and comment counts
  const prCommentMap = new Map<string, PRCommentedOnStats>();

  for (const pr of filteredPRs) {
    const prAuthor = pr.author.login.toLowerCase();

    // Skip PRs authored by this user - only analyze comments on OTHERS' PRs
    if (prAuthor === user) {
      continue;
    }

    let prCommentCount = 0;
    let lastCommentDate = '';

    // Count review comments (code-level comments from reviews)
    const userReviews = pr.reviews?.nodes?.filter(
      (review) => review.author?.login.toLowerCase() === user
    ) || [];

    for (const review of userReviews) {
      prCommentCount += review.comments?.totalCount || 0;

      // Track latest comment timestamp
      if (review.createdAt > lastCommentDate) {
        lastCommentDate = review.createdAt;
      }
    }

    // Count direct comments (general PR discussion from comments array)
    const userComments = pr.comments?.nodes?.filter(
      (comment) => comment.author?.login.toLowerCase() === user
    ) || [];
    prCommentCount += userComments.length;

    // Track latest comment from direct comments
    for (const comment of userComments) {
      if (comment.createdAt > lastCommentDate) {
        lastCommentDate = comment.createdAt;
      }
    }

    // Count issue comments from timeline (IssueComment type)
    const timelineComments = pr.timelineItems?.nodes?.filter(
      (item) =>
        item.__typename === 'IssueComment' &&
        item.author?.login.toLowerCase() === user
    ) || [];
    prCommentCount += timelineComments.length;

    // Track latest comment from timeline
    for (const item of timelineComments) {
      if ('createdAt' in item && item.createdAt > lastCommentDate) {
        lastCommentDate = item.createdAt;
      }
    }

    // Only add to map if developer actually commented
    if (prCommentCount > 0) {
      const prKey = `${pr.repository?.name || 'unknown'}-${pr.number}`;
      prCommentMap.set(prKey, {
        pr,
        commentCount: prCommentCount,
        lastCommentedAt: lastCommentDate,
      });
    }
  }

  // Transform map to sorted array (by comment count DESC)
  const prsCommentedOn = Array.from(prCommentMap.values())
    .sort((a, b) => b.commentCount - a.commentCount);

  const totalCommentsGiven = prsCommentedOn.reduce((sum, pr) => sum + pr.commentCount, 0);
  const totalPRsCommentedOn = prsCommentedOn.length;

  return {
    developerId: userLogin,
    totalCommentsGiven,
    totalPRsCommentedOn,
    prsCommentedOn,
  };
}

/**
 * Analyzes PRs created by a developer
 * Provides list of PRs authored by the developer with key metadata
 */
export function analyzePRsCreatedByDeveloper(
  allPRs: GitHubPullRequest[],
  userLogin: string,
  days: number = 0
): PRCreatedAnalysis {
  const user = userLogin.toLowerCase();

  // Filter PRs by creation date if days is specified
  const filteredPRs = filterPRsByCreationDate(allPRs, days);

  // Filter to PRs authored by this developer
  const userPRs = filteredPRs.filter(
    (pr) => pr.author.login.toLowerCase() === user
  );

  // Map PRs to details
  const prsCreated: PRCreatedDetail[] = userPRs.map((pr) => {
    const prId = `${pr.repository?.name || 'unknown'}-${pr.number}`;
    const prUrl = `https://github.com/${pr.repository?.owner.login || 'unknown'}/${pr.repository?.name || 'unknown'}/pull/${pr.number}`;
    const repository = pr.repository?.name || 'unknown';
    const status = pr.state === 'MERGED' ? 'merged' : pr.state === 'OPEN' ? 'open' : 'closed';
    const milestone = pr.milestone?.title || null;

    return {
      prId,
      prNumber: pr.number,
      prTitle: pr.title,
      prUrl,
      repository,
      status,
      milestone,
      createdAt: pr.createdAt,
      mergedAt: pr.mergedAt || null,
    };
  });

  // Sort by creation date DESC (newest first)
  prsCreated.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate summary stats
  const totalPRsCreated = prsCreated.length;
  const totalPRsMerged = prsCreated.filter((p) => p.status === 'merged').length;
  const totalPRsOpen = prsCreated.filter((p) => p.status === 'open').length;

  return {
    developerId: userLogin,
    totalPRsCreated,
    totalPRsMerged,
    totalPRsOpen,
    prsCreated,
  };
}

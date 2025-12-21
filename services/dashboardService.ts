import { githubClient } from './api/github/client';
import { githubRestClient } from './api/github/restClient';
import {
  GET_ORGANIZATION_PULL_REQUESTS,
  GET_ORGANIZATION_MEMBERS,
} from './api/github/queries';
import {
  aggregateOrgPullRequests,
  aggregateUserPullRequests,
  buildGithubAnalyticsData,
  getRecentActivityTrend,
  analyzeCommentsOnDeveloperPRs,
  analyzeCommentsGivenByDeveloper,
  analyzePRsCreatedByDeveloper,
} from './api/github/transforms';
import { buildCopilotAnalyticsData } from './api/github/copilotTransforms';
import { getConfig } from './config';
import { cache } from './api/cache';
import {
  fetchDashboardData as fetchMockDashboardData,
  fetchGithubAnalytics as fetchMockGithubAnalytics,
} from './mockData';
import {
  DeveloperMetric,
  DashboardSummary,
  TimeRange,
  GithubAnalyticsData,
  CopilotAnalyticsData,
  Developer,
  PRCommentAnalysis,
  PRCommentGivenAnalysis,
  PRCommentedOn,
  CommentAuthor,
  PRCreatedAnalysis,
} from '../types';
import type {
  OrgPullRequestsResponse,
  OrgMembersResponse,
} from './api/github/types';

interface DeveloperMapping {
  githubLogin: string;
  name: string;
  role: 'Frontend' | 'Backend' | 'Fullstack' | 'DevOps';
}

// Default developer mapping - can be overridden by external config
// Add your team members here with their GitHub login
const DEFAULT_DEVELOPER_MAP: DeveloperMapping[] = [
  // Add more team members below:
  // {
  //   githubLogin: 'github-username',
  //   name: 'Developer Name',
  //   role: 'Frontend', // or 'Backend', 'Fullstack', 'DevOps'
  // },
];

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

// Safe fetch with caching and fallback
async function safeFetchWithCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  const config = getConfig();

  // Try to get from cache first
  const cached = cache.get<T>(cacheKey);
  if (cached) {
    console.log(`Using cached data for ${cacheKey}`);
    return cached;
  }

  try {
    // Try to fetch with retry
    const data = await retryWithBackoff(fetchFn);
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${cacheKey}:`, error);

    // Try to use stale cache if available
    const staleCache = cache.get<T>(cacheKey);
    if (staleCache) {
      console.warn(`Using stale cache for ${cacheKey}`);
      return staleCache;
    }

    // Fallback to mock data if configured
    if (config.fallbackToMock && fallbackFn) {
      console.warn(`Falling back to mock data for ${cacheKey}`);
      return await fallbackFn();
    }

    throw error;
  }
}

function getTimeRangeDays(range: TimeRange): number {
  switch (range) {
    case 'sprint':
      return 14; // 2 weeks
    case 'month':
      return 30;
    case 'quarter':
      return 90;
  }
}

function calculateImpactScore(metric: Partial<DeveloperMetric>): number {
  const multiplier = 1.0;

  const prScore = (metric.prsMerged || 0) * 5 * multiplier;
  const reviewScore = (metric.reviewCommentsGiven || 0) * 0.5 * multiplier;

  const total = prScore + reviewScore;
  return Math.min(100, Math.round(total));
}

export async function fetchDashboardData(
  range: TimeRange
): Promise<{ metrics: DeveloperMetric[]; summary: DashboardSummary }> {
  const cacheKey = `dashboard_metrics_v2_${range}`; // v2 to invalidate old cache

  return safeFetchWithCache(
    cacheKey,
    async () => {
      const config = getConfig();
      const days = getTimeRangeDays(range);

      // Calculate date range for filtering
      const since = new Date();
      since.setDate(since.getDate() - days);

      // Fetch GitHub data
      const githubData = await githubClient.query<OrgPullRequestsResponse>(
        GET_ORGANIZATION_PULL_REQUESTS,
        {
          org: config.github.org,
          first: 20,
        }
      );

      // Filter PRs by date range
      const allPRsRaw = aggregateOrgPullRequests(githubData);
      const allPRs = allPRsRaw.filter((pr) => {
        const updatedAt = new Date(pr.updatedAt);
        return updatedAt >= since;
      });

      // Fetch GitHub members
      const membersData = await githubClient.query<OrgMembersResponse>(
        GET_ORGANIZATION_MEMBERS,
        {
          org: config.github.org,
          first: 100,
        }
      );

      // Create developer metrics from GitHub data only
      // Use GitHub org members if available, otherwise fall back to manual mapping
      const githubMembers = membersData.organization.membersWithRole.nodes || [];
      const githubTeams = membersData.organization.teams?.nodes || [];

      console.log(`Found ${githubMembers.length} GitHub org members`);
      console.log(`Found ${githubTeams.length} GitHub teams`);

      // Create a map of user login to their teams
      const userTeamsMap = new Map<string, string[]>();
      for (const team of githubTeams) {
        for (const member of team.members.nodes) {
          if (!userTeamsMap.has(member.login)) {
            userTeamsMap.set(member.login, []);
          }
          userTeamsMap.get(member.login)!.push(team.name);
        }
      }

      const developerMap = githubMembers.length > 0
        ? githubMembers.map(member => {
            const userTeams = userTeamsMap.get(member.login) || [];
            // Use first team name as role, or default to 'Fullstack'
            const role = userTeams.length > 0 ? userTeams[0] : 'Fullstack';

            return {
              githubLogin: member.login,
              name: member.name || member.login,
              role: role as any, // Allow any team name as role
            };
          })
        : DEFAULT_DEVELOPER_MAP;

      console.log(`Processing metrics for ${developerMap.length} developers`);

      // Log team assignments for debugging
      developerMap.forEach(dev => {
        const teams = userTeamsMap.get(dev.githubLogin) || [];
        if (teams.length > 0) {
          console.log(`${dev.name} (${dev.githubLogin}): ${dev.role} - All Teams: ${teams.join(', ')}`);
        }
      });

      const metrics: DeveloperMetric[] = [];

      for (const dev of developerMap) {
        // Get GitHub stats
        const githubStats = aggregateUserPullRequests(allPRs, dev.githubLogin);

        // Get activity trend
        const recentActivityTrend = getRecentActivityTrend(allPRs, dev.githubLogin, 7);

        // Get comment analysis (comments RECEIVED on developer's PRs)
        const commentStats = analyzeCommentsOnDeveloperPRs(allPRs, dev.githubLogin);

        // Transform to app-level type with avatar URLs
        const commentAnalysis: PRCommentAnalysis = {
          developerId: commentStats.developerId,
          totalCommentsReceived: commentStats.totalComments,
          uniqueCommenters: commentStats.uniqueCommenters,
          topCommenters: commentStats.topCommenters.map(c => ({
            login: c.login,
            count: c.count,
            avatar: `https://github.com/${c.login}.png`,
          })),
          allCommenters: commentStats.commenters.map(c => ({
            login: c.login,
            count: c.count,
            avatar: `https://github.com/${c.login}.png`,
          })),
        };

        // Get comment given analysis (comments GIVEN by developer on others' PRs)
        const commentGivenStats = analyzeCommentsGivenByDeveloper(allPRs, dev.githubLogin);

        // Transform to app-level type
        const commentGivenAnalysis: PRCommentGivenAnalysis = {
          developerId: commentGivenStats.developerId,
          totalCommentsGiven: commentGivenStats.totalCommentsGiven,
          totalPRsCommentedOn: commentGivenStats.totalPRsCommentedOn,
          prsCommentedOn: commentGivenStats.prsCommentedOn.map(prStats => ({
            prId: `${prStats.pr.repository?.name || 'unknown'}-${prStats.pr.number}`,
            prNumber: prStats.pr.number,
            prTitle: prStats.pr.title,
            prUrl: `https://github.com/${prStats.pr.repository?.owner.login || 'unknown'}/${prStats.pr.repository?.name || 'unknown'}/pull/${prStats.pr.number}`,
            prAuthor: prStats.pr.author.login,
            prAuthorAvatar: `https://github.com/${prStats.pr.author.login}.png`,
            repository: prStats.pr.repository?.name || 'unknown',
            commentCount: prStats.commentCount,
            status: prStats.pr.state === 'MERGED' ? 'merged' : prStats.pr.state === 'OPEN' ? 'open' : 'closed',
            lastCommentedAt: prStats.lastCommentedAt,
          })),
        };

        // Analyze PRs created by developer
        const prCreatedAnalysis: PRCreatedAnalysis = analyzePRsCreatedByDeveloper(
          allPRs,
          dev.githubLogin
        );

        const developer: Developer = {
          id: dev.githubLogin,
          name: dev.name,
          role: dev.role,
          avatar: `https://github.com/${dev.githubLogin}.png`,
        };

        const metric = {
          ...developer,
          ...githubStats,
          recentActivityTrend,
          commentAnalysis,
          commentGivenAnalysis,
          prCreatedAnalysis,
          impactScore: calculateImpactScore(githubStats),
          impactTrend: 0, // TODO: Calculate based on historical data
        } as DeveloperMetric;

        metrics.push(metric);
      }

      // Calculate summary from GitHub data only
      const totalPrsMerged = metrics.reduce((sum, m) => sum + m.prsMerged, 0);
      const avgCycleTime =
        metrics.reduce((sum, m) => sum + m.avgCycleTimeHours, 0) / metrics.length || 0;

      const summary: DashboardSummary = {
        totalPrsMerged,
        avgCycleTime: Math.round(avgCycleTime * 10) / 10,
        velocityTrend: 0, // TODO: Calculate trend
        prTrend: 0, // TODO: Calculate trend
        cycleTimeTrend: 0, // TODO: Calculate trend
      };

      return { metrics, summary };
    },
    () => fetchMockDashboardData(range)
  );
}

export async function fetchGithubAnalytics(): Promise<GithubAnalyticsData> {
  const cacheKey = 'dashboard_github_v2'; // v2 to invalidate old cache

  return safeFetchWithCache(
    cacheKey,
    async () => {
      const config = getConfig();
      const since = new Date();
      since.setDate(since.getDate() - 30); // Last 30 days

      const githubData = await githubClient.query<OrgPullRequestsResponse>(
        GET_ORGANIZATION_PULL_REQUESTS,
        {
          org: config.github.org,
          first: 20,
        }
      );

      // Filter PRs by date
      const allPRsRaw = aggregateOrgPullRequests(githubData);
      const allPRs = allPRsRaw.filter((pr) => {
        const updatedAt = new Date(pr.updatedAt);
        return updatedAt >= since;
      });

      return buildGithubAnalyticsData(allPRs);
    },
    fetchMockGithubAnalytics
  );
}

/**
 * Fetch GitHub Copilot usage analytics for the organization
 * @param timeRange - Time range for activity trend calculation
 */
export async function fetchCopilotAnalytics(
  timeRange: TimeRange
): Promise<CopilotAnalyticsData> {
  const cacheKey = `dashboard_copilot_v1_${timeRange}`;

  return safeFetchWithCache(
    cacheKey,
    async () => {
      const config = getConfig();
      const days = getTimeRangeDays(timeRange);

      // Fetch Copilot seats data from REST API
      const copilotData = await githubRestClient.getCopilotSeats(config.github.org);

      // Transform to analytics data
      return buildCopilotAnalyticsData(copilotData, days);
    },
    undefined // No mock fallback for Copilot data
  );
}

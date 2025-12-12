import { githubClient } from './api/github/client';
import { jiraClient } from './api/jira/client';
import {
  GET_ORGANIZATION_PULL_REQUESTS,
  GET_ORGANIZATION_MEMBERS,
} from './api/github/queries';
import {
  aggregateOrgPullRequests,
  aggregateUserPullRequests,
  buildGithubAnalyticsData,
  getRecentActivityTrend,
} from './api/github/transforms';
import {
  buildActiveTicketsQuery,
  buildCompletedTicketsQuery,
  STANDARD_FIELDS,
} from './api/jira/endpoints';
import {
  mapJiraIssuesToStats,
  buildJiraAnalyticsData,
} from './api/jira/transforms';
import { getConfig } from './config';
import { cache } from './api/cache';
import {
  fetchDashboardData as fetchMockDashboardData,
  fetchGithubAnalytics as fetchMockGithubAnalytics,
  fetchJiraAnalytics as fetchMockJiraAnalytics,
} from './mockData';
import {
  DeveloperMetric,
  DashboardSummary,
  TimeRange,
  GithubAnalyticsData,
  JiraAnalyticsData,
  DeveloperStatus,
  Developer,
} from '../types';
import type {
  OrgPullRequestsResponse,
  OrgMembersResponse,
} from './api/github/types';
import type { JiraSearchResponse } from './api/jira/types';

interface DeveloperMapping {
  githubLogin: string;
  jiraEmail: string;
  name: string;
  role: 'Frontend' | 'Backend' | 'Fullstack' | 'DevOps';
}

// Default developer mapping - can be overridden by external config
const DEFAULT_DEVELOPER_MAP: DeveloperMapping[] = [
  {
    githubLogin: 'example-user',
    jiraEmail: 'user@example.com',
    name: 'Example User',
    role: 'Fullstack',
  },
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

  const velocityScore = (metric.velocity || 0) * 1.5 * multiplier;
  const prScore = (metric.prsMerged || 0) * 5 * multiplier;
  const reviewScore = (metric.reviewCommentsGiven || 0) * 0.5 * multiplier;
  const bugFixScore = (metric.bugsFixed || 0) * 3 * multiplier;

  const total = velocityScore + prScore + reviewScore + bugFixScore;
  return Math.min(100, Math.round(total));
}

function determineStatus(metric: Partial<DeveloperMetric>): DeveloperStatus {
  if (metric.activeTickets === 0) {
    return 'On Leave';
  }

  if ((metric.bugsFixed || 0) > (metric.featuresCompleted || 0)) {
    return 'Bug Fixing';
  }

  if ((metric.techDebtTickets || 0) > 0) {
    return 'Tech Debt';
  }

  if ((metric.activeTickets || 0) > 5) {
    return 'Blocked';
  }

  return 'Shipping';
}

export async function fetchDashboardData(
  range: TimeRange
): Promise<{ metrics: DeveloperMetric[]; summary: DashboardSummary }> {
  const cacheKey = `dashboard_metrics_${range}`;

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

    // Fetch Jira data
    const jiraQuery = buildActiveTicketsQuery();
    const jiraActiveData = await jiraClient.searchIssues(jiraQuery, STANDARD_FIELDS, 200);

    const jiraCompletedQuery = buildCompletedTicketsQuery(undefined, days);
    const jiraCompletedData = await jiraClient.searchIssues(
      jiraCompletedQuery,
      STANDARD_FIELDS,
      200
    );

    const allJiraIssues = [
      ...jiraActiveData.issues,
      ...jiraCompletedData.issues,
    ] as any[];

    // Create developer metrics by merging GitHub and Jira data
    const developerMap = DEFAULT_DEVELOPER_MAP;
    const metrics: DeveloperMetric[] = [];

    for (const dev of developerMap) {
      // Get GitHub stats
      const githubStats = aggregateUserPullRequests(allPRs, dev.githubLogin);

      // Get Jira stats
      const jiraStats = mapJiraIssuesToStats(allJiraIssues, dev.jiraEmail);

      // Get activity trend
      const recentActivityTrend = getRecentActivityTrend(allPRs, dev.githubLogin, 7);

      const developer: Developer = {
        id: dev.githubLogin,
        name: dev.name,
        role: dev.role,
        avatar: `https://github.com/${dev.githubLogin}.png`,
      };

      const combined = {
        ...developer,
        ...githubStats,
        ...jiraStats,
        recentActivityTrend,
      };

      const impactScore = calculateImpactScore(combined);
      const status = determineStatus(combined);

      metrics.push({
        ...combined,
        impactScore,
        impactTrend: 0, // TODO: Calculate based on historical data
        status,
      });
    }

    // Calculate summary
    const totalPoints = metrics.reduce((sum, m) => sum + m.velocity, 0);
    const totalPrsMerged = metrics.reduce((sum, m) => sum + m.prsMerged, 0);
    const avgCycleTime =
      metrics.reduce((sum, m) => sum + m.avgCycleTimeHours, 0) / metrics.length || 0;

    const summary: DashboardSummary = {
      totalPoints,
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
  const cacheKey = 'dashboard_github';

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

export async function fetchJiraAnalytics(): Promise<JiraAnalyticsData> {
  const cacheKey = 'dashboard_jira';

  return safeFetchWithCache(
    cacheKey,
    async () => {
      const config = getConfig();

      // Fetch recent sprints
      const sprintsResponse = await jiraClient.getSprints(config.jira.boardId, 'closed');
      const sprints = sprintsResponse.values.slice(0, 10); // Last 10 sprints

      // Fetch issues for each sprint
      const sprintIssuesMap = new Map();
      for (const sprint of sprints as any[]) {
        const issuesResponse = await jiraClient.getSprintIssues(sprint.id, 200);
        sprintIssuesMap.set(sprint.id, issuesResponse.issues);
      }

      // Fetch active tickets
      const activeQuery = buildActiveTicketsQuery();
      const activeTicketsResponse = await jiraClient.searchIssues(
        activeQuery,
        STANDARD_FIELDS,
        200
      );

      return buildJiraAnalyticsData(
        sprints as any[],
        sprintIssuesMap,
        activeTicketsResponse.issues as any[]
      );
    },
    fetchMockJiraAnalytics
  );
}

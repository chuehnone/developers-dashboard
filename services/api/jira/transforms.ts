import {
  JiraIssue,
  JiraSprint,
  JiraSprintIssuesResponse,
} from './types';
import {
  JiraStats,
  JiraTicket,
  JiraIssueType,
  SprintMetric,
  JiraAnalyticsData,
} from '../../../types';

export function getStoryPoints(issue: JiraIssue): number {
  // Try common story points field names
  const points =
    issue.fields.customfield_10016 || // Most common
    issue.fields.customfield_10026 || // Alternative
    issue.fields.customfield_10036 || // Alternative
    0;

  return typeof points === 'number' ? points : 0;
}

export function mapJiraIssueTypeToAppType(jiraType: string): JiraIssueType {
  const typeMap: { [key: string]: JiraIssueType } = {
    'Story': 'Story',
    'Bug': 'Bug',
    'Task': 'Task',
    'Technical Debt': 'Tech Debt',
    'Sub-task': 'Task',
    'Support': 'Support',
  };

  return typeMap[jiraType] || 'Task';
}

export function mapJiraIssuesToStats(
  issues: JiraIssue[],
  userEmail: string
): JiraStats {
  const userIssues = issues.filter(
    (issue) => issue.fields.assignee?.emailAddress?.toLowerCase() === userEmail.toLowerCase()
  );

  // Calculate velocity (completed story points)
  const completedIssues = userIssues.filter(
    (issue) => issue.fields.status.statusCategory.key === 'done'
  );
  const velocity = completedIssues.reduce(
    (sum, issue) => sum + getStoryPoints(issue),
    0
  );

  // Count active tickets (not done)
  const activeTickets = userIssues.filter(
    (issue) => issue.fields.status.statusCategory.key !== 'done'
  ).length;

  // Count bugs fixed
  const bugsFixed = completedIssues.filter(
    (issue) => issue.fields.issuetype.name === 'Bug'
  ).length;

  // Count features completed
  const featuresCompleted = completedIssues.filter(
    (issue) => issue.fields.issuetype.name === 'Story'
  ).length;

  // Count tech debt tickets
  const techDebtTickets = userIssues.filter(
    (issue) =>
      issue.fields.issuetype.name === 'Technical Debt' ||
      issue.fields.labels.some((label) =>
        label.toLowerCase().includes('tech-debt') ||
        label.toLowerCase().includes('technical-debt')
      )
  ).length;

  return {
    developerId: userEmail,
    velocity,
    activeTickets,
    bugsFixed,
    featuresCompleted,
    techDebtTickets,
  };
}

export function mapJiraIssueToTicket(issue: JiraIssue): JiraTicket {
  const assignee = issue.fields.assignee;
  const statusName = issue.fields.status.name as JiraTicket['status'];

  // Calculate days in current status
  const updated = new Date(issue.fields.updated);
  const now = new Date();
  const daysInStatus = Math.floor(
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check if flagged (usually in labels or a custom field)
  const flagged = issue.fields.labels.some((label) =>
    label.toLowerCase().includes('blocked') ||
    label.toLowerCase().includes('impediment')
  );

  return {
    id: issue.id,
    key: issue.key,
    title: issue.fields.summary,
    assignee: assignee?.displayName || 'Unassigned',
    assigneeAvatar: assignee?.avatarUrls['48x48'] || '',
    type: mapJiraIssueTypeToAppType(issue.fields.issuetype.name),
    status: ['To Do', 'In Progress', 'Review', 'Done'].includes(statusName)
      ? statusName
      : 'To Do',
    points: getStoryPoints(issue),
    daysInStatus,
    flagged,
  };
}

export function calculateSprintMetrics(
  sprint: JiraSprint,
  sprintIssues: JiraIssue[]
): SprintMetric {
  // Find issues that were in sprint at start
  const startDate = sprint.startDate ? new Date(sprint.startDate) : new Date();
  const committedIssues = sprintIssues.filter((issue) => {
    const created = new Date(issue.fields.created);
    return created <= startDate;
  });

  // Issues added after sprint start
  const addedIssues = sprintIssues.filter((issue) => {
    const created = new Date(issue.fields.created);
    return created > startDate;
  });

  // Calculate points
  const committedPoints = committedIssues.reduce(
    (sum, issue) => sum + getStoryPoints(issue),
    0
  );

  const completedIssues = sprintIssues.filter(
    (issue) => issue.fields.status.statusCategory.key === 'done'
  );
  const completedPoints = completedIssues.reduce(
    (sum, issue) => sum + getStoryPoints(issue),
    0
  );

  const scopeChangePoints = addedIssues.reduce(
    (sum, issue) => sum + getStoryPoints(issue),
    0
  );

  // Calculate say-do ratio
  const sayDoRatio =
    committedPoints > 0 ? (completedPoints / committedPoints) * 100 : 0;

  return {
    id: sprint.id.toString(),
    name: sprint.name,
    committedPoints,
    completedPoints,
    scopeChangePoints,
    sayDoRatio: Math.round(sayDoRatio),
  };
}

export function buildInvestmentProfile(issues: JiraIssue[]): {
  name: string;
  value: number;
  color: string;
}[] {
  const typeCounts: { [key: string]: number } = {};

  for (const issue of issues) {
    const type = mapJiraIssueTypeToAppType(issue.fields.issuetype.name);
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  const colorMap: { [key in JiraIssueType]: string } = {
    'Story': '#3b82f6',
    'Bug': '#ef4444',
    'Task': '#8b5cf6',
    'Tech Debt': '#f59e0b',
    'Support': '#10b981',
  };

  return Object.entries(typeCounts).map(([type, count]) => ({
    name: type,
    value: count,
    color: colorMap[type as JiraIssueType] || '#6b7280',
  }));
}

export function buildJiraAnalyticsData(
  sprints: JiraSprint[],
  allSprintIssues: Map<number, JiraIssue[]>,
  activeTicketsIssues: JiraIssue[]
): JiraAnalyticsData {
  // Calculate sprint history
  const sprintHistory: SprintMetric[] = [];
  for (const sprint of sprints) {
    const issues = allSprintIssues.get(sprint.id) || [];
    const metric = calculateSprintMetrics(sprint, issues);
    sprintHistory.push(metric);
  }

  // Calculate summary metrics
  const avgVelocity =
    sprintHistory.length > 0
      ? sprintHistory.reduce((sum, s) => sum + s.completedPoints, 0) / sprintHistory.length
      : 0;

  const avgSayDoRatio =
    sprintHistory.length > 0
      ? sprintHistory.reduce((sum, s) => sum + s.sayDoRatio, 0) / sprintHistory.length
      : 0;

  const avgScopeCreep =
    sprintHistory.length > 0
      ? sprintHistory.reduce((sum, s) => sum + s.scopeChangePoints, 0) / sprintHistory.length
      : 0;

  // Calculate all issues for bug rate
  const allIssues: JiraIssue[] = [];
  for (const issues of allSprintIssues.values()) {
    allIssues.push(...issues);
  }

  const totalIssues = allIssues.length;
  const bugCount = allIssues.filter((issue) => issue.fields.issuetype.name === 'Bug').length;
  const bugRate = totalIssues > 0 ? (bugCount / totalIssues) * 100 : 0;

  // Map active tickets
  const activeTickets = activeTicketsIssues.map(mapJiraIssueToTicket);

  // Build investment profile from all issues
  const investmentProfile = buildInvestmentProfile(allIssues);

  return {
    summary: {
      avgVelocity: Math.round(avgVelocity * 10) / 10,
      sayDoRatio: Math.round(avgSayDoRatio),
      scopeCreep: Math.round(avgScopeCreep * 10) / 10,
      bugRate: Math.round(bugRate * 10) / 10,
    },
    sprintHistory,
    activeTickets,
    investmentProfile,
  };
}

export function findStuckTickets(issues: JiraIssue[], daysThreshold: number = 3): JiraTicket[] {
  const now = new Date();

  return issues
    .filter((issue) => {
      const status = issue.fields.status.name;
      if (!['In Progress', 'Review'].includes(status)) {
        return false;
      }

      const updated = new Date(issue.fields.updated);
      const daysSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);

      return daysSinceUpdate >= daysThreshold;
    })
    .map(mapJiraIssueToTicket);
}

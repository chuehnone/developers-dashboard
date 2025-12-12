
import { Developer, JiraStats, GithubStats, DeveloperMetric, DashboardSummary, TimeRange, DeveloperStatus, GithubAnalyticsData, PullRequest, CycleTimeDaily, JiraAnalyticsData, SprintMetric, JiraTicket, JiraIssueType } from '../types';

const DEVELOPERS: Developer[] = [
  { id: 'dev_1', name: 'Alice Chen', role: 'Fullstack', avatar: 'https://picsum.photos/seed/alice/64/64' },
  { id: 'dev_2', name: 'Bob Smith', role: 'Backend', avatar: 'https://picsum.photos/seed/bob/64/64' },
  { id: 'dev_3', name: 'Charlie Kim', role: 'Frontend', avatar: 'https://picsum.photos/seed/charlie/64/64' },
  { id: 'dev_4', name: 'Diana Prince', role: 'DevOps', avatar: 'https://picsum.photos/seed/diana/64/64' },
  { id: 'dev_5', name: 'Ethan Hunt', role: 'Fullstack', avatar: 'https://picsum.photos/seed/ethan/64/64' },
  { id: 'dev_6', name: 'Fiona Gallagher', role: 'Frontend', avatar: 'https://picsum.photos/seed/fiona/64/64' },
  { id: 'dev_7', name: 'George Martin', role: 'Backend', avatar: 'https://picsum.photos/seed/george/64/64' },
];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const STATUSES: DeveloperStatus[] = ['Shipping', 'Shipping', 'Bug Fixing', 'Tech Debt', 'Blocked', 'On Leave'];

// Simulate fetching data from external APIs
export const fetchDashboardData = async (range: TimeRange): Promise<{ metrics: DeveloperMetric[], summary: DashboardSummary }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  // Multiplier based on time range to make data realistic
  const multiplier = range === 'sprint' ? 1 : range === 'month' ? 2.5 : 6;

  const metrics: DeveloperMetric[] = DEVELOPERS.map(dev => {
    // Generate randomized Jira Stats
    const jira: JiraStats = {
      developerId: dev.id,
      velocity: getRandomInt(15, 40) * multiplier,
      activeTickets: getRandomInt(1, 8),
      bugsFixed: getRandomInt(0, 5) * multiplier,
      featuresCompleted: getRandomInt(1, 4) * multiplier,
      techDebtTickets: getRandomInt(0, 3) * multiplier,
    };

    // Generate randomized GitHub Stats
    const github: GithubStats = {
      developerId: dev.id,
      prsOpened: getRandomInt(3, 12) * multiplier,
      prsMerged: getRandomInt(2, 10) * multiplier,
      avgCycleTimeHours: getRandomInt(12, 72), // Hours
      reviewCommentsGiven: getRandomInt(5, 50) * multiplier,
    };

    // Calculate Impact Score (Arbitrary formula for demo)
    const rawScore = (jira.velocity * 1.5) + (github.prsMerged * 5) + (github.reviewCommentsGiven * 0.5);
    const impactScore = Math.min(100, Math.round(rawScore / (multiplier * 0.8))); // Normalize slightly

    return {
      ...dev,
      ...jira,
      ...github,
      impactScore,
      impactTrend: getRandomInt(-10, 15),
      status: STATUSES[getRandomInt(0, STATUSES.length - 1)],
      recentActivityTrend: Array.from({ length: 7 }, () => getRandomInt(0, 15)),
    };
  });

  // Calculate Aggregates
  const totalPoints = metrics.reduce((acc, curr) => acc + curr.velocity, 0);
  const totalPrsMerged = metrics.reduce((acc, curr) => acc + curr.prsMerged, 0);
  const avgCycleTime = Math.round(metrics.reduce((acc, curr) => acc + curr.avgCycleTimeHours, 0) / metrics.length);

  const summary: DashboardSummary = {
    totalPoints,
    totalPrsMerged,
    avgCycleTime,
    velocityTrend: getRandomInt(-10, 20),
    prTrend: getRandomInt(-5, 15),
    cycleTimeTrend: getRandomInt(-15, 5), // Negative cycle time trend is good
  };

  return { metrics, summary };
};

// Generate GitHub Analytics Data
export const fetchGithubAnalytics = async (): Promise<GithubAnalyticsData> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const scatterData: { size: number; time: number; pr: PullRequest }[] = [];
  const stalePRs: PullRequest[] = [];
  
  // Generate 14 days of cycle time data
  const cycleTimeTrend: CycleTimeDaily[] = Array.from({ length: 14 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    
    // Randomize daily stats
    const codingTime = getRandomInt(2, 8);
    const pickupTime = getRandomInt(1, 12);
    const reviewTime = getRandomInt(4, 24);
    
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      codingTime,
      pickupTime,
      reviewTime,
      totalTime: codingTime + pickupTime + reviewTime
    };
  });

  // Generate Scatter Data (Merged PRs) & Stale PRs
  const PR_TITLES = [
    "Refactor authentication middleware",
    "Add dark mode support to dashboard",
    "Fix memory leak in websocket connection",
    "Update dependencies to latest versions",
    "Implement new user onboarding flow",
    "Optimize database queries for reporting",
    "Add automated tests for payment gateway",
    "Fix UI glitch on mobile safari",
    "Integrate new logging service",
    "Refactor sidebar component"
  ];

  for (let i = 0; i < 30; i++) {
    const isStale = i % 8 === 0; // Every 8th is stale
    const dev = DEVELOPERS[getRandomInt(0, DEVELOPERS.length - 1)];
    const linesAdded = getRandomInt(10, 800);
    const linesDeleted = getRandomInt(5, 400);
    const totalLines = linesAdded + linesDeleted;
    
    // Simulate time based loosely on size + randomness
    const mergeTime = (totalLines / 20) + getRandomInt(2, 24); 

    const pr: PullRequest = {
      id: `PR-${1000 + i}`,
      title: PR_TITLES[getRandomInt(0, PR_TITLES.length - 1)],
      author: dev.name,
      authorAvatar: dev.avatar,
      created_at: new Date(Date.now() - getRandomInt(1, 10) * 86400000).toISOString(),
      first_commit_at: new Date().toISOString(), // Simplified
      first_review_at: null,
      merged_at: isStale ? null : new Date().toISOString(),
      lines_added: linesAdded,
      lines_deleted: linesDeleted,
      status: isStale ? 'open' : 'merged',
      url: '#'
    };

    if (isStale) {
      stalePRs.push(pr);
    } else {
      scatterData.push({
        size: totalLines,
        time: Math.round(mergeTime),
        pr
      });
    }
  }

  // Calculate Averages from the generated trend
  const avgCoding = cycleTimeTrend.reduce((acc, curr) => acc + curr.codingTime, 0) / 14;
  const avgPickup = cycleTimeTrend.reduce((acc, curr) => acc + curr.pickupTime, 0) / 14;
  const avgReview = cycleTimeTrend.reduce((acc, curr) => acc + curr.reviewTime, 0) / 14;

  return {
    summary: {
      avgCycleTime: Math.round(avgCoding + avgPickup + avgReview),
      avgPickupTime: Math.round(avgPickup),
      avgReviewTime: Math.round(avgReview),
      mergeRate: 92 // Mocked constant for now
    },
    cycleTimeTrend,
    scatterData,
    stalePRs
  };
};

// Generate Jira Analytics Data
export const fetchJiraAnalytics = async (): Promise<JiraAnalyticsData> => {
  await new Promise(resolve => setTimeout(resolve, 700));

  // 1. Generate Sprint History (Last 5 sprints)
  const sprints: SprintMetric[] = [];
  const SPRINT_NAMES = ['Sprint 20', 'Sprint 21', 'Sprint 22', 'Sprint 23', 'Sprint 24 (Active)'];
  
  SPRINT_NAMES.forEach((name, index) => {
    const isCurrent = index === SPRINT_NAMES.length - 1;
    const committed = getRandomInt(100, 140);
    // If current, completed is lower. If past, it varies around committed.
    const completed = isCurrent ? Math.floor(committed * 0.4) : getRandomInt(Math.floor(committed * 0.8), Math.floor(committed * 1.1)); 
    const scopeChange = getRandomInt(0, 15);
    
    // Calculate ratio based on final totals (completed vs committed + scope)
    const sayDoRatio = isCurrent ? 0 : Math.round((completed / committed) * 100);

    sprints.push({
      id: `sp-${index}`,
      name,
      committedPoints: committed,
      completedPoints: completed,
      scopeChangePoints: scopeChange,
      sayDoRatio
    });
  });

  // 2. Generate Active Tickets & Stuck Tickets
  const activeTickets: JiraTicket[] = [];
  const TICKET_TYPES: JiraIssueType[] = ['Story', 'Story', 'Story', 'Bug', 'Bug', 'Task', 'Tech Debt'];
  const TICKET_TITLES = [
    "API Latency Optimization",
    "User Profile Redesign",
    "Fix Crash on Android 12",
    "Migrate to Next.js 14",
    "Update Stripe Webhooks",
    "Design System implementation",
    "Resolve Memory Leak",
    "Add 2FA Authentication"
  ];

  // Generate random tickets
  for (let i = 0; i < 20; i++) {
    const type = TICKET_TYPES[getRandomInt(0, TICKET_TYPES.length - 1)];
    const dev = DEVELOPERS[getRandomInt(0, DEVELOPERS.length - 1)];
    const statusVal = getRandomInt(0, 3);
    const status: JiraTicket['status'] = statusVal === 0 ? 'To Do' : statusVal === 1 ? 'In Progress' : statusVal === 2 ? 'Review' : 'Done';
    
    // Make some tickets "stuck" if In Progress
    const daysInStatus = status === 'In Progress' ? getRandomInt(1, 10) : getRandomInt(0, 3);
    
    activeTickets.push({
      id: `ticket-${i}`,
      key: `DEV-${2040 + i}`,
      title: TICKET_TITLES[getRandomInt(0, TICKET_TITLES.length - 1)],
      assignee: dev.name,
      assigneeAvatar: dev.avatar,
      type,
      status,
      points: getRandomInt(1, 8),
      daysInStatus,
      flagged: daysInStatus > 6
    });
  }

  // 3. Investment Profile Data (Aggregated from mock tickets + bias)
  const investmentProfile = [
    { name: 'Features', value: 55, color: '#3b82f6' }, // Blue
    { name: 'Bugs', value: 20, color: '#ef4444' }, // Red
    { name: 'Tech Debt', value: 15, color: '#64748b' }, // Slate
    { name: 'Support', value: 10, color: '#f59e0b' }, // Amber
  ];

  // 4. Calculate Summary KPIs based on past sprints (excluding current)
  const pastSprints = sprints.slice(0, 4);
  const avgVelocity = Math.round(pastSprints.reduce((acc, s) => acc + s.completedPoints, 0) / 4);
  const avgSayDo = Math.round(pastSprints.reduce((acc, s) => acc + s.sayDoRatio, 0) / 4);
  
  return {
    summary: {
      avgVelocity,
      sayDoRatio: avgSayDo,
      scopeCreep: Math.round(pastSprints.reduce((acc, s) => acc + s.scopeChangePoints, 0) / 4),
      bugRate: 20 // Mocked %
    },
    sprintHistory: sprints,
    activeTickets: activeTickets.sort((a, b) => b.daysInStatus - a.daysInStatus), // Sort by stuck time
    investmentProfile
  };
};

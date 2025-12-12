# Developer Dashboard - Project Documentation

## Project Overview

A comprehensive engineering dashboard for tracking developer metrics, GitHub analytics, and Jira activity. Built with React, TypeScript, and Vite, this dashboard provides real-time insights into team performance, code review cycles, and sprint health.

**Live App**: https://ai.studio/apps/drive/15OoJp-sjX62kbFoL8v2AUBoY2CzFqy7N

## Tech Stack

- **Framework**: React 19.2.1
- **Language**: TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Charts**: Recharts 3.5.1
- **Icons**: Lucide React 0.559.0
- **Styling**: Tailwind CSS (utility classes)

## Project Structure

```
developers-dashboard/
├── components/           # React components
│   ├── CycleTimeChart.tsx       # GitHub cycle time visualization
│   ├── GithubPage.tsx           # GitHub analytics view
│   ├── InvestmentProfile.tsx    # Jira work type breakdown
│   ├── JiraPage.tsx             # Jira analytics view
│   ├── JiraVelocityChart.tsx    # Sprint velocity trends
│   ├── MembersPage.tsx          # Team member detail view
│   ├── MembersTable.tsx         # Developer metrics table
│   ├── MetricCard.tsx           # Reusable metric display card
│   ├── PRScatterPlot.tsx        # PR size vs time scatter plot
│   ├── Sidebar.tsx              # Navigation sidebar
│   ├── StalePRsList.tsx         # Unmerged PR alerts
│   ├── StuckTicketsList.tsx     # Blocked Jira tickets
│   ├── VelocityChart.tsx        # Story points velocity chart
│   └── WorkDistributionChart.tsx # Team workload distribution
│
├── services/             # Data layer
│   ├── api/
│   │   ├── github/
│   │   │   ├── client.ts        # GitHub GraphQL client
│   │   │   ├── queries.ts       # GraphQL query definitions
│   │   │   ├── types.ts         # GitHub API response types
│   │   │   └── transforms.ts    # API response → App types
│   │   ├── jira/
│   │   │   ├── client.ts        # Jira REST client
│   │   │   ├── endpoints.ts     # JQL query builders
│   │   │   ├── types.ts         # Jira API response types
│   │   │   └── transforms.ts    # API response → App types
│   │   └── cache.ts             # localStorage cache layer
│   ├── config.ts                # Environment variable validation
│   ├── dashboardService.ts      # Main orchestrator (replaces mockData)
│   └── mockData.ts              # Mock data (fallback/testing)
│
├── docs/                 # Documentation
│   └── 0001-migrate-mock-to-real-api-integration.md
│
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── types.ts             # TypeScript type definitions
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
├── .env.local           # Environment variables (gitignored)
└── .env.local.example   # Environment variable template
```

## Core Data Models

### Developer Metrics (`DeveloperMetric`)
Combines GitHub and Jira stats for each team member:
- **Developer Info**: id, name, role, avatar
- **Jira Stats**: velocity, activeTickets, bugsFixed, featuresCompleted, techDebtTickets
- **GitHub Stats**: prsOpened, prsMerged, avgCycleTimeHours, reviewCommentsGiven
- **Calculated Fields**: impactScore, impactTrend, status, recentActivityTrend

### GitHub Analytics (`GithubAnalyticsData`)
- **Summary Metrics**: avgCycleTime, avgPickupTime, avgReviewTime, mergeRate
- **Cycle Time Trends**: Daily breakdown of coding/pickup/review times
- **PR Scatter Data**: Size vs time correlations
- **Stale PRs**: Unmerged pull requests needing attention

### Jira Analytics (`JiraAnalyticsData`)
- **Summary Metrics**: avgVelocity, sayDoRatio, scopeCreep, bugRate
- **Sprint History**: Historical sprint performance
- **Active Tickets**: Current work in progress
- **Investment Profile**: Work type distribution (features/bugs/tech debt)

## Application Architecture

### State Management
- **Local State**: React hooks (useState, useEffect)
- **Time Range**: Controls data filtering ('sprint' | 'month' | 'quarter')
- **Current View**: Navigation state ('overview' | 'members' | 'github' | 'jira')
- **Loading States**: Async data fetching feedback

### Navigation Views
1. **Overview** - High-level metrics, velocity charts, team table
2. **Members** - Detailed per-developer breakdown
3. **GitHub** - Code review cycle times, stale PRs, merge analytics
4. **Jira** - Sprint velocity, stuck tickets, work type distribution

### Data Flow
```
App.tsx (useEffect)
    ↓
services/dashboardService.ts (Orchestrator)
    ↓
├── services/api/github/client.ts → GitHub GraphQL API
│   └── transforms.ts → DeveloperMetric, GithubStats
└── services/api/jira/client.ts → Jira REST API
    └── transforms.ts → JiraStats, SprintMetric
    ↓
State Updates (setData, setSummary, etc.)
    ↓
Child Components (props)
```

## Key Components

### Layout Components
- **Sidebar** (`components/Sidebar.tsx`): Navigation menu with active state
- **App** (`App.tsx`): Root component, manages routing and data fetching

### Dashboard Cards
- **MetricCard** (`components/MetricCard.tsx`): Displays KPI with trend indicator
  - Supports inverse trends (lower is better for cycle time)
  - Icon support via Lucide React

### Charts & Visualizations
- **VelocityChart**: Line chart for story points over time
- **CycleTimeChart**: Stacked area chart for PR lifecycle phases
- **JiraVelocityChart**: Sprint capacity vs completion
- **WorkDistributionChart**: Pie/donut chart for team workload
- **PRScatterPlot**: Bubble chart for PR size vs merge time
- **InvestmentProfile**: Bar chart for work type allocation

### Data Tables
- **MembersTable**: Sortable table with developer metrics
- **MembersPage**: Expanded view with detailed stats per developer
- **StalePRsList**: Alert widget for PRs needing review
- **StuckTicketsList**: Alert widget for blocked Jira tickets

## Styling Approach

- **Dark Theme**: Slate color palette (bg-slate-950, text-slate-200)
- **Utility-First**: Tailwind CSS classes
- **Responsive**: Grid layouts with breakpoints (md:, lg:)
- **Glassmorphism**: Backdrop blur effects on headers
- **Gradients**: Accent colors (blue-500, purple-600)

## Development

### Scripts
```bash
npm run dev      # Start dev server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
```

### Environment Variables
Create `.env.local` for API keys and configuration:

```bash
# GitHub Configuration
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
VITE_GITHUB_ORG=your-organization-name
VITE_GITHUB_API_URL=https://api.github.com/graphql

# Jira Configuration
VITE_JIRA_DOMAIN=your-company.atlassian.net
VITE_JIRA_EMAIL=your-email@company.com
VITE_JIRA_API_TOKEN=ATATTxxxxxxxxxxxxxxxxxx
VITE_JIRA_PROJECT_KEY=DEV
VITE_JIRA_BOARD_ID=123

# Optional Feature Flags
VITE_CACHE_TTL_MINUTES=15
VITE_FALLBACK_TO_MOCK=false
```

See `.env.local.example` for a complete template.

## Data Source

The dashboard integrates with **GitHub GraphQL API** and **Jira REST API** for real-time data.

### API Integration Architecture

**GitHub Integration:**
- Uses GraphQL API for efficient data fetching (5000 points/hour rate limit)
- Fetches pull requests, commits, reviews, and contribution data across organization repositories
- Calculates cycle time metrics (coding time, pickup time, review time)
- Maps GitHub users to developer metrics via username/email mapping

**Jira Integration:**
- Uses REST API with Agile endpoints for sprint data
- Fetches tickets via JQL queries filtered by assignee and project
- Calculates velocity, story points, and investment profile
- Tracks sprint metrics (say-do ratio, scope creep, completion rates)

**Data Transformation:**
- `services/api/github/transforms.ts` - Maps GitHub API responses to app types
- `services/api/jira/transforms.ts` - Maps Jira API responses to app types
- `services/dashboardService.ts` - Orchestrates and merges data from both sources

**Caching:**
- localStorage-based cache with configurable TTL (default 15 minutes)
- Stale-while-revalidate pattern for better UX
- Graceful fallback to cached data on API failures

**Error Handling:**
- Exponential backoff retry logic (3 attempts)
- Partial data handling (show available data with warnings)
- Fallback to mock data for development (configurable via `VITE_FALLBACK_TO_MOCK`)

### Implementation Details

See `docs/0001-migrate-mock-to-real-api-integration.md` for complete implementation plan including:
- Detailed API endpoint documentation
- Data mapping strategies
- Authentication setup guide
- Testing procedures
- Troubleshooting guide

## Future Enhancements

- [x] Real API integration (GitHub GraphQL, Jira REST)
- [ ] Backend proxy server for secure token management
- [ ] User authentication and role-based access
- [ ] Configurable metrics and thresholds
- [ ] Export functionality (PDF reports)
- [ ] Real-time updates (WebSockets)
- [ ] Custom dashboard layouts
- [ ] Team goals and OKR tracking
- [ ] Historical trend analysis (data warehouse)
- [ ] Slack/Discord notifications
- [ ] Advanced filtering and search
- [ ] Custom developer mapping UI (instead of JSON config)

## Code Conventions

- **TypeScript**: Strict mode enabled, interfaces over types
- **React**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **File Organization**: One component per file
- **Props**: Destructure in function parameters
- **State**: Use descriptive names (isLoading, not loading)

## Performance Considerations

- Memoization opportunities: Large data transformations in charts
- Lazy loading: Consider code-splitting for each view
- Virtual scrolling: For large tables (100+ developers)
- Chart optimization: Use Recharts responsiveness features

## Accessibility

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast ratios (WCAG AA)
- Screen reader friendly data tables

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features required
- CSS Grid and Flexbox support required
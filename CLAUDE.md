# Developer Dashboard - Project Documentation

## Project Overview

A comprehensive engineering dashboard for tracking developer metrics and GitHub analytics. Built with React, TypeScript, and Vite, this dashboard provides real-time insights into team performance and code review cycles.

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
├── components/           # React components (16 total)
│   ├── CopilotActivityChart.tsx  # Copilot usage trend visualization
│   ├── CopilotPage.tsx           # Copilot analytics dashboard
│   ├── CopilotUsersTable.tsx     # Copilot seat management table
│   ├── CycleTimeChart.tsx        # GitHub cycle time visualization
│   ├── DeveloperDetailsModal.tsx # Detailed developer analytics modal
│   ├── DropdownMenu.tsx          # Reusable dropdown menu component
│   ├── EditorDistributionChart.tsx # Copilot editor usage distribution
│   ├── GithubPage.tsx            # GitHub analytics view
│   ├── MembersPage.tsx           # Team member detail view with search/filtering
│   ├── MembersTable.tsx          # Developer metrics table
│   ├── MetricCard.tsx            # Reusable metric display card
│   ├── PRScatterPlot.tsx         # PR size vs time scatter plot
│   ├── Sidebar.tsx               # Navigation sidebar (4 views)
│   ├── StalePRsList.tsx          # Unmerged PR alerts
│   ├── VelocityChart.tsx         # PR velocity composed chart (bars + line)
│   └── WorkDistributionChart.tsx # Team workload distribution
│
├── services/             # Data layer
│   ├── api/
│   │   ├── github/
│   │   │   ├── client.ts         # GitHub GraphQL client with rate limiting
│   │   │   ├── restClient.ts     # GitHub REST API client (Copilot)
│   │   │   ├── queries.ts        # GraphQL query definitions
│   │   │   ├── types.ts          # GitHub API response types
│   │   │   ├── transforms.ts     # API response → App types
│   │   │   ├── copilotTypes.ts   # Copilot API response types
│   │   │   └── copilotTransforms.ts # Copilot data transformations
│   │   └── cache.ts              # localStorage cache layer (TTL-based)
│   ├── config.ts                 # Environment variable validation
│   ├── dashboardService.ts       # Main orchestrator with retry logic
│   └── mockData.ts               # Mock data (fallback/testing)
│
├── hooks/                # Custom React hooks
│   └── useClickOutside.ts        # Detect clicks outside element
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
Combines GitHub stats for each team member:
- **Developer Info**: id, name, role, avatar
- **GitHub Stats**: prsOpened, prsMerged, avgCycleTimeHours, reviewCommentsGiven
- **Calculated Fields**: impactScore, impactTrend, status, recentActivityTrend
- **Enhanced Analysis**: commentsReceived, commentsGiven, prsCreated (with detailed metadata)

### GitHub Analytics (`GithubAnalyticsData`)
- **Summary Metrics**: avgCycleTime, avgPickupTime, avgReviewTime, mergeRate
- **Cycle Time Trends**: Daily breakdown of coding/pickup/review times
- **PR Scatter Data**: Size vs time correlations
- **Stale PRs**: Unmerged pull requests needing attention

### Copilot Analytics (`CopilotAnalyticsData`)
- **Adoption Metrics**: totalSeats, activeSeats, adoptionRate
- **User Statistics**: Seat assignments with activity status
- **Editor Distribution**: Breakdown by editor type (VS Code, JetBrains, etc.)
- **Activity Trends**: Time-series data for active user counts (7-day threshold)

### PR Comment Analysis (`PRCommentAnalysis`, `PRCommentGivenAnalysis`)
- **Comments Received**: Analysis of comments on developer's PRs (excluding self-comments)
- **Comments Given**: Analysis of comments developer gave on others' PRs
- **Metrics**: Total comments, unique commenters, average per PR

### PR Authorship Tracking (`PRCreatedAnalysis`)
- **PR Metadata**: Title, number, status, createdAt, mergedAt
- **Repository Info**: Repository name and owner
- **Status Tracking**: Open, merged, or closed state
- **Milestone Data**: Associated milestones and labels

## Application Architecture

### State Management
- **Local State**: React hooks (useState, useEffect)
- **Time Range**: Controls data filtering ('sprint' | 'month' | 'quarter')
- **Current View**: Navigation state ('overview' | 'members' | 'github' | 'copilot')
- **Loading States**: Async data fetching feedback for each data source

### Navigation Views
1. **Overview** - High-level metrics, velocity charts, team table
2. **Team Members** - Detailed per-developer breakdown with search, filtering, and expandable rows
3. **GitHub Metrics** - Code review cycle times, stale PRs, merge analytics, scatter plots
4. **Copilot Usage** - Copilot adoption metrics, seat management, editor distribution, activity trends

### Data Flow
```
App.tsx (useEffect)
    ↓
services/dashboardService.ts (Orchestrator)
    ↓
    ├─→ GitHub GraphQL API (client.ts)
    │   └── GET_ORGANIZATION_PULL_REQUESTS
    │   └── GET_ORGANIZATION_MEMBERS
    │        ↓
    │   transforms.ts
    │        ├── aggregateOrgPullRequests()
    │        ├── calculateCycleTime()
    │        ├── analyzeCommentsOnDeveloperPRs()
    │        ├── analyzeCommentsGivenByDeveloper()
    │        └── analyzePRsCreatedByDeveloper()
    │
    ├─→ GitHub REST API (restClient.ts)
    │   └── /orgs/{org}/copilot/billing/seats
    │        ↓
    │   copilotTransforms.ts
    │        ├── transformCopilotData()
    │        ├── calculateEditorDistribution()
    │        └── generateActivityTrends()
    │
    └─→ localStorage cache (cache.ts)
         └── TTL-based with stale-while-revalidate
    ↓
State Updates (setData, setSummary, setGithubData, setCopilotData)
    ↓
Child Components (props)
    ├── MembersPage / GithubPage / CopilotPage
    ├── Charts (Velocity, CycleTime, CopilotActivity, EditorDistribution)
    └── Tables (Members, CopilotUsers)
```

## Key Components

### Layout Components
- **Sidebar** (`components/Sidebar.tsx`): Navigation menu with active state for 4 views
- **App** (`App.tsx`): Root component, manages routing and data fetching for all data sources

### Dashboard Pages
- **GithubPage** (`components/GithubPage.tsx`): GitHub analytics dashboard with 4 KPI cards, 3 charts, and stale PRs list
- **MembersPage** (`components/MembersPage.tsx`): Comprehensive developer view (39KB) with search, filtering, expandable rows, and multi-tab analysis
- **CopilotPage** (`components/CopilotPage.tsx`): Copilot adoption metrics dashboard with seat management and usage analytics

### Dashboard Cards
- **MetricCard** (`components/MetricCard.tsx`): Displays KPI with trend indicator
  - Supports inverse trends (lower is better for cycle time)
  - Icon support via Lucide React
  - Used across all dashboard pages

### Charts & Visualizations
- **VelocityChart** (`components/VelocityChart.tsx`): Composed chart (bars + line) showing PRs opened/merged by developer
- **CycleTimeChart** (`components/CycleTimeChart.tsx`): Stacked bar chart breaking down cycle time (coding/pickup/review phases)
- **WorkDistributionChart** (`components/WorkDistributionChart.tsx`): Workload distribution visualization
- **PRScatterPlot** (`components/PRScatterPlot.tsx`): Bubble chart for PR size vs merge time analysis
- **CopilotActivityChart** (`components/CopilotActivityChart.tsx`): Trend chart for Copilot user activity over time
- **EditorDistributionChart** (`components/EditorDistributionChart.tsx`): Editor usage distribution (VS Code, JetBrains, etc.)

### Data Tables
- **MembersTable** (`components/MembersTable.tsx`): Overview table with developer metrics, sortable columns, and dropdown actions
- **CopilotUsersTable** (`components/CopilotUsersTable.tsx`): Copilot seat management and activity tracking
- **StalePRsList** (`components/StalePRsList.tsx`): Alert widget for unmerged PRs needing review

### Modals & UI Components
- **DeveloperDetailsModal** (`components/DeveloperDetailsModal.tsx`): Modal displaying comprehensive developer analytics including comments received/given and PRs created
- **DropdownMenu** (`components/DropdownMenu.tsx`): Reusable dropdown menu component with click-outside detection

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
# GitHub Configuration (Required)
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx  # PAT with repo, read:org, read:user, copilot scopes
VITE_GITHUB_ORG=your-organization-name
VITE_GITHUB_API_URL=https://api.github.com/graphql

# Optional Configuration
VITE_CACHE_TTL_MINUTES=15          # Cache duration in minutes (default: 15)
VITE_FALLBACK_TO_MOCK=false        # Use mock data on API failure (default: false)

# Legacy Configuration (Currently Unused)
# The following Jira variables are present in .env.local.example but not actively used:
# VITE_JIRA_DOMAIN, VITE_JIRA_EMAIL, VITE_JIRA_API_TOKEN,
# VITE_JIRA_PROJECT_KEY, VITE_JIRA_BOARD_ID
```

**GitHub Token Scopes Required:**
- `repo` - Access repository data for PRs and commits
- `read:org` - Read organization teams and members
- `read:user` - Access user profile information
- `copilot` - Access Copilot seat and usage data (for Copilot analytics)

See `.env.local.example` for a complete template.

## Data Source

The dashboard integrates with **GitHub GraphQL and REST APIs** for real-time data.

### API Integration Architecture

**GitHub GraphQL Integration:**
- Uses GraphQL API for efficient data fetching (5000 points/hour rate limit)
- Fetches pull requests, commits, reviews, and contribution data across organization repositories (up to 10 repos, 20 PRs per repo)
- Calculates cycle time metrics (coding time, pickup time, review time)
- Auto-detects team members from GitHub organization
- **Team-Based Role Assignment**: Automatically assigns roles based on GitHub team membership rather than hard-coded mappings
- **Enhanced Comment Analysis**: Tracks comments received on developer's PRs and comments given on others' PRs (excludes self-comments)
- **PR Authorship Tracking**: Detailed tracking with status, milestones, and repository metadata

**GitHub REST Integration:**
- Uses REST API for Copilot-specific endpoints
- Endpoint: `/orgs/{org}/copilot/billing/seats`
- Fetches Copilot seat assignments and activity data
- **Activity Status Logic**: 7-day threshold for determining "active" users
- **Editor Detection**: Tracks editor type (VS Code, JetBrains, etc.) from telemetry
- **Privacy Note**: Requires user consent for telemetry; respects opt-out preferences

**Data Transformation:**
- `services/api/github/transforms.ts` - Maps GitHub GraphQL responses to app types
  - `aggregateOrgPullRequests()` - Combines PR data across repositories
  - `calculateCycleTime()` - Computes three-phase cycle time metrics
  - `analyzeCommentsOnDeveloperPRs()` - Analyzes comments received
  - `analyzeCommentsGivenByDeveloper()` - Analyzes comments given (excludes self-reviews)
  - `analyzePRsCreatedByDeveloper()` - Tracks PR authorship with metadata
- `services/api/github/copilotTransforms.ts` - Maps Copilot REST responses
  - `transformCopilotData()` - Converts seat data to analytics format
  - `calculateEditorDistribution()` - Aggregates editor usage statistics
  - `generateActivityTrends()` - Creates time-series activity data
- `services/dashboardService.ts` - Orchestrates all data sources with retry logic

**Caching:**
- localStorage-based cache with configurable TTL (default 15 minutes)
- Stale-while-revalidate pattern for better UX
- Graceful fallback to cached data on API failures
- Separate cache keys for GraphQL and REST endpoints

**Error Handling:**
- Exponential backoff retry logic (max 3 attempts with increasing delays)
- Partial data handling (show available data with warnings)
- Fallback to mock data for development (configurable via `VITE_FALLBACK_TO_MOCK`)
- Detailed error reporting in console for debugging

### Implementation Details

See `docs/0001-migrate-mock-to-real-api-integration.md` for complete implementation plan including:
- Detailed API endpoint documentation
- Data mapping strategies
- Authentication setup guide
- Testing procedures
- Troubleshooting guide

## Future Enhancements

### Completed
- [x] Real API integration (GitHub GraphQL)
- [x] Copilot analytics and adoption tracking
- [x] Team-based role assignment from GitHub teams
- [x] Enhanced PR comment analysis (received vs given)
- [x] PR authorship tracking with metadata
- [x] Dual API approach (GraphQL + REST)

### In Progress / Planned
- [ ] Trend calculations (velocity trend, PR trend, cycle time trend) - marked as TODO in code
- [ ] Backend proxy server for secure token management
- [ ] User authentication and role-based access
- [ ] Configurable metrics and thresholds
- [ ] Export functionality (PDF reports, CSV exports)
- [ ] Real-time updates (WebSockets or polling)
- [ ] Custom dashboard layouts (drag-and-drop widgets)
- [ ] Team goals and OKR tracking
- [ ] Historical trend analysis (requires data warehouse)
- [ ] Slack/Discord notifications for stale PRs
- [ ] Advanced filtering and search capabilities
- [ ] Custom developer mapping UI (instead of auto-detection)
- [ ] PR review quality metrics (depth of review comments)
- [ ] Integration with other platforms (GitLab, Bitbucket)
- [ ] Mobile-responsive optimizations
- [ ] Dark/light theme toggle

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

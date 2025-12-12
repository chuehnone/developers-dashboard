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
│   └── mockData.ts              # Mock API and data generation
│
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── types.ts             # TypeScript type definitions
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
└── .env.local           # Environment variables (gitignored)
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
services/mockData.ts (API layer)
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
Create `.env.local` for API keys or configuration:
```
VITE_API_URL=https://api.example.com
```

## Data Source

Currently uses **mock data** (`services/mockData.ts`) for demonstration. In production:

1. Replace `fetchDashboardData()` with real GitHub API calls
2. Replace `fetchJiraAnalytics()` with Jira REST API integration
3. Add authentication/authorization
4. Implement real-time data refresh
5. Add data caching layer

## Future Enhancements

- [ ] Real API integration (GitHub GraphQL, Jira REST)
- [ ] User authentication and role-based access
- [ ] Configurable metrics and thresholds
- [ ] Export functionality (PDF reports)
- [ ] Real-time updates (WebSockets)
- [ ] Custom dashboard layouts
- [ ] Team goals and OKR tracking
- [ ] Historical trend analysis
- [ ] Slack/Discord notifications

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
# Developer Dashboard

> A comprehensive engineering analytics platform for tracking developer metrics, GitHub performance, and Copilot adoption.

## Overview

Developer Dashboard is a real-time analytics platform that provides actionable insights into your engineering team's performance. Built with modern web technologies, it integrates with GitHub's GraphQL and REST APIs to deliver comprehensive metrics on code review cycles, developer productivity, and GitHub Copilot adoption.

**Perfect for:**
- Engineering managers tracking team velocity and code review efficiency
- Team leads monitoring developer contributions and collaboration patterns
- Organizations optimizing their GitHub Copilot investment

## Features

### Developer Metrics
- **PR Tracking**: Monitor pull requests opened, merged, and in-progress across the team
- **Impact Scores**: Calculated metrics based on PR contributions and review participation
- **Activity Trends**: 7-day activity sparklines showing recent developer engagement
- **Role Assignment**: Automatic team role mapping from GitHub organization teams

### GitHub Analytics
- **Cycle Time Analysis**: Three-phase breakdown of PR lifecycle (coding → pickup → review)
- **Merge Rate Tracking**: Overall PR merge success rates and patterns
- **Stale PR Detection**: Alerts for unmerged pull requests requiring attention
- **PR Size Analysis**: Scatter plot visualization correlating PR size with merge time
- **Review Trends**: Daily cycle time trends across the organization

### Copilot Analytics
- **Adoption Tracking**: Monitor Copilot seat usage and activation rates
- **Activity Status**: Track active vs inactive users with 7-day activity thresholds
- **Editor Distribution**: Visualize editor preferences (VS Code, JetBrains, etc.)
- **Usage Trends**: Historical activity trends for Copilot utilization

### Advanced Analysis
- **Comment Tracking**: Analyze comments received on PRs and comments given on others' PRs
- **PR Authorship**: Detailed tracking of PRs created with status, milestones, and metadata
- **Team Collaboration**: Cross-team review participation and collaboration metrics
- **Expandable Details**: Drill-down modals for comprehensive developer analytics

## Quick Start

### Prerequisites

- **Node.js**: Version 18.x or higher
- **GitHub Personal Access Token**: With required scopes (see Configuration below)
- **GitHub Organization**: Admin or read access to organization data

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd developers-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your GitHub configuration (see Configuration section below).

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build     # Build production bundle
npm run preview   # Preview production build locally
```

## Configuration

### GitHub Personal Access Token

Create a GitHub Personal Access Token at: https://github.com/settings/tokens

**Required Scopes:**
- `repo` - Access repository data for PR and commit information
- `read:org` - Read organization teams and members
- `read:user` - Access user profile information
- `copilot` - Access Copilot seat and usage data (for Copilot analytics)

### Environment Variables

Configure your `.env.local` file with the following variables:

```bash
# GitHub Configuration (Required)
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
VITE_GITHUB_ORG=your-organization-name
VITE_GITHUB_API_URL=https://api.github.com/graphql

# Optional Configuration
VITE_CACHE_TTL_MINUTES=15           # Cache duration (default: 15 minutes)
VITE_FALLBACK_TO_MOCK=false         # Use mock data on API failure (default: false)
```

**Note**: Jira configuration variables in `.env.local.example` are legacy and currently unused.

### Copilot Analytics Requirements

To access Copilot analytics features, ensure your GitHub token has the `copilot` scope and your organization has GitHub Copilot seats configured.

## Project Structure

```
developers-dashboard/
├── components/              # React UI components (16 total)
│   ├── CopilotPage.tsx           # Copilot analytics dashboard
│   ├── GithubPage.tsx            # GitHub cycle time analytics
│   ├── MembersPage.tsx           # Developer details and metrics
│   ├── MembersTable.tsx          # Overview metrics table
│   ├── DeveloperDetailsModal.tsx # Detailed developer analytics modal
│   └── ...                       # Charts, visualizations, and UI components
├── services/                # Data layer and API integration
│   ├── api/
│   │   ├── github/
│   │   │   ├── client.ts         # GraphQL client with rate limiting
│   │   │   ├── restClient.ts     # REST API for Copilot data
│   │   │   ├── queries.ts        # GraphQL query definitions
│   │   │   ├── types.ts          # GitHub API response types
│   │   │   ├── transforms.ts     # Data transformation logic
│   │   │   ├── copilotTypes.ts   # Copilot API types
│   │   │   └── copilotTransforms.ts # Copilot data transforms
│   │   └── cache.ts              # localStorage cache with TTL
│   ├── config.ts                 # Environment validation
│   ├── dashboardService.ts       # Main data orchestrator
│   └── mockData.ts               # Fallback mock data
├── hooks/                   # Custom React hooks
├── types.ts                 # TypeScript type definitions
├── App.tsx                  # Root application component
└── index.tsx                # Application entry point
```

## Tech Stack

### Core Technologies
- **React 19.2.1** - Modern UI framework with concurrent features
- **TypeScript 5.8.2** - Type-safe development with strict mode
- **Vite 6.2.0** - Fast build tool with HMR and optimized bundling
- **Recharts 3.5.1** - Composable charting library for data visualization
- **Lucide React 0.559.0** - Beautiful, consistent icon set

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Dark Theme** - Slate color palette for reduced eye strain
- **Responsive Design** - Mobile-friendly layouts with breakpoints

### Why These Choices?
- **React 19**: Latest features, improved performance, and better developer experience
- **Vite**: Significantly faster than webpack, excellent DX with instant HMR
- **TypeScript**: Type safety prevents runtime errors and improves code quality
- **Recharts**: Declarative API, responsive by default, extensive customization

## Development

### Available Scripts

```bash
npm run dev      # Start development server with HMR
npm run build    # Build optimized production bundle
npm run preview  # Preview production build locally
```

### Development Workflow

1. **Start development server**: `npm run dev`
2. **Make changes**: Edit components or services
3. **Hot reload**: Changes reflect instantly in browser
4. **Type checking**: TypeScript validates on save
5. **Build**: Run `npm run build` before deployment

### Code Conventions

- **TypeScript**: Strict mode enabled, prefer interfaces over types
- **React**: Functional components with hooks only
- **Naming**:
  - PascalCase for components (`DeveloperMetrics.tsx`)
  - camelCase for functions and variables (`fetchDashboardData`)
- **File Organization**: One component per file
- **Props**: Destructure in function parameters for clarity
- **State**: Use descriptive names (`isLoading`, not `loading`)

## Architecture

### Data Flow

```
User Interaction
    ↓
App.tsx (State Management)
    ↓
dashboardService.ts (Orchestrator)
    ├→ Cache Check (localStorage)
    ├→ GitHub GraphQL API (PRs, Members)
    ├→ GitHub REST API (Copilot Seats)
    └→ Fallback to Mock Data (if configured)
    ↓
Transform Layer (transforms.ts, copilotTransforms.ts)
    ↓
State Updates (React setState)
    ↓
Component Re-render
    └→ Charts, Tables, Metrics Display
```

### Key Design Decisions

1. **Cache-First Strategy**: localStorage cache with configurable TTL (default 15 minutes) reduces API calls and improves UX
2. **Graceful Degradation**: Falls back to stale cache or mock data on API failures
3. **Dual API Approach**: GraphQL for complex queries, REST for Copilot-specific endpoints
4. **Transform Layer**: Separates API response parsing from business logic
5. **Three-Phase Cycle Time**: Coding time → Pickup time → Review time for detailed insights
6. **Team-Based Roles**: Automatic role assignment from GitHub teams instead of hard-coded mappings

### Caching Strategy

- **TTL-based**: Configurable cache duration (default 15 minutes)
- **Stale-while-revalidate**: Shows cached data while fetching updates
- **Error resilience**: Falls back to cached data on network failures
- **Exponential backoff**: 3 retry attempts with increasing delays

## API Integration

### GitHub GraphQL API

- **Rate Limit**: 5000 points per hour
- **Queries**: Organization PRs, team members, commits, reviews
- **Scope**: Up to 10 repositories, 20 PRs per repo
- **Metrics Calculated**: Cycle time, review time, pickup time, merge rate

### GitHub REST API

- **Endpoints**: Copilot seat management, activity data
- **Authentication**: Bearer token from environment
- **Metrics Calculated**: Adoption rate, active users, editor distribution

### Error Handling

- **Retry Logic**: Exponential backoff (3 attempts)
- **Partial Data**: Shows available data with warnings
- **Fallback Mode**: Optional mock data for development

## Performance Considerations

- **Code Splitting**: Consider lazy loading for page-level components
- **Memoization**: Large chart data transformations can benefit from `useMemo`
- **Virtual Scrolling**: Implement for tables with 100+ developers
- **Chart Optimization**: Recharts responsiveness features enabled

## Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript features required
- CSS Grid and Flexbox support required
- LocalStorage API required for caching

## License

[Specify your license here]

## Support

For issues, questions, or contributions, please visit the repository or contact the maintainers.

---

**Built with** ❤️ **for engineering teams**

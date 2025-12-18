import { getConfig } from '../../config';
import { CopilotSeatsResponse } from './copilotTypes';

/**
 * GitHub REST API Client
 * Handles REST API calls to GitHub (unlike the GraphQL client)
 */
export class GitHubRestClient {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor() {
    const config = getConfig();
    this.token = config.github.token;
  }

  /**
   * Generic REST API request method
   * @param endpoint - API endpoint path (e.g., '/orgs/{org}/copilot/billing/seats')
   * @param options - Fetch options
   */
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage += ` - ${errorJson.message}`;
        }
      } catch {
        // If error response is not JSON, use status text
      }

      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get Copilot seat information for an organization
   * @param org - GitHub organization name
   * @returns Copilot seats data including per-user activity
   */
  async getCopilotSeats(org: string): Promise<CopilotSeatsResponse> {
    return this.request<CopilotSeatsResponse>(
      `/orgs/${org}/copilot/billing/seats`
    );
  }
}

export const githubRestClient = new GitHubRestClient();

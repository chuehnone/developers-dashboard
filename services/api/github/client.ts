import { getConfig } from '../../config';

export class GitHubClient {
  private token: string;
  private apiUrl: string;

  constructor() {
    const config = getConfig();
    this.token = config.github.token;
    this.apiUrl = config.github.apiUrl;
  }

  async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    // Monitor rate limit headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining) {
      const remainingPoints = parseInt(remaining);
      if (remainingPoints < 1000) {
        const resetDate = reset ? new Date(parseInt(reset) * 1000) : null;
        const resetTime = resetDate ? resetDate.toLocaleTimeString() : 'unknown';
        console.warn(
          `⚠️ GitHub API rate limit low: ${remainingPoints} points remaining (resets at ${resetTime})`
        );
      }
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(
        `GraphQL errors: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`
      );
    }

    return result.data as T;
  }
}

export const githubClient = new GitHubClient();

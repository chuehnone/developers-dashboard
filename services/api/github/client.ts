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

    const result = await response.json();

    if (result.errors) {
      throw new Error(
        `GraphQL errors: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`
      );
    }

    return result.data as T;
  }

  async getRateLimit(): Promise<{
    remaining: number;
    limit: number;
    resetAt: string;
  }> {
    const query = `
      query {
        rateLimit {
          remaining
          limit
          resetAt
        }
      }
    `;

    const data = await this.query<{
      rateLimit: {
        remaining: number;
        limit: number;
        resetAt: string;
      };
    }>(query);

    return data.rateLimit;
  }

  async testConnection(): Promise<{ success: boolean; login?: string; error?: string }> {
    try {
      const query = `
        query {
          viewer {
            login
          }
        }
      `;

      const data = await this.query<{ viewer: { login: string } }>(query);
      return { success: true, login: data.viewer.login };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const githubClient = new GitHubClient();

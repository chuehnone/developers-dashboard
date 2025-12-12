import { getConfig } from '../../config';

export class JiraClient {
  private domain: string;
  private email: string;
  private apiToken: string;
  private authHeader: string;

  constructor() {
    const config = getConfig();
    this.domain = config.jira.domain;
    this.email = config.jira.email;
    this.apiToken = config.jira.apiToken;

    // Create Basic Auth header (base64 encode email:token)
    this.authHeader = 'Basic ' + btoa(`${this.email}:${this.apiToken}`);
  }

  private getBaseUrl(): string {
    // Use proxy in development to avoid CORS issues
    if (import.meta.env.DEV) {
      return '/api/jira';
    }
    return `https://${this.domain}`;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;

    console.log(`[Jira API] GET ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = JSON.stringify(errorJson, null, 2);
      } catch {
        errorDetail = await response.text();
      }

      console.error(`[Jira API] Error Response:`, errorDetail);
      throw new Error(
        `Jira API error: ${response.status} ${response.statusText}\nURL: ${url}\nDetails: ${errorDetail}`
      );
    }

    return response.json();
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Jira API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  async searchIssues(jql: string, fields: string[] = [], maxResults: number = 100): Promise<{
    issues: unknown[];
    total: number;
  }> {
    const endpoint = `/rest/api/3/search`;
    const params = new URLSearchParams({
      jql,
      maxResults: maxResults.toString(),
    });

    // Only add fields if provided
    if (fields.length > 0) {
      params.append('fields', fields.join(','));
    }

    return this.get(`${endpoint}?${params.toString()}`);
  }

  async getBoard(boardId: number): Promise<unknown> {
    return this.get(`/rest/agile/1.0/board/${boardId}`);
  }

  async getSprints(boardId: number, state?: 'active' | 'closed' | 'future'): Promise<{
    values: unknown[];
  }> {
    const endpoint = `/rest/agile/1.0/board/${boardId}/sprint`;
    const params = state ? `?state=${state}` : '';
    return this.get(`${endpoint}${params}`);
  }

  async getSprintIssues(sprintId: number, maxResults: number = 200): Promise<{
    issues: unknown[];
  }> {
    const endpoint = `/rest/agile/1.0/sprint/${sprintId}/issue`;
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
    });

    return this.get(`${endpoint}?${params.toString()}`);
  }

  async getFields(): Promise<unknown[]> {
    return this.get('/rest/api/3/field');
  }

  async testConnection(): Promise<{ success: boolean; user?: string; error?: string }> {
    try {
      const data = await this.get<{ displayName: string }>('/rest/api/3/myself');
      return { success: true, user: data.displayName };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const jiraClient = new JiraClient();

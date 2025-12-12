export interface AppConfig {
  github: {
    token: string;
    org: string;
    apiUrl: string;
  };
  jira: {
    domain: string;
    email: string;
    apiToken: string;
    projectKey: string;
    boardId: number;
  };
  cache: {
    ttlMinutes: number;
  };
  fallbackToMock: boolean;
}

interface ConfigValidationError {
  variable: string;
  message: string;
}

class ConfigurationError extends Error {
  constructor(
    message: string,
    public errors: ConfigValidationError[]
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function validateConfig(): AppConfig {
  const errors: ConfigValidationError[] = [];

  // GitHub configuration
  const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
  const githubOrg = import.meta.env.VITE_GITHUB_ORG;
  const githubApiUrl = import.meta.env.VITE_GITHUB_API_URL || 'https://api.github.com/graphql';

  if (!githubToken) {
    errors.push({
      variable: 'VITE_GITHUB_TOKEN',
      message: 'GitHub Personal Access Token is required. Create one at https://github.com/settings/tokens'
    });
  }

  if (!githubOrg) {
    errors.push({
      variable: 'VITE_GITHUB_ORG',
      message: 'GitHub organization name is required'
    });
  }

  // Jira configuration
  const jiraDomain = import.meta.env.VITE_JIRA_DOMAIN;
  const jiraEmail = import.meta.env.VITE_JIRA_EMAIL;
  const jiraApiToken = import.meta.env.VITE_JIRA_API_TOKEN;
  const jiraProjectKey = import.meta.env.VITE_JIRA_PROJECT_KEY;
  const jiraBoardId = import.meta.env.VITE_JIRA_BOARD_ID;

  if (!jiraDomain) {
    errors.push({
      variable: 'VITE_JIRA_DOMAIN',
      message: 'Jira domain is required (e.g., your-company.atlassian.net)'
    });
  }

  if (!jiraEmail) {
    errors.push({
      variable: 'VITE_JIRA_EMAIL',
      message: 'Jira email is required for API authentication'
    });
  }

  if (!jiraApiToken) {
    errors.push({
      variable: 'VITE_JIRA_API_TOKEN',
      message: 'Jira API token is required. Create one at https://id.atlassian.com/manage-profile/security/api-tokens'
    });
  }

  if (!jiraProjectKey) {
    errors.push({
      variable: 'VITE_JIRA_PROJECT_KEY',
      message: 'Jira project key is required (e.g., DEV, PROJ)'
    });
  }

  if (!jiraBoardId) {
    errors.push({
      variable: 'VITE_JIRA_BOARD_ID',
      message: 'Jira board ID is required'
    });
  }

  // Parse board ID
  const boardId = parseInt(jiraBoardId || '0', 10);
  if (jiraBoardId && isNaN(boardId)) {
    errors.push({
      variable: 'VITE_JIRA_BOARD_ID',
      message: 'Jira board ID must be a number'
    });
  }

  // Optional configuration
  const cacheTtlMinutes = parseInt(import.meta.env.VITE_CACHE_TTL_MINUTES || '15', 10);
  const fallbackToMock = import.meta.env.VITE_FALLBACK_TO_MOCK === 'true';

  // Throw if there are validation errors
  if (errors.length > 0) {
    throw new ConfigurationError(
      `Configuration validation failed. Please check your .env.local file.`,
      errors
    );
  }

  return {
    github: {
      token: githubToken,
      org: githubOrg,
      apiUrl: githubApiUrl
    },
    jira: {
      domain: jiraDomain,
      email: jiraEmail,
      apiToken: jiraApiToken,
      projectKey: jiraProjectKey,
      boardId
    },
    cache: {
      ttlMinutes: cacheTtlMinutes
    },
    fallbackToMock
  };
}

// Export singleton config
let config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!config) {
    config = validateConfig();
  }
  return config;
}

export function isConfigValid(): { valid: boolean; errors?: ConfigValidationError[] } {
  try {
    validateConfig();
    return { valid: true };
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return { valid: false, errors: error.errors };
    }
    return { valid: false, errors: [{ variable: 'unknown', message: 'Unknown configuration error' }] };
  }
}

export { ConfigurationError };

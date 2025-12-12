export interface AppConfig {
  github: {
    token: string;
    org: string;
    apiUrl: string;
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

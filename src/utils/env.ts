/**
 * Environment Configuration Utility
 * 
 * This utility provides a centralized way to access environment variables
 * with proper fallbacks and type safety.
 */

export interface EnvConfig {
  jira: {
    url: string;
    adminToken: string;
    tempoOAuthToken: string;
    debug: boolean;
  };
  auth: {
    url: string;
  };
  github: {
    owner: string;
    repo: string;
    apiUrl: string;
  };
  app: {
    name: string;
    version: string;
    id: string;
  };
  services: {
    avatarUrl: string;
    atlassianTokensUrl: string;
  };
  dev: {
    serverUrl: string;
  };
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, fallback: string = ''): string {
  return import.meta.env[key] || fallback;
}

/**
 * Get boolean environment variable
 */
function getBooleanEnvVar(key: string, fallback: boolean = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

/**
 * Environment configuration object
 */
export const envConfig: EnvConfig = {
  jira: {
    url: getEnvVar('VITE_JIRA_URL', 'https://jira.alchemytech.in'),
    adminToken: getEnvVar('VITE_JIRA_ADMIN_TOKEN', ''),
    tempoOAuthToken: getEnvVar('VITE_TEMPO_OAUTH_TOKEN', ''),
    debug: getBooleanEnvVar('VITE_DEBUG_JIRA', false),
  },
  auth: {
    url: getEnvVar('VITE_AUTH_URL', 'https://jirabridge.alchemytech.in/?from=electron'),
  },
  github: {
    owner: getEnvVar('VITE_GITHUB_OWNER', 'MananAlchemy'),
    repo: getEnvVar('VITE_GITHUB_REPO', 'JiraBridge'),
    apiUrl: getEnvVar('VITE_GITHUB_API_URL', 'https://api.github.com'),
  },
  app: {
    name: getEnvVar('VITE_APP_NAME', 'JiraBridge'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    id: getEnvVar('VITE_APP_ID', 'com.mananalchemy.jirabridge'),
  },
  services: {
    avatarUrl: getEnvVar('VITE_AVATAR_SERVICE_URL', 'https://ui-avatars.com/api'),
    atlassianTokensUrl: getEnvVar('VITE_ATLASSIAN_TOKENS_URL', 'https://id.atlassian.com/manage-profile/security/api-tokens'),
  },
  dev: {
    serverUrl: getEnvVar('VITE_DEV_SERVER_URL', 'http://localhost:5173'),
  },
};

/**
 * Validate that all required environment variables are set
 */
export function validateEnvConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'VITE_JIRA_URL',
    'VITE_JIRA_ADMIN_TOKEN',
    'VITE_TEMPO_OAUTH_TOKEN',
    'VITE_AUTH_URL',
    'VITE_GITHUB_OWNER',
    'VITE_GITHUB_REPO',
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

/**
 * Log environment configuration (excluding sensitive data)
 */
export function logEnvConfig(): void {
  const safeConfig = {
    ...envConfig,
    jira: {
      ...envConfig.jira,
      adminToken: envConfig.jira.adminToken ? '***' : 'NOT_SET',
      tempoOAuthToken: envConfig.jira.tempoOAuthToken ? '***' : 'NOT_SET',
    },
  };

  console.log('Environment Configuration:', safeConfig);
}

export default envConfig;

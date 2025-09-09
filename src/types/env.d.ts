/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Jira Configuration
  readonly VITE_JIRA_URL: string
  readonly VITE_JIRA_ADMIN_TOKEN: string
  readonly VITE_TEMPO_OAUTH_TOKEN: string
  readonly VITE_DEBUG_JIRA: string

  // Authentication & External Services
  readonly VITE_AUTH_URL: string

  // GitHub Releases & Updates
  readonly VITE_GITHUB_OWNER: string
  readonly VITE_GITHUB_REPO: string
  readonly VITE_GITHUB_API_URL: string

  // Development Configuration
  readonly VITE_DEV_SERVER_URL: string

  // Application Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ID: string

  // Avatar Service
  readonly VITE_AVATAR_SERVICE_URL: string

  // Atlassian Services
  readonly VITE_ATLASSIAN_TOKENS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

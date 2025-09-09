# Environment Variables Setup Guide

This guide explains how to configure environment variables for JiraBridge in different environments.

## Environment Files

The application uses the following environment files:

- `.env` - Default environment variables (used in development)
- `.env.example` - Template file with all available variables
- `env.production` - Production environment variables (copy to `.env.production` for production builds)

## Required Environment Variables

### Jira Configuration
```bash
# Jira instance URL (self-hosted or cloud)
VITE_JIRA_URL=https://jira.alchemytech.in

# Jira admin token for self-hosted instances
VITE_JIRA_ADMIN_TOKEN=your_jira_admin_token_here

# Tempo OAuth token (can be same as admin token for self-hosted)
VITE_TEMPO_OAUTH_TOKEN=your_tempo_oauth_token_here
```

### Authentication & External Services
```bash
# Authentication URL for OAuth flow
VITE_AUTH_URL=https://jirabridge.alchemytech.in/?from=electron
```

### GitHub Releases & Updates
```bash
# GitHub repository owner
VITE_GITHUB_OWNER=MananAlchemy

# GitHub repository name
VITE_GITHUB_REPO=JiraBridge

# GitHub API base URL
VITE_GITHUB_API_URL=https://api.github.com
```

### Application Configuration
```bash
# Application name
VITE_APP_NAME=JiraBridge

# Application version
VITE_APP_VERSION=1.0.0

# Application ID
VITE_APP_ID=com.mananalchemy.jirabridge
```

### Optional Configuration
```bash
# Development server URL
VITE_DEV_SERVER_URL=http://localhost:5173

# Enable debug mode for Jira operations
VITE_DEBUG_JIRA=false

# Avatar service URL for user avatars
VITE_AVATAR_SERVICE_URL=https://ui-avatars.com/api

# Atlassian API tokens management URL
VITE_ATLASSIAN_TOKENS_URL=https://id.atlassian.com/manage-profile/security/api-tokens
```

## Setup Instructions

### 1. Development Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:
   ```bash
   # Update with your Jira instance details
   VITE_JIRA_URL=https://your-jira-instance.com
   VITE_JIRA_ADMIN_TOKEN=your_actual_token_here
   VITE_TEMPO_OAUTH_TOKEN=your_actual_token_here
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### 2. Production Setup

1. Copy the production environment file:
   ```bash
   cp env.production .env.production
   ```

2. Update `.env.production` with your production values:
   ```bash
   # Update with your production Jira instance details
   VITE_JIRA_URL=https://your-production-jira.com
   VITE_JIRA_ADMIN_TOKEN=your_production_token_here
   VITE_TEMPO_OAUTH_TOKEN=your_production_token_here
   ```

3. Build for production:
   ```bash
   npm run build:prod
   npm run electron:build:prod
   ```

### 3. Environment-Specific Builds

#### Development Build
```bash
npm run build
npm run electron:build
```

#### Production Build
```bash
npm run build:prod
npm run electron:build:prod
```

#### Platform-Specific Production Builds
```bash
# macOS
npm run build:mac:prod

# Windows
npm run build:win:prod

# Linux
npm run build:linux:prod

# All platforms
npm run build:all:prod
```

## Security Best Practices

### 1. Never Commit Sensitive Data
- Add `.env` to `.gitignore`
- Only commit `.env.example` and `env.production` (without sensitive data)
- Use placeholder values in example files

### 2. Token Management
- Use different tokens for development and production
- Rotate tokens regularly
- Use least-privilege access for tokens

### 3. Environment Separation
- Use separate Jira instances for development and production
- Use different GitHub repositories if needed
- Keep development and production configurations separate

## Validation

The application includes environment validation. You can check if all required variables are set:

```typescript
import { validateEnvConfig } from './src/utils/env';

const validation = validateEnvConfig();
if (!validation.isValid) {
  console.error('Missing environment variables:', validation.missingVars);
}
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure variables start with `VITE_` prefix
   - Restart the development server after changing `.env`
   - Check for typos in variable names

2. **Build fails with missing variables**
   - Ensure all required variables are set in production environment
   - Check that `.env.production` exists and is properly configured

3. **Authentication issues**
   - Verify Jira URL is correct and accessible
   - Check that admin token has proper permissions
   - Ensure Tempo OAuth token is valid

### Debug Mode

Enable debug mode to see detailed Jira operation logs:

```bash
VITE_DEBUG_JIRA=true
```

## Migration from Hardcoded Values

If you're migrating from hardcoded values, follow these steps:

1. Identify all hardcoded URLs, tokens, and configuration values
2. Move them to appropriate environment variables
3. Update code to use `import.meta.env.VITE_*` variables
4. Test in both development and production environments
5. Update deployment scripts to use environment variables

## Support

For issues related to environment configuration, check:

1. Environment variable validation logs
2. Application console output
3. Network requests to external services
4. Jira API response codes and messages

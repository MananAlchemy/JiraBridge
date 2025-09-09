#!/usr/bin/env node

/**
 * Environment Variables Test Script
 * 
 * This script tests that all environment variables are properly loaded
 * and accessible in the application.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Environment Variables...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found');
  if (fs.existsSync(envExamplePath)) {
    console.log('💡 Copy .env.example to .env and configure your values');
  }
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: envPath });

// Required environment variables
const requiredVars = [
  'VITE_JIRA_URL',
  'VITE_JIRA_ADMIN_TOKEN',
  'VITE_TEMPO_OAUTH_TOKEN',
  'VITE_AUTH_URL',
  'VITE_GITHUB_OWNER',
  'VITE_GITHUB_REPO',
];

// Optional environment variables
const optionalVars = [
  'VITE_DEBUG_JIRA',
  'VITE_DEV_SERVER_URL',
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_APP_ID',
  'VITE_AVATAR_SERVICE_URL',
  'VITE_ATLASSIAN_TOKENS_URL',
  'VITE_GITHUB_API_URL',
];

console.log('📋 Checking Required Variables:');
let allRequiredPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allRequiredPresent = false;
  }
});

console.log('\n📋 Checking Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: NOT SET (using default)`);
  }
});

console.log('\n📊 Summary:');
if (allRequiredPresent) {
  console.log('✅ All required environment variables are set');
  console.log('🚀 Ready to run the application');
} else {
  console.log('❌ Some required environment variables are missing');
  console.log('💡 Please check your .env file and ensure all required variables are set');
  process.exit(1);
}

// Test environment configuration loading
console.log('\n🔧 Testing Environment Configuration Loading...');
try {
  // This would normally be done by Vite, but we can simulate it
  const envConfig = {
    jira: {
      url: process.env.VITE_JIRA_URL || 'https://jira.alchemytech.in',
      adminToken: process.env.VITE_JIRA_ADMIN_TOKEN || '',
      tempoOAuthToken: process.env.VITE_TEMPO_OAUTH_TOKEN || '',
      debug: process.env.VITE_DEBUG_JIRA === 'true'
    },
    auth: {
      url: process.env.VITE_AUTH_URL || 'https://jirabridge.alchemytech.in/?from=electron'
    },
    github: {
      owner: process.env.VITE_GITHUB_OWNER || 'MananAlchemy',
      repo: process.env.VITE_GITHUB_REPO || 'JiraBridge',
      apiUrl: process.env.VITE_GITHUB_API_URL || 'https://api.github.com'
    },
    app: {
      name: process.env.VITE_APP_NAME || 'JiraBridge',
      version: process.env.VITE_APP_VERSION || '1.0.0',
      id: process.env.VITE_APP_ID || 'com.mananalchemy.jirabridge'
    }
  };

  console.log('✅ Environment configuration loaded successfully');
  console.log(`   - Jira URL: ${envConfig.jira.url}`);
  console.log(`   - Auth URL: ${envConfig.auth.url}`);
  console.log(`   - GitHub: ${envConfig.github.owner}/${envConfig.github.repo}`);
  console.log(`   - App: ${envConfig.app.name} v${envConfig.app.version}`);

} catch (error) {
  console.log('❌ Failed to load environment configuration:', error.message);
  process.exit(1);
}

console.log('\n🎉 Environment variables test completed successfully!');

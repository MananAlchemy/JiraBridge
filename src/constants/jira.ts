// Jira Configuration Constants
export const JIRA_CONFIG = {
  // Self-hosted Jira configuration
  SELF_HOSTED: {
    URL: 'https://jira.alchemytech.in',
    // Note: In production, this should come from environment variables
    ADMIN_TOKEN: process.env.REACT_APP_JIRA_ADMIN_TOKEN || '',
  },
  
  // API endpoints
  ENDPOINTS: {
    USER: '/rest/api/2/user',
    SEARCH: '/rest/api/2/search',
    WORKLOG: '/rest/api/2/issue',
    MYSELF: '/rest/api/3/myself',
    TEMPO_WORKLOGS: '/rest/tempo-timesheets/4/worklogs',
    TEMPO_WORKLOGS_V3: '/rest/tempo-timesheets/3/worklogs', // Alternative endpoint
    TEMPO_WORKLOGS_V2: '/rest/tempo-timesheets/2/worklogs', // Alternative endpoint
    TRANSITIONS: '/rest/api/2/issue',
  },
  
  // JQL queries
  QUERIES: {
    USER_TASKS: (email: string) => 
      `assignee = "${email}" AND status not in (Done, Closed)`,
    USER_TASKS_BY_PROJECT: (email: string, projectKey: string) => 
      `assignee = "${email}" AND project = "${projectKey}" AND status not in (Done, Closed)`,
  },
  
  // Storage keys
  STORAGE: {
    CONFIG: 'jiraConfig',
  },
  
  // UI constants
  UI: {
    BOX_HEIGHT: 'h-96', // 384px
    MAX_TASK_HEIGHT: 'max-h-64', // 256px
    REFRESH_INTERVAL: 30000, // 30 seconds
  },
} as const;

// Jira task status colors
export const TASK_STATUS_COLORS = {
  'In Progress': 'text-blue-400 bg-blue-900/20 border-blue-500/30',
  'To Do': 'text-gray-400 bg-gray-900/20 border-gray-500/30',
  'Open': 'text-gray-400 bg-gray-900/20 border-gray-500/30',
  'Done': 'text-green-400 bg-green-900/20 border-green-500/30',
  'Closed': 'text-green-400 bg-green-900/20 border-green-500/30',
  'default': 'text-purple-400 bg-purple-900/20 border-purple-500/30',
} as const;

// Jira task priority colors
export const TASK_PRIORITY_COLORS = {
  'Highest': 'text-red-400 bg-red-900/20 border-red-500/30',
  'Critical': 'text-red-400 bg-red-900/20 border-red-500/30',
  'High': 'text-orange-400 bg-orange-900/20 border-orange-500/30',
  'Medium': 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  'Low': 'text-green-400 bg-green-900/20 border-green-500/30',
  'default': 'text-gray-400 bg-gray-900/20 border-gray-500/30',
} as const;

// Error messages
export const JIRA_ERRORS = {
  CONNECTION_FAILED: 'Failed to connect to Jira. Please check your credentials.',
  FETCH_TASKS_FAILED: 'Failed to fetch tasks from Jira.',
  FETCH_PROJECTS_FAILED: 'Failed to fetch projects from Jira.',
  LOG_TIME_FAILED: 'Failed to log time to Jira.',
  INVALID_CONFIG: 'Invalid Jira configuration.',
  NO_PROJECT_SELECTED: 'Please select a project first.',
  NO_TASK_SELECTED: 'Please select a task first.',
  UPDATE_STATUS_FAILED: 'Failed to update task status.',
  FETCH_TRANSITIONS_FAILED: 'Failed to fetch available transitions.',
} as const;

// Success messages
export const JIRA_SUCCESS = {
  CONNECTED: 'Successfully connected to Jira',
  TIME_LOGGED: 'Time logged successfully to Jira',
  PROJECT_SELECTED: 'Project selected successfully',
  TASK_SELECTED: 'Task selected successfully',
  STATUS_UPDATED: 'Task status updated successfully',
} as const;

// Common task status transitions
export const TASK_STATUS_TRANSITIONS = {
  'To Do': ['In Progress', 'Done'],
  'Open': ['In Progress', 'Done'],
  'In Progress': ['Done', 'To Do'],
  'Done': ['In Progress', 'Closed'],
  'Closed': ['In Progress', 'Done'],
} as const;

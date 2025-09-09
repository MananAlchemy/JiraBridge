export const JIRA_CONFIG = {
  ENDPOINTS: {
    MYSELF: '/rest/api/2/myself',
    USER: '/rest/api/2/user',
    SEARCH: '/rest/api/2/search',
    WORKLOG: '/rest/api/2/issue',
    TRANSITIONS: '/rest/api/2/issue',
    TEMPO_WORKLOGS: '/rest/tempo-timesheets/4/worklogs',
    TEMPO_WORKLOGS_V3: '/rest/tempo-timesheets/3/worklogs',
    TEMPO_WORKLOGS_V2: '/rest/tempo-timesheets/2/worklogs'
  },
  QUERIES: {
    USER_TASKS: (email) => `assignee = "${email}" AND status != Done ORDER BY updated DESC`,
    USER_TASKS_BY_PROJECT: (email, projectKey) => `assignee = "${email}" AND project = "${projectKey}" AND status != Done ORDER BY updated DESC`
  },
  STORAGE: {
    CONFIG: 'jiraConfig'
  },
  SELF_HOSTED: {
    ADMIN_TOKEN: 'Njc2NTgyNjY3MDA2Ops2sKkM9s+DmPPkvcdyeX7pri5n', // Admin token for self-hosted Jira authentication
    TEMPO_OAUTH_TOKEN: 'Njc2NTgyNjY3MDA2Ops2sKkM9s+DmPPkvcdyeX7pri5n' // Tempo OAuth token (can be same as admin token for self-hosted)
  }
};

export const JIRA_ERRORS = {
  INVALID_CONFIG: 'Invalid Jira configuration',
  FETCH_PROJECTS_FAILED: 'Failed to fetch projects',
  FETCH_TASKS_FAILED: 'Failed to fetch tasks',
  LOG_TIME_FAILED: 'Failed to log time',
  UPDATE_STATUS_FAILED: 'Failed to update task status'
};

export const JIRA_SUCCESS = {
  TIME_LOGGED: 'Time logged successfully'
};

export const TASK_STATUS_TRANSITIONS = {
  'To Do': ['In Progress'],
  'In Progress': ['Done', 'To Do'],
  'Done': ['In Progress']
};

export const TASK_STATUS_COLORS = {
  'To Do': 'bg-gray-100 text-gray-800 border-gray-200',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'Done': 'bg-green-100 text-green-800 border-green-200',
  'default': 'bg-gray-100 text-gray-800 border-gray-200'
};

export const TASK_PRIORITY_COLORS = {
  'Highest': 'bg-red-100 text-red-800 border-red-200',
  'High': 'bg-orange-100 text-orange-800 border-orange-200',
  'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Low': 'bg-green-100 text-green-800 border-green-200',
  'Lowest': 'bg-blue-100 text-blue-800 border-blue-200',
  'default': 'bg-gray-100 text-gray-800 border-gray-200'
};

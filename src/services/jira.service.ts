import { errorHandler, JiraError } from '../utils/errorHandler.js';
import { JIRA_CONFIG, JIRA_ERRORS } from '../constants/jira.js';

export interface JiraConfig {
  url: string;
  email: string;
  token: string;
  type: 'atlassian' | 'self-hosted';
  project?: string;
  displayName?: string;
  userKey?: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraTask {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: {
    displayName: string;
    emailAddress: string;
  };
  project: JiraProject;
  created: string;
  updated: string;
  timeSpent?: number;
  timeEstimate?: number;
}

export interface JiraUser {
  key: string;
  displayName: string;
  emailAddress: string;
}

class JiraService {
  private jiraConfig: JiraConfig | null = null;

  setConfig(jiraConfig: JiraConfig): void {
    // Validate configuration before setting
    const validation = errorHandler.validateConfig(jiraConfig);
    if (!validation.isValid) {
      throw new JiraError(
        `Invalid Jira configuration: ${validation.errors.join(', ')}`,
        'INVALID_CONFIG'
      );
    }
    this.jiraConfig = jiraConfig;
  }

  getConfig(): JiraConfig | null {
    return this.jiraConfig;
  }

  private isConfigured(): boolean {
    return this.jiraConfig !== null;
  }

  private getAuthHeader(): string {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }
    
    const jiraConfig = this.jiraConfig!;
    
    if (jiraConfig.type === 'self-hosted') {
      return `Bearer ${jiraConfig.token}`;
    } else {
      const base64Credentials = btoa(`${jiraConfig.email}:${jiraConfig.token}`);
      return `Basic ${base64Credentials}`;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }

    const jiraConfig = this.jiraConfig!;
    const url = `${jiraConfig.url}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Atlassian-Token': 'no-check', // Disable XSRF check
          'X-Requested-With': 'XMLHttpRequest', // Indicate AJAX request
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw errorHandler.handleApiError(
          { response: { status: response.status, data: errorText } },
          `API request to ${endpoint}`
        );
      }

      return response.json();
    } catch (error) {
      throw errorHandler.handleApiError(error, `API request to ${endpoint}`);
    }
  }

  async testConnection(): Promise<JiraUser> {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }

    const jiraConfig = this.jiraConfig!;

    if (jiraConfig.type === 'self-hosted') {
      return this.makeRequest(`${JIRA_CONFIG.ENDPOINTS.USER}?username=${jiraConfig.email}`);
    } else {
      return this.makeRequest(JIRA_CONFIG.ENDPOINTS.MYSELF);
    }
  }

  async getUserProjects(): Promise<JiraProject[]> {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }

    const jiraConfig = this.jiraConfig!;
    
    // Get all tasks assigned to the user
    const jql = JIRA_CONFIG.QUERIES.USER_TASKS(jiraConfig.email);
    const response = await this.makeRequest(
      `${JIRA_CONFIG.ENDPOINTS.SEARCH}?jql=${encodeURIComponent(jql)}`
    );

    // Extract unique projects from tasks
    const projectMap = new Map<string, JiraProject>();
    response.issues.forEach((issue: any) => {
      const proj = issue.fields.project;
      if (!projectMap.has(proj.key)) {
        projectMap.set(proj.key, {
          id: proj.id,
          key: proj.key,
          name: proj.name
        });
      }
    });

    return Array.from(projectMap.values());
  }

  async getUserTasks(projectKey?: string): Promise<JiraTask[]> {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }

    const jiraConfig = this.jiraConfig!;
    
    const jql = projectKey 
      ? JIRA_CONFIG.QUERIES.USER_TASKS_BY_PROJECT(jiraConfig.email, projectKey)
      : JIRA_CONFIG.QUERIES.USER_TASKS(jiraConfig.email);

    const response = await this.makeRequest(
      `${JIRA_CONFIG.ENDPOINTS.SEARCH}?jql=${encodeURIComponent(jql)}&expand=changelog`
    );

    return response.issues.map((issue: any) => this.mapIssueToTask(issue));
  }

  private mapIssueToTask(issue: any): JiraTask {
    return {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name || 'Medium',
      assignee: issue.fields.assignee ? {
        displayName: issue.fields.assignee.displayName,
        emailAddress: issue.fields.assignee.emailAddress
      } : undefined,
      project: {
        id: issue.fields.project.id,
        key: issue.fields.project.key,
        name: issue.fields.project.name
      },
      created: issue.fields.created,
      updated: issue.fields.updated,
      timeSpent: issue.fields.timespent || 0,
      timeEstimate: issue.fields.timeestimate || 0
    };
  }

  async logWork(taskKey: string, timeSpent: string, comment?: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }

    if (!taskKey || !timeSpent) {
      throw new JiraError('Task key and time spent are required', 'INVALID_PARAMETERS');
    }

    const worklogData = {
      timeSpent: timeSpent,
      comment: comment || `Time logged via JiraBridge at ${new Date().toISOString()}`
    };

    await this.makeRequest(`${JIRA_CONFIG.ENDPOINTS.WORKLOG}/${taskKey}/worklog`, {
      method: 'POST',
      body: JSON.stringify(worklogData)
    });
  }

  async getTaskDetails(taskKey: string): Promise<JiraTask> {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }

    if (!taskKey) {
      throw new JiraError('Task key is required', 'INVALID_PARAMETERS');
    }

    const response = await this.makeRequest(`${JIRA_CONFIG.ENDPOINTS.WORKLOG}/${taskKey}`);
    return this.mapIssueToTask(response);
  }

  async logWorkToTempo(workLogData: {
    userKey: string;
    description: string;
    startTime: Date;
    endTime: Date;
    timeSpentSeconds: number;
    taskKey: string;
  }): Promise<void> {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }

    const jiraConfig = this.jiraConfig!;
    
    // Validate userKey
    if (!workLogData.userKey) {
      throw new JiraError('User key is required for Tempo logging', 'MISSING_USER_KEY');
    }
    
    // Convert seconds to Jira time format (e.g., "1h 30m")
    const formatTimeSpent = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return '1m'; // Minimum time
      }
    };
    
    const tempoWorkLogData = {
      worker: workLogData.userKey,
      comment: workLogData.description,
      started: workLogData.startTime.toISOString(),
      endDate: workLogData.endTime.toISOString(), // Add endDate like in working code
      timeSpentSeconds: workLogData.timeSpentSeconds,
      billableSeconds: workLogData.timeSpentSeconds,
      originTaskId: workLogData.taskKey,
      remainingEstimate: 0,
      includeNonWorkingDays: false
    };

    try {
      const tempoUrl = `${jiraConfig.url}${JIRA_CONFIG.ENDPOINTS.TEMPO_WORKLOGS}`;
      const authHeader = this.getAuthHeader();
      
      console.log('=== TEMPO API DEBUG INFO ===');
      console.log('Full URL:', tempoUrl);
      console.log('Jira Config:', {
        url: jiraConfig.url,
        type: jiraConfig.type,
        email: jiraConfig.email,
        hasToken: !!jiraConfig.token,
        userKey: workLogData.userKey
      });
      console.log('Auth Header:', authHeader);
      console.log('Request Data:', tempoWorkLogData);
      console.log('============================');

      // Use IPC to make the request through the main process
      if (!window.electronAPI || !(window.electronAPI as any).proxyHttpRequest) {
        throw new JiraError('Electron API not available', 'ELECTRON_API_UNAVAILABLE');
      }
      
      const response = await (window.electronAPI as any).proxyHttpRequest({
        method: 'POST',
        url: tempoUrl,
        headers: {
          'Authorization': `Bearer ${JIRA_CONFIG.SELF_HOSTED.ADMIN_TOKEN}`, // Use admin token like working code
        },
        body: tempoWorkLogData
      });

      if (!response.ok) {
        console.error('Tempo API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: response.body,
          url: `${jiraConfig.url}${JIRA_CONFIG.ENDPOINTS.TEMPO_WORKLOGS}`,
          headers: response.headers
        });
        
        // If Tempo fails, try fallback to regular Jira worklog
        if (response.status === 403 || response.status === 401) {
          console.log('Tempo access denied, trying fallback to regular Jira worklog...');
          try {
            return this.logWork(workLogData.taskKey, formatTimeSpent(workLogData.timeSpentSeconds), workLogData.description);
          } catch (fallbackError) {
            console.error('Fallback worklog also failed:', fallbackError);
            throw new JiraError(
              'Both Tempo and regular Jira worklog failed. Please check your permissions and try again.',
              'WORKLOG_FAILED',
              response.status,
              fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
            );
          }
        }
        
                  throw errorHandler.handleApiError(
                    { response: { status: response.status, data: response.body } },
                    'Tempo work log submission'
                  );
      }
      
      console.log('Tempo worklog submitted successfully');
    } catch (error) {
      console.error('Tempo logging error:', error);
      
      // If it's a network or permission error, try fallback to regular Jira worklog
      if (error instanceof JiraError && (error.code === 'HTTP_403' || error.code === 'HTTP_401')) {
        console.log('Tempo access denied, trying fallback to regular Jira worklog...');
        try {
          return this.logWork(workLogData.taskKey, formatTimeSpent(workLogData.timeSpentSeconds), workLogData.description);
        } catch (fallbackError) {
          console.error('Fallback worklog also failed:', fallbackError);
          throw new JiraError(
            'Both Tempo and regular Jira worklog failed. Please check your permissions.',
            'WORKLOG_FAILED',
            undefined,
            fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
          );
        }
      }
      
      throw errorHandler.handleApiError(error, 'Tempo work log submission');
    }
  }

  async getTaskTransitions(taskKey: string): Promise<any[]> {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }

    if (!taskKey) {
      throw new JiraError('Task key is required', 'INVALID_PARAMETERS');
    }

    try {
      const response = await this.makeRequest(`${JIRA_CONFIG.ENDPOINTS.TRANSITIONS}/${taskKey}/transitions`);
      return response.transitions || [];
    } catch (error) {
      throw errorHandler.handleApiError(error, 'Fetching task transitions');
    }
  }

  async updateTaskStatus(taskKey: string, transitionId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }

    if (!taskKey || !transitionId) {
      throw new JiraError('Task key and transition ID are required', 'INVALID_PARAMETERS');
    }

    const transitionData = {
      transition: {
        id: transitionId
      }
    };

    try {
      await this.makeRequest(`${JIRA_CONFIG.ENDPOINTS.TRANSITIONS}/${taskKey}/transitions`, {
        method: 'POST',
        body: JSON.stringify(transitionData)
      });
    } catch (error) {
      throw errorHandler.handleApiError(error, 'Updating task status');
    }
  }

  async testTempoConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.isConfigured()) {
      throw new JiraError(JIRA_ERRORS.INVALID_CONFIG, 'NOT_CONFIGURED');
    }

    const jiraConfig = this.jiraConfig!;
    const endpoints = [
      JIRA_CONFIG.ENDPOINTS.TEMPO_WORKLOGS,
      JIRA_CONFIG.ENDPOINTS.TEMPO_WORKLOGS_V3,
      JIRA_CONFIG.ENDPOINTS.TEMPO_WORKLOGS_V2
    ];
    
    for (const endpoint of endpoints) {
      const tempoUrl = `${jiraConfig.url}${endpoint}`;
      
      try {
        console.log(`Testing Tempo connection with endpoint: ${endpoint}`, { url: tempoUrl });
        
        // Try a simple GET request to test access using admin token via IPC
        if (!window.electronAPI || !(window.electronAPI as any).proxyHttpRequest) {
          throw new JiraError('Electron API not available', 'ELECTRON_API_UNAVAILABLE');
        }
        
        const response = await (window.electronAPI as any).proxyHttpRequest({
          method: 'GET',
          url: tempoUrl,
          headers: {
            'Authorization': `Bearer ${JIRA_CONFIG.SELF_HOSTED.ADMIN_TOKEN}`, // Use admin token
          }
        });

        console.log(`Tempo connection test response for ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });

        if (response.status === 403) {
          console.log(`Access denied for ${endpoint}, trying next endpoint...`);
          continue; // Try next endpoint
        } else if (response.status === 401) {
          return {
            success: false,
            message: 'Authentication failed. Please check your Jira credentials.',
            details: { status: response.status, statusText: response.statusText, endpoint }
          };
        } else if (response.status === 404) {
          console.log(`Endpoint ${endpoint} not found, trying next endpoint...`);
          continue; // Try next endpoint
        } else if (response.ok) {
          return {
            success: true,
            message: `Tempo API connection successful using ${endpoint}!`,
            details: { status: response.status, endpoint }
          };
        } else {
          console.log(`Unexpected status ${response.status} for ${endpoint}, trying next endpoint...`);
          continue; // Try next endpoint
        }
      } catch (error) {
        console.error(`Tempo connection test failed for ${endpoint}:`, error);
        continue; // Try next endpoint
      }
    }
    
    // If we get here, all endpoints failed
    return {
      success: false,
      message: 'All Tempo API endpoints failed. Tempo Timesheets may not be installed, configured, or you may not have the required permissions.',
      details: { 
        testedEndpoints: endpoints,
        suggestion: 'Please check with your Jira administrator about Tempo Timesheets installation and your user permissions.'
      }
    };
  }
}

export const jiraService = new JiraService();

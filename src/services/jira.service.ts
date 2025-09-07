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
    
    const tempoWorkLogData = {
      worker: workLogData.userKey,
      comment: workLogData.description,
      started: workLogData.startTime.toISOString(),
      endDate: workLogData.endTime.toISOString(),
      timeSpentSeconds: workLogData.timeSpentSeconds,
      billableSeconds: workLogData.timeSpentSeconds,
      originTaskId: workLogData.taskKey,
      remainingEstimate: 0,
      includeNonWorkingDays: false
    };

    try {
      const response = await fetch(`${jiraConfig.url}${JIRA_CONFIG.ENDPOINTS.TEMPO_WORKLOGS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jiraConfig.token}`,
        },
        body: JSON.stringify(tempoWorkLogData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw errorHandler.handleApiError(
          { response: { status: response.status, data: errorText } },
          'Tempo work log submission'
        );
      }
    } catch (error) {
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
}

export const jiraService = new JiraService();

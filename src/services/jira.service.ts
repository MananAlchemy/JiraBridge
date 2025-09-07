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
  private config: JiraConfig | null = null;

  setConfig(config: JiraConfig) {
    this.config = config;
  }

  getConfig(): JiraConfig | null {
    return this.config;
  }

  private getAuthHeader(): string {
    if (!this.config) throw new Error('Jira not configured');
    
    if (this.config.type === 'self-hosted') {
      return `Bearer ${this.config.token}`;
    } else {
      const base64Credentials = btoa(`${this.config.email}:${this.config.token}`);
      return `Basic ${base64Credentials}`;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.config) throw new Error('Jira not configured');

    const url = `${this.config.url}${endpoint}`;
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
      throw new Error(`Jira API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<JiraUser> {
    if (!this.config) throw new Error('Jira not configured');

    if (this.config.type === 'self-hosted') {
      return this.makeRequest(`/rest/api/2/user?username=${this.config.email}`);
    } else {
      return this.makeRequest('/rest/api/3/myself');
    }
  }

  async getUserProjects(): Promise<JiraProject[]> {
    if (!this.config) throw new Error('Jira not configured');

    // Get all tasks assigned to the user
    const jql = `assignee = "${this.config.email}" AND status not in (Done, Closed)`;
    const response = await this.makeRequest(`/rest/api/2/search?jql=${encodeURIComponent(jql)}`);

    // Extract unique projects from tasks
    const projectMap = new Map();
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
    if (!this.config) throw new Error('Jira not configured');

    let jql = `assignee = "${this.config.email}" AND status not in (Done, Closed)`;
    if (projectKey) {
      jql += ` AND project = "${projectKey}"`;
    }

    const response = await this.makeRequest(`/rest/api/2/search?jql=${encodeURIComponent(jql)}&expand=changelog`);

    return response.issues.map((issue: any) => ({
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
    }));
  }

  async logWork(taskKey: string, timeSpent: string, comment?: string): Promise<void> {
    if (!this.config) throw new Error('Jira not configured');

    const worklogData = {
      timeSpent: timeSpent,
      comment: comment || `Time logged via JiraBridge`
    };

    await this.makeRequest(`/rest/api/2/issue/${taskKey}/worklog`, {
      method: 'POST',
      body: JSON.stringify(worklogData)
    });
  }

  async getTaskDetails(taskKey: string): Promise<JiraTask> {
    if (!this.config) throw new Error('Jira not configured');

    const response = await this.makeRequest(`/rest/api/2/issue/${taskKey}`);

    return {
      id: response.id,
      key: response.key,
      summary: response.fields.summary,
      description: response.fields.description,
      status: response.fields.status.name,
      priority: response.fields.priority?.name || 'Medium',
      assignee: response.fields.assignee ? {
        displayName: response.fields.assignee.displayName,
        emailAddress: response.fields.assignee.emailAddress
      } : undefined,
      project: {
        id: response.fields.project.id,
        key: response.fields.project.key,
        name: response.fields.project.name
      },
      created: response.fields.created,
      updated: response.fields.updated,
      timeSpent: response.fields.timespent || 0,
      timeEstimate: response.fields.timeestimate || 0
    };
  }
}

export const jiraService = new JiraService();

import { useState, useEffect, useCallback } from 'react';
import { jiraService, JiraConfig, JiraTask } from '../services/jira.service';

export interface UseJiraReturn {
  config: JiraConfig | null;
  isConnected: boolean;
  selectedTask: JiraTask | null;
  isLoading: boolean;
  error: string | null;
  connectJira: (config: JiraConfig) => void;
  disconnectJira: () => void;
  selectTask: (task: JiraTask | null) => void;
  logTime: (timeSpent: string, comment?: string) => Promise<void>;
  clearError: () => void;
}

export function useJira(): UseJiraReturn {
  const [config, setConfig] = useState<JiraConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTask, setSelectedTask] = useState<JiraTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load saved Jira configuration
    const savedConfig = localStorage.getItem('jiraConfig');
    if (savedConfig) {
      try {
        const parsedConfig: JiraConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        setIsConnected(true);
        jiraService.setConfig(parsedConfig);
      } catch (err) {
        console.error('Error loading Jira config:', err);
        localStorage.removeItem('jiraConfig');
      }
    }
  }, []);

  const connectJira = useCallback((newConfig: JiraConfig) => {
    setConfig(newConfig);
    setIsConnected(true);
    jiraService.setConfig(newConfig);
    setError(null);
  }, []);

  const disconnectJira = useCallback(() => {
    setConfig(null);
    setIsConnected(false);
    setSelectedTask(null);
    jiraService.setConfig(null as any);
    localStorage.removeItem('jiraConfig');
    setError(null);
  }, []);

  const selectTask = useCallback((task: JiraTask | null) => {
    setSelectedTask(task);
    setError(null);
  }, []);

  const logTime = useCallback(async (timeSpent: string, comment?: string) => {
    if (!selectedTask) {
      setError('No task selected');
      return;
    }

    if (!isConnected) {
      setError('Not connected to Jira');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await jiraService.logWork(selectedTask.key, timeSpent, comment);
      
      // Refresh task details to get updated time spent
      const updatedTask = await jiraService.getTaskDetails(selectedTask.key);
      setSelectedTask(updatedTask);
    } catch (err: any) {
      setError(err.message || 'Failed to log time to Jira');
      console.error('Error logging time:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTask, isConnected]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    config,
    isConnected,
    selectedTask,
    isLoading,
    error,
    connectJira,
    disconnectJira,
    selectTask,
    logTime,
    clearError
  };
}

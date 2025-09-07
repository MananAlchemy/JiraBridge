import { useState } from 'react';
import { jiraService } from '../services/jira.service';
import { JiraError } from '../utils/errorHandler';
import { JIRA_ERRORS, JIRA_SUCCESS } from '../constants/jira';

interface WorkLogData {
  description: string;
  startTime: Date;
  endTime: Date;
  taskKey: string;
  timeSpentSeconds: number;
}

export const useWorkLog = () => {
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const logWorkToTempo = async (workLogData: WorkLogData, userKey: string): Promise<void> => {
    setIsLogging(true);
    setError(null);
    setSuccess(null);

    try {
      await jiraService.logWorkToTempo({
        ...workLogData,
        userKey
      });

      setSuccess(JIRA_SUCCESS.TIME_LOGGED);
    } catch (err) {
      const errorMessage = err instanceof JiraError 
        ? err.message 
        : JIRA_ERRORS.LOG_TIME_FAILED;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLogging(false);
    }
  };

  const updateTaskStatus = async (taskKey: string, newStatus: string): Promise<void> => {
    try {
      // Get available transitions
      const transitions = await jiraService.getTaskTransitions(taskKey);
      
      // Find the transition that leads to the desired status
      const targetTransition = transitions.find(
        (transition: any) => transition.to.name === newStatus
      );

      if (!targetTransition) {
        throw new Error(`Cannot transition to status: ${newStatus}`);
      }

      // Execute the transition
      await jiraService.updateTaskStatus(taskKey, targetTransition.id);
    } catch (err) {
      const errorMessage = err instanceof JiraError 
        ? err.message 
        : JIRA_ERRORS.UPDATE_STATUS_FAILED;
      setError(errorMessage);
      throw err;
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    isLogging,
    error,
    success,
    logWorkToTempo,
    updateTaskStatus,
    clearMessages
  };
};

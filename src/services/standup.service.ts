import { logger } from '../utils/logger';

export interface StandupTask {
  taskKey: string;
  taskSummary: string;
  project: string;
  timeSpentSeconds: number;
  timeSpentFormatted: string;
  description?: string;
  status?: string;
}

export interface StandupData {
  userEmail: string;
  date: string;
  totalTimeToday: string;
  tasks: StandupTask[];
  screenshotCount: number;
  sessionCount: number;
}

export interface StandupResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class StandupService {
  private static readonly STANDUP_API_URL = 'https://n8n.alchemytech.in/webhook/standup';

  /**
   * Send standup data to the API
   */
  static async sendStandupData(data: StandupData): Promise<StandupResponse> {
    try {
      logger.info('Sending standup data to API:', {
        userEmail: data.userEmail,
        date: data.date,
        taskCount: data.tasks.length,
        totalTime: data.totalTimeToday
      });

      const response = await fetch(this.STANDUP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      logger.info('Standup data sent successfully:', result);
      
      return {
        success: true,
        message: result.message || 'Standup data sent successfully'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send standup data:', error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Prepare standup data from time tracking data
   */
  static prepareStandupData(
    userEmail: string,
    dailyData: any,
    sessions: any[],
    screenshots: any[]
  ): StandupData {
    const today = new Date().toISOString().split('T')[0];
    
    // Debug logging
    console.log('🔍 Standup data preparation:', {
      userEmail,
      today,
      dailyData: dailyData ? {
        totalTimeFormatted: dailyData.totalTimeFormatted,
        tasks: dailyData.tasks ? Object.keys(dailyData.tasks) : 'no tasks',
        hasTasks: !!dailyData.tasks
      } : 'no daily data',
      sessionsCount: sessions.length,
      screenshotsCount: screenshots.length,
      sessions: sessions.map(s => ({
        jiraTaskKey: s.jiraTaskKey,
        jiraTaskSummary: s.jiraTaskSummary,
        durationSeconds: s.durationSeconds
      }))
    });
    
    // Helper function to convert Firestore Timestamp to Date
    const toDate = (timestamp: any): Date => {
      if (!timestamp) return new Date();
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
      }
      return new Date(timestamp);
    };

    // Get today's screenshots
    const todayScreenshots = screenshots.filter(s => {
      const screenshotDate = toDate(s.timestamp).toISOString().split('T')[0];
      return screenshotDate === today;
    });

    // Get today's sessions
    const todaySessions = sessions.filter(s => {
      const sessionDate = toDate(s.startTime).toISOString().split('T')[0];
      return sessionDate === today;
    });

    // Prepare tasks data
    const tasks: StandupTask[] = [];
    
    // First, try to get tasks from daily data
    if (dailyData && dailyData.tasks) {
      Object.entries(dailyData.tasks).forEach(([taskKey, taskData]: [string, any]) => {
        tasks.push({
          taskKey,
          taskSummary: taskData.taskSummary || '',
          project: taskData.project || '',
          timeSpentSeconds: taskData.timeSpentSeconds || 0,
          timeSpentFormatted: taskData.timeSpentFormatted || '0s',
          description: taskData.description || '',
          status: taskData.status || ''
        });
      });
    }

    // If no tasks from daily data, try to get from sessions
    if (tasks.length === 0 && todaySessions.length > 0) {
      const uniqueTasks = new Map();
      
      todaySessions.forEach(session => {
        if (session.jiraTaskKey) {
          const key = session.jiraTaskKey;
          if (!uniqueTasks.has(key)) {
            uniqueTasks.set(key, {
              taskKey: session.jiraTaskKey,
              taskSummary: session.jiraTaskSummary || '',
              project: session.jiraProject || '',
              timeSpentSeconds: session.durationSeconds || 0,
              timeSpentFormatted: session.durationFormatted || '0s',
              description: session.description || '',
              status: session.status || ''
            });
          } else {
            // Add time to existing task
            const existing = uniqueTasks.get(key);
            existing.timeSpentSeconds += session.durationSeconds || 0;
            existing.timeSpentFormatted = this.formatTime(existing.timeSpentSeconds);
          }
        }
      });
      
      tasks.push(...Array.from(uniqueTasks.values()));
    }

    // If still no tasks, try to get from screenshots
    if (tasks.length === 0 && todayScreenshots.length > 0) {
      const uniqueTasks = new Map();
      
      todayScreenshots.forEach(screenshot => {
        if (screenshot.jiraTaskKey) {
          const key = screenshot.jiraTaskKey;
          if (!uniqueTasks.has(key)) {
            uniqueTasks.set(key, {
              taskKey: screenshot.jiraTaskKey,
              taskSummary: screenshot.jiraTaskSummary || '',
              project: screenshot.jiraProject || '',
              timeSpentSeconds: screenshot.timeSpentSeconds || 0,
              timeSpentFormatted: screenshot.timeSpentFormatted || '0s',
              description: screenshot.description || '',
              status: screenshot.status || ''
            });
          } else {
            // Add time to existing task
            const existing = uniqueTasks.get(key);
            existing.timeSpentSeconds += screenshot.timeSpentSeconds || 0;
            existing.timeSpentFormatted = this.formatTime(existing.timeSpentSeconds);
          }
        }
      });
      
      tasks.push(...Array.from(uniqueTasks.values()));
    }

    const result = {
      userEmail,
      date: today,
      totalTimeToday: dailyData?.totalTimeFormatted || '0s',
      tasks,
      screenshotCount: todayScreenshots.length,
      sessionCount: todaySessions.length
    };

    console.log('📊 Final standup data:', {
      totalTimeToday: result.totalTimeToday,
      tasksCount: result.tasks.length,
      tasks: result.tasks.map(t => ({
        taskKey: t.taskKey,
        taskSummary: t.taskSummary,
        timeSpent: t.timeSpentFormatted
      })),
      screenshotCount: result.screenshotCount,
      sessionCount: result.sessionCount
    });

    return result;
  }

  /**
   * Format time in seconds to human readable format
   */
  private static formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

export const standupService = StandupService;

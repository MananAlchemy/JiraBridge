import { Timestamp } from 'firebase/firestore';

// Daily time tracking data for hierarchical structure
export interface DailyTimeTracking {
  totalTimeSeconds: number;
  totalTimeFormatted: string; // e.g., "2h 30m 15s"
  sessionCount: number;
  screenshotCount: number;
  lastUpdated: Timestamp;
  tasks: {
    [taskKey: string]: {
      taskSummary: string;
      project: string;
      timeSpentSeconds: number;
      timeSpentFormatted: string;
      sessionCount: number;
      screenshotCount: number;
      lastUpdated: Timestamp;
    };
  };
}

// Individual time tracking session for hierarchical structure
export interface TimeTrackingSession {
  sessionId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  durationSeconds: number;
  durationFormatted: string;
  isActive: boolean;
  jiraTaskKey?: string;
  jiraTaskSummary?: string;
  jiraProject?: string;
  screenshotIds: string[];
  lastUpdated: Timestamp;
}

// Screenshot time tracking data
export interface ScreenshotTimeTracking {
  id?: string;
  userEmail: string;
  date: string; // YYYY-MM-DD format
  screenshotId: string;
  timestamp: Timestamp;
  timeSpentSeconds: number;
  timeSpentFormatted: string;
  sessionId?: string;
  jiraTaskKey?: string;
  jiraTaskSummary?: string;
  screenshotSize: number;
  screenshotQuality: 'low' | 'medium' | 'high';
  synced: boolean;
  createdAt: Timestamp;
}

// Weekly summary data
export interface WeeklySummary {
  id?: string;
  userEmail: string;
  weekStartDate: string; // YYYY-MM-DD format (Monday)
  weekEndDate: string; // YYYY-MM-DD format (Sunday)
  totalTimeSeconds: number;
  totalTimeFormatted: string;
  totalSessions: number;
  totalScreenshots: number;
  averageSessionDuration: number;
  averageSessionDurationFormatted: string;
  mostActiveDay: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Monthly summary data
export interface MonthlySummary {
  id?: string;
  userEmail: string;
  month: string; // YYYY-MM format
  totalTimeSeconds: number;
  totalTimeFormatted: string;
  totalSessions: number;
  totalScreenshots: number;
  averageDailyTime: number;
  averageDailyTimeFormatted: string;
  workingDays: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User profile data
export interface UserProfile {
  id?: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  firstTrackedDate: string;
  lastActiveDate: string;
  totalTimeTracked: number;
  totalTimeTrackedFormatted: string;
  totalSessions: number;
  totalScreenshots: number;
  preferences: {
    defaultScreenshotInterval: number;
    defaultScreenshotQuality: 'low' | 'medium' | 'high';
    timezone: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

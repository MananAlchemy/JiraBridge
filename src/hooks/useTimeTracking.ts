import { useState, useEffect, useCallback } from 'react';
import { TimeTrackingSession, DailyTimeTracking } from '../types';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';
import { formatUtils } from '../utils/format';
import { APP_CONSTANTS } from '../constants';
import { JiraTask } from '../services/jira.service';

export const useTimeTracking = (selectedJiraTask?: JiraTask | null) => {
  const [currentSession, setCurrentSession] = useState<TimeTrackingSession | null>(null);
  const [dailyData, setDailyData] = useState<DailyTimeTracking[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [totalTimeToday, setTotalTimeToday] = useState(0);

  useEffect(() => {
    loadTimeTrackingData();
    loadCurrentSession();
  }, []);

  useEffect(() => {
    if (isTracking && currentSession) {
      const interval = setInterval(() => {
        updateCurrentSession();
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
  }, [isTracking, currentSession]);

  const loadTimeTrackingData = useCallback(() => {
    try {
      const saved = storage.get<DailyTimeTracking[]>(APP_CONSTANTS.TIME_TRACKING.STORAGE_KEY, []);
      setDailyData(saved);
      logger.info('Time tracking data loaded:', { count: saved.length });
    } catch (error) {
      logger.error('Failed to load time tracking data:', error);
    }
  }, []);

  const loadCurrentSession = useCallback(() => {
    try {
      const saved = storage.get<TimeTrackingSession | null>(APP_CONSTANTS.TIME_TRACKING.SESSION_STORAGE_KEY, null);
      if (saved) {
        setCurrentSession(saved);
        setIsTracking(saved.isActive);
        logger.info('Current session loaded:', { id: saved.id, isActive: saved.isActive });
      }
    } catch (error) {
      logger.error('Failed to load current session:', error);
    }
  }, []);

  const saveTimeTrackingData = useCallback((data: DailyTimeTracking[]) => {
    try {
      storage.set(APP_CONSTANTS.TIME_TRACKING.STORAGE_KEY, data);
      logger.debug('Time tracking data saved:', { count: data.length });
    } catch (error) {
      logger.error('Failed to save time tracking data:', error);
    }
  }, []);

  const saveCurrentSession = useCallback((session: TimeTrackingSession | null) => {
    try {
      storage.set(APP_CONSTANTS.TIME_TRACKING.SESSION_STORAGE_KEY, session);
      logger.debug('Current session saved:', { id: session?.id });
    } catch (error) {
      logger.error('Failed to save current session:', error);
    }
  }, []);

  const getTodayKey = useCallback(() => {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }, []);

  const getTodayData = useCallback(() => {
    const today = getTodayKey();
    return dailyData.find(d => d.date === today) || {
      date: today,
      totalTime: 0,
      sessions: [],
      screenshotCount: 0
    };
  }, [dailyData, getTodayKey]);

  const updateCurrentSession = useCallback(() => {
    if (currentSession && currentSession.isActive) {
      const now = new Date();
      const duration = now.getTime() - currentSession.startTime.getTime();
      
      setCurrentSession(prev => prev ? {
        ...prev,
        duration
      } : null);
    }
  }, [currentSession]);

  const startTracking = useCallback(() => {
    try {
      const sessionId = formatUtils.generateId();
      const now = new Date();
      
      const newSession: TimeTrackingSession = {
        id: sessionId,
        startTime: now,
        screenshots: [],
        isActive: true,
        jiraTask: selectedJiraTask ? {
          key: selectedJiraTask.key,
          summary: selectedJiraTask.summary,
          project: selectedJiraTask.project.name
        } : undefined
      };

      setCurrentSession(newSession);
      setIsTracking(true);
      saveCurrentSession(newSession);
      
      logger.info('Time tracking started:', { 
        sessionId, 
        jiraTask: selectedJiraTask?.key 
      });
    } catch (error) {
      logger.error('Failed to start time tracking:', error);
    }
  }, [saveCurrentSession, selectedJiraTask]);

  const stopTracking = useCallback(() => {
    try {
      if (!currentSession) return;

      const now = new Date();
      const duration = now.getTime() - currentSession.startTime.getTime();
      
      const completedSession: TimeTrackingSession = {
        ...currentSession,
        endTime: now,
        duration,
        isActive: false
      };

      // Update daily data
      const today = getTodayData();
      const updatedToday = {
        ...today,
        totalTime: today.totalTime + duration,
        sessions: [...today.sessions.filter(s => s.id !== currentSession.id), completedSession],
        screenshotCount: today.screenshotCount + completedSession.screenshots.length
      };

      const updatedDailyData = [
        ...dailyData.filter(d => d.date !== today.date),
        updatedToday
      ];

      setDailyData(updatedDailyData);
      setCurrentSession(null);
      setIsTracking(false);
      setTotalTimeToday(updatedToday.totalTime);
      
      saveTimeTrackingData(updatedDailyData);
      saveCurrentSession(null);
      
      logger.info('Time tracking stopped:', { 
        sessionId: currentSession.id, 
        duration: Math.round(duration / 1000) + 's' 
      });
    } catch (error) {
      logger.error('Failed to stop time tracking:', error);
    }
  }, [currentSession, dailyData, getTodayData, saveTimeTrackingData, saveCurrentSession]);

  const addScreenshotToSession = useCallback((screenshotId: string) => {
    if (currentSession && currentSession.isActive) {
      const updatedSession = {
        ...currentSession,
        screenshots: [...currentSession.screenshots, screenshotId]
      };
      
      setCurrentSession(updatedSession);
      saveCurrentSession(updatedSession);
      
      // Update today's screenshot count
      const today = getTodayData();
      const updatedToday = {
        ...today,
        screenshotCount: today.screenshotCount + 1
      };
      
      const updatedDailyData = [
        ...dailyData.filter(d => d.date !== today.date),
        updatedToday
      ];
      
      setDailyData(updatedDailyData);
      saveTimeTrackingData(updatedDailyData);
    }
  }, [currentSession, dailyData, getTodayData, saveCurrentSession, saveTimeTrackingData]);

  const getTotalTimeToday = useCallback(() => {
    const today = getTodayData();
    return today.totalTime + (currentSession?.duration || 0);
  }, [getTodayData, currentSession]);

  const getFormattedTime = useCallback((milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  const getWeeklyStats = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyData = dailyData.filter(d => {
      const date = new Date(d.date);
      return date >= weekAgo && date <= now;
    });
    
    const totalTime = weeklyData.reduce((sum, day) => sum + day.totalTime, 0);
    const totalScreenshots = weeklyData.reduce((sum, day) => sum + day.screenshotCount, 0);
    const averageTime = weeklyData.length > 0 ? totalTime / weeklyData.length : 0;
    
    return {
      totalTime,
      totalScreenshots,
      averageTime,
      daysTracked: weeklyData.length,
      formattedTotalTime: getFormattedTime(totalTime),
      formattedAverageTime: getFormattedTime(averageTime)
    };
  }, [dailyData, getFormattedTime]);

  return {
    currentSession,
    dailyData,
    isTracking,
    totalTimeToday: getTotalTimeToday(),
    startTracking,
    stopTracking,
    addScreenshotToSession,
    getFormattedTime,
    getWeeklyStats,
    getTodayData
  };
};

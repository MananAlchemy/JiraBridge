import { useState, useEffect, useCallback } from 'react';
import { TimeTrackingSession, DailyTimeTracking } from '../types';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';
import { formatUtils } from '../utils/format';
import { APP_CONSTANTS } from '../constants';
import { JiraTask } from '../services/jira.service';
import { useFirestore } from './useFirestore';
import { useAuth } from './useAuth';

export const useTimeTracking = (selectedJiraTask?: JiraTask | null) => {
  const [currentSession, setCurrentSession] = useState<TimeTrackingSession | null>(null);
  const [dailyData, setDailyData] = useState<DailyTimeTracking[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  
  const { user } = useAuth();
  const { 
    storeDailyTimeTracking, 
    storeTimeTrackingSession, 
    updateTimeTrackingSession,
    updateDailyTimeTracking,
    storeUserProfile 
  } = useFirestore();

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

  // 10-second based Firestore updates
  useEffect(() => {
    if (isTracking && currentSession && user?.email) {
      const tenSecondInterval = setInterval(async () => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const now = new Date();
        const sessionDuration = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000);
        
        // Update session in Firestore
        await updateTimeTrackingSession(user.email, today, currentSession.id, {
          durationSeconds: sessionDuration,
          durationFormatted: getFormattedTime(sessionDuration * 1000),
        });

        // Update daily time tracking (add 10 seconds for the 10-second interval that passed)
        await updateDailyTimeTracking(
          user.email, 
          today, 
          10, // 10 seconds
          selectedJiraTask?.key,
          selectedJiraTask?.summary,
          selectedJiraTask?.project.name
        );

        logger.info('10-second Firestore update completed', { 
          userEmail: user.email, 
          date: today, 
          sessionId: currentSession.id,
          additionalTime: 10 
        });
      }, 10000); // Update every 10 seconds

      return () => clearInterval(tenSecondInterval);
    }
  }, [isTracking, currentSession, user, selectedJiraTask, updateTimeTrackingSession, updateDailyTimeTracking]);

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

  const loadTimeTrackingData = useCallback(() => {
    try {
      const saved = storage.get<DailyTimeTracking[]>(APP_CONSTANTS.TIME_TRACKING.STORAGE_KEY, []);
      setDailyData(saved || []);
      logger.info('Time tracking data loaded:', { count: (saved || []).length });
    } catch (error) {
      logger.error('Failed to load time tracking data:', error);
    }
  }, []);

  const loadCurrentSession = useCallback(() => {
    try {
      const saved = storage.get<TimeTrackingSession | null>(APP_CONSTANTS.TIME_TRACKING.SESSION_STORAGE_KEY, null);
      if (saved) {
        // Validate the saved session
        const now = new Date();
        const sessionAge = now.getTime() - saved.startTime.getTime();
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        // If session is too old or not properly formatted, clear it
        if (sessionAge > maxSessionAge || !saved.startTime || !saved.id) {
          logger.warn('Clearing invalid or expired session:', { 
            sessionAge: Math.round(sessionAge / 1000 / 60) + ' minutes',
            hasStartTime: !!saved.startTime,
            hasId: !!saved.id
          });
          storage.remove(APP_CONSTANTS.TIME_TRACKING.SESSION_STORAGE_KEY);
          setCurrentSession(null);
          setIsTracking(false);
          return;
        }
        
        // If session is active but seems stale (more than 1 hour without updates), deactivate it
        if (saved.isActive && sessionAge > 60 * 60 * 1000) { // 1 hour
          logger.warn('Deactivating stale session:', { 
            sessionAge: Math.round(sessionAge / 1000 / 60) + ' minutes'
          });
          const deactivatedSession = { ...saved, isActive: false };
          setCurrentSession(deactivatedSession);
          setIsTracking(false);
          saveCurrentSession(deactivatedSession);
          return;
        }
        
        setCurrentSession(saved);
        setIsTracking(saved.isActive);
        logger.info('Current session loaded:', { 
          id: saved.id, 
          isActive: saved.isActive,
          sessionAge: Math.round(sessionAge / 1000 / 60) + ' minutes'
        });
      }
    } catch (error) {
      logger.error('Failed to load current session:', error);
      // Clear any corrupted session data
      storage.remove(APP_CONSTANTS.TIME_TRACKING.SESSION_STORAGE_KEY);
      setCurrentSession(null);
      setIsTracking(false);
    }
  }, [saveCurrentSession]);

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

  const startTracking = useCallback(async () => {
    try {
      const sessionId = formatUtils.generateId();
      const now = new Date();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
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
      
      // Store session in Firestore if user is authenticated
      if (user?.email) {
        await storeTimeTrackingSession(user.email, today, sessionId, {
          sessionId,
          startTime: now,
          durationSeconds: 0,
          durationFormatted: '0s',
          isActive: true,
          jiraTaskKey: selectedJiraTask?.key,
          jiraTaskSummary: selectedJiraTask?.summary,
          jiraProject: selectedJiraTask?.project.name,
          screenshotIds: [],
        });
      }
      
      logger.info('Time tracking started:', { 
        sessionId, 
        jiraTask: selectedJiraTask?.key 
      });
    } catch (error) {
      logger.error('Failed to start time tracking:', error);
    }
  }, [saveCurrentSession, selectedJiraTask, user, storeTimeTrackingSession]);

  const stopTracking = useCallback(async () => {
    try {
      if (!currentSession) return;

      const now = new Date();
      const duration = now.getTime() - currentSession.startTime.getTime();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const completedSession: TimeTrackingSession = {
        ...currentSession,
        endTime: now,
        duration,
        isActive: false
      };

      // Update session in Firestore if user is authenticated
      if (user?.email) {
        await updateTimeTrackingSession(user.email, today, currentSession.id, {
          endTime: now,
          durationSeconds: Math.floor(duration / 1000),
          durationFormatted: getFormattedTime(duration),
          isActive: false,
        });
      }

      // Update daily data
      const todayData = getTodayData();
      const updatedToday = {
        ...todayData,
        totalTime: todayData.totalTime + duration,
        sessions: [...todayData.sessions.filter(s => s.id !== currentSession.id), completedSession],
        screenshotCount: todayData.screenshotCount + completedSession.screenshots.length
      };

      const updatedDailyData = [
        ...dailyData.filter(d => d.date !== todayData.date),
        updatedToday
      ];

      setDailyData(updatedDailyData);
      setCurrentSession(null);
      setIsTracking(false);
      
      saveTimeTrackingData(updatedDailyData);
      saveCurrentSession(null);
      
      // Store daily data in Firestore if user is authenticated
      if (user?.email) {
        await storeDailyTimeTracking(user.email, today, {
          totalTimeSeconds: Math.floor(updatedToday.totalTime / 1000),
          totalTimeFormatted: getFormattedTime(updatedToday.totalTime),
          sessionCount: updatedToday.sessions.length,
          screenshotCount: updatedToday.screenshotCount,
          lastUpdated: now,
          tasks: selectedJiraTask ? {
            [selectedJiraTask.key]: {
              taskSummary: selectedJiraTask.summary,
              project: selectedJiraTask.project.name,
              timeSpentSeconds: Math.floor(duration / 1000),
              timeSpentFormatted: getFormattedTime(duration),
              sessionCount: 1,
              screenshotCount: completedSession.screenshots.length,
              lastUpdated: now,
            }
          } : {},
        });
      }
      
      logger.info('Time tracking stopped:', { 
        sessionId: currentSession.id, 
        duration: Math.round(duration / 1000) + 's' 
      });
    } catch (error) {
      logger.error('Failed to stop time tracking:', error);
    }
  }, [currentSession, dailyData, getTodayData, saveTimeTrackingData, saveCurrentSession, user, updateTimeTrackingSession, storeDailyTimeTracking]);

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

  const clearCurrentSession = useCallback(() => {
    try {
      storage.remove(APP_CONSTANTS.TIME_TRACKING.SESSION_STORAGE_KEY);
      setCurrentSession(null);
      setIsTracking(false);
      logger.info('Current session cleared manually');
    } catch (error) {
      logger.error('Failed to clear current session:', error);
    }
  }, []);

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
    getTodayData,
    clearCurrentSession
  };
};

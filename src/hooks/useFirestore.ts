import { useState, useCallback } from 'react';
import { firestoreService } from '../services/firestore.service';
import { logger } from '../utils/logger';
import { 
  DailyTimeTracking, 
  TimeTrackingSession, 
  ScreenshotTimeTracking, 
  UserProfile,
  WeeklySummary,
  MonthlySummary
} from '../types/firestore';

export const useFirestore = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Store daily time tracking data
   */
  const storeDailyTimeTracking = useCallback(async (userEmail: string, date: string, data: DailyTimeTracking) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await firestoreService.storeDailyTimeTracking(userEmail, date, data);
      if (!success) {
        throw new Error('Failed to store daily time tracking data');
      }
      
      logger.info('Daily time tracking data stored successfully via hook');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error storing daily time tracking data:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Store time tracking session
   */
  const storeTimeTrackingSession = useCallback(async (userEmail: string, date: string, sessionId: string, data: TimeTrackingSession) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await firestoreService.storeTimeTrackingSession(userEmail, date, sessionId, data);
      if (!success) {
        throw new Error('Failed to store time tracking session');
      }
      
      logger.info('Time tracking session stored successfully via hook');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error storing time tracking session:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Store screenshot time tracking data
   */
  const storeScreenshotTimeTracking = useCallback(async (data: Omit<ScreenshotTimeTracking, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await firestoreService.storeScreenshotTimeTracking(data);
      if (!success) {
        throw new Error('Failed to store screenshot time tracking data');
      }
      
      logger.info('Screenshot time tracking data stored successfully via hook');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error storing screenshot time tracking data:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update time tracking session
   */
  const updateTimeTrackingSession = useCallback(async (userEmail: string, date: string, sessionId: string, updates: Partial<TimeTrackingSession>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await firestoreService.updateTimeTrackingSession(userEmail, date, sessionId, updates);
      if (!success) {
        throw new Error('Failed to update time tracking session');
      }
      
      logger.info('Time tracking session updated successfully via hook');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error updating time tracking session:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update daily time tracking every minute
   */
  const updateDailyTimeTracking = useCallback(async (userEmail: string, date: string, additionalTimeSeconds: number, taskKey?: string, taskSummary?: string, project?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await firestoreService.updateDailyTimeTracking(userEmail, date, additionalTimeSeconds, taskKey, taskSummary, project);
      if (!success) {
        throw new Error('Failed to update daily time tracking');
      }
      
      logger.info('Daily time tracking updated successfully via hook');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error updating daily time tracking:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Store user profile
   */
  const storeUserProfile = useCallback(async (data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await firestoreService.storeUserProfile(data);
      if (!success) {
        throw new Error('Failed to store user profile');
      }
      
      logger.info('User profile stored successfully via hook');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error storing user profile:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get daily time tracking data
   */
  const getDailyTimeTracking = useCallback(async (userEmail: string, date: string): Promise<DailyTimeTracking | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await firestoreService.getDailyTimeTracking(userEmail, date);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error getting daily time tracking data:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get time tracking sessions for a date
   */
  const getTimeTrackingSessions = useCallback(async (userEmail: string, date: string): Promise<TimeTrackingSession[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await firestoreService.getTimeTrackingSessions(userEmail, date);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error getting time tracking sessions:', err);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get screenshot time tracking data for a date
   */
  const getScreenshotTimeTracking = useCallback(async (userEmail: string, date: string): Promise<ScreenshotTimeTracking[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await firestoreService.getScreenshotTimeTracking(userEmail, date);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error getting screenshot time tracking data:', err);
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get all user time tracking data
   */
  const getAllUserTimeTrackingData = useCallback(async (userEmail: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await firestoreService.getAllUserTimeTrackingData(userEmail);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error getting all user time tracking data:', err);
      setError(errorMessage);
      return {
        profile: null,
        dailyData: [],
        sessions: [],
        screenshots: [],
        weeklySummaries: [],
        monthlySummaries: [],
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Store weekly summary
   */
  const storeWeeklySummary = useCallback(async (data: Omit<WeeklySummary, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await firestoreService.storeWeeklySummary(data);
      if (!success) {
        throw new Error('Failed to store weekly summary');
      }
      
      logger.info('Weekly summary stored successfully via hook');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error storing weekly summary:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Store monthly summary
   */
  const storeMonthlySummary = useCallback(async (data: Omit<MonthlySummary, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await firestoreService.storeMonthlySummary(data);
      if (!success) {
        throw new Error('Failed to store monthly summary');
      }
      
      logger.info('Monthly summary stored successfully via hook');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error storing monthly summary:', err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    storeDailyTimeTracking,
    storeTimeTrackingSession,
    storeScreenshotTimeTracking,
    updateTimeTrackingSession,
    updateDailyTimeTracking,
    storeUserProfile,
    getDailyTimeTracking,
    getTimeTrackingSessions,
    getScreenshotTimeTracking,
    getAllUserTimeTrackingData,
    storeWeeklySummary,
    storeMonthlySummary,
  };
};

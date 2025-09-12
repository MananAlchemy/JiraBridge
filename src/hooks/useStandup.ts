import { useState, useCallback } from 'react';
import { standupService, StandupData, StandupResponse } from '../services/standup.service';
import { logger } from '../utils/logger';
import { useFirestore } from './useFirestore';
import { useAuth } from './useAuth';

export const useStandup = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<StandupResponse | null>(null);
  
  const { user } = useAuth();
  const { getDailyTimeTracking, getTimeTrackingSessions, getScreenshotTimeTracking } = useFirestore();

  /**
   * Send standup data for today
   */
  const sendStandup = useCallback(async (): Promise<StandupResponse> => {
    if (!user?.email) {
      const error = 'User not authenticated';
      logger.error('Standup submission failed:', error);
      return { success: false, error };
    }

    setIsSubmitting(true);
    setLastSubmission(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's data from Firestore
      const [dailyData, sessions, screenshots] = await Promise.all([
        getDailyTimeTracking(user.email, today),
        getTimeTrackingSessions(user.email, today),
        getScreenshotTimeTracking(user.email, today)
      ]);

      // Prepare standup data
      const standupData = standupService.prepareStandupData(
        user.email,
        dailyData,
        sessions,
        screenshots
      );

      logger.info('Prepared standup data:', standupData);

      // Send to API
      const result = await standupService.sendStandupData(standupData);
      setLastSubmission(result);

      if (result.success) {
        logger.info('Standup data sent successfully');
      } else {
        logger.error('Standup submission failed:', result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Standup submission error:', error);
      
      const result = { success: false, error: errorMessage };
      setLastSubmission(result);
      return result;
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.email, getDailyTimeTracking, getTimeTrackingSessions, getScreenshotTimeTracking]);

  /**
   * Get today's standup data without sending
   */
  const getTodayStandupData = useCallback(async (): Promise<StandupData | null> => {
    if (!user?.email) {
      logger.error('Cannot get standup data: User not authenticated');
      return null;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's data from Firestore
      const [dailyData, sessions, screenshots] = await Promise.all([
        getDailyTimeTracking(user.email, today),
        getTimeTrackingSessions(user.email, today),
        getScreenshotTimeTracking(user.email, today)
      ]);

      // Prepare standup data
      const standupData = standupService.prepareStandupData(
        user.email,
        dailyData,
        sessions,
        screenshots
      );

      return standupData;
    } catch (error) {
      logger.error('Error getting today\'s standup data:', error);
      return null;
    }
  }, [user?.email, getDailyTimeTracking, getTimeTrackingSessions, getScreenshotTimeTracking]);

  return {
    sendStandup,
    getTodayStandupData,
    isSubmitting,
    lastSubmission
  };
};

import { useState, useEffect, useCallback } from 'react';
import { firebaseService } from '../services/firebase.service';
import { logger } from '../utils/logger';
import { APP_CONSTANTS } from '../constants';

export interface FirebaseConfigValues {
  screenshotInterval: number;
  screenshotQuality: 'low' | 'medium' | 'high';
  maxScreenshots: number;
  autoSyncEnabled: boolean;
  notificationsEnabled: boolean;
}

export const useFirebaseConfig = () => {
  const [config, setConfig] = useState<FirebaseConfigValues>({
    screenshotInterval: APP_CONSTANTS.SCREENSHOT.DEFAULT_INTERVAL,
    screenshotQuality: 'medium',
    maxScreenshots: APP_CONSTANTS.SCREENSHOT.MAX_COUNT,
    autoSyncEnabled: true,
    notificationsEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * Initialize Firebase Remote Config
   */
  const initializeConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('Initializing Firebase Remote Config...');
      const success = await firebaseService.initialize();
      
      if (success) {
        const configValues = firebaseService.getAllConfigValues();
        setConfig(configValues);
        setLastUpdated(new Date());
        logger.info('Firebase Remote Config initialized successfully', configValues);
      } else {
        logger.warn('Firebase Remote Config initialization failed, using default values');
        // Use default values from the service
        const configValues = firebaseService.getAllConfigValues();
        setConfig(configValues);
      }
      
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error initializing Firebase Remote Config:', err);
      setError(errorMessage);
      
      // Use default values as fallback
      const configValues = firebaseService.getAllConfigValues();
      setConfig(configValues);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh remote config values
   */
  const refreshConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('Refreshing Firebase Remote Config...');
      const success = await firebaseService.refreshConfig();
      
      if (success) {
        const configValues = firebaseService.getAllConfigValues();
        setConfig(configValues);
        setLastUpdated(new Date());
        logger.info('Firebase Remote Config refreshed successfully', configValues);
      } else {
        logger.warn('Failed to refresh Firebase Remote Config');
        setError('Failed to refresh remote config');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error refreshing Firebase Remote Config:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get specific config value with fallback
   */
  const getConfigValue = useCallback(<K extends keyof FirebaseConfigValues>(
    key: K,
    fallback?: FirebaseConfigValues[K]
  ): FirebaseConfigValues[K] => {
    if (!isInitialized) {
      return fallback ?? config[key];
    }
    
    try {
      const value = firebaseService.getAllConfigValues()[key];
      return value ?? fallback ?? config[key];
    } catch (err) {
      logger.error(`Error getting config value for ${key}:`, err);
      return fallback ?? config[key];
    }
  }, [config, isInitialized]);

  /**
   * Check if a specific config value has changed
   */
  const hasConfigChanged = useCallback((key: keyof FirebaseConfigValues, newValue: any): boolean => {
    return config[key] !== newValue;
  }, [config]);

  // Initialize config on mount
  useEffect(() => {
    initializeConfig();
  }, [initializeConfig]);

  // Set up periodic refresh every minute
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      refreshConfig();
    }, 60000); // 1 minute = 60,000 milliseconds

    return () => clearInterval(interval);
  }, [isInitialized, refreshConfig]);

  return {
    config,
    isLoading,
    isInitialized,
    error,
    lastUpdated,
    initializeConfig,
    refreshConfig,
    getConfigValue,
    hasConfigChanged,
  };
};

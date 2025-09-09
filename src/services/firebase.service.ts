import { initializeApp } from 'firebase/app';
import { getRemoteConfig, fetchAndActivate, getValue, RemoteConfig } from 'firebase/remote-config';
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { logger } from '../utils/logger';
import { APP_CONSTANTS } from '../constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLi5j0Dd02r148dSdJAPmv8AEFg3iQVNI",
  authDomain: "jira-bridge.firebaseapp.com",
  databaseURL: "https://jira-bridge-default-rtdb.firebaseio.com",
  projectId: "jira-bridge",
  storageBucket: "jira-bridge.firebasestorage.app",
  messagingSenderId: "748907208318",
  appId: "1:748907208318:web:d3ca5bcaebffa26c35c22f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Remote Config
const remoteConfig = getRemoteConfig(app);

// Initialize Firestore
const db = getFirestore(app);

// Configure Remote Config settings
remoteConfig.settings = {
  minimumFetchIntervalMillis: 30000, // 30 seconds minimum fetch interval for faster updates
  fetchTimeoutMillis: APP_CONSTANTS.FIREBASE.FETCH_TIMEOUT,
};

// Set default values
remoteConfig.defaultConfig = {
  screenshot_interval: APP_CONSTANTS.SCREENSHOT.DEFAULT_INTERVAL,
  screenshot_quality: 'medium',
  max_screenshots: APP_CONSTANTS.SCREENSHOT.MAX_COUNT,
  auto_sync_enabled: true,
  notifications_enabled: true,
};

export class FirebaseService {
  private static instance: FirebaseService;
  private remoteConfig: RemoteConfig;
  private isInitialized = false;

  private constructor() {
    this.remoteConfig = remoteConfig;
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialize Firebase Remote Config and fetch latest values
   */
  public async initialize(): Promise<boolean> {
    try {
      logger.info('Initializing Firebase Remote Config...', { firebaseConfig });
      
      // Check if Firebase is properly configured
      if (!this.isFirebaseConfigured()) {
        logger.warn('Firebase not properly configured, using default values');
        this.isInitialized = true;
        return false;
      }

      logger.info('Firebase config is valid, fetching remote config...');
      
      // Fetch and activate remote config
      await fetchAndActivate(this.remoteConfig);
      
      this.isInitialized = true;
      logger.info('Firebase Remote Config initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Firebase Remote Config:', error);
      this.isInitialized = true; // Mark as initialized to prevent retries
      return false;
    }
  }

  /**
   * Get screenshot interval from remote config
   */
  public getScreenshotInterval(): number {
    if (!this.isInitialized) {
      logger.warn('Remote config not initialized, returning default value');
      return 30; // Default fallback
    }

    try {
      const value = getValue(this.remoteConfig, 'screenshot_interval');
      const interval = value.asNumber();
      
      // Validate the interval (must be between 5 seconds and 1 hour)
      if (interval >= 5 && interval <= 3600) {
        logger.debug('Using remote config screenshot interval:', interval);
        return interval;
      } else {
        logger.warn('Invalid screenshot interval from remote config:', interval, 'using default');
        return 30;
      }
    } catch (error) {
      logger.error('Error getting screenshot interval from remote config:', error);
      return 30; // Default fallback
    }
  }

  /**
   * Get screenshot quality from remote config
   */
  public getScreenshotQuality(): 'low' | 'medium' | 'high' {
    if (!this.isInitialized) {
      return 'medium'; // Default fallback
    }

    try {
      const value = getValue(this.remoteConfig, 'screenshot_quality');
      const quality = value.asString();
      
      if (['low', 'medium', 'high'].includes(quality)) {
        logger.debug('Using remote config screenshot quality:', quality);
        return quality as 'low' | 'medium' | 'high';
      } else {
        logger.warn('Invalid screenshot quality from remote config:', quality, 'using default');
        return 'medium';
      }
    } catch (error) {
      logger.error('Error getting screenshot quality from remote config:', error);
      return 'medium'; // Default fallback
    }
  }

  /**
   * Get max screenshots from remote config
   */
  public getMaxScreenshots(): number {
    if (!this.isInitialized) {
      return 50; // Default fallback
    }

    try {
      const value = getValue(this.remoteConfig, 'max_screenshots');
      const maxScreenshots = value.asNumber();
      
      if (maxScreenshots >= 10 && maxScreenshots <= 1000) {
        logger.debug('Using remote config max screenshots:', maxScreenshots);
        return maxScreenshots;
      } else {
        logger.warn('Invalid max screenshots from remote config:', maxScreenshots, 'using default');
        return 50;
      }
    } catch (error) {
      logger.error('Error getting max screenshots from remote config:', error);
      return 50; // Default fallback
    }
  }

  /**
   * Get auto sync enabled from remote config
   */
  public getAutoSyncEnabled(): boolean {
    if (!this.isInitialized) {
      return true; // Default fallback
    }

    try {
      const value = getValue(this.remoteConfig, 'auto_sync_enabled');
      return value.asBoolean();
    } catch (error) {
      logger.error('Error getting auto sync enabled from remote config:', error);
      return true; // Default fallback
    }
  }

  /**
   * Get notifications enabled from remote config
   */
  public getNotificationsEnabled(): boolean {
    if (!this.isInitialized) {
      return true; // Default fallback
    }

    try {
      const value = getValue(this.remoteConfig, 'notifications_enabled');
      return value.asBoolean();
    } catch (error) {
      logger.error('Error getting notifications enabled from remote config:', error);
      return true; // Default fallback
    }
  }

  /**
   * Force refresh remote config values
   */
  public async refreshConfig(): Promise<boolean> {
    try {
      logger.info('Refreshing Firebase Remote Config...');
      await fetchAndActivate(this.remoteConfig);
      logger.info('Firebase Remote Config refreshed successfully');
      return true;
    } catch (error) {
      logger.error('Failed to refresh Firebase Remote Config:', error);
      return false;
    }
  }

  /**
   * Check if Firebase is properly configured
   */
  private isFirebaseConfigured(): boolean {
    return !!(
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
    );
  }

  /**
   * Get all remote config values as an object
   */
  public getAllConfigValues() {
    return {
      screenshotInterval: this.getScreenshotInterval(),
      screenshotQuality: this.getScreenshotQuality(),
      maxScreenshots: this.getMaxScreenshots(),
      autoSyncEnabled: this.getAutoSyncEnabled(),
      notificationsEnabled: this.getNotificationsEnabled(),
    };
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();

// Export Firestore instance for other services
export { db };

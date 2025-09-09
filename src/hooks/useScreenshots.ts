import { useState, useEffect, useCallback } from 'react';
import { Screenshot, CaptureOptions } from '../types';
import { electronService } from '../services/electron.service';
import { s3Service } from '../services/s3.service';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';
import { formatUtils } from '../utils/format';
import { APP_CONSTANTS } from '../constants';
import { useFirestore } from './useFirestore';

export const useScreenshots = (
  onScreenshotCaptured?: (screenshotId: string) => void,
  userEmail?: string,
  machineId?: string,
  jiraKey?: string,
  jiraTask?: { key: string; summary: string; project: string }
) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapture, setLastCapture] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryInterval, setRetryInterval] = useState<NodeJS.Timeout | null>(null);
  
  const { storeScreenshotTimeTracking } = useFirestore();

  useEffect(() => {
    loadScreenshots();
    setupElectronEventListeners();
    setupNetworkListeners();
    
    return () => {
      electronService.cleanupEventListeners();
      cleanupNetworkListeners();
    };
  }, []);

  const saveScreenshots = useCallback((newScreenshots: Screenshot[]) => {
    try {
      storage.set(APP_CONSTANTS.STORAGE_KEYS.SCREENSHOTS, newScreenshots);
      logger.debug('Screenshots saved to storage:', { count: newScreenshots.length });
    } catch (error) {
      logger.error('Failed to save screenshots:', error);
    }
  }, []);

  const uploadScreenshotToS3 = useCallback(async (screenshot: Screenshot, userEmail: string, machineId: string, jiraKey?: string): Promise<Screenshot> => {
    if (!screenshot.dataURL) {
      logger.warn('No dataURL available for S3 upload:', { id: screenshot.id });
      return screenshot;
    }

    try {
      logger.info('Uploading screenshot to S3:', { id: screenshot.id });
      const uploadResult = await s3Service.uploadScreenshot(
        screenshot.id,
        screenshot.dataURL,
        screenshot.filename,
        userEmail,
        machineId,
        jiraKey
      );

      if (uploadResult.success) {
        logger.info('Screenshot uploaded to S3 successfully:', { 
          id: screenshot.id, 
          url: uploadResult.url 
        });
        return {
          ...screenshot,
          synced: true,
          s3Url: uploadResult.url,
          s3Key: uploadResult.key,
          uploadError: undefined,
        };
      } else {
        logger.error('S3 upload failed:', { 
          id: screenshot.id, 
          error: uploadResult.error 
        });
        return {
          ...screenshot,
          synced: false,
          uploadError: uploadResult.error,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('S3 upload error:', { id: screenshot.id, error: errorMessage });
      return {
        ...screenshot,
        synced: false,
        uploadError: errorMessage,
      };
    }
  }, []);

  const retryFailedUploads = useCallback(async () => {
    try {
      logger.info('Retrying failed uploads');
      const failedUploads = screenshots.filter(s => !s.synced && s.uploadError && s.dataURL);
      
      if (failedUploads.length === 0) {
        logger.info('No failed uploads to retry');
        return;
      }
      
      logger.info('Found failed uploads to retry:', { count: failedUploads.length });
      
      const updatedScreenshots = [...screenshots];
      
      for (const screenshot of failedUploads) {
        try {
          logger.info('Retrying upload for screenshot:', { id: screenshot.id });
          if (userEmail && machineId) {
            const uploadedScreenshot = await uploadScreenshotToS3(screenshot, userEmail, machineId, jiraKey);
            
            // Update the screenshot in the array
            const index = updatedScreenshots.findIndex(s => s.id === screenshot.id);
            if (index !== -1) {
              updatedScreenshots[index] = uploadedScreenshot;
            }
            
            logger.debug('Screenshot upload retry completed:', { 
              id: screenshot.id, 
              synced: uploadedScreenshot.synced 
            });
          }
        } catch (uploadError) {
          logger.error('Failed to retry upload for screenshot:', { 
            id: screenshot.id, 
            error: uploadError 
          });
        }
      }
      
      setScreenshots(updatedScreenshots);
      saveScreenshots(updatedScreenshots);
      
      logger.info('Failed upload retry completed');
    } catch (error) {
      logger.error('Failed upload retry failed:', error);
      setError('Failed to retry uploads');
    }
  }, [screenshots, saveScreenshots, uploadScreenshotToS3, userEmail, machineId, jiraKey]);

  const setupNetworkListeners = useCallback(() => {
    const handleOnline = () => {
      console.log('🌐 Network connection restored - attempting to sync failed uploads');
      // Auto-retry failed uploads when connection is restored
      const failedUploads = screenshots.filter(s => !s.synced && s.uploadError && s.dataURL);
      if (failedUploads.length > 0 && userEmail && machineId) {
        console.log(`🔄 Auto-retrying ${failedUploads.length} failed uploads`);
        retryFailedUploads();
      }
    };

    const handleOffline = () => {
      console.log('📡 Network connection lost - screenshots will be stored locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [screenshots, userEmail, machineId, retryFailedUploads]);

  const cleanupNetworkListeners = useCallback(() => {
    // Cleanup is handled in setupNetworkListeners return function
  }, []);

  // Setup periodic retry for failed uploads
  useEffect(() => {
    const setupPeriodicRetry = () => {
      // Clear existing interval
      if (retryInterval) {
        clearInterval(retryInterval);
      }

      // Set up new interval to retry failed uploads every 5 minutes
      const interval = setInterval(() => {
        const failedUploads = screenshots.filter(s => !s.synced && s.uploadError && s.dataURL);
        if (failedUploads.length > 0 && userEmail && machineId && navigator.onLine) {
          console.log(`🔄 Periodic retry: Attempting to sync ${failedUploads.length} failed uploads`);
          retryFailedUploads();
        }
      }, 5 * 60 * 1000); // 5 minutes

      setRetryInterval(interval);
    };

    setupPeriodicRetry();

    return () => {
      if (retryInterval) {
        clearInterval(retryInterval);
      }
    };
  }, [screenshots, userEmail, machineId, retryFailedUploads, retryInterval]);

  const loadScreenshots = useCallback(() => {
    try {
      const saved = storage.get<Screenshot[]>(APP_CONSTANTS.STORAGE_KEYS.SCREENSHOTS, []);
      const parsedScreenshots = (saved || []).map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp),
        quality: s.quality || 'medium',
        tags: s.tags || [],
      }));
      
      setScreenshots(parsedScreenshots);
      logger.info('Screenshots loaded from storage:', { count: parsedScreenshots.length });
    } catch (error) {
      logger.error('Failed to load screenshots:', error);
      setError('Failed to load screenshots');
    }
  }, []);

  const setupElectronEventListeners = useCallback(() => {
    if (electronService.isElectron()) {
      electronService.setupEventListeners();
      
      // Listen for Electron events
      const handleElectronCapture = () => {
        captureScreenshot();
      };
      
      const handleElectronSettings = () => {
        // This could trigger settings modal
        window.dispatchEvent(new CustomEvent('open-settings'));
      };
      
      const handleElectronToggleTracking = () => {
        // This could toggle tracking
        window.dispatchEvent(new CustomEvent('toggle-tracking'));
      };
      
      window.addEventListener('electron-capture-screenshot', handleElectronCapture);
      window.addEventListener('electron-open-settings', handleElectronSettings);
      window.addEventListener('electron-toggle-tracking', handleElectronToggleTracking);
      
      return () => {
        window.removeEventListener('electron-capture-screenshot', handleElectronCapture);
        window.removeEventListener('electron-open-settings', handleElectronSettings);
        window.removeEventListener('electron-toggle-tracking', handleElectronToggleTracking);
      };
    }
  }, []);

  const generateScreenshotFilename = useCallback((timestamp: Date, jiraKey?: string): string => {
    // Format: HH-mm-ss-SSS.png
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    const milliseconds = timestamp.getMilliseconds().toString().padStart(3, '0');
    const filename = `${hours}-${minutes}-${seconds}-${milliseconds}.png`;
    
    console.log('📸 Screenshot Filename Generated:', {
      timestamp: timestamp.toISOString(),
      jiraKey: jiraKey || 'no-jira-key',
      filename
    });
    
    return filename;
  }, []);

  const generateMockScreenshot = useCallback((): Screenshot => {
    const id = formatUtils.generateId();
    const timestamp = new Date();
    return {
      id,
      timestamp,
      filename: generateScreenshotFilename(timestamp),
      size: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
      synced: Math.random() > 0.3, // 70% chance of being synced
      quality: 'medium',
      tags: [],
    };
  }, [generateScreenshotFilename]);

  const captureScreenshot = useCallback(async (options?: CaptureOptions) => {
    setIsCapturing(true);
    setError(null);
    
    try {
      logger.info('Starting screenshot capture', { options });
      let newScreenshot: Screenshot;
      
      // Check if we're running in Electron
      if (electronService.isElectron()) {
        const result = await electronService.captureScreenshot();
        if (result.success && result.dataURL) {
          // Create a real screenshot from Electron
          const timestamp = new Date(result.timestamp || Date.now());
          const quality = options?.quality || 'medium';
          const screenshotId = formatUtils.generateId();
          const filename = generateScreenshotFilename(timestamp);
          
          newScreenshot = {
            id: screenshotId,
            timestamp,
            filename,
            size: result.dataURL.length * 0.75, // Approximate size from base64
            synced: false,
            dataURL: result.dataURL, // Store the actual image data
            quality,
            displayId: options?.displayId,
            tags: [],
            jiraTask: jiraTask,
          };
          
          console.log('📷 Screenshot Captured:', {
            screenshotId,
            filename,
            timestamp: timestamp.toISOString(),
            quality,
            size: newScreenshot.size,
            displayId: options?.displayId
          });
          
          logger.info('Screenshot captured successfully via Electron');
        } else {
          throw new Error(result.error || 'Failed to capture screenshot');
        }
      } else {
        // Fallback to mock screenshot for web development
        logger.info('Using mock screenshot for web development');
        await new Promise(resolve => setTimeout(resolve, 1000));
        newScreenshot = generateMockScreenshot();
      }
      
      // Add screenshot to list first
      const updatedScreenshots = [newScreenshot, ...screenshots].slice(0, APP_CONSTANTS.SCREENSHOT.MAX_COUNT);
      setScreenshots(updatedScreenshots);
      setLastCapture(new Date());
      saveScreenshots(updatedScreenshots);
      
      // Store screenshot time tracking data in Firestore if user is authenticated
      if (userEmail) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const timeSpentSeconds = 1; // Assuming 1 second per screenshot capture
        
        await storeScreenshotTimeTracking({
          userEmail,
          date: today,
          screenshotId: newScreenshot.id,
          timestamp: newScreenshot.timestamp,
          timeSpentSeconds,
          timeSpentFormatted: '1s',
          jiraTaskKey: jiraTask?.key,
          jiraTaskSummary: jiraTask?.summary,
          screenshotSize: newScreenshot.size,
          screenshotQuality: newScreenshot.quality,
          synced: newScreenshot.synced,
        });
      }
      
      // Notify time tracking about new screenshot
      if (onScreenshotCaptured) {
        onScreenshotCaptured(newScreenshot.id);
      }
      
      // Upload to S3 in the background
      if (newScreenshot.dataURL && userEmail && machineId) {
        logger.info('Starting S3 upload for new screenshot:', { id: newScreenshot.id });
        try {
          const uploadedScreenshot = await uploadScreenshotToS3(newScreenshot, userEmail, machineId, jiraKey);
          
          // Update the screenshot with S3 upload results
          const finalScreenshots = updatedScreenshots.map(s => 
            s.id === newScreenshot.id ? uploadedScreenshot : s
          );
          setScreenshots(finalScreenshots);
          saveScreenshots(finalScreenshots);
          
          logger.info('Screenshot S3 upload completed:', { 
            id: newScreenshot.id, 
            synced: uploadedScreenshot.synced 
          });
        } catch (uploadError) {
          logger.error('S3 upload failed for screenshot:', { 
            id: newScreenshot.id, 
            error: uploadError 
          });
          // Update screenshot with upload error
          const errorScreenshot = {
            ...newScreenshot,
            synced: false,
            uploadError: uploadError instanceof Error ? uploadError.message : 'Upload failed',
          };
          const finalScreenshots = updatedScreenshots.map(s => 
            s.id === newScreenshot.id ? errorScreenshot : s
          );
          setScreenshots(finalScreenshots);
          saveScreenshots(finalScreenshots);
        }
      }
      
      logger.info('Screenshot capture completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Screenshot capture failed:', errorMessage);
      setError(errorMessage);
      
      // Fallback to mock screenshot
      const newScreenshot = generateMockScreenshot();
      const updatedScreenshots = [newScreenshot, ...screenshots].slice(0, APP_CONSTANTS.SCREENSHOT.MAX_COUNT);
      setScreenshots(updatedScreenshots);
      setLastCapture(new Date());
      saveScreenshots(updatedScreenshots);
      
      // Notify time tracking about new screenshot
      if (onScreenshotCaptured) {
        onScreenshotCaptured(newScreenshot.id);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [screenshots, generateMockScreenshot, generateScreenshotFilename, saveScreenshots, uploadScreenshotToS3, userEmail, jiraTask, storeScreenshotTimeTracking]);

  const deleteScreenshot = useCallback((id: string) => {
    try {
      const updated = screenshots.filter(s => s.id !== id);
      setScreenshots(updated);
      saveScreenshots(updated);
      logger.info('Screenshot deleted:', { id });
    } catch (error) {
      logger.error('Failed to delete screenshot:', error);
      setError('Failed to delete screenshot');
    }
  }, [screenshots, saveScreenshots]);

  const syncScreenshots = useCallback(async () => {
    try {
      logger.info('Starting screenshot sync');
      const unsynced = screenshots.filter(s => !s.synced && s.dataURL);
      
      if (unsynced.length === 0) {
        logger.info('No screenshots to sync');
        return;
      }
      
      logger.info('Found unsynced screenshots:', { count: unsynced.length });
      
      // Upload each unsynced screenshot to S3
      const updatedScreenshots = [...screenshots];
      
      for (const screenshot of unsynced) {
        try {
          logger.info('Syncing screenshot to S3:', { id: screenshot.id });
          if (userEmail && machineId) {
            const uploadedScreenshot = await uploadScreenshotToS3(screenshot, userEmail, machineId, jiraKey);
            
            // Update the screenshot in the array
            const index = updatedScreenshots.findIndex(s => s.id === screenshot.id);
            if (index !== -1) {
              updatedScreenshots[index] = uploadedScreenshot;
            }
            
            logger.debug('Screenshot synced:', { 
              id: screenshot.id, 
              synced: uploadedScreenshot.synced 
            });
          }
        } catch (uploadError) {
          logger.error('Failed to sync screenshot:', { 
            id: screenshot.id, 
            error: uploadError 
          });
          // Update screenshot with upload error
          const index = updatedScreenshots.findIndex(s => s.id === screenshot.id);
          if (index !== -1) {
            updatedScreenshots[index] = {
              ...screenshot,
              synced: false,
              uploadError: uploadError instanceof Error ? uploadError.message : 'Upload failed',
            };
          }
        }
      }
      
      setScreenshots(updatedScreenshots);
      saveScreenshots(updatedScreenshots);
      
      const syncedCount = updatedScreenshots.filter(s => s.synced).length;
      logger.info('Screenshot sync completed:', { syncedCount });
    } catch (error) {
      logger.error('Screenshot sync failed:', error);
      setError('Failed to sync screenshots');
    }
  }, [screenshots, saveScreenshots, uploadScreenshotToS3]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);


  const getScreenshotStats = useCallback(() => {
    const total = screenshots.length;
    const synced = screenshots.filter(s => s.synced).length;
    const unsynced = total - synced;
    const failedUploads = screenshots.filter(s => !s.synced && s.uploadError).length;
    const totalSize = screenshots.reduce((sum, s) => sum + s.size, 0);
    
    return {
      total,
      synced,
      unsynced,
      failedUploads,
      totalSize,
      averageSize: total > 0 ? totalSize / total : 0,
    };
  }, [screenshots]);

  return {
    screenshots,
    isCapturing,
    lastCapture,
    error,
    captureScreenshot,
    deleteScreenshot,
    syncScreenshots,
    retryFailedUploads,
    clearError,
    getScreenshotStats,
  };
};
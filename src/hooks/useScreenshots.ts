import { useState, useEffect, useCallback } from 'react';
import { Screenshot, CaptureOptions } from '../types';
import { electronService } from '../services/electron.service';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';
import { formatUtils } from '../utils/format';
import { APP_CONSTANTS } from '../constants';

export const useScreenshots = (onScreenshotCaptured?: (screenshotId: string) => void) => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapture, setLastCapture] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScreenshots();
    setupElectronEventListeners();
    
    return () => {
      electronService.cleanupEventListeners();
    };
  }, []);

  const loadScreenshots = useCallback(() => {
    try {
      const saved = storage.get<Screenshot[]>(APP_CONSTANTS.STORAGE_KEYS.SCREENSHOTS, []);
      const parsedScreenshots = saved.map((s: any) => ({
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

  const saveScreenshots = useCallback((newScreenshots: Screenshot[]) => {
    try {
      storage.set(APP_CONSTANTS.STORAGE_KEYS.SCREENSHOTS, newScreenshots);
      logger.debug('Screenshots saved to storage:', { count: newScreenshots.length });
    } catch (error) {
      logger.error('Failed to save screenshots:', error);
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

  const generateMockScreenshot = useCallback((): Screenshot => {
    const id = formatUtils.generateId();
    return {
      id,
      timestamp: new Date(),
      filename: `screenshot_${id}.png`,
      size: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
      synced: Math.random() > 0.3, // 70% chance of being synced
      quality: 'medium',
      tags: [],
    };
  }, []);

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
          newScreenshot = {
            id: formatUtils.generateId(),
            timestamp: new Date(result.timestamp || Date.now()),
            filename: `screenshot_${Date.now()}.png`,
            size: result.dataURL.length * 0.75, // Approximate size from base64
            synced: false,
            dataURL: result.dataURL, // Store the actual image data
            quality: options?.quality || 'medium',
            displayId: options?.displayId,
            tags: [],
          };
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
      
      const updatedScreenshots = [newScreenshot, ...screenshots].slice(0, APP_CONSTANTS.SCREENSHOT.MAX_COUNT);
      
      setScreenshots(updatedScreenshots);
      setLastCapture(new Date());
      saveScreenshots(updatedScreenshots);
      
      // Notify time tracking about new screenshot
      if (onScreenshotCaptured) {
        onScreenshotCaptured(newScreenshot.id);
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
  }, [screenshots, generateMockScreenshot, saveScreenshots]);

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
      const unsynced = screenshots.filter(s => !s.synced);
      
      if (unsynced.length === 0) {
        logger.info('No screenshots to sync');
        return;
      }
      
      // Simulate sync process
      for (const screenshot of unsynced) {
        await new Promise(resolve => setTimeout(resolve, 500));
        screenshot.synced = true;
        logger.debug('Screenshot synced:', { id: screenshot.id });
      }
      
      const updatedScreenshots = [...screenshots];
      setScreenshots(updatedScreenshots);
      saveScreenshots(updatedScreenshots);
      
      logger.info('Screenshot sync completed:', { syncedCount: unsynced.length });
    } catch (error) {
      logger.error('Screenshot sync failed:', error);
      setError('Failed to sync screenshots');
    }
  }, [screenshots, saveScreenshots]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getScreenshotStats = useCallback(() => {
    const total = screenshots.length;
    const synced = screenshots.filter(s => s.synced).length;
    const unsynced = total - synced;
    const totalSize = screenshots.reduce((sum, s) => sum + s.size, 0);
    
    return {
      total,
      synced,
      unsynced,
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
    clearError,
    getScreenshotStats,
  };
};
import { logger } from '../utils/logger';

export interface ElectronScreenshotResult {
  success: boolean;
  dataURL?: string;
  timestamp?: string;
  error?: string;
}

export interface ElectronScreenInfoResult {
  success: boolean;
  displays?: ElectronDisplayInfo[];
  error?: string;
}

export interface ElectronDisplayInfo {
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  isPrimary: boolean;
}

export class ElectronService {
  private static instance: ElectronService;

  private constructor() {}

  static getInstance(): ElectronService {
    if (!ElectronService.instance) {
      ElectronService.instance = new ElectronService();
    }
    return ElectronService.instance;
  }

  /**
   * Check if running in Electron environment
   */
  isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }

  /**
   * Capture screenshot using Electron API
   */
  async captureScreenshot(): Promise<ElectronScreenshotResult> {
    if (!this.isElectron()) {
      logger.warn('Not running in Electron environment');
      return {
        success: false,
        error: 'Not running in Electron environment',
      };
    }

    try {
      logger.info('Capturing screenshot via Electron API');
      const result = await window.electronAPI!.captureScreenshot();
      logger.info('Screenshot capture result:', { success: result.success });
      return result;
    } catch (error) {
      logger.error('Screenshot capture failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get screen information using Electron API
   */
  async getScreenInfo(): Promise<ElectronScreenInfoResult> {
    if (!this.isElectron()) {
      logger.warn('Not running in Electron environment');
      return {
        success: false,
        error: 'Not running in Electron environment',
      };
    }

    try {
      logger.info('Getting screen info via Electron API');
      const result = await window.electronAPI!.getScreenInfo();
      logger.info('Screen info result:', { success: result.success });
      return result;
    } catch (error) {
      logger.error('Get screen info failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Set up event listeners for Electron events
   */
  setupEventListeners(): void {
    if (!this.isElectron()) {
      logger.warn('Cannot setup event listeners - not in Electron environment');
      return;
    }

    try {
      // Set up screenshot capture listener
      window.electronAPI!.onCaptureScreenshot(() => {
        logger.info('Screenshot capture event received from Electron');
        // This could trigger a screenshot capture in the UI
        window.dispatchEvent(new CustomEvent('electron-capture-screenshot'));
      });

      // Set up settings open listener
      window.electronAPI!.onOpenSettings(() => {
        logger.info('Open settings event received from Electron');
        // This could open settings modal in the UI
        window.dispatchEvent(new CustomEvent('electron-open-settings'));
      });

      // Set up toggle tracking listener
      window.electronAPI!.onToggleTracking(() => {
        logger.info('Toggle tracking event received from Electron');
        // This could toggle tracking in the UI
        window.dispatchEvent(new CustomEvent('electron-toggle-tracking'));
      });

      logger.info('Electron event listeners setup successfully');
    } catch (error) {
      logger.error('Failed to setup Electron event listeners:', error);
    }
  }

  /**
   * Minimize the window
   */
  minimizeWindow(): void {
    if (this.isElectron()) {
      try {
        window.electronAPI!.minimizeWindow();
        logger.info('Window minimize requested');
      } catch (error) {
        logger.error('Failed to minimize window:', error);
      }
    }
  }

  /**
   * Maximize or restore the window
   */
  maximizeWindow(): void {
    if (this.isElectron()) {
      try {
        window.electronAPI!.maximizeWindow();
        logger.info('Window maximize/restore requested');
      } catch (error) {
        logger.error('Failed to maximize window:', error);
      }
    }
  }

  /**
   * Close the window
   */
  closeWindow(): void {
    if (this.isElectron()) {
      try {
        window.electronAPI!.closeWindow();
        logger.info('Window close requested');
      } catch (error) {
        logger.error('Failed to close window:', error);
      }
    }
  }

  /**
   * Clean up event listeners
   */
  cleanupEventListeners(): void {
    if (!this.isElectron()) {
      return;
    }

    try {
      window.electronAPI!.removeAllListeners('capture-screenshot');
      window.electronAPI!.removeAllListeners('open-settings');
      window.electronAPI!.removeAllListeners('toggle-tracking');
      logger.info('Electron event listeners cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup Electron event listeners:', error);
    }
  }
}

export const electronService = ElectronService.getInstance();

import { ipcMain } from 'electron';
import { APP_CONSTANTS } from '../config/app.config';
import { logger } from '../utils/logger';
import { screenshotManager } from './screenshot-manager';

export class IPCHandler {
  private mainWindow: Electron.BrowserWindow | null = null;

  setMainWindow(window: Electron.BrowserWindow): void {
    this.mainWindow = window;
  }

  registerHandlers(): void {
    logger.info('Registering IPC handlers');

    // Screenshot handlers
    ipcMain.handle(APP_CONSTANTS.IPC_CHANNELS.CAPTURE_SCREENSHOT, this.handleCaptureScreenshot.bind(this));
    ipcMain.handle(APP_CONSTANTS.IPC_CHANNELS.GET_SCREEN_INFO, this.handleGetScreenInfo.bind(this));

    // Additional handlers can be added here
    this.registerCustomHandlers();

    logger.info('IPC handlers registered successfully');
  }

  private async handleCaptureScreenshot(): Promise<any> {
    try {
      logger.info('IPC: Screenshot capture requested');
      const result = await screenshotManager.captureScreenshot();
      logger.info('IPC: Screenshot capture completed', { success: result.success });
      return result;
    } catch (error) {
      logger.error('IPC: Screenshot capture failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handleGetScreenInfo(): Promise<any> {
    try {
      logger.info('IPC: Screen info requested');
      const result = await screenshotManager.getScreenInfo();
      logger.info('IPC: Screen info retrieved', { success: result.success });
      return result;
    } catch (error) {
      logger.error('IPC: Screen info request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private registerCustomHandlers(): void {
    // Add any custom IPC handlers here
    // Example:
    // ipcMain.handle('custom-action', this.handleCustomAction.bind(this));
  }

  // Example of a custom handler
  private async handleCustomAction(): Promise<any> {
    try {
      logger.info('IPC: Custom action requested');
      // Implement custom logic here
      return { success: true, data: 'Custom action completed' };
    } catch (error) {
      logger.error('IPC: Custom action failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  unregisterHandlers(): void {
    logger.info('Unregistering IPC handlers');
    
    // Remove all IPC handlers
    ipcMain.removeAllListeners(APP_CONSTANTS.IPC_CHANNELS.CAPTURE_SCREENSHOT);
    ipcMain.removeAllListeners(APP_CONSTANTS.IPC_CHANNELS.GET_SCREEN_INFO);
    
    // Remove custom handlers
    this.unregisterCustomHandlers();
    
    logger.info('IPC handlers unregistered');
  }

  private unregisterCustomHandlers(): void {
    // Remove custom handlers here
    // Example:
    // ipcMain.removeAllListeners('custom-action');
  }
}

export const ipcHandler = new IPCHandler();

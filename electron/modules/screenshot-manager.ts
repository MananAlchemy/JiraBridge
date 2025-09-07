import { desktopCapturer, screen } from 'electron';
import { ScreenshotResult, ScreenInfoResult } from '../types';
import { APP_CONFIG, APP_CONSTANTS } from '../config/app.config';
import { logger } from '../utils/logger';
import { fileManager } from '../utils/file-manager';

export class ScreenshotManager {
  async captureScreenshot(): Promise<ScreenshotResult> {
    try {
      logger.info('Starting screenshot capture');
      
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: APP_CONFIG.screenshot.maxThumbnailSize,
      });

      if (sources.length === 0) {
        const error = 'No screen sources available';
        logger.warn(error);
        return { success: false, error };
      }

      const source = sources[0];
      const dataURL = source.thumbnail.toDataURL();
      const timestamp = new Date().toISOString();

      // Optionally save to file
      const filename = `screenshot_${Date.now()}.png`;
      try {
        await fileManager.saveScreenshot(dataURL, filename);
        logger.info('Screenshot saved to file:', filename);
      } catch (saveError) {
        logger.warn('Failed to save screenshot to file:', saveError);
        // Continue even if file save fails
      }

      logger.info('Screenshot captured successfully');
      return {
        success: true,
        dataURL,
        timestamp,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Screenshot capture failed:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async getScreenInfo(): Promise<ScreenInfoResult> {
    try {
      logger.info('Getting screen information');
      
      const displays = screen.getAllDisplays();
      const displayInfo = displays.map(display => ({
        id: display.id,
        bounds: display.bounds,
        scaleFactor: display.scaleFactor,
        isPrimary: display === screen.getPrimaryDisplay(),
      }));

      logger.info('Screen info retrieved:', { displayCount: displays.length });
      return {
        success: true,
        displays: displayInfo,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get screen info:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async captureSpecificDisplay(displayId: number): Promise<ScreenshotResult> {
    try {
      logger.info('Capturing screenshot for display:', displayId);
      
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: APP_CONFIG.screenshot.maxThumbnailSize,
      });

      const source = sources.find(s => s.display_id === displayId.toString());
      if (!source) {
        const error = `Display with ID ${displayId} not found`;
        logger.warn(error);
        return { success: false, error };
      }

      const dataURL = source.thumbnail.toDataURL();
      const timestamp = new Date().toISOString();

      logger.info('Display screenshot captured successfully');
      return {
        success: true,
        dataURL,
        timestamp,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Display screenshot capture failed:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const screenshotManager = new ScreenshotManager();

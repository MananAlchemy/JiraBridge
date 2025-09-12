import fs from 'fs/promises';
import path from 'path';
import { APP_CONFIG } from '../config/app.config';
import { logger } from './logger';

export class FileManager {
  private screenshotsDir: string;

  constructor() {
    this.screenshotsDir = APP_CONFIG.paths.screenshots;
    this.ensureScreenshotsDirectory();
  }

  private async ensureScreenshotsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.screenshotsDir, { recursive: true });
      logger.info('Screenshots directory ensured:', this.screenshotsDir);
    } catch (error) {
      logger.error('Failed to create screenshots directory:', error);
      throw error;
    }
  }

  async saveScreenshot(dataURL: string, filename: string): Promise<string> {
    try {
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = dataURL.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filePath = path.join(this.screenshotsDir, filename);
      await fs.writeFile(filePath, buffer);
      
      logger.info('Screenshot saved:', filePath);
      return filePath;
    } catch (error) {
      logger.error('Failed to save screenshot:', error);
      throw error;
    }
  }

  async deleteScreenshot(filename: string): Promise<void> {
    const filePath = path.join(this.screenshotsDir, filename);
    
    // Retry logic for Windows file locking issues
    const maxRetries = 3;
    const retryDelay = 100; // ms
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await fs.unlink(filePath);
        logger.info('Screenshot deleted:', filePath);
        return;
      } catch (error: any) {
        const isBusyError = error.code === 'EBUSY' || error.code === 'EPERM' || error.message.includes('resource busy');
        
        if (isBusyError && attempt < maxRetries) {
          logger.warn(`File busy, retrying delete (attempt ${attempt}/${maxRetries}):`, filePath);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        // If it's the last attempt or not a busy error, throw
        logger.error('Failed to delete screenshot:', error);
        throw error;
      }
    }
  }

  async getScreenshotList(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.screenshotsDir);
      return files.filter(file => 
        /\.(png|jpg|jpeg|gif|bmp)$/i.test(file)
      );
    } catch (error) {
      logger.error('Failed to get screenshot list:', error);
      return [];
    }
  }

  async getFileStats(filename: string): Promise<{ size: number; created: Date } | null> {
    try {
      const filePath = path.join(this.screenshotsDir, filename);
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
      };
    } catch (error) {
      logger.error('Failed to get file stats:', error);
      return null;
    }
  }

  getScreenshotsDirectory(): string {
    return this.screenshotsDir;
  }
}

export const fileManager = new FileManager();

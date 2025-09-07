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
    try {
      const filePath = path.join(this.screenshotsDir, filename);
      await fs.unlink(filePath);
      logger.info('Screenshot deleted:', filePath);
    } catch (error) {
      logger.error('Failed to delete screenshot:', error);
      throw error;
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

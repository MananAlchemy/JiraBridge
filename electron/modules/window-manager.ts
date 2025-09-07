import { BrowserWindow, app, shell } from 'electron';
import path from 'path';
import { APP_CONFIG, APP_CONSTANTS } from '../config/app.config';
import { logger } from '../utils/logger';
import { menuManager } from './menu-manager';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
  }

  async createMainWindow(): Promise<BrowserWindow> {
    logger.info('Creating main window');

    this.mainWindow = new BrowserWindow({
      width: APP_CONFIG.window.width,
      height: APP_CONFIG.window.height,
      minWidth: APP_CONFIG.window.minWidth,
      minHeight: APP_CONFIG.window.minHeight,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'hiddenInset', // macOS style title bar
      show: false, // Don't show until ready
    });

    this.setupWindowEventHandlers();
    await this.loadWindowContent();
    this.setupMenu();

    logger.info('Main window created successfully');
    return this.mainWindow;
  }

  private setupWindowEventHandlers(): void {
    if (!this.mainWindow) return;

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        logger.info('Main window shown');
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
      logger.info('Main window closed');
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      logger.info('Opening external URL:', url);
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Handle navigation
    this.mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      
      if (parsedUrl.origin !== this.getBaseUrl()) {
        event.preventDefault();
        logger.info('Prevented navigation to external URL:', navigationUrl);
        shell.openExternal(navigationUrl);
      }
    });
  }

  private async loadWindowContent(): Promise<void> {
    if (!this.mainWindow) return;

    try {
      if (this.isDev) {
        await this.mainWindow.loadURL(APP_CONSTANTS.DEV_SERVER_URL);
        // Open DevTools in development
        this.mainWindow.webContents.openDevTools();
        logger.info('Loaded development server URL');
      } else {
        await this.mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        logger.info('Loaded production build');
      }
    } catch (error) {
      logger.error('Failed to load window content:', error);
      throw error;
    }
  }

  private setupMenu(): void {
    if (this.mainWindow) {
      menuManager.setMainWindow(this.mainWindow);
      const menu = menuManager.createMenu();
      // Note: Menu.setApplicationMenu is called in the main process
    }
  }

  private getBaseUrl(): string {
    return this.isDev ? APP_CONSTANTS.DEV_SERVER_URL : 'file://';
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  isMainWindowOpen(): boolean {
    return this.mainWindow !== null;
  }

  focusMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.focus();
      logger.info('Main window focused');
    }
  }

  minimizeMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.minimize();
      logger.info('Main window minimized');
    }
  }

  maximizeMainWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
      logger.info('Main window toggled maximize');
    }
  }
}

export const windowManager = new WindowManager();

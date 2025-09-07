import { Menu, MenuItemConstructorOptions } from 'electron';
import { APP_CONSTANTS } from '../config/app.config';
import { logger } from '../utils/logger';

export class MenuManager {
  private mainWindow: Electron.BrowserWindow | null = null;

  setMainWindow(window: Electron.BrowserWindow): void {
    this.mainWindow = window;
  }

  createMenu(): Menu {
    logger.info('Creating application menu');
    
    const template = this.getMenuTemplate();
    const menu = Menu.buildFromTemplate(template);
    
    logger.info('Application menu created successfully');
    return menu;
  }

  private getMenuTemplate(): MenuItemConstructorOptions[] {
    const isMac = process.platform === 'darwin';
    
    const template: MenuItemConstructorOptions[] = [
      this.createFileMenu(),
      this.createViewMenu(),
      this.createWindowMenu(),
    ];

    // macOS specific menu adjustments
    if (isMac) {
      template.unshift(this.createAppMenu());
    }

    return template;
  }

  private createAppMenu(): MenuItemConstructorOptions {
    return {
      label: APP_CONSTANTS.APP_NAME,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    };
  }

  private createFileMenu(): MenuItemConstructorOptions {
    return {
      label: 'File',
      submenu: [
        {
          label: 'New Screenshot',
          accelerator: APP_CONSTANTS.KEYBOARD_SHORTCUTS.CAPTURE_SCREENSHOT,
          click: () => this.handleCaptureScreenshot(),
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: APP_CONSTANTS.KEYBOARD_SHORTCUTS.OPEN_SETTINGS,
          click: () => this.handleOpenSettings(),
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: APP_CONSTANTS.KEYBOARD_SHORTCUTS.QUIT_APP,
          click: () => this.handleQuit(),
        },
      ],
    };
  }

  private createViewMenu(): MenuItemConstructorOptions {
    return {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    };
  }

  private createWindowMenu(): MenuItemConstructorOptions {
    const isMac = process.platform === 'darwin';
    
    return {
      label: 'Window',
      submenu: isMac
        ? [
            { role: 'close' },
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' },
          ]
        : [
            { role: 'minimize' },
            { role: 'close' },
          ],
    };
  }

  private handleCaptureScreenshot(): void {
    if (this.mainWindow) {
      logger.info('Screenshot capture requested via menu');
      this.mainWindow.webContents.send(APP_CONSTANTS.IPC_CHANNELS.CAPTURE_SCREENSHOT);
    }
  }

  private handleOpenSettings(): void {
    if (this.mainWindow) {
      logger.info('Settings requested via menu');
      this.mainWindow.webContents.send(APP_CONSTANTS.IPC_CHANNELS.OPEN_SETTINGS);
    }
  }

  private handleQuit(): void {
    logger.info('Quit requested via menu');
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }
}

export const menuManager = new MenuManager();
